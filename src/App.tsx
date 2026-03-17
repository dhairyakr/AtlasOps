import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiSettingsProvider, useApiSettings } from './contexts/ApiSettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ParticleBackground } from './components/ParticleBackground';
import { GrainGradientBackground } from './components/GrainGradientBackground';
import { ApiKeyInput } from './components/ApiKeyInput';
import { ModeSelector, AppMode } from './components/ModeSelector';
import { EnhancedChatInterface } from './components/EnhancedChatInterface';
import { VoiceAssistant } from './components/VoiceAssistant';
import { ChatInterface } from './components/ChatInterface';
import { TermSheetValidator } from './components/TermSheetValidator';
import { RagLab } from './components/rag/RagLab';
import { PromptLab } from './components/promptLab/PromptLab';
import { AgentsLab } from './components/agentsLab/AgentsLab';
import { FineTuningLab } from './components/fineTuningLab/FineTuningLab';
import { EmbeddingsLab } from './components/embeddingsLab/EmbeddingsLab';
import { EthicsLab } from './components/ethicsLab/EthicsLab';
import { MultimodalLab } from './components/multimodalLab/MultimodalLab';
import { WebAgent } from './components/webAgent/WebAgent';
import { OutboundVoiceAgent } from './components/outboundVoiceAgent/OutboundVoiceAgent';
import { AtlasLab } from './components/atlas/AtlasLab';
import { AxonLab } from './components/axon/AxonLab';
import { OsintLab } from './components/osint/OsintLab';
import { ChatHistory } from './types/chat';
import { loadChatHistory, saveChatHistory, getCurrentConversationId } from './utils/localStorageService';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { isConfigured, resetConfig } = useApiSettings();
  const { signOut } = useAuth();
  const [currentMode, setCurrentMode] = useState<AppMode>('chat');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatHistory>(() => loadChatHistory());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => getCurrentConversationId());

  useEffect(() => {
    saveChatHistory(chatHistory);
  }, [chatHistory]);

  useEffect(() => {
    if (chatHistory.currentConversationId !== currentConversationId) {
      setCurrentConversationId(chatHistory.currentConversationId);
    }
  }, [chatHistory.currentConversationId]);

  const handleApiKeySet = () => {
    setShowModeSelector(true);
  };

  const handleLogout = () => {
    setShowModeSelector(true);
  };

  const handleGoBackToSetup = async () => {
    await signOut();
    resetConfig();
  };

  const handleModeSelect = (mode: AppMode) => {
    setCurrentMode(mode);
    setShowModeSelector(false);
  };

  const handleBackToModeSelector = () => {
    setShowModeSelector(true);
  };

  const updateChatHistory = (newChatHistory: ChatHistory) => {
    setChatHistory(newChatHistory);
  };

  const labModes = ['ragLab', 'promptLab', 'agentsLab', 'fineTuningLab', 'embeddingsLab', 'ethicsLab', 'multimodalLab', 'webAgent', 'outboundVoiceAgent', 'atlas', 'axon', 'osint'];

  const renderInterface = () => {
    if (!isConfigured) {
      return <ApiKeyInput onApiKeySet={handleApiKeySet} />;
    }

    if (showModeSelector) {
      return (
        <div className="h-full flex flex-col relative overflow-hidden">
          <GrainGradientBackground />

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neo-tech-neon-violet rounded-full animate-cosmic-drift opacity-60"></div>
            <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-neo-tech-aurora-pink rounded-full animate-cosmic-drift opacity-40" style={{ animationDelay: '5s' }}></div>
            <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-neo-tech-quantum-cyan rounded-full animate-cosmic-drift opacity-50" style={{ animationDelay: '10s' }}></div>
            <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-neo-tech-plasma-blue rounded-full animate-cosmic-drift opacity-30" style={{ animationDelay: '15s' }}></div>
            <div className="absolute bottom-1/4 right-1/6 w-2 h-2 bg-neo-tech-vapor-lilac rounded-full animate-cosmic-drift opacity-45" style={{ animationDelay: '20s' }}></div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">
            <div className="w-full max-w-4xl mx-auto">
              <ModeSelector currentMode={currentMode} onModeChange={handleModeSelect} onLogout={handleLogout} onGoBack={handleGoBackToSetup} />
            </div>
          </div>
        </div>
      );
    }

    switch (currentMode) {
      case 'chat':
        return (
          <EnhancedChatInterface
            onBack={handleBackToModeSelector}
            chatHistory={chatHistory}
            currentConversationId={currentConversationId}
            onChatHistoryUpdate={updateChatHistory}
          />
        );
      case 'voice':
        return (
          <VoiceAssistant
            onBack={handleBackToModeSelector}
          />
        );
      case 'hybrid':
        return (
          <ChatInterface
            onLogout={handleBackToModeSelector}
          />
        );
      case 'termSheetValidator':
        return (
          <TermSheetValidator
            onBack={handleBackToModeSelector}
          />
        );
      case 'ragLab':
        return (
          <RagLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'promptLab':
        return (
          <PromptLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'agentsLab':
        return (
          <ErrorBoundary>
            <AgentsLab
              onBack={handleBackToModeSelector}
            />
          </ErrorBoundary>
        );
      case 'fineTuningLab':
        return (
          <FineTuningLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'embeddingsLab':
        return (
          <EmbeddingsLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'ethicsLab':
        return (
          <EthicsLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'multimodalLab':
        return (
          <MultimodalLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'webAgent':
        return (
          <WebAgent
            onBack={handleBackToModeSelector}
          />
        );
      case 'outboundVoiceAgent':
        return (
          <ErrorBoundary>
            <OutboundVoiceAgent
              onBack={handleBackToModeSelector}
            />
          </ErrorBoundary>
        );
      case 'atlas':
        return (
          <AtlasLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'axon':
        return (
          <AxonLab
            onBack={handleBackToModeSelector}
          />
        );
      case 'osint':
        return (
          <OsintLab
            onBack={handleBackToModeSelector}
          />
        );
      default:
        return (
          <EnhancedChatInterface
            onBack={handleBackToModeSelector}
            chatHistory={chatHistory}
            currentConversationId={currentConversationId}
            onChatHistoryUpdate={updateChatHistory}
          />
        );
    }
  };

  return (
    <div className="h-full relative overflow-hidden">
      {isConfigured && !labModes.includes(currentMode) && <ParticleBackground />}
      {renderInterface()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ApiSettingsProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </ApiSettingsProvider>
    </AuthProvider>
  );
}

export default App;
