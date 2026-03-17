export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
  reactions?: Record<string, number>;
  image?: {
    data: string; // base64 encoded image data
    mimeType: string;
  };
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  personaId?: string;
  responseStyleId?: string;
}

export interface ChatHistory {
  conversations: Conversation[];
  currentConversationId: string | null;
  version: number; // For future migration compatibility
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  apiKey: string;
}