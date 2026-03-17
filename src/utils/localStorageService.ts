import { Message, Conversation, ChatHistory } from '../types/chat';

const LOCAL_STORAGE_KEY = 'gemini-chat-history-v2';
const LEGACY_KEY = 'gemini-chat-history';

export interface StoredMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string; // Store as ISO string for serialization
  reactions?: Record<string, number>;
}

export interface StoredConversation {
  id: string;
  name: string;
  messages: StoredMessage[];
  createdAt: string;
  updatedAt: string;
  personaId?: string;
  responseStyleId?: string;
}

export interface StoredChatHistory {
  conversations: StoredConversation[];
  currentConversationId: string | null;
  version: number;
}

/**
 * Generate a unique ID for conversations
 */
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

/**
 * Convert Message to StoredMessage
 */
function messageToStored(message: Message): StoredMessage {
  return {
    id: message.id,
    text: message.text,
    sender: message.sender,
    timestamp: message.timestamp.toISOString(),
    reactions: message.reactions
  };
}

/**
 * Convert StoredMessage to Message
 */
function storedToMessage(stored: StoredMessage): Message {
  return {
    id: stored.id,
    text: stored.text,
    sender: stored.sender,
    timestamp: new Date(stored.timestamp),
    reactions: stored.reactions
  };
}

/**
 * Convert Conversation to StoredConversation
 */
function conversationToStored(conversation: Conversation): StoredConversation {
  return {
    id: conversation.id,
    name: conversation.name,
    messages: conversation.messages.map(messageToStored),
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
    personaId: conversation.personaId,
    responseStyleId: conversation.responseStyleId
  };
}

/**
 * Convert StoredConversation to Conversation
 */
function storedToConversation(stored: StoredConversation): Conversation {
  return {
    id: stored.id,
    name: stored.name,
    messages: stored.messages.map(storedToMessage),
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
    personaId: stored.personaId,
    responseStyleId: stored.responseStyleId
  };
}

/**
 * Get default welcome messages for a new conversation
 */
function getDefaultMessages(): Message[] {
  return [
    {
      id: '1',
      text: "Hello! I'm your enhanced Gemini AI assistant with advanced features. I can help you with text, voice, and provide rich interactive responses. You can also upload documents (PDF, Word, Excel, PowerPoint), text files, and images for analysis. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ];
}

/**
 * Create a default conversation
 */
function createDefaultConversation(): Conversation {
  const now = new Date();
  return {
    id: generateId(),
    name: 'New Conversation',
    messages: getDefaultMessages(),
    createdAt: now,
    updatedAt: now,
    personaId: 'default', // Set default persona
    responseStyleId: 'default' // Set default response style
  };
}

/**
 * Get default chat history with one conversation
 */
function getDefaultChatHistory(): ChatHistory {
  const defaultConversation = createDefaultConversation();
  return {
    conversations: [defaultConversation],
    currentConversationId: defaultConversation.id,
    version: 1
  };
}

/**
 * Migrate legacy chat history to new format
 */
function migrateLegacyHistory(): ChatHistory | null {
  try {
    const legacyData = localStorage.getItem(LEGACY_KEY);
    if (!legacyData) return null;

    const legacyMessages: StoredMessage[] = JSON.parse(legacyData);
    if (!Array.isArray(legacyMessages) || legacyMessages.length === 0) {
      return null;
    }

    // Create a conversation from legacy messages
    const now = new Date();
    const migratedConversation: Conversation = {
      id: generateId(),
      name: 'Migrated Conversation',
      messages: legacyMessages.map(storedToMessage),
      createdAt: new Date(legacyMessages[0]?.timestamp || now.toISOString()),
      updatedAt: now
    };

    const migratedHistory: ChatHistory = {
      conversations: [migratedConversation],
      currentConversationId: migratedConversation.id,
      version: 1
    };

    // Save migrated data and remove legacy key
    saveChatHistory(migratedHistory);
    localStorage.removeItem(LEGACY_KEY);

    console.log('Successfully migrated legacy chat history');
    return migratedHistory;
  } catch (error) {
    console.error('Failed to migrate legacy chat history:', error);
    return null;
  }
}

/**
 * Load the complete chat history from localStorage
 */
export function loadChatHistory(): ChatHistory {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (!stored) {
      // Try to migrate from legacy format
      const migrated = migrateLegacyHistory();
      if (migrated) return migrated;
      
      // Return default if no history exists
      return getDefaultChatHistory();
    }

    const storedHistory: StoredChatHistory = JSON.parse(stored);
    
    // Validate structure
    if (!storedHistory.conversations || !Array.isArray(storedHistory.conversations)) {
      throw new Error('Invalid chat history structure');
    }

    // Convert back to ChatHistory format
    const chatHistory: ChatHistory = {
      conversations: storedHistory.conversations.map(storedToConversation),
      currentConversationId: storedHistory.currentConversationId,
      version: storedHistory.version || 1
    };

    // Ensure we have at least one conversation
    if (chatHistory.conversations.length === 0) {
      return getDefaultChatHistory();
    }

    // Ensure current conversation ID is valid
    if (!chatHistory.currentConversationId || 
        !chatHistory.conversations.find(c => c.id === chatHistory.currentConversationId)) {
      chatHistory.currentConversationId = chatHistory.conversations[0].id;
    }

    return chatHistory;
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return getDefaultChatHistory();
  }
}

/**
 * Save the complete chat history to localStorage
 */
export function saveChatHistory(chatHistory: ChatHistory): void {
  try {
    const storedHistory: StoredChatHistory = {
      conversations: chatHistory.conversations.map(conversationToStored),
      currentConversationId: chatHistory.currentConversationId,
      version: chatHistory.version
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedHistory));
  } catch (error) {
    console.error('Failed to save chat history:', error);
    // Silently fail - don't disrupt user experience
  }
}

