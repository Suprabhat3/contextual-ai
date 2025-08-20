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
}

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "embedding-001",
});

const qdrantClient = new QdrantClient({
  host: process.env.QDRANT_HOST || 'localhost',
  port: Number(process.env.QDRANT_PORT) || 6333,
  apiKey: process.env.QDRANT_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, collectionId, conversationHistory = [] }: ChatRequest = await request.json();

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

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearchWithScore(message, 5);

    if (relevantDocs.length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the uploaded document to answer your question.",
        sources: [],
      } as ChatResponse);
    }

    // Prepare context from relevant documents
    const context = relevantDocs
      .map(([doc, score]) => doc.pageContent)
      .join('\n\n');

    // Build conversation history
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create prompt
    const prompt = `
You are a helpful AI assistant that answers questions based on the provided context from uploaded documents.

Context from documents:
${context}

${historyText ? `Previous conversation:\n${historyText}\n` : ''}

Current question: ${message}

Please answer the question based on the provided context. If the answer cannot be found in the context, please say so. Be concise but comprehensive.

Answer:`;

    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Prepare sources information
    const sources = relevantDocs.map(([doc, score]) => ({
      content: doc.pageContent.substring(0, 200) + '...',
      metadata: doc.metadata,
      score: score,
    }));

    return NextResponse.json({
      success: true,
      response,
      sources,
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