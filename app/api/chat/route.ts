// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantClient } from '@qdrant/js-client-rest';

interface ChatRequest {
  message: string;
  collectionId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  useHyDE?: boolean; // Optional flag to enable/disable HyDE
}

interface ChatResponse {
  success: boolean;
  response: string;
  sources?: Array<{
    content: string;
    metadata: any;
    score: number;
  }>;
  error?: string;
  hydeQuery?: string; // For debugging - shows the hypothetical answer used for retrieval
}

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "embedding-001",
});

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      collectionId, 
      conversationHistory = [], 
      useHyDE = true 
    }: ChatRequest = await request.json();

    if (!message || !collectionId) {
      return NextResponse.json(
        { success: false, error: 'Message and collection ID are required' },
        { status: 400 }
      );
    }

    // Create vector store instance
    const vectorStore = new QdrantVectorStore(embeddings, {
      client: qdrantClient,
      collectionName: collectionId,
    });

    let relevantDocs: Array<[any, number]> = [];
    let hydeQuery: string | undefined;

    if (useHyDE) {
      // HyDE Pipeline: Generate hypothetical answer first
      const { hypotheticalAnswer, retrievedDocs } = await performHyDERetrieval(
        message, 
        conversationHistory, 
        vectorStore
      );
      relevantDocs = retrievedDocs;
      hydeQuery = hypotheticalAnswer;
    } else {
      // Traditional retrieval using original query
      relevantDocs = await vectorStore.similaritySearchWithScore(message, 5);
    }

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the uploaded document to answer your question.",
        sources: [],
        hydeQuery,
      } as ChatResponse);
    }

    // Generate final response using retrieved context
    const finalResponse = await generateFinalResponse(
      message,
      conversationHistory,
      relevantDocs
    );

    // Prepare sources information
    const sources = relevantDocs.map(([doc, score]) => ({
      content: doc.pageContent.substring(0, 200) + '...',
      metadata: doc.metadata,
      score: score,
    }));

    return NextResponse.json({
      success: true,
      response: finalResponse,
      sources,
      hydeQuery,
    } as ChatResponse);

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate response',
        response: '',
      } as ChatResponse,
      { status: 500 }
    );
  }
}

/**
 * HyDE Pipeline Implementation
 * 1. Generate hypothetical answer from the question
 * 2. Create embedding of the hypothetical answer
 * 3. Use embedding to retrieve relevant documents
 */
async function performHyDERetrieval(
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  vectorStore: QdrantVectorStore
): Promise<{ hypotheticalAnswer: string; retrievedDocs: Array<[any, number]> }> {
  
  // Step 1: Generate hypothetical answer
  const hypotheticalAnswer = await generateHypotheticalAnswer(userQuestion, conversationHistory);
  
  // Step 2: Use hypothetical answer for retrieval
  const retrievedDocs = await vectorStore.similaritySearchWithScore(hypotheticalAnswer, 5);
  
  return {
    hypotheticalAnswer,
    retrievedDocs
  };
}

/**
 * Generate a hypothetical answer to the user's question
 * This answer will be used for embedding-based retrieval
 */
async function generateHypotheticalAnswer(
  question: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  
  // Build conversation context
  const historyText = conversationHistory
    .slice(-4) // Use only last 4 exchanges to keep prompt manageable
    .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const hydePrompt = `You are an expert assistant. Based on the conversation context and the current question, write a comprehensive hypothetical answer that would likely contain the information the user is looking for.

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Question: ${question}

Write a small hypothetical answer that covers the key aspects someone would typically want to know about this question. This answer will be used to find relevant documents, so include various terms and concepts that might appear in relevant documents.

Hypothetical Answer:`;

  try {
    const result = await model.generateContent(hydePrompt);
    const hypotheticalAnswer = result.response.text().trim();
    
    // Ensure we have a meaningful response
    if (hypotheticalAnswer.length < 20) {
      // Fallback to original question if hypothetical answer is too short
      return question;
    }
    
    return hypotheticalAnswer;
  } catch (error) {
    console.error('Error generating hypothetical answer:', error);
    // Fallback to original question
    return question;
  }
}

/**
 * Generate the final response using retrieved context
 */
async function generateFinalResponse(
  userQuestion: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  relevantDocs: Array<[any, number]>
): Promise<string> {
  
  // Prepare context from relevant documents
  const context = relevantDocs
    .map(([doc, score], index) => `[Source ${index + 1}] (Relevance: ${score.toFixed(3)})\n${doc.pageContent}`)
    .join('\n\n---\n\n');

  // Build conversation history
  const historyText = conversationHistory
    .slice(-6) // Keep more history for final response
    .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const finalPrompt = `You are a smart assistant. Your job is to answer the user's question based on the provided context and conversation history.

Context from documents:
${context}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Current question: ${userQuestion}

Instructions:
- Answer based primarily on the provided context
- If the answer cannot be found in the context, say so clearly
- Be concise but comprehensive
- When providing links, use this format: [Link name](url)
- Cite which sources you're referencing when possible (e.g., "According to Source 1...")
- If multiple sources contradict each other, mention this

Answer:`;

  try {
    const result = await model.generateContent(finalPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Error generating final response:', error);
    throw new Error('Failed to generate response');
  }
}