/**
 * Load messages for a specific conversation
 */
export function loadMessages(conversationId?: string): Message[] {
  const chatHistory = loadChatHistory();
  
  if (!conversationId) {
    conversationId = chatHistory.currentConversationId || chatHistory.conversations[0]?.id;
  }
  
  const conversation = chatHistory.conversations.find(c => c.id === conversationId);
  return conversation?.messages || getDefaultMessages();
}

/**
 * Save messages for a specific conversation
 */
export function saveMessages(messages: Message[], conversationId?: string): void {
  try {
    const chatHistory = loadChatHistory();
    
    if (!conversationId) {
      conversationId = chatHistory.currentConversationId || chatHistory.conversations[0]?.id;
    }
    
    const conversationIndex = chatHistory.conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex >= 0) {
      chatHistory.conversations[conversationIndex].messages = messages;
      chatHistory.conversations[conversationIndex].updatedAt = new Date();
      saveChatHistory(chatHistory);
    }
  } catch (error) {
    console.error('Failed to save messages:', error);
  }
}

/**
 * Add a new conversation
 */
export function addConversation(name: string): string {
  try {
    const chatHistory = loadChatHistory();
    const newConversation = createDefaultConversation();
    newConversation.name = name || `Conversation ${chatHistory.conversations.length + 1}`;
    
    chatHistory.conversations.push(newConversation);
    chatHistory.currentConversationId = newConversation.id;
    
    saveChatHistory(chatHistory);
    return newConversation.id;
  } catch (error) {
    console.error('Failed to add conversation:', error);
    return '';
  }
}

/**
 * Delete a conversation
 */
export function deleteConversation(conversationId: string): boolean {
  try {
    const chatHistory = loadChatHistory();
    
    // Don't allow deleting the last conversation
    if (chatHistory.conversations.length <= 1) {
      return false;
    }
    
    const conversationIndex = chatHistory.conversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex >= 0) {
      chatHistory.conversations.splice(conversationIndex, 1);
      
      // If we deleted the current conversation, switch to the first available one
      if (chatHistory.currentConversationId === conversationId) {
        chatHistory.currentConversationId = chatHistory.conversations[0]?.id || null;
      }
      
      saveChatHistory(chatHistory);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to delete conversation:', error);
    return false;
  }
}

/**
 * Rename a conversation
 */
export function renameConversation(conversationId: string, newName: string): boolean {
  try {
    const chatHistory = loadChatHistory();
    const conversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.name = newName.trim() || 'Untitled Conversation';
      conversation.updatedAt = new Date();
      saveChatHistory(chatHistory);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to rename conversation:', error);
    return false;
  }
}

/**
 * Set the current conversation ID
 */
export function setCurrentConversationId(conversationId: string): boolean {
  try {
    const chatHistory = loadChatHistory();
    const conversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      chatHistory.currentConversationId = conversationId;
      saveChatHistory(chatHistory);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to set current conversation:', error);
    return false;
  }
}

/**
 * Clear all messages from the current conversation
 */
