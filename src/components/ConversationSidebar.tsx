import React, { useState, useRef } from 'react';
import { Plus, MessageCircle, Edit3, Trash2, Copy, MoreHorizontal, X, Check, Search, Calendar } from 'lucide-react';
import { Conversation, ChatHistory } from '../types/chat';
import { useTheme } from '../contexts/ThemeContext';
import { getPersonaById, getDefaultPersona } from '../utils/personas';
import { getResponseStyleById, getDefaultResponseStyle } from '../utils/responseStyles';
import { 
  addConversation, 
  deleteConversation, 
  renameConversation, 
  setCurrentConversationId,
  duplicateConversation 
} from '../utils/localStorageService';

interface ConversationSidebarProps {
  chatHistory: ChatHistory;
  currentConversationId: string | null;
  onChatHistoryUpdate: (newChatHistory: ChatHistory) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  chatHistory,
  currentConversationId,
  onChatHistoryUpdate,
  isOpen,
  onToggle
}) => {
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Filter conversations based on search query
  const filteredConversations = chatHistory.conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Sort conversations by last updated (most recent first)
  const sortedConversations = [...filteredConversations].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleAddConversation = () => {
    const newId = addConversation(`New Chat ${chatHistory.conversations.length + 1}`);
    if (newId) {
      const updatedHistory = {
        ...chatHistory,
        conversations: [...chatHistory.conversations, {
          id: newId,
          name: `New Chat ${chatHistory.conversations.length + 1}`,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }],
        currentConversationId: newId
      };
      onChatHistoryUpdate(updatedHistory);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    if (setCurrentConversationId(conversationId)) {
      const updatedHistory = {
        ...chatHistory,
        currentConversationId: conversationId
      };
      onChatHistoryUpdate(updatedHistory);
    }
  };

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingName(conversation.name);
    setShowDropdown(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      if (renameConversation(editingId, editingName.trim())) {
        const updatedConversations = chatHistory.conversations.map(conv =>
          conv.id === editingId 
            ? { ...conv, name: editingName.trim(), updatedAt: new Date() }
            : conv
        );
        const updatedHistory = {
          ...chatHistory,
          conversations: updatedConversations
        };
        onChatHistoryUpdate(updatedHistory);
      }
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (chatHistory.conversations.length <= 1) {
      alert('Cannot delete the last conversation');
      return;
    }

    if (confirm('Are you sure you want to delete this conversation?')) {
      if (deleteConversation(conversationId)) {
        const updatedConversations = chatHistory.conversations.filter(conv => conv.id !== conversationId);
        let newCurrentId = chatHistory.currentConversationId;
        
        if (chatHistory.currentConversationId === conversationId) {
          newCurrentId = updatedConversations[0]?.id || null;
        }
        
        const updatedHistory = {
          ...chatHistory,
          conversations: updatedConversations,
          currentConversationId: newCurrentId
        };
        onChatHistoryUpdate(updatedHistory);
      }
    }
    setShowDropdown(null);
  };

  const handleDuplicateConversation = (conversationId: string) => {
    const newId = duplicateConversation(conversationId);
    if (newId) {
      const originalConv = chatHistory.conversations.find(c => c.id === conversationId);
      if (originalConv) {
        const duplicatedConv = {
          ...originalConv,
          id: newId,
          name: `${originalConv.name} (Copy)`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedHistory = {
          ...chatHistory,
          conversations: [...chatHistory.conversations, duplicatedConv],
          currentConversationId: newId
        };
        onChatHistoryUpdate(updatedHistory);
      }
    }
    setShowDropdown(null);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationPreview = (conversation: Conversation) => {
    const lastUserMessage = conversation.messages
      .filter(msg => msg.sender === 'user')
      .pop();
    
    if (lastUserMessage) {
      return lastUserMessage.text.length > 50 
        ? lastUserMessage.text.substring(0, 50) + '...'
        : lastUserMessage.text;
    }
    
    return 'No messages yet';
  };

  return (
    <>
      {/* Overlay for mobile - only show when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* ChronoGlass Navigator Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-full max-w-xs chronoglass-panel z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Floating cosmic particles in sidebar */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-neo-tech-neon-violet rounded-full animate-cosmic-drift opacity-40"></div>
          <div className="absolute top-3/4 left-3/4 w-0.5 h-0.5 bg-neo-tech-aurora-pink rounded-full animate-cosmic-drift opacity-30" style={{ animationDelay: '3s' }}></div>
          <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-neo-tech-quantum-cyan rounded-full animate-cosmic-drift opacity-50" style={{ animationDelay: '6s' }}></div>
          <div className="absolute bottom-1/4 right-1/6 w-1 h-1 bg-neo-tech-vapor-lilac rounded-full animate-cosmic-drift opacity-35" style={{ animationDelay: '9s' }}></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 chronoglass-header relative z-10">
          <h2 className="text-lg font-semibold gradient-text">Memory Stream</h2>
          <button
            onClick={onToggle}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-white/10 relative z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 chronoglass-search-input rounded-xl outline-none transition-all text-sm text-white placeholder-white/50"
            />
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4 border-b border-white/10 relative z-10">
          <button
            onClick={handleAddConversation}
            className="w-full chronoglass-new-button flex items-center justify-center space-x-2 px-4 py-4 text-white rounded-xl transition-all transform hover:scale-105 btn-hover-lift shadow-cosmic-glow relative overflow-hidden group"
          >
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-neo-tech-neon-violet/20 via-neo-tech-aurora-pink/20 to-neo-tech-quantum-cyan/20 animate-aurora rounded-xl"></div>
            
            {/* Light sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out rounded-xl"></div>
            
            <Plus className="w-5 h-5 relative z-10 animate-breathe" />
            <span className="font-medium relative z-10">New Memory</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto relative z-10 hide-scrollbar">
          {sortedConversations.length === 0 ? (
            <div className="p-4 text-center text-white/50">
              {searchQuery ? 'No memories found' : 'No memories yet'}
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {sortedConversations.map((conversation, index) => (
                <div
                  key={conversation.id}
                  className={`relative group rounded-xl transition-all duration-300 memory-capsule overflow-hidden ${
                    conversation.id === currentConversationId
                      ? 'memory-capsule-active shadow-neural-glow animate-breathe'
                      : 'memory-capsule-inactive hover:memory-capsule-hover'
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Memory capsule glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                  
                  {editingId === conversation.id ? (
                    <div className="p-3 relative z-10">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full px-3 py-2 text-sm border border-white/20 bg-white/10 backdrop-blur-sm text-white rounded-lg focus:ring-2 focus:ring-neo-tech-neon-violet focus:border-transparent outline-none placeholder-white/50"
                      />
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1.5 text-neo-tech-quantum-cyan hover:bg-neo-tech-quantum-cyan/20 rounded transition-all btn-hover-lift backdrop-blur-sm"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-white/60 hover:bg-white/10 rounded transition-all btn-hover-lift backdrop-blur-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleSelectConversation(conversation.id)}
                        className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-neo-tech-neon-violet rounded-xl relative z-10"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center memory-orb transition-all duration-300 ${
                            conversation.id === currentConversationId
                              ? 'memory-orb-active shadow-cosmic-glow'
                              : 'memory-orb-inactive group-hover:memory-orb-hover'
                          }`}>
                            <MessageCircle className="w-5 h-5 text-white relative z-10" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium text-sm truncate transition-all duration-300 ${
                              conversation.id === currentConversationId
                                ? 'text-white'
                                : 'text-white/90 group-hover:text-white'
                            }`}>
                              {conversation.name}
                            </h3>
                            <p className="text-xs text-white/60 truncate mt-1 group-hover:text-white/70 transition-colors">
                              {getConversationPreview(conversation)}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              {/* Persona and style indicators */}
                              {(() => {
                                const persona = getPersonaById(conversation.personaId || 'default') || getDefaultPersona();
                                const responseStyle = getResponseStyleById(conversation.responseStyleId || 'default') || getDefaultResponseStyle();
                                return (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs opacity-70 hover:opacity-100 transition-opacity" title={`Persona: ${persona.name}`}>
                                      {persona.icon}
                                    </span>
                                    <span className="text-xs opacity-70 hover:opacity-100 transition-opacity" title={`Style: ${responseStyle.name}`}>
                                      {responseStyle.icon}
                                    </span>
                                  </div>
                                );
                              })()}
                              <Calendar className="w-3 h-3 text-white/40" />
                              <span className="text-xs text-white/50">
                                {formatDate(conversation.updatedAt)}
                              </span>
                              <span className="text-xs text-white/40">
                                • {conversation.messages.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDropdown(showDropdown === conversation.id ? null : conversation.id);
                          }}
                          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showDropdown === conversation.id && (
                          <div className="absolute right-0 top-8 w-48 chronoglass-dropdown rounded-xl shadow-cosmic-glow z-30 animate-scale-in border border-white/20 overflow-hidden">
                            <button
                              onClick={() => handleStartEdit(conversation)}
                              className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={() => handleDuplicateConversation(conversation.id)}
                              className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-white/90 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Duplicate</span>
                            </button>
                            <button
                              onClick={() => handleDeleteConversation(conversation.id)}
                              className="w-full flex items-center space-x-2 px-3 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all backdrop-blur-sm"
                              disabled={chatHistory.conversations.length <= 1}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 relative z-10">
          <div className="text-xs text-white/50 text-center">
            {chatHistory.conversations.length} memory{chatHistory.conversations.length !== 1 ? ' capsules' : ' capsule'}
            {searchQuery && ` • ${sortedConversations.length} shown`}
          </div>
        </div>
      </div>
    </>
  );
};