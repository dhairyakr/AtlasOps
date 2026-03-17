import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, Settings, Trash2, Download, Upload, HardDrive } from 'lucide-react';
import { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';
import { VoiceControls } from './VoiceControls';
import { LLMService } from '../services/llmService';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { saveMessages, loadMessages, clearAllMessages, getStorageInfo, exportChatHistory, importChatHistory } from '../utils/localStorageService';

interface ChatInterfaceProps {
  onLogout: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const llmService = new LLMService(provider, geminiKey, groqKey);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
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
    setIsLoading(true);

    try {
      const response = await llmService.generateResponse(messageText);
      
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
    // Auto-send voice input after a short delay
    setTimeout(() => {
      handleSendMessage(transcript);
    }, 100);
  };

  const clearChat = () => {
    clearAllMessages();
    setMessages([
      {
        id: '1',
        text: "Hello! I'm your Gemini AI assistant. You can type your message or use voice input by clicking the microphone button. How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
      }
    ]);
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storageInfo = getStorageInfo();

  // Get the last bot message for voice output
  const lastBotMessage = messages
    .filter(msg => msg.sender === 'bot' && !msg.isLoading)
    .pop()?.text;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Gemini Voice Assistant</h1>
              <p className="text-sm text-gray-500">Powered by Google AI • Voice Enabled • Auto-Save</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStorageInfo(!showStorageInfo)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Storage info"
            >
              <HardDrive className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleExportHistory}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Export chat history"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => importInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Import chat history"
            >
              <Upload className="w-5 h-5" />
            </button>
            
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Clear chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title="Change API key"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Storage Info Panel */}
        {showStorageInfo && (
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Chat History Storage</h3>
                <p className="text-sm text-gray-600">
                  Using {formatFileSize(storageInfo.used)} of estimated {formatFileSize(5 * 1024 * 1024)} available
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {storageInfo.percentage.toFixed(1)}%
                </div>
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Your chat history is automatically saved locally. Export to backup or import to restore conversations.
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Voice Controls */}
          <div className="flex justify-center mb-3">
            <VoiceControls
              onVoiceInput={handleVoiceInput}
              isProcessing={isLoading}
              lastBotMessage={lastBotMessage}
            />
          </div>
          
          {/* Text Input */}
          <form onSubmit={handleFormSubmit} className="flex items-end space-x-3">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message or use voice input..."
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFormSubmit(e);
                    }
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          
          {/* Hidden Import Input */}
          <input
            ref={importInputRef}
            type="file"
            onChange={handleImportInputChange}
            accept=".json"
            className="hidden"
          />
          
          {/* Instructions */}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              💾 Your conversations are automatically saved locally • Export/import to backup or share
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};