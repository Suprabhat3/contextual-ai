// utils/localStorage.ts

import type { UploadedFile } from '../types/firebase';
const DOCUMENTS_KEY = 'uploaded_documents';
const CHAT_SETTINGS_KEY = 'chat_settings';

export interface ChatSettings {
  autoScroll: boolean;
  showSources: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'dark' | 'light';
}

export class LocalStorageService {
  // Document operations
  static saveDocuments(docs: UploadedFile[]): void {
    try {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
    }
  }

  static loadDocuments(): UploadedFile[] {
    try {
      const saved = localStorage.getItem(DOCUMENTS_KEY);
      if (saved) {
        const docs = JSON.parse(saved);
        // Convert uploadedAt string back to Date
        return docs.map((doc: any) => ({
          ...doc,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading documents from localStorage:', error);
      return [];
    }
  }

  static removeDocument(documentId: string): void {
    const docs = this.loadDocuments();
    const filtered = docs.filter(doc => doc.id !== documentId);
    this.saveDocuments(filtered);
  }

  static clearDocuments(): void {
    try {
      localStorage.removeItem(DOCUMENTS_KEY);
    } catch (error) {
      console.error('Error clearing documents from localStorage:', error);
    }
  }

  // Settings operations
  static saveChatSettings(settings: ChatSettings): void {
    try {
      localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving chat settings:', error);
    }
  }

  static loadChatSettings(): ChatSettings {
    try {
      const saved = localStorage.getItem(CHAT_SETTINGS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
    
    // Default settings
    return {
      autoScroll: true,
      showSources: true,
      fontSize: 'medium',
      theme: 'dark',
    };
  }

  // Utility methods
  static getStorageSize(): number {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          total += key.length + value.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  static clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}