// app/api/collections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

// Use the cloud version of Qdrant by connecting via the full URL
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// GET - List all collections
export async function GET() {
  try {
    const collections = await qdrantClient.getCollections();
    return NextResponse.json({
      success: true,
      collections: collections.collections,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a collection
export async function DELETE(request: NextRequest) {
  try {
    const { collectionId } = await request.json();
    
    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID is required' },
        { status: 400 }
      );
    }

    await qdrantClient.deleteCollection(collectionId);
    
    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}