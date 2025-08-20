// types/firebase.ts
import { Timestamp } from 'firebase/firestore';

export interface FirebaseMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  attachments?: UploadedFile[];
  sources?: DocumentSource[];
  userId: string;
  chatId: string;
}

export interface FirebaseChat {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'url';
  size?: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  collectionId?: string;
  preview?: string;
  uploadedAt?: Date;
}

export interface DocumentSource {
  content: string;
  metadata: any;
  score: number;
}