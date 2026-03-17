import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Trash2, Heart, ThumbsUp, Copy, Share, Paperclip, X, FileText, File, FileSpreadsheet, Presentation, Image, Download, Upload, HardDrive, Zap, MessageCircle, User, Settings, Plus } from 'lucide-react';
import { Message } from '../types/chat';
import { EnhancedMessageBubble } from './EnhancedMessageBubble';
import { VoiceControls } from './VoiceControls';
import { LLMService } from '../services/llmService';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { parseFileContent, isFileTypeSupported, ParsedFileContent } from '../utils/fileParsers';
import { saveMessages, loadMessages, clearAllMessages, getStorageInfo, exportChatHistory, importChatHistory, getCurrentConversationId, updateConversationPersona, updateConversationResponseStyle } from '../utils/localStorageService';
import { ConversationSidebar } from './ConversationSidebar';
import { PersonaSelector } from './PersonaSelector';
import { ResponseStyleSelector } from './ResponseStyleSelector';
import { SearchSettings } from './SearchSettings';
import { ChatHistory } from '../types/chat';
import { getPersonaById, getDefaultPersona } from '../utils/personas';
import { getResponseStyleById, getDefaultResponseStyle } from '../utils/responseStyles';

interface EnhancedChatInterfaceProps {
  onBack: () => void;
  chatHistory: ChatHistory;
  currentConversationId: string | null;
  onChatHistoryUpdate: (newChatHistory: ChatHistory) => void;
}

