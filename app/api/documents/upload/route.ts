// app/api/documents/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

// Types
interface UploadResponse {
  success: boolean;
  collectionId: string;
  documentCount: number;
  message: string;
}

interface DocumentMetadata {
  source: string;
  type: 'pdf' | 'text' | 'url';
  timestamp: number;
  collectionId: string;
}

// Initialize clients
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: "embedding-001",
});

// Updated Qdrant client for cloud usage
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL!, // Cloud URL
  apiKey: process.env.QDRANT_API_KEY!,
});

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n\n', '\n', ' ', ''],
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const collectionId = uuidv4();

    let documents: any[] = [];

    switch (type) {
      case 'pdf':
        documents = await handlePDFUpload(formData, collectionId);
        break;
      case 'text':
        documents = await handleTextUpload(formData, collectionId);
        break;
      case 'url':
        documents = await handleURLUpload(formData, collectionId);
        break;
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid document type' },
          { status: 400 }
        );
    }

    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No documents processed' },
        { status: 400 }
      );
    }

    // Create collection in Qdrant
    await createQdrantCollection(collectionId);

    // Split documents into chunks
    const splitDocs = await textSplitter.splitDocuments(documents);

    // Store in Qdrant
    await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
      client: qdrantClient,
      collectionName: collectionId,
    });

    const response: UploadResponse = {
      success: true,
      collectionId,
      documentCount: splitDocs.length,
      message: `Successfully processed ${splitDocs.length} document chunks`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process document',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handlePDFUpload(formData: FormData, collectionId: string) {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No PDF file provided');

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Save temporary file
  const tempPath = join(tmpdir(), `${collectionId}.pdf`);
  await writeFile(tempPath, buffer);

  try {
    const loader = new PDFLoader(tempPath);
    const documents = await loader.load();
    
    // Add metadata
    documents.forEach(doc => {
      doc.metadata = {
        ...doc.metadata,
        source: file.name,
        type: 'pdf',
        timestamp: Date.now(),
        collectionId,
      } as DocumentMetadata;
    });

    return documents;
  } finally {
    // Clean up temp file
    await unlink(tempPath).catch(() => {});
  }
}

async function handleTextUpload(formData: FormData, collectionId: string) {
  const text = formData.get('text') as string;
  if (!text) throw new Error('No text content provided');

  const documents = [{
    pageContent: text,
    metadata: {
      source: 'text-input',
      type: 'text',
      timestamp: Date.now(),
      collectionId,
    } as DocumentMetadata,
  }];

  return documents;
}

async function handleURLUpload(formData: FormData, collectionId: string) {
  const url = formData.get('url') as string;
  if (!url) throw new Error('No URL provided');

  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  const loader = new CheerioWebBaseLoader(url);
  const documents = await loader.load();
  
  // Add metadata
  documents.forEach(doc => {
    doc.metadata = {
      ...doc.metadata,
      source: url,
      type: 'url',
      timestamp: Date.now(),
      collectionId,
    } as DocumentMetadata;
  });

  return documents;
}

async function createQdrantCollection(collectionName: string) {
  try {
    // Check if collection exists first
    const collections = await qdrantClient.getCollections();
    const existingCollection = collections.collections.find(
      col => col.name === collectionName
    );
    
    if (existingCollection) {
      console.log(`Collection ${collectionName} already exists`);
      return;
    }

    await qdrantClient.createCollection(collectionName, {
      vectors: {
        size: 768, // Gemini embedding dimension
        distance: 'Cosine',
      },
    });
    
    console.log(`Collection ${collectionName} created successfully`);
  } catch (error) {
    console.error(`Error with collection ${collectionName}:`, error);
    // Only throw if it's not a "collection already exists" error
    if (error instanceof Error && !error.message.includes('already exists')) {
      throw error;
    }
  }
}