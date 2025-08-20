import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FirebaseMessage, FirebaseChat } from '@/types/firebase';

export class FirestoreService {
  // Chat operations
  static async createChat(userId: string, title: string = 'New Chat'): Promise<string> {
    const chatRef = await addDoc(collection(db, 'chats'), {
      userId,
      title,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return chatRef.id;
  }

  static async updateChatTitle(chatId: string, title: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      title,
      updatedAt: Timestamp.now(),
    });
  }

  static async deleteChat(chatId: string): Promise<void> {
    // Delete all messages in the chat first
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    
    const deletePromises = messagesSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);

    // Delete the chat
    const chatRef = doc(db, 'chats', chatId);
    await deleteDoc(chatRef);
  }

  static getUserChats(userId: string, callback: (chats: FirebaseChat[]) => void) {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(chatsQuery, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FirebaseChat[];
      callback(chats);
    });
  }

  // Message operations
  static async addMessage(message: Omit<FirebaseMessage, 'id'>): Promise<string> {
    const messageRef = await addDoc(collection(db, 'messages'), {
      ...message,
      timestamp: Timestamp.now(),
    });
    return messageRef.id;
  }

  static getChatMessages(chatId: string, callback: (messages: FirebaseMessage[]) => void) {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as FirebaseMessage[];
      callback(messages);
    });
  }

  static async deleteMessage(messageId: string): Promise<void> {
    const messageRef = doc(db, 'messages', messageId);
    await deleteDoc(messageRef);
  }

  // Utility methods
  static async updateChatTimestamp(chatId: string): Promise<void> {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      updatedAt: Timestamp.now(),
    });
  }
}