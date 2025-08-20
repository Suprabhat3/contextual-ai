'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  FileText,
  Link,
  X,
  User,
  Bot,
  Loader2,
  CheckCircle,
  AlertCircle,
  Menu,
  Eye,
  Trash2
} from 'lucide-react';
import { auth, db } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

/*********** TYPES  ***********/
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: UploadedFile[];
  sources?: DocumentSource[];
  userId?: string;
  chatId?: string;
}

interface UploadedFile {
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

interface DocumentSource {
  content: string;
  metadata: any;
  score: number;
}

interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/*********** CONSTANTS ***********/
const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB
const PREVIEW_LENGTH = 200;

/*********** LOCAL STORAGE HELPERS ***********/
const saveDocumentsToLocal = (docs: UploadedFile[]) => {
  try {
    localStorage.setItem('uploaded_documents', JSON.stringify(docs));
  } catch (error) {
    console.error('Error saving documents to localStorage:', error);
  }
};

const loadDocumentsFromLocal = (): UploadedFile[] => {
  try {
    const saved = localStorage.getItem('uploaded_documents');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading documents from localStorage:', error);
    return [];
  }
};

/*********** API HELPERS ***********/
const ragAPI = {
  uploadDocument: async (formData: FormData) => {
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  chat: async (request: { message: string; collectionId: string; conversationHistory: any[] }) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  deleteCollection: async (collectionId: string) => {
    const response = await fetch('/api/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionId }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};

/*********** MODAL COMPONENTS ***********/
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title,
  onClose,
  children
}) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-sm bg-slate-800 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-white">{title}</h3>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
  };
const PreviewModal: React.FC<{ file: UploadedFile; onClose: () => void }> = ({ file, onClose }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl bg-slate-800 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Document Preview</h3>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
          <span className="font-medium">{file.name}</span>
          {file.size && <span>({formatBytes(file.size)})</span>}
          <span className="text-xs bg-blue-500/20 px-2 py-1 rounded uppercase">{file.type}</span>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto bg-black/20 rounded-lg p-4">
        <pre className="text-sm text-gray-200 whitespace-pre-wrap">
          {file.preview || 'No preview available'}
        </pre>
      </div>
    </div>
  </div>
);

/*********** MAIN COMPONENT ***********/
export default function ContextualAIChatUI() {
  /* ---------- Auth & Firebase ---------- */
  const [user, loading] = useAuthState(auth);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  /* ---------- State ---------- */
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  /* Bottom-sheet for mobile */
  const [showSheet, setShowSheet] = useState(false);

  /* URL / Text quick modals */
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [url, setUrl] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [showPreview, setShowPreview] = useState<UploadedFile | null>(null);

  /* Refs */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);

  /* ---------- Effects ---------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const refs = [desktopTextareaRef, mobileTextareaRef];
    refs.forEach(ref => {
      if (ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${Math.min(ref.current.scrollHeight, 120)}px`;
      }
    });
  }, [inputMessage]);

  // Initialize anonymous auth and load documents
  useEffect(() => {
    const initAuth = async () => {
      if (!user && !loading) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Auth error:', error);
        }
      }
    };
    initAuth();
  }, [user, loading]);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = loadDocumentsFromLocal();
    setUploadedFiles(savedDocs);
  }, []);

  // Save documents to localStorage when they change
  useEffect(() => {
    saveDocumentsToLocal(uploadedFiles);
  }, [uploadedFiles]);

  // Load messages from Firebase when user is available
  useEffect(() => {
    if (!user) return;

    // Create or get current chat session
    const initChat = async () => {
      if (!currentChatId) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          userId: user.uid,
          title: 'New Chat',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setCurrentChatId(chatRef.id);
      }
    };

    initChat();

    // Listen to messages if we have a chat ID
    if (currentChatId) {
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', currentChatId),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const loadedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Message[];
        
        if (loadedMessages.length === 0) {
          // Set welcome message for new chat
          setMessages([{
            id: 'welcome',
            type: 'assistant',
            content: 'Hello! Upload a PDF, paste text, or share a URL — then ask me anything about it.',
            timestamp: new Date()
          }]);
        } else {
          setMessages(loadedMessages);
        }
      });

      return () => unsubscribe();
    }
  }, [user, currentChatId]);

  /* ---------- Helpers ---------- */
  const isValidUrl = (u: string) => {
    try { new URL(u); return true; } catch { return false; }
  };



  const removeFile = async (id: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === id);
    
    // Delete from Qdrant if it has a collection ID
    if (fileToRemove?.collectionId) {
      try {
        await ragAPI.deleteCollection(fileToRemove.collectionId);
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
    
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const fileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />;
      case 'text':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'url':
        return <Link className="w-4 h-4 text-green-400" />;
    }
  };

  /* ---------- Upload Handlers ---------- */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach(async (file) => {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are supported');
        return;
      }
      
      if (file.size > MAX_PDF_SIZE) {
        alert(`File size must be less than ${MAX_PDF_SIZE / (1024 * 1024)}MB`);
        return;
      }

      const id = crypto.randomUUID();
      const newFile: UploadedFile = { 
        id, 
        name: file.name, 
        type: 'pdf', 
        size: file.size, 
        status: 'uploading',
        uploadedAt: new Date()
      };
      
      setUploadedFiles((p) => [...p, newFile]);

      try {
        const formData = new FormData();
        formData.append('type', 'pdf');
        formData.append('file', file);

        const response = await ragAPI.uploadDocument(formData);
        
        if (response.success) {
          setUploadedFiles((p) =>
            p.map((f) =>
              f.id === id ? { 
                ...f, 
                status: 'success', 
                collectionId: response.collectionId,
                preview: `PDF processed successfully. ${response.documentCount} chunks created.`
              } : f
            )
          );
        } else {
          throw new Error(response.message || 'Upload failed');
        }
      } catch (error) {
        setUploadedFiles((p) =>
          p.map((f) =>
            f.id === id ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            } : f
          )
        );
      }
    });
    setShowSheet(false);
  };

  const handleTextUpload = async () => {
    if (!textContent.trim()) return;
    
    const id = crypto.randomUUID();
    const name = `Text: ${textContent.slice(0, 30)}${textContent.length > 30 ? '…' : ''}`;
    const newFile: UploadedFile = { 
      id, 
      name, 
      type: 'text', 
      status: 'uploading',
      preview: textContent.slice(0, PREVIEW_LENGTH) + (textContent.length > PREVIEW_LENGTH ? '...' : ''),
      uploadedAt: new Date()
    };
    
    setUploadedFiles((p) => [...p, newFile]);

    try {
      const formData = new FormData();
      formData.append('type', 'text');
      formData.append('text', textContent);

      const response = await ragAPI.uploadDocument(formData);
      
      if (response.success) {
        setUploadedFiles((p) =>
          p.map((f) =>
            f.id === id ? { 
              ...f, 
              status: 'success', 
              collectionId: response.collectionId 
            } : f
          )
        );
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      setUploadedFiles((p) =>
        p.map((f) =>
          f.id === id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        )
      );
    }

    setTextContent('');
    setShowTextModal(false);
    setShowSheet(false);
  };

  const handleUrlUpload = async () => {
    if (!isValidUrl(url)) return;
    
    const id = crypto.randomUUID();
    const newFile: UploadedFile = { 
      id, 
      name: url, 
      type: 'url', 
      status: 'uploading', 
      url,
      uploadedAt: new Date()
    };
    
    setUploadedFiles((p) => [...p, newFile]);

    try {
      const formData = new FormData();
      formData.append('type', 'url');
      formData.append('url', url);

      const response = await ragAPI.uploadDocument(formData);
      
      if (response.success) {
        setUploadedFiles((p) =>
          p.map((f) =>
            f.id === id ? { 
              ...f, 
              status: 'success', 
              collectionId: response.collectionId,
              preview: `Website content processed. ${response.documentCount} chunks created.`
            } : f
          )
        );
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      setUploadedFiles((p) =>
        p.map((f) =>
          f.id === id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        )
      );
    }

    setUrl('');
    setShowUrlModal(false);
    setShowSheet(false);
  };

  /* ---------- Chat ---------- */
  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || !currentChatId) return;

    const successfulFiles = uploadedFiles.filter((f) => f.status === 'success');
    
    const userMsg: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      attachments: successfulFiles.length ? successfulFiles : undefined,
      userId: user.uid,
      chatId: currentChatId,
    };

    // Save user message to Firebase
    await addDoc(collection(db, 'messages'), {
      ...userMsg,
      timestamp: new Date(),
    });

    setInputMessage('');
    setIsTyping(true);

    // If we have documents, use RAG
    if (successfulFiles.length > 0) {
      try {
        // Use the first successful document's collection ID
        const collectionId = successfulFiles[0].collectionId!;
        
        // Prepare conversation history
        const conversationHistory = messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        const response = await ragAPI.chat({
          message: inputMessage,
          collectionId,
          conversationHistory
        });

        if (response.success) {
          const assistantMsg: Message = {
            id: crypto.randomUUID(),
            type: 'assistant',
            content: response.response,
            timestamp: new Date(),
            sources: response.sources,
            userId: user.uid,
            chatId: currentChatId,
          };

          // Save assistant message to Firebase
          await addDoc(collection(db, 'messages'), {
            ...assistantMsg,
            timestamp: new Date(),
          });
        } else {
          throw new Error(response.error || 'Chat failed');
        }
      } catch (error) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          userId: user.uid,
          chatId: currentChatId,
        };

        await addDoc(collection(db, 'messages'), {
          ...errorMsg,
          timestamp: new Date(),
        });
      }
    } else {
      // No documents uploaded, provide helpful message
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Please upload a document (PDF, text, or URL) first so I can help answer questions about it.',
        timestamp: new Date(),
        userId: user.uid,
        chatId: currentChatId,
      };

      await addDoc(collection(db, 'messages'), {
        ...assistantMsg,
        timestamp: new Date(),
      });
    }

    setIsTyping(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  /* ---------- Render ---------- */
  return (
    <div className="h-screen flex bg-slate-900 text-white">
      {/* ===== DESKTOP WRAPPER ===== */}
      <div className="hidden md:flex w-full">
        {/* Left sidebar (desktop) */}
        <aside className="w-1/3 bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Data Sources</h2>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-gray-400" />
              <div>
                <span className="text-gray-200 text-lg block">Upload PDF</span>
                <span className="text-xs text-gray-400">Max 5MB</span>
              </div>
            </button>

            <button
              onClick={() => setShowTextModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <FileText className="w-6 h-6 text-gray-400" />
              <span className="text-gray-200 text-lg">Paste text</span>
            </button>

            <button
              onClick={() => setShowUrlModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
            >
              <Link className="w-6 h-6 text-gray-400" />
              <span className="text-gray-200 text-lg">Add website</span>
            </button>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Uploaded Files</h3>
                {uploadedFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-white/10">
                    {fileIcon(f.type)}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-200 block truncate">{f.name}</span>
                      {f.size && <span className="text-xs text-gray-400">{formatBytes(f.size)}</span>}
                      {f.uploadedAt && (
                        <span className="text-xs text-gray-500">
                          {f.uploadedAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {f.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                      {f.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                      {f.preview && f.status === 'success' && (
                        <button 
                          onClick={() => setShowPreview(f)} 
                          className="text-gray-400 hover:text-gray-200"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => removeFile(f.id)} 
                        className="text-gray-400 hover:text-gray-200"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right panel (desktop chat) */}
        <main className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg" />
              <div>
                <h1 className="text-lg font-semibold text-white">Contextual AI Chat</h1>
                <p className="text-sm text-gray-300">Ask questions about your documents</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                  }`}
                >
                  {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex-1 max-w-3xl ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl ${
                      msg.type === 'user'
                        ? 'bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-white'
                        : 'bg-black/20 backdrop-blur-sm border border-white/10 text-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                        {msg.attachments.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 text-sm opacity-90">
                            {fileIcon(f.type)}
                            <span className="truncate">{f.name}</span>
                            {f.size && <span className="text-xs">({formatBytes(f.size)})</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-1">Sources:</p>
                        {msg.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="text-xs bg-black/20 rounded p-2 mb-1">
                            <p className="truncate">{source.content}</p>
                            <span className="text-gray-500">Score: {source.score.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 text-gray-300 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-200">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-300" /> AI is thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-black/20 border-t border-white/10 px-6 py-4">
            <div className="flex items-end gap-3">
              <textarea
                ref={desktopTextareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-black/30 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                rows={1}
                style={{ minHeight: 48, maxHeight: 120 }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim()}
                className="p-3 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-gray-500/20 disabled:text-gray-400"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ===== MOBILE MARKUP ===== */}
      <div className="md:hidden h-full w-full flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <button onClick={() => setShowSheet((s) => !s)} className="p-1">
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          <div className="w-7 h-7 bg-gradient-to-r from-blue-200 to-purple-200 rounded-md" />
          <div>
            <h1 className="text-base font-semibold text-white">Contextual AI</h1>
            <p className="text-xs text-gray-400">Ask about your docs</p>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-gray-300" />
                </div>
              )}
              <div className={`max-w-[75%] ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-black/20 text-gray-100 border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 space-y-1">
                      {msg.attachments.map((f) => (
                        <div key={f.id} className="flex items-center gap-1.5 text-xs">
                          {fileIcon(f.type)}
                          <span className="truncate">{f.name}</span>
                          {f.size && <span className="opacity-60">({formatBytes(f.size)})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Sources:</p>
                      {msg.sources.slice(0, 2).map((source, idx) => (
                        <div key={idx} className="text-xs bg-black/20 rounded p-1 mb-1">
                          <p className="truncate">{source.content.slice(0, 50)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {msg.type === 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <div className="bg-black/20 border border-white/10 rounded-2xl px-3 py-2 text-sm text-gray-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> AI is thinking…
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="bg-black/20 border-t border-white/10 px-2 py-2">
          {uploadedFiles.filter((f) => f.status === 'success').length > 0 && (
            <div className="text-xs text-gray-400 mb-1 px-2">
              {uploadedFiles.filter((f) => f.status === 'success').length} source(s) ready
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={mobileTextareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask a question…"
              rows={1}
              className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              style={{ minHeight: 40, maxHeight: 120 }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="p-2.5 bg-blue-500 rounded-full text-white disabled:opacity-50 disabled:bg-gray-500/20 disabled:text-blue-300/50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom-sheet backdrop */}
        <div
          className={`fixed inset-0 bg-black/50 z-20 transition-opacity md:hidden ${showSheet ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowSheet(false)}
        />
        <aside
          className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-slate-900/90 backdrop-blur-md border-r border-white/10 z-30 transition-transform md:hidden ${
            showSheet ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Sources</h2>
            <button onClick={() => setShowSheet(false)}>
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-60px)] p-4">
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg text-left"
              >
                <FileText className="w-5 h-5 text-gray-300" />
                <div>
                  <span className="text-gray-200 block">Upload PDF</span>
                  <span className="text-xs text-gray-400">Max 5MB</span>
                </div>
              </button>
              <button
                onClick={() => setShowTextModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg text-left"
              >
                <FileText className="w-5 h-5 text-gray-300" />
                <span className="text-gray-200">Paste text</span>
              </button>
              <button
                onClick={() => setShowUrlModal(true)}
                className="w-full flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-lg text-left"
              >
                <Link className="w-5 h-5 text-gray-300" />
                <span className="text-gray-200">Add website</span>
              </button>
            </div>
            
            <div className="flex-1 mt-4 space-y-2 overflow-y-auto">
              {uploadedFiles.map((f) => (
                <div key={f.id} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg">
                  {fileIcon(f.type)}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate text-sm text-gray-200">{f.name}</span>
                    {f.size && <span className="text-xs text-gray-400">{formatBytes(f.size)}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {f.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    {f.status === 'success' && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                    {f.preview && f.status === 'success' && (
                      <button 
                        onClick={() => setShowPreview(f)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => removeFile(f.id)}>
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      
      {/* FIX: Moved Modals and hidden inputs to the top level */}
      {showTextModal && (
        <Modal title="Paste text" onClose={() => setShowTextModal(false)}>
          <textarea
            autoFocus
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-32 p-2 bg-black/30 border border-white/10 rounded-md text-white placeholder-gray-400"
            placeholder="Paste or type text…"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowTextModal(false)} className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200">
              Cancel
            </button>
            <button
              onClick={handleTextUpload}
              disabled={!textContent.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </Modal>
      )}

      {showUrlModal && (
        <Modal title="Add website" onClose={() => setShowUrlModal(false)}>
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValidUrl(url) && handleUrlUpload()}
            placeholder="https://example.com"
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded-md text-white placeholder-gray-400"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowUrlModal(false)} className="px-3 py-1 text-sm text-gray-400 hover:text-gray-200">
              Cancel
            </button>
            <button
              onClick={handleUrlUpload}
              disabled={!isValidUrl(url)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </Modal>
      )}

      {showPreview && (
        <PreviewModal file={showPreview} onClose={() => setShowPreview(null)} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}