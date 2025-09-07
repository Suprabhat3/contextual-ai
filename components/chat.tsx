'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
  LogIn,
  LogOut,
  Upload,
  Plus,
  Youtube,
  File,
  Type,
  Globe,
  Paperclip
} from 'lucide-react';
import { auth } from '@/firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

/*********** TYPES ***********/
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: UploadedFile[];
  sources?: DocumentSource[];
  userId?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'url' | 'youtube' | 'docx' | 'csv' | 'json' | 'txt' | 'file';
  size?: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
  collectionId?: string;
  preview?: string;
  uploadedAt?: Date;
  title?: string;
  author?: string;
  duration?: string;
}

interface DocumentSource {
  content: string;
  metadata: any;
  score: number;
}

/*********** CONSTANTS ***********/
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_LENGTH = 200;

const SUPPORTED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
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

/*********** UTILITY FUNCTIONS ***********/
const isValidUrl = (u: string) => {
  try { new URL(u); return true; } catch { return false; }
};

const isYouTubeUrl = (url: string) => {
  const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/;
  return youtubePattern.test(url);
};

const formatBytes = (bytes?: number) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
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
        {file.type === 'youtube' && file.title && (
          <div className="text-sm text-gray-400">
            <p><strong>Title:</strong> {file.title}</p>
            {file.author && <p><strong>Author:</strong> {file.author}</p>}
            {file.duration && <p><strong>Duration:</strong> {file.duration}</p>}
          </div>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto bg-black/20 rounded-lg p-4">
        <pre className="text-sm text-gray-200 whitespace-pre-wrap">
          {file.preview || 'No preview available'}
        </pre>
      </div>
    </div>
  </div>
);

const UploadOptionsModal: React.FC<{ 
  onClose: () => void; 
  onSelectOption: (option: string) => void;
  checkAuth: () => boolean;
}> = ({ onClose, onSelectOption, checkAuth }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-slate-800 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Add Content</h3>
        <button onClick={onClose}>
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => { checkAuth() && onSelectOption('file'); onClose(); }}
          className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <File className="w-6 h-6 text-blue-400" />
          <div>
            <span className="text-gray-200 text-base block font-medium">Upload Files</span>
            <span className="text-xs text-gray-400">PDF, DOCX, TXT, CSV, JSON (Max 10MB)</span>
          </div>
        </button>

        <button
          onClick={() => { checkAuth() && onSelectOption('text'); onClose(); }}
          className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <Type className="w-6 h-6 text-green-400" />
          <div>
            <span className="text-gray-200 text-base block font-medium">Paste Text</span>
            <span className="text-xs text-gray-400">Add text content directly</span>
          </div>
        </button>

        <button
          onClick={() => { checkAuth() && onSelectOption('url'); onClose(); }}
          className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <Globe className="w-6 h-6 text-purple-400" />
          <div>
            <span className="text-gray-200 text-base block font-medium">Web Page</span>
            <span className="text-xs text-gray-400">Extract content from website</span>
          </div>
        </button>

        <button
          onClick={() => { checkAuth() && onSelectOption('youtube'); onClose(); }}
          className="w-full flex items-center gap-4 p-4 bg-black/20 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <Youtube className="w-6 h-6 text-red-400" />
          <div>
            <span className="text-gray-200 text-base block font-medium">YouTube Video</span>
            <span className="text-xs text-gray-400">Extract transcript from video</span>
          </div>
        </button>
      </div>
    </div>
  </div>
);

const fileIcon = (type: UploadedFile['type']) => {
  switch (type) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-400" />;
    case 'docx':
      return <FileText className="w-4 h-4 text-blue-400" />;
    case 'txt':
      return <FileText className="w-4 h-4 text-gray-400" />;
    case 'csv':
      return <FileText className="w-4 h-4 text-green-400" />;
    case 'json':
      return <FileText className="w-4 h-4 text-yellow-400" />;
    case 'text':
      return <Type className="w-4 h-4 text-blue-400" />;
    case 'url':
      return <Globe className="w-4 h-4 text-purple-400" />;
    case 'youtube':
      return <Youtube className="w-4 h-4 text-red-400" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
};

const initialWelcomeMessage: Message = {
  id: 'welcome',
  type: 'assistant',
  content: 'Hello! Upload documents (PDF, DOCX, TXT, CSV, JSON), add text, share a website URL, or paste a YouTube video link, then ask me anything about it.',
  timestamp: new Date()
};