interface UploadedFile {
  name: string;
  content: string;
  size: number;
  type: string;
  metadata?: ParsedFileContent['metadata'];
  base64Content?: string; // For images
  mimeType?: string; // For images
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  onBack,
  chatHistory,
  currentConversationId,
  onChatHistoryUpdate
}) => {
  const { theme } = useTheme();
  const { provider, geminiKey, groqKey } = useApiSettings();
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(currentConversationId || undefined));
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [sendButtonClicked, setSendButtonClicked] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showResponseStyleSelector, setShowResponseStyleSelector] = useState(false);
  const [isButtonClicked, setIsButtonClicked] = useState<string | null>(null);
  const [showAttachmentPopover, setShowAttachmentPopover] = useState(false);
  const [showSearchSettings, setShowSearchSettings] = useState(false);
  const [searchApiKey, setSearchApiKey] = useState('');
  const [searchEngineId, setSearchEngineId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const llmService = new LLMService(provider, geminiKey, groqKey);

  const handleClick = (buttonId: string, action: () => void) => {
    setIsButtonClicked(buttonId);
    action();
    setTimeout(() => setIsButtonClicked(null), 300);
  };

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const conversationMessages = loadMessages(currentConversationId);
      setMessages(conversationMessages);
    }
  }, [currentConversationId]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (currentConversationId) {
      saveMessages(messages, currentConversationId);
      
      // Update the conversation's updatedAt timestamp in chat history
      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId 
          ? { ...conv, messages, updatedAt: new Date() }
          : conv
      );
      
      if (JSON.stringify(updatedConversations) !== JSON.stringify(chatHistory.conversations)) {
        onChatHistoryUpdate({
          ...chatHistory,
          conversations: updatedConversations
        });
      }
    }
  }, [messages, currentConversationId, chatHistory, onChatHistoryUpdate]);

  // Click outside to close attachment popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAttachmentPopover && 
          popoverRef.current && 
          attachButtonRef.current &&
          !popoverRef.current.contains(event.target as Node) &&
          !attachButtonRef.current.contains(event.target as Node)) {
        setShowAttachmentPopover(false);
      }
    };

    if (showAttachmentPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachmentPopover]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const getFileIcon = (fileName: string, mimeType: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    
    // Check for image types first
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    }
    
    if (mimeType === 'application/pdf' || extension === 'pdf') {
      return <File className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    if (mimeType.includes('wordprocessingml') || extension === 'docx') {
      return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (mimeType.includes('spreadsheetml') || extension === 'xlsx') {
      return <FileSpreadsheet className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    if (mimeType.includes('presentationml') || extension === 'pptx') {
      return <Presentation className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
    return <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  };

  // Enhanced file upload with progress simulation
  const handleFileUpload = async (file: File) => {
    // Check file size (limit to 10MB for images, 50MB for documents)
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    
    if (file.size > maxSize) {
      const sizeLimit = isImage ? '10MB' : '50MB';
      alert(`File size must be less than ${sizeLimit}`);
      return;
    }

    // Check if file type is supported
    if (!isFileTypeSupported(file)) {
      alert('Unsupported file type. Please upload PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), text files, or images (JPG, PNG, GIF, WebP).');
      return;
    }

    setIsProcessingFile(true);
    setProcessingProgress(0);
    
    // Simulate processing stages with progress
    const stages = [
      { stage: 'Reading file...', progress: 20 },
      { stage: 'Analyzing content...', progress: 50 },
      { stage: 'Extracting text...', progress: 80 },
      { stage: 'Finalizing...', progress: 100 }
    ];

    try {
      for (let i = 0; i < stages.length; i++) {
        setProcessingStage(stages[i].stage);
        setProcessingProgress(stages[i].progress);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const parsedContent = await parseFileContent(file);
      
      setUploadedFile({
        name: file.name,
        content: parsedContent.text,
        size: file.size,
        type: file.type || 'application/octet-stream',
        metadata: parsedContent.metadata,
        base64Content: parsedContent.base64Content,
        mimeType: parsedContent.mimeType
      });
    } catch (error) {
      console.error('File processing error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process file. Please try again.');
    } finally {
      setIsProcessingFile(false);
      setProcessingProgress(0);
      setProcessingStage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = '';
  };

  const handleImportInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const jsonData = event.target?.result as string;
        if (importChatHistory(jsonData)) {
          setMessages(loadMessages());
          alert('Chat history imported successfully!');
        } else {
          alert('Failed to import chat history. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    // Reset input value
    e.target.value = '';
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileMetadataText = (metadata?: ParsedFileContent['metadata']): string => {
    if (!metadata) return '';
    
    const parts = [];
    if (metadata.pageCount) parts.push(`${metadata.pageCount} pages`);
    if (metadata.sheetCount) parts.push(`${metadata.sheetCount} sheets`);
    if (metadata.slideCount) parts.push(`${metadata.slideCount} slides`);
    if (metadata.wordCount) parts.push(`~${metadata.wordCount} words`);
    
    return parts.join(' • ');
  };

  // Enhanced send message with micro-interactions
  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if ((!messageText && !uploadedFile) || isLoading) return;

    // Send button animation
    setSendButtonClicked(true);
    setTimeout(() => setSendButtonClicked(false), 200);

    let finalMessage = messageText;
    let imageData: { data: string; mimeType: string } | undefined;

    // Handle uploaded file
    if (uploadedFile) {
      if (uploadedFile.base64Content && uploadedFile.mimeType) {
        // This is an image
        imageData = {
          data: uploadedFile.base64Content,
          mimeType: uploadedFile.mimeType
        };
        finalMessage = messageText || 'Please analyze this image and describe what you see.';
      } else {
        // This is a document
        const fileInfo = `File: ${uploadedFile.name} (${formatFileSize(uploadedFile.size)})`;
        const metadataInfo = getFileMetadataText(uploadedFile.metadata);
        const fileContext = `Here is the content of the uploaded file "${uploadedFile.name}"${metadataInfo ? ` (${metadataInfo})` : ''}:\n\n${uploadedFile.content}\n\n---\n\n`;
        finalMessage = fileContext + (messageText || 'Please analyze this file and provide a comprehensive summary.');
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: uploadedFile ? 
        `${messageText || (uploadedFile.base64Content ? 'Please analyze this image and describe what you see.' : 'Please analyze this file and provide a comprehensive summary.')} [File: ${uploadedFile.name}]` : 
        messageText,
      sender: 'user',
      timestamp: new Date(),
      image: imageData ? imageData : undefined
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'bot',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setUploadedFile(null); // Clear the uploaded file after sending
    setIsLoading(true);

    try {
      // Get current conversation and persona
      const currentConversation = chatHistory.conversations.find(c => c.id === currentConversationId);
      const persona = getPersonaById(currentConversation?.personaId || 'default') || getDefaultPersona();
      const responseStyle = getResponseStyleById(currentConversation?.responseStyleId || 'default') || getDefaultResponseStyle();
      const personaInstruction = persona.instruction;
      const responseStyleInstruction = responseStyle.instruction;
      
      const response = await llmService.generateResponse(finalMessage, imageData, personaInstruction, responseStyleInstruction);
      
      // Update message with response immediately (no typing effect)
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { ...msg, text: response, isLoading: false }
          : msg
      ));
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessage.id 
          ? { 
              ...msg, 
              text: `I apologize, but I encountered an error: ${errorMessage}. Please try again or check your API key.`, 
              isLoading: false 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleVoiceInput = (transcript: string) => {
    setInputText(transcript);
    setTimeout(() => {
      handleSendMessage(transcript);
    }, 100);
  };

  const handlePersonaChange = (personaId: string) => {
    if (currentConversationId && updateConversationPersona(currentConversationId, personaId)) {
      // Update the conversation in chat history
      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId 
          ? { ...conv, personaId, updatedAt: new Date() }
          : conv
      );
      
      onChatHistoryUpdate({
        ...chatHistory,
        conversations: updatedConversations
      });
    }
    setShowPersonaSelector(false);
  };

  const handleResponseStyleChange = (responseStyleId: string) => {
    if (currentConversationId && updateConversationResponseStyle(currentConversationId, responseStyleId)) {
      // Update the conversation in chat history
      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId 
          ? { ...conv, responseStyleId, updatedAt: new Date() }
          : conv
      );
      
      onChatHistoryUpdate({
        ...chatHistory,
        conversations: updatedConversations
      });
    }
    setShowResponseStyleSelector(false);
  };

  const handleSearchSettingsSave = (apiKey: string, engineId: string) => {
    setSearchApiKey(apiKey);
    setSearchEngineId(engineId);
    setShowSearchSettings(false);
  };

  const handleMessageReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, reactions: { ...msg.reactions, [reaction]: (msg.reactions?.[reaction] || 0) + 1 } }
        : msg
    ));
  };

  const clearChat = () => {
    if (currentConversationId) {
      clearAllMessages(currentConversationId);
      const defaultMessages = [
        {
          id: '1',
          text: "Hello! I'm your enhanced Gemini AI assistant with advanced features. I can help you with text, voice, and provide rich interactive responses. You can also upload documents (PDF, Word, Excel, PowerPoint), text files, and images for analysis. How can I assist you today?",
          sender: 'bot' as const,
          timestamp: new Date(),
        }
      ];
      setMessages(defaultMessages);
    }
    setUploadedFile(null);
  };

  const handleExportHistory = () => {
    const jsonData = exportChatHistory();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const storageInfo = getStorageInfo();
  const lastBotMessage = messages
    .filter(msg => msg.sender === 'bot' && !msg.isLoading)
    .pop()?.text;

  const currentConversation = chatHistory.conversations.find(c => c.id === currentConversationId);
  const currentPersona = getPersonaById(currentConversation?.personaId || 'default') || getDefaultPersona();
  const currentResponseStyle = getResponseStyleById(currentConversation?.responseStyleId || 'default') || getDefaultResponseStyle();

  return (
    <div className="flex h-screen chat-galaxy-bg relative overflow-hidden">
      {/* Floating Thought Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="thought-particle" style={{ left: '10%', animationDelay: '0s' }}></div>
        <div className="thought-particle" style={{ left: '20%', animationDelay: '2s' }}></div>
        <div className="thought-particle" style={{ left: '30%', animationDelay: '4s' }}></div>
        <div className="thought-particle" style={{ left: '40%', animationDelay: '6s' }}></div>
        <div className="thought-particle" style={{ left: '50%', animationDelay: '8s' }}></div>
        <div className="thought-particle" style={{ left: '60%', animationDelay: '10s' }}></div>
        <div className="thought-particle" style={{ left: '70%', animationDelay: '12s' }}></div>
        <div className="thought-particle" style={{ left: '80%', animationDelay: '14s' }}></div>
        <div className="thought-particle" style={{ left: '90%', animationDelay: '16s' }}></div>
      </div>

      {/* Conversation Sidebar */}
      <div className={`transition-all duration-300 ease-out overflow-hidden ${sidebarOpen ? 'w-96' : 'w-0'}`}>
        <ConversationSidebar
          chatHistory={chatHistory}
          currentConversationId={currentConversationId}
          onChatHistoryUpdate={onChatHistoryUpdate}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      {/* Main Chat Interface */}
      <div className="flex flex-col flex-1">
      {/* Enhanced Header */}
      <div className="chat-navbar-glass px-4 py-3 sm:px-6 sm:py-4 relative">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleClick('sidebar-toggle', () => setSidebarOpen(!sidebarOpen))}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'sidebar-toggle' ? 'clicked' : ''}`}
              title="Toggle conversations"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleClick('back-button', onBack)}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'back-button' ? 'clicked' : ''}`}
            >
              ←
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-neo-tech-neon-violet to-neo-tech-aurora-pink rounded-2xl flex items-center justify-center shadow-cosmic-glow animate-glow avatar-orb">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">
                  {currentConversation?.name || 'Enhanced Chat'}
                </h1>
                <p className="text-sm text-white/60">
                  {isProcessingFile ? `${processingStage} (${processingProgress}%)` : `${currentPersona.name} • ${currentResponseStyle.name} Style • Advanced AI Assistant`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Response Style Selector Button */}
            <button
              onClick={() => handleClick('response-style', () => setShowResponseStyleSelector(true))}
              className={`flex items-center space-x-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'response-style' ? 'clicked' : ''}`}
              title={`Current style: ${currentResponseStyle.name}`}
            >
              <span className="text-lg">{currentResponseStyle.icon}</span>
              <Settings className="w-4 h-4" />
            </button>
            
            {/* Persona Selector Button */}
            <button
              onClick={() => handleClick('persona-selector', () => setShowPersonaSelector(true))}
              className={`flex items-center space-x-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'persona-selector' ? 'clicked' : ''}`}
              title={`Current persona: ${currentPersona.name}`}
            >
              <span className="text-lg">{currentPersona.icon}</span>
              <User className="w-4 h-4" />
            </button>
            
            {/* Storage Info Button */}
            <button
              onClick={() => handleClick('storage-info', () => setShowStorageInfo(!showStorageInfo))}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'storage-info' ? 'clicked' : ''}`}
              title="Storage info"
            >
              <HardDrive className="w-5 h-5" />
            </button>
            
            {/* Export History Button */}
            <button
              onClick={() => handleClick('export-history', handleExportHistory)}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'export-history' ? 'clicked' : ''}`}
              title="Export chat history"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Import History Button */}
            <button
              onClick={() => handleClick('import-history', () => importInputRef.current?.click())}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'import-history' ? 'clicked' : ''}`}
              title="Import chat history"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => handleClick('clear-chat', clearChat)}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm btn-interactive-effect ${isButtonClicked === 'clear-chat' ? 'clicked' : ''}`}
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>

          </div>
        </div>

        {/* Storage Info Panel */}
        {showStorageInfo && (
          <div className="mt-4 p-3 sm:p-4 glass-premium rounded-2xl border border-neo-tech-neon-violet/30 max-w-6xl mx-auto animate-slide-up shadow-cosmic-glow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Chat History Storage</h3>
                <p className="text-sm text-white/70">
                  Using {formatFileSize(storageInfo.used)} of estimated {formatFileSize(5 * 1024 * 1024)} available
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text">
                  {storageInfo.percentage.toFixed(1)}%
                </div>
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="h-full bg-gradient-to-r from-neo-tech-neon-violet to-neo-tech-aurora-pink transition-all duration-300"
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">
              💡 Your chat history is automatically saved locally. Export to backup or import to restore conversations.
            </p>
          </div>
        )}
      </div>

      {/* Messages with Enhanced Styling */}
      <div 
        className={`flex-1 overflow-y-auto px-4 py-6 ${dragActive ? 'bg-neo-tech-neon-violet/10' : ''} transition-colors duration-300 relative hide-scrollbar`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {dragActive && (
            <div className="fixed inset-0 bg-neo-tech-neon-violet/20 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none animate-fade-in">
              <div className="glass-premium rounded-2xl p-8 shadow-cosmic-glow border-2 border-dashed border-neo-tech-neon-violet animate-bounce-in">
                <div className="text-center">
                  <div className="flex justify-center space-x-2 mb-4">
                    <File className="w-8 h-8 text-neo-tech-aurora-pink animate-bounce" />
                    <FileText className="w-8 h-8 text-neo-tech-quantum-cyan animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <FileSpreadsheet className="w-8 h-8 text-neo-tech-neon-violet animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <Presentation className="w-8 h-8 text-neo-tech-plasma-blue animate-bounce" style={{ animationDelay: '0.3s' }} />
                    <Image className="w-8 h-8 text-neo-tech-vapor-lilac animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Drop your file here</h3>
                  <p className="text-white/70">Supports documents, text files, and images</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <EnhancedMessageBubble 
              key={message.id} 
              message={message} 
              onReaction={(reaction) => handleMessageReaction(message.id, reaction)}
              isLatest={index === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="input-dock-glass px-4 py-4 sm:px-6 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* File Upload Area */}
          {uploadedFile && (
            <div className="mb-4 p-4 glass-premium rounded-2xl border border-neo-tech-quantum-cyan/30 animate-slide-up shadow-neural-glow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(uploadedFile.name, uploadedFile.type)}
                  <div className="flex-1">
                    <p className="font-medium text-white">{uploadedFile.name}</p>
                    <p className="text-sm text-white/70">
                      {formatFileSize(uploadedFile.size)}
                      {uploadedFile.metadata && getFileMetadataText(uploadedFile.metadata) && 
                        ` • ${getFileMetadataText(uploadedFile.metadata)}`
                      }
                      {uploadedFile.base64Content ? (provider !== 'gemini' ? ' • Switch to Gemini for image analysis' : ' • Image ready for analysis') : ' • Ready to analyze'}
                    </p>
                  </div>
                  {/* Image Preview */}
                  {uploadedFile.base64Content && uploadedFile.mimeType && (
                    <div className="ml-3">
                      <img
                        src={`data:${uploadedFile.mimeType};base64,${uploadedFile.base64Content}`}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-lg border border-white/20 shadow-neural-glow hover:shadow-cosmic-glow transition-shadow"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={removeUploadedFile}
                  className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Processing Indicator */}
          {isProcessingFile && (
            <div className="mb-4 p-4 glass-premium rounded-2xl border border-neo-tech-plasma-blue/30 animate-slide-up shadow-neural-glow">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-neo-tech-plasma-blue animate-spin" />
                <div className="flex-1">
                  <p className="font-medium text-white">{processingStage}</p>
                  <div className="mt-2 w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                    <div 
                      className="bg-gradient-to-r from-neo-tech-plasma-blue to-neo-tech-quantum-cyan h-2 rounded-full transition-all duration-300 progress-shimmer"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-white/70 mt-1">
                    {processingProgress}% complete
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Voice Controls */}
          <div className="flex justify-center mb-4">
            <VoiceControls
              onVoiceInput={handleVoiceInput}
              isProcessing={isLoading}
              lastBotMessage={lastBotMessage}
            />
          </div>
          
          {/* Enhanced Text Input */}
          <form onSubmit={handleFormSubmit} className="flex items-center space-x-4">
            {/* Attach Button with Popover */}
            <div className="relative flex-shrink-0">
              <button
                ref={attachButtonRef}
                type="button"
                onClick={() => handleClick('attach-toggle', () => setShowAttachmentPopover(!showAttachmentPopover))}
                disabled={isProcessingFile}
                className={`w-14 h-14 glass-premium text-white/60 hover:text-white hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 btn-hover-lift btn-interactive-effect shadow-neural-glow ${isButtonClicked === 'attach-toggle' ? 'clicked' : ''} ${showAttachmentPopover ? 'bg-white/10 text-white' : ''}`}
                title="Attach file or image"
              >
                <Plus className={`w-6 h-6 transition-transform duration-300 ${showAttachmentPopover ? 'rotate-45' : ''}`} />
              </button>
              
              {/* Attachment Popover */}
              {showAttachmentPopover && (
                <div
                  ref={popoverRef}
                  className="absolute bottom-full left-0 mb-2 w-48 glass-premium rounded-xl border border-white/20 shadow-cosmic-glow animate-scale-in z-50 overflow-hidden"
                >
                  {/* Popover content */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachmentPopover(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-neo-tech-neon-violet to-neo-tech-aurora-pink rounded-lg flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium">Upload File</div>
                        <div className="text-xs text-white/60">Documents, images, text files</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Popover arrow */}
                  <div className="absolute bottom-0 left-6 transform translate-y-full">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/20"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={uploadedFile ? 
                    (uploadedFile.base64Content ? "Ask me anything about the uploaded image..." : "Ask me anything about the uploaded document...") : 
                    "Type your message..."
                  }
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-8 input-field-glass rounded-2xl outline-none resize-none transition-all shadow-lg hide-scrollbar"
                  rows={1}
                  style={{ minHeight: '56px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                  disabled={isProcessingFile}
                />
                
                {/* Character count */}
                <div className="absolute bottom-2 right-4 text-xs text-white/40">
                  {inputText.length}/1000
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={(!inputText.trim() && !uploadedFile) || isLoading || isProcessingFile}
              className={`flex-shrink-0 w-14 h-14 send-button-crystal text-white rounded-2xl focus:ring-4 focus:ring-neo-tech-neon-violet/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center shadow-cosmic-glow btn-hover-lift btn-interactive-effect ${sendButtonClicked ? 'animate-pop' : ''} ${isButtonClicked === 'send-message' ? 'clicked' : ''}`}
              onClick={() => {
                setIsButtonClicked('send-message');
                setTimeout(() => setIsButtonClicked(null), 300);
              }}
            >
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </form>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            accept=".txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.html,.css,.xml,.py,.java,.cpp,.c,.h,.php,.rb,.go,.rs,.swift,.kt,.scala,.sh,.yml,.yaml,.toml,.ini,.cfg,.conf,.log,.pdf,.docx,.xlsx,.pptx,image/*"
            className="hidden"
          />
          
          <input
            ref={importInputRef}
            type="file"
            onChange={handleImportInputChange}
            accept=".json"
            className="hidden"
          />

          {/* File Upload Instructions */}
          <div className="mt-3 text-center">
            <p className="text-xs text-white/50">
              Drag & drop files here or click the + button • Supports documents, text files, and images up to 10MB
              <br />
              💾 Your conversations are automatically saved locally • Export/import to backup or share
            </p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Persona Selector Modal */}
    {showPersonaSelector && (
      <PersonaSelector
        currentPersonaId={currentConversation?.personaId || 'default'}
        onPersonaChange={handlePersonaChange}
        onClose={() => setShowPersonaSelector(false)}
      />
    )}

    {/* Response Style Selector Modal */}
    {showResponseStyleSelector && (
      <ResponseStyleSelector
        currentResponseStyleId={currentConversation?.responseStyleId || 'default'}
        onResponseStyleChange={handleResponseStyleChange}
        onClose={() => setShowResponseStyleSelector(false)}
      />
    )}

    {/* Search Settings Modal */}
    {showSearchSettings && (
      <SearchSettings
        onClose={() => setShowSearchSettings(false)}
        onSave={handleSearchSettingsSave}
        initialSearchApiKey={searchApiKey}
        initialSearchEngineId={searchEngineId}
      />
    )}
    </div>
  );
};