export function clearAllMessages(conversationId?: string): void {
  try {
    const chatHistory = loadChatHistory();
    
    if (!conversationId) {
      conversationId = chatHistory.currentConversationId || chatHistory.conversations[0]?.id;
    }
    
    const conversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.messages = getDefaultMessages();
      conversation.updatedAt = new Date();
      saveChatHistory(chatHistory);
    }
  } catch (error) {
    console.error('Failed to clear messages:', error);
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const usedBytes = stored ? new Blob([stored]).size : 0;
    
    // Estimate available localStorage space (usually 5-10MB)
    // We'll use a conservative estimate of 5MB
    const estimatedTotal = 5 * 1024 * 1024; // 5MB
    
    return {
      used: usedBytes,
      available: estimatedTotal - usedBytes,
      percentage: (usedBytes / estimatedTotal) * 100
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Export chat history as JSON
 */
export function exportChatHistory(): string {
  try {
    const chatHistory = loadChatHistory();
    return JSON.stringify(chatHistory, null, 2);
  } catch (error) {
    console.error('Failed to export chat history:', error);
    return JSON.stringify(getDefaultChatHistory(), null, 2);
  }
}

/**
 * Import chat history from JSON
 */
export function importChatHistory(jsonData: string): boolean {
  try {
    const importedData = JSON.parse(jsonData);
    
    // Check if it's the new format (ChatHistory)
    if (importedData.conversations && Array.isArray(importedData.conversations)) {
      // Validate the structure
      for (const conv of importedData.conversations) {
        if (!conv.id || !conv.name || !Array.isArray(conv.messages)) {
          throw new Error('Invalid conversation format');
        }
        
        for (const msg of conv.messages) {
          if (!msg.id || !msg.text || !msg.sender || !msg.timestamp) {
            throw new Error('Invalid message format');
          }
        }
      }
      
      // Convert timestamps back to Date objects and save
      const chatHistory: ChatHistory = {
        conversations: importedData.conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        })),
        currentConversationId: importedData.currentConversationId,
        version: importedData.version || 1
      };
      
      saveChatHistory(chatHistory);
      return true;
    }
    
    // Check if it's legacy format (array of messages)
    if (Array.isArray(importedData)) {
      // Basic validation of message structure
      for (const msg of importedData) {
        if (!msg.id || !msg.text || !msg.sender || !msg.timestamp) {
          throw new Error('Invalid message format');
        }
      }
      
      // Create a new conversation from legacy messages
      const now = new Date();
      const conversation: Conversation = {
        id: generateId(),
        name: 'Imported Conversation',
        messages: importedData.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        createdAt: now,
        updatedAt: now
      };
      
      const chatHistory: ChatHistory = {
        conversations: [conversation],
        currentConversationId: conversation.id,
        version: 1
      };
      
      saveChatHistory(chatHistory);
      return true;
    }
    
    throw new Error('Invalid format: expected ChatHistory or array of messages');
  } catch (error) {
    console.error('Failed to import chat history:', error);
    return false;
  }
}

/**
 * Get current conversation ID
 */
export function getCurrentConversationId(): string | null {
  const chatHistory = loadChatHistory();
  return chatHistory.currentConversationId;
}

/**
 * Get all conversations
 */
export function getAllConversations(): Conversation[] {
  const chatHistory = loadChatHistory();
  return chatHistory.conversations;
}

/**
 * Get a specific conversation by ID
 */
export function getConversation(conversationId: string): Conversation | null {
  const chatHistory = loadChatHistory();
  return chatHistory.conversations.find(c => c.id === conversationId) || null;
}

/**
 * Duplicate a conversation
 */
export function duplicateConversation(conversationId: string): string | null {
  try {
    const chatHistory = loadChatHistory();
    const originalConversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (!originalConversation) {
      return null;
    }
    
    const now = new Date();
    const duplicatedConversation: Conversation = {
      id: generateId(),
      name: `${originalConversation.name} (Copy)`,
      messages: originalConversation.messages.map(msg => ({
        ...msg,
        id: generateId() // Generate new IDs for messages
      })),
      createdAt: now,
      updatedAt: now
    };
    
    chatHistory.conversations.push(duplicatedConversation);
    chatHistory.currentConversationId = duplicatedConversation.id;
    
    saveChatHistory(chatHistory);
    return duplicatedConversation.id;
  } catch (error) {
    console.error('Failed to duplicate conversation:', error);
    return null;
  }
}

/**
 * Update conversation persona
 */
export function updateConversationPersona(conversationId: string, personaId: string): boolean {
  try {
    const chatHistory = loadChatHistory();
    const conversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.personaId = personaId;
      conversation.updatedAt = new Date();
      saveChatHistory(chatHistory);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to update conversation persona:', error);
    return false;
  }
}

/**
 * Update conversation response style
 */
export function updateConversationResponseStyle(conversationId: string, responseStyleId: string): boolean {
  try {
    const chatHistory = loadChatHistory();
    const conversation = chatHistory.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.responseStyleId = responseStyleId;
      conversation.updatedAt = new Date();
      saveChatHistory(chatHistory);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to update conversation response style:', error);
    return false;
  }
}