/*********** MAIN COMPONENT ***********/
export default function ContextualAIChatUI() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [url, setUrl] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [showPreview, setShowPreview] = useState<UploadedFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mobileTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const checkAuth = (): boolean => {
    if (!user) {
      router.push('/signup');
      return false;
    }
    return true;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setMessages([initialWelcomeMessage]);
      setUploadedFiles([]);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const removeFile = async (id: string) => {
    if (!checkAuth()) return;

    const fileToRemove = uploadedFiles.find(f => f.id === id);

    if (fileToRemove?.collectionId) {
      try {
        await ragAPI.deleteCollection(fileToRemove.collectionId);
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }

    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!checkAuth()) return;
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const fileType = SUPPORTED_FILE_TYPES[file.type as keyof typeof SUPPORTED_FILE_TYPES];
      if (!fileType) {
        alert(`Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT, CSV, JSON`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        return;
      }

      const id = crypto.randomUUID();
      const newFile: UploadedFile = {
        id,
        name: file.name,
        type: fileType,
        size: file.size,
        status: 'uploading',
        uploadedAt: new Date()
      };

      setUploadedFiles((p) => [...p, newFile]);

      try {
        const formData = new FormData();
        formData.append('type', 'file');
        formData.append('file', file);

        const response = await ragAPI.uploadDocument(formData);

        if (response.success) {
          setUploadedFiles((p) =>
            p.map((f) =>
              f.id === id ? {
                ...f,
                status: 'success',
                collectionId: response.collectionId,
                preview: `${fileType.toUpperCase()} processed successfully. ${response.documentCount} chunks created.`
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
  };

  const handleTextUpload = async () => {
    if (!checkAuth()) return;
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
  };

  const handleUrlUpload = async () => {
    if (!checkAuth()) return;
    if (!isValidUrl(url)) return;

    const id = crypto.randomUUID();
    const isYoutube = isYouTubeUrl(url);
    const newFile: UploadedFile = {
      id,
      name: url,
      type: isYoutube ? 'youtube' : 'url',
      status: 'uploading',
      url,
      uploadedAt: new Date()
    };

    setUploadedFiles((p) => [...p, newFile]);

    try {
      const formData = new FormData();
      formData.append('type', isYoutube ? 'youtube' : 'url');
      formData.append('url', url);

      const response = await ragAPI.uploadDocument(formData);

      if (response.success) {
        setUploadedFiles((p) =>
          p.map((f) =>
            f.id === id ? {
              ...f,
              status: 'success',
              collectionId: response.collectionId,
              preview: isYoutube 
                ? `YouTube video transcript processed. ${response.documentCount} chunks created.`
                : `Website content processed. ${response.documentCount} chunks created.`
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
  };

  const handleUploadOption = (option: string) => {
    switch (option) {
      case 'file':
        fileInputRef.current?.click();
        break;
      case 'text':
        setShowTextModal(true);
        break;
      case 'url':
      case 'youtube':
        setShowUrlModal(true);
        break;
    }
  };

  const sendMessage = async () => {
    if (!checkAuth()) return;
    if (!inputMessage.trim()) return;

    const successfulFiles = uploadedFiles.filter((f) => f.status === 'success');

    const userMsg: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      attachments: successfulFiles.length ? successfulFiles : undefined,
      userId: user!.uid,
    };

    setMessages(prev => [...prev, userMsg]);

    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    if (successfulFiles.length > 0) {
      try {
        const collectionId = successfulFiles[0].collectionId!;

        const conversationHistory = messages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

        conversationHistory.push({ role: 'user', content: currentInput });

        const response = await ragAPI.chat({
          message: currentInput,
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
            userId: 'assistant-id',
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          throw new Error(response.error || 'Chat failed');
        }
      } catch (error) {
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          type: 'assistant',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          userId: 'assistant-id',
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } else {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: 'Please upload a document, add text, or share a URL/YouTube video first so I can help answer questions about it.',
        timestamp: new Date(),
        userId: 'assistant-id',
      };
      setMessages(prev => [...prev, assistantMsg]);
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

  return (
    <div className="h-screen flex bg-slate-900 text-white relative">
      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden md:flex w-full flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <button 
            onClick={() => setShowSidebar(true)} 
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Open data sources"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Contextual AI Chat</h1>
            <p className="text-sm text-gray-300">Ask questions about your documents</p>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">
                {user.email || 'Anonymous'}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/signup')}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </header>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-slate-900">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                    }`}
                >
                  {msg.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`flex-1 max-w-3xl ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl ${msg.type === 'user'
                        ? 'bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-white'
                        : 'bg-black/20 backdrop-blur-sm border border-white/10 text-gray-100'
                      }`}
                  >
                    <div className="prose prose-invert prose-sm max-w-none text-left">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ node, inline, className, children, ...props }: any) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>

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

          {/* Input Area - Fixed at bottom */}
          <div className="bg-slate-900 border-t border-white/30 px-6 py-8">
            <div className="max-w-4xl mx-auto">
              {uploadedFiles.filter((f) => f.status === 'success').length > 0 && (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>{uploadedFiles.filter((f) => f.status === 'success').length} source(s) ready</span>
                </div>
              )}
              <div className="flex items-end gap-3">
                <button
                  onClick={() => checkAuth() && setShowUploadModal(true)}
                  className="flex-shrink-0 p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors flex items-center justify-center h-12 w-12"
                  title="Add content"
                >
                  <Paperclip className="w-5 h-5 text-gray-300" />
                </button>
                <div className="flex-1 flex flex-col">
                  <textarea
                    ref={desktopTextareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Ask a question about your documents..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm scrollbar-hide overflow-hidden"
                    rows={1}
                    style={{ minHeight: 48, maxHeight: 120 }}
                  />
                  {inputMessage && (
                    <div className="text-xs text-gray-500 text-right mt-1 pr-2">
                      {inputMessage.length}/1000
                    </div>
                  )}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-purple-500 shadow-lg flex items-center justify-center h-12 w-12"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowSidebar(false)}
        />
        <aside
          className={`fixed top-0 left-0 h-full w-1/3 max-w-sm bg-slate-900/95 backdrop-blur-md border-r border-white/10 z-50 transition-transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Data Sources</h2>
            <button onClick={() => setShowSidebar(false)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <button
              onClick={() => {checkAuth() && setShowUploadModal(true); setShowSidebar(false);}}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg hover:from-blue-500/20 hover:to-purple-500/20 transition-all text-left"
            >
              <Plus className="w-6 h-6 text-blue-400" />
              <div>
                <span className="text-white text-lg block font-medium">Add Content</span>
                <span className="text-xs text-gray-400">Files, text, URLs, YouTube videos</span>
              </div>
            </button>

            {uploadedFiles.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Uploaded Sources ({uploadedFiles.length})</h3>
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
      </div>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="md:hidden h-full w-full flex flex-col">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <button onClick={() => setShowSidebar((s) => !s)} className="p-1">
            <Menu className="w-5 h-5 text-gray-300" />
          </button>
          <div className="w-7 h-7 bg-gradient-to-r from-blue-200 to-purple-200 rounded-md" />
          <div>
            <h1 className="text-base font-semibold text-white">Contextual AI</h1>
            <p className="text-xs text-gray-400">Ask about your docs</p>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="ml-auto p-1 text-gray-400 hover:text-white"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </header>

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
                  className={`inline-block px-3 py-2 rounded-2xl text-sm ${msg.type === 'user'
                      ? 'bg-blue-500/20 text-white'
                      : 'bg-black/20 text-gray-100 border border-white/10'
                    }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none text-left">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
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

        {/* Enhanced Mobile Input Area */}
        <div className="bg-gradient-to-r from-black/20 to-black/30 border-t border-white/10 px-3 py-3">
          {uploadedFiles.filter((f) => f.status === 'success').length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 px-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>{uploadedFiles.filter((f) => f.status === 'success').length} source(s) ready</span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => {checkAuth() && setShowUploadModal(true); setShowSidebar(false);}}
              className="flex-shrink-0 p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors"
              title="Add content"
            >
              <Paperclip className="w-4 h-4 text-gray-300" />
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={mobileTextareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask a question…"
                rows={1}
                className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 backdrop-blur-sm scrollbar-hide overflow-hidden"
                style={{ minHeight: 40, maxHeight: 120 }}
              />
              {inputMessage && (
                <div className="absolute right-2 bottom-1 text-xs text-gray-500">
                  {inputMessage.length}
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim()}
              className="flex-shrink-0 p-2.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Side Panel - Reused for both mobile and desktop */}
        <div
          className={`fixed inset-0 bg-black/50 z-20 transition-opacity ${showSidebar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setShowSidebar(false)}
        />
        <aside
          className={`fixed top-0 left-0 h-full w-4/5 max-w-sm bg-slate-900/95 backdrop-blur-md border-r border-white/10 z-30 transition-transform md:w-1/3 md:z-50 ${showSidebar ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white md:text-xl">Data Sources</h2>
            <button onClick={() => setShowSidebar(false)}>
              <X className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          <div className="flex flex-col h-[calc(100%-60px)] p-4">
            <button
              onClick={() => {checkAuth() && setShowUploadModal(true); setShowSidebar(false);}}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 rounded-lg hover:from-blue-500/20 hover:to-purple-500/20 transition-all text-left mb-4 md:gap-4"
            >
              <Plus className="w-5 h-5 text-blue-400 md:w-6 md:h-6" />
              <div>
                <span className="text-white block font-medium md:text-lg">Add Content</span>
                <span className="text-xs text-gray-400">Files, text, URLs, YouTube</span>
              </div>
            </button>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide hidden md:block">Uploaded Sources ({uploadedFiles.length})</h3>
                  {uploadedFiles.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 p-2 bg-black/30 rounded-lg md:gap-3 md:p-3">
                      {fileIcon(f.type)}
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-sm text-gray-200">{f.name}</span>
                        {f.size && <span className="text-xs text-gray-400">{formatBytes(f.size)}</span>}
                        {f.uploadedAt && (
                          <span className="text-xs text-gray-500 hidden md:block">
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
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      {showUploadModal && (
        <UploadOptionsModal
          onClose={() => setShowUploadModal(false)}
          onSelectOption={handleUploadOption}
          checkAuth={checkAuth}
        />
      )}

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
        <Modal title="Add URL or YouTube Video" onClose={() => setShowUrlModal(false)}>
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValidUrl(url) && handleUrlUpload()}
            placeholder="https://example.com or YouTube URL"
            className="w-full px-2 py-1 bg-black/30 border border-white/10 rounded-md text-white placeholder-gray-400"
          />
          <div className="text-xs text-gray-400 mt-1">
            Supports websites and YouTube videos
          </div>
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
        accept=".pdf,.docx,.doc,.txt,.csv,.json"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
}