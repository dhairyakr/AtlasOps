import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Power, Download, Upload, HardDrive, X, Play, User, Zap, ExternalLink, AlertCircle } from 'lucide-react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { SpeechService } from '../services/speechService';
import { OrpheusTtsService, OrpheusVoice, ORPHEUS_VOICES, loadOrpheusTtsSettings, saveOrpheusTtsSettings, OrpheusTtsSettings } from '../services/orpheusTtsService';
import { LLMService } from '../services/llmService';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { Message } from '../types/chat';
import { saveMessages, loadMessages, clearAllMessages, getStorageInfo, exportChatHistory, importChatHistory, loadChatHistory, saveChatHistory, getCurrentConversationId, updateConversationPersona, updateConversationResponseStyle } from '../utils/localStorageService';
import { PersonaSelector } from './PersonaSelector';
import { ResponseStyleSelector } from './ResponseStyleSelector';
import { getPersonaById, getDefaultPersona } from '../utils/personas';
import { getResponseStyleById, getDefaultResponseStyle } from '../utils/responseStyles';

interface VoiceAssistantProps {
  onBack: () => void;
}

interface VoiceSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
}

const ORPHEUS_PLAYGROUND_URL = 'https://console.groq.com/playground?model=canopylabs%2Forpheus-v1-english';

const ORPHEUS_VOICE_LABELS: Record<OrpheusVoice, string> = {
  autumn: 'Autumn (Female)',
  diana: 'Diana (Female)',
  hannah: 'Hannah (Female)',
  austin: 'Austin (Male)',
  daniel: 'Daniel (Male)',
  troy: 'Troy (Male)',
};

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { provider, geminiKey, groqKey } = useApiSettings();
  const [speechService] = useState(() => new SpeechService());
  const llmService = new LLMService(provider, geminiKey, groqKey);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => speechService.getCurrentSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [showResponseStyleSelector, setShowResponseStyleSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => loadChatHistory());
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(() => getCurrentConversationId());
  const [isButtonClicked, setIsButtonClicked] = useState<string | null>(null);
  const [orpheusSettings, setOrpheusSettings] = useState<OrpheusTtsSettings>(() => loadOrpheusTtsSettings());
  const [orpheusError, setOrpheusError] = useState('');
  const orpheusTtsRef = useRef<OrpheusTtsService | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = (buttonId: string, action: () => void) => {
    setIsButtonClicked(buttonId);
    action();
    setTimeout(() => setIsButtonClicked(null), 300);
  };

  const updateOrpheusSettings = (partial: Partial<OrpheusTtsSettings>) => {
    setOrpheusSettings(prev => {
      const next = { ...prev, ...partial };
      saveOrpheusTtsSettings(next);
      return next;
    });
  };

  useEffect(() => {
    const updateVoices = () => {
      const voices = speechService.getAvailableVoices();
      setAvailableVoices(voices);
      setVoiceSettings(speechService.getCurrentSettings());
    };

    updateVoices();

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [speechService]);

  useEffect(() => {
    if (currentConversationId) {
      saveMessages(messages, currentConversationId);

      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, messages, updatedAt: new Date() }
          : conv
      );

      if (JSON.stringify(updatedConversations) !== JSON.stringify(chatHistory.conversations)) {
        const updatedHistory = {
          ...chatHistory,
          conversations: updatedConversations
        };
        setChatHistory(updatedHistory);
        saveChatHistory(updatedHistory);
      }
    }
  }, [messages, currentConversationId, chatHistory]);

  useEffect(() => {
    if (isActive && autoMode && !isListening && !isSpeaking && !isProcessing) {
      const timer = setTimeout(() => {
        handleStartListening();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isActive, autoMode, isListening, isSpeaking, isProcessing]);

  const speakText = useCallback((text: string, onStart: () => void, onEnd: () => void, onError?: (e: Error) => void) => {
    if (orpheusSettings.enabled) {
      if (!groqKey) {
        setOrpheusError('Groq API key is required for Orpheus TTS. Configure it in Settings.');
        onEnd();
        return;
      }
      if (!orpheusSettings.termsAccepted) {
        setOrpheusError('You must accept the Orpheus model terms on Groq before using this voice.');
        onEnd();
        return;
      }
      setOrpheusError('');
      const svc = new OrpheusTtsService(groqKey);
      orpheusTtsRef.current = svc;
      svc.speak(text, orpheusSettings.voice, onStart, onEnd, (err) => {
        setOrpheusError(err.message);
        onError?.(err);
        onEnd();
      });
    } else {
      speechService.speak(text, onStart, onEnd, onError ?? (() => {}));
    }
  }, [orpheusSettings, groqKey, speechService]);

  const stopSpeaking = useCallback(() => {
    if (orpheusSettings.enabled && orpheusTtsRef.current) {
      orpheusTtsRef.current.stop();
      orpheusTtsRef.current = null;
    } else {
      speechService.stopSpeaking();
    }
    setIsSpeaking(false);
  }, [orpheusSettings.enabled, speechService]);

  const handleStartListening = () => {
    if (!speechService.isSupported() || isListening) return;

    setTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        setTranscript(transcript);
        if (isFinal && transcript.trim()) {
          handleVoiceInput(transcript.trim());
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsListening(false);
      },
      () => setIsListening(true),
      () => setIsListening(false)
    );
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    setTranscript('');
  };

  const handleVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setTranscript('');

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const currentConversation = chatHistory.conversations.find(c => c.id === currentConversationId);
      const persona = getPersonaById(currentConversation?.personaId || 'default') || getDefaultPersona();
      const responseStyle = getResponseStyleById(currentConversation?.responseStyleId || 'default') || getDefaultResponseStyle();
      const personaInstruction = persona.instruction;
      const responseStyleInstruction = responseStyle.instruction;

      const response = await llmService.generateResponse(text, undefined, personaInstruction, responseStyleInstruction);
      setLastResponse(response);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);

      const cleanText = response
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      speakText(
        cleanText,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          if (autoMode && isActive) {
            setTimeout(() => handleStartListening(), 300);
          }
        },
        (error) => {
          if (error.message !== 'interrupted') {
            console.error('Speech synthesis error:', error);
          }
          setIsSpeaking(false);
        }
      );
    } catch (error) {
      const errorMessage = 'I encountered an error processing your request. Please check your internet connection and API key.';
      setLastResponse(errorMessage);

      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessage,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorBotMessage]);
      speakText(errorMessage, () => setIsSpeaking(true), () => setIsSpeaking(false));
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePersonaChange = (personaId: string) => {
    if (currentConversationId && updateConversationPersona(currentConversationId, personaId)) {
      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, personaId, updatedAt: new Date() }
          : conv
      );

      const updatedHistory = { ...chatHistory, conversations: updatedConversations };
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
    }
    setShowPersonaSelector(false);
  };

  const handleResponseStyleChange = (responseStyleId: string) => {
    if (currentConversationId && updateConversationResponseStyle(currentConversationId, responseStyleId)) {
      const updatedConversations = chatHistory.conversations.map(conv =>
        conv.id === currentConversationId
          ? { ...conv, responseStyleId, updatedAt: new Date() }
          : conv
      );

      const updatedHistory = { ...chatHistory, conversations: updatedConversations };
      setChatHistory(updatedHistory);
      saveChatHistory(updatedHistory);
    }
    setShowResponseStyleSelector(false);
  };

  const toggleActive = () => {
    if (isActive) {
      speechService.stopListening();
      stopSpeaking();
      setIsListening(false);
      setIsProcessing(false);
      setIsActive(false);
    } else {
      setIsActive(true);
      if (autoMode) {
        handleStartListening();
      }
    }
  };

  const clearChat = () => {
    if (currentConversationId) {
      clearAllMessages(currentConversationId);
      const defaultMessages = [
        {
          id: '1',
          text: "Hello! I'm your voice assistant. Activate me and start speaking!",
          sender: 'bot' as const,
          timestamp: new Date(),
        }
      ];
      setMessages(defaultMessages);
    }
    setLastResponse('');
  };

  const handleExportHistory = () => {
    const jsonData = exportChatHistory();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-voice-history-${new Date().toISOString().split('T')[0]}.json`;
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
    e.target.value = '';
  };

  const handleVoiceChange = (voiceName: string) => {
    speechService.updateVoiceSelection(voiceName);
    setVoiceSettings(speechService.getCurrentSettings());
  };

  const handleRateChange = (rate: number) => {
    speechService.setRate(rate);
    setVoiceSettings(speechService.getCurrentSettings());
  };

  const handlePitchChange = (pitch: number) => {
    speechService.setPitch(pitch);
    setVoiceSettings(speechService.getCurrentSettings());
  };

  const handleTestVoice = () => {
    speechService.testVoice();
  };

  const handleTestOrpheusVoice = async () => {
    if (!groqKey) {
      setOrpheusError('Groq API key is required. Configure it in Settings.');
      return;
    }
    if (!orpheusSettings.termsAccepted) {
      setOrpheusError('Please accept the model terms on Groq Playground first.');
      return;
    }
    setOrpheusError('');
    setIsSpeaking(true);
    const svc = new OrpheusTtsService(groqKey);
    orpheusTtsRef.current = svc;
    await svc.speak(
      `Hello! This is the ${ORPHEUS_VOICE_LABELS[orpheusSettings.voice]} voice from Orpheus.`,
      orpheusSettings.voice,
      () => {},
      () => { setIsSpeaking(false); orpheusTtsRef.current = null; },
      (err) => { setOrpheusError(err.message); setIsSpeaking(false); }
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusText = () => {
    if (!isActive) return 'Voice Assistant Inactive';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isSpeaking) return 'Speaking...';
    return 'Ready to listen';
  };

  const getStatusColor = () => {
    if (!isActive) return 'text-gray-500';
    if (isListening) return 'text-blue-500';
    if (isProcessing) return 'text-purple-500';
    if (isSpeaking) return 'text-green-500';
    return 'text-gray-700 dark:text-gray-300';
  };

  const storageInfo = getStorageInfo();
  const currentConversation = chatHistory.conversations.find(c => c.id === currentConversationId);
  const currentPersona = getPersonaById(currentConversation?.personaId || 'default') || getDefaultPersona();
  const currentResponseStyle = getResponseStyleById(currentConversation?.responseStyleId || 'default') || getDefaultResponseStyle();

  return (
    <div className="min-h-screen bg-voice-core-galaxy flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neo-tech-neon-violet rounded-full animate-cosmic-drift opacity-60"></div>
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-neo-tech-aurora-pink rounded-full animate-cosmic-drift opacity-40" style={{ animationDelay: '5s' }}></div>
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-neo-tech-quantum-cyan rounded-full animate-cosmic-drift opacity-50" style={{ animationDelay: '10s' }}></div>
        <div className="absolute top-1/6 right-1/4 w-1 h-1 bg-neo-tech-plasma-blue rounded-full animate-cosmic-drift opacity-30" style={{ animationDelay: '15s' }}></div>
        <div className="absolute bottom-1/4 right-1/6 w-2 h-2 bg-neo-tech-vapor-lilac rounded-full animate-cosmic-drift opacity-45" style={{ animationDelay: '20s' }}></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neo-tech-neon-violet/5 via-transparent to-neo-tech-aurora-pink/5 animate-diagonal-light-sweep"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-1 h-1 bg-white/30 rounded-full animate-nebula-float"></div>
          <div className="absolute top-40 right-32 w-0.5 h-0.5 bg-neo-tech-quantum-cyan/40 rounded-full animate-nebula-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-neo-tech-aurora-pink/30 rounded-full animate-nebula-float" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bottom-20 right-20 w-1 h-1 bg-neo-tech-neon-violet/40 rounded-full animate-nebula-float" style={{ animationDelay: '6s' }}></div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-voice-core-navbar px-4 py-3 sm:px-6 sm:py-4 relative z-10">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleClick('back-button', onBack)}
              className={`p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 btn-interactive-effect ${isButtonClicked === 'back-button' ? 'clicked' : ''}`}
            >
              ←
            </button>
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">The Voice Core</h1>
              <p className="text-sm text-white/70">
                {currentPersona.name} • {currentResponseStyle.name} Style • Hands-free AI interaction
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleClick('response-style', () => setShowResponseStyleSelector(true))}
              className={`flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'response-style' ? 'clicked' : ''}`}
              title={`Current style: ${currentResponseStyle.name}`}
            >
              <span className="text-lg">{currentResponseStyle.icon}</span>
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleClick('persona-selector', () => setShowPersonaSelector(true))}
              className={`flex items-center space-x-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'persona-selector' ? 'clicked' : ''}`}
              title={`Current persona: ${currentPersona.name}`}
            >
              <span className="text-lg">{currentPersona.icon}</span>
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleClick('voice-settings', () => setShowVoiceSettings(!showVoiceSettings))}
              className={`p-2 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'voice-settings' ? 'clicked' : ''} ${
                showVoiceSettings
                  ? 'bg-voice-core-toggle-active text-white border-neo-tech-neon-violet/50'
                  : 'text-white/70 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/20'
              }`}
              title="Voice settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleClick('storage-info', () => setShowStorageInfo(!showStorageInfo))}
              className={`p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'storage-info' ? 'clicked' : ''}`}
              title="Storage info"
            >
              <HardDrive className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleClick('export-history', handleExportHistory)}
              className={`p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'export-history' ? 'clicked' : ''}`}
              title="Export chat history"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleClick('import-history', () => importInputRef.current?.click())}
              className={`p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 hover:shadow-neural-glow btn-interactive-effect ${isButtonClicked === 'import-history' ? 'clicked' : ''}`}
              title="Import chat history"
            >
              <Upload className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleClick('auto-mode', () => setAutoMode(!autoMode))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all btn-hover-lift backdrop-blur-sm border btn-interactive-effect ${isButtonClicked === 'auto-mode' ? 'clicked' : ''} ${
                autoMode
                  ? 'bg-voice-core-toggle-active text-white border-neo-tech-neon-violet/50 shadow-neural-glow'
                  : 'bg-voice-core-toggle-inactive text-white/70 border-white/20 hover:border-white/30'
              }`}
            >
              Auto Mode
            </button>
          </div>
        </div>

        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="mt-4 p-4 sm:p-6 glass-premium rounded-2xl border border-voice-core-panel max-w-4xl mx-auto animate-slide-up shadow-cosmic-glow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Voice Core Configuration</h3>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TTS Engine Toggle */}
            <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5">
              <p className="text-sm font-medium text-white/90 mb-3">TTS Engine</p>
              <div className="flex gap-3">
                <button
                  onClick={() => updateOrpheusSettings({ enabled: false })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border ${
                    !orpheusSettings.enabled
                      ? 'bg-neo-tech-quantum-cyan/20 border-neo-tech-quantum-cyan text-white shadow-neural-glow'
                      : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  Browser (Native)
                </button>
                <button
                  onClick={() => updateOrpheusSettings({ enabled: true })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all border ${
                    orpheusSettings.enabled
                      ? 'bg-neo-tech-aurora-pink/20 border-neo-tech-aurora-pink text-white shadow-neural-glow'
                      : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                  }`}
                >
                  Orpheus (Groq AI)
                </button>
              </div>
            </div>

            {/* Orpheus Settings */}
            {orpheusSettings.enabled && (
              <div className="mb-6 space-y-4">
                {/* Terms Acceptance Notice */}
                <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-300 mb-1">Model Terms Required</p>
                      <p className="text-xs text-amber-200/80 mb-3">
                        Before using Orpheus TTS, you must accept the model terms on the Groq Playground. This is a one-time action required by Groq for the <code className="font-mono bg-amber-500/20 px-1 rounded">canopylabs/orpheus-v1-english</code> model.
                      </p>
                      <a
                        href={ORPHEUS_PLAYGROUND_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-lg transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Accept Terms on Groq Playground
                      </a>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="terms-accepted"
                      checked={orpheusSettings.termsAccepted}
                      onChange={(e) => updateOrpheusSettings({ termsAccepted: e.target.checked })}
                      className="w-4 h-4 accent-amber-400 cursor-pointer"
                    />
                    <label htmlFor="terms-accepted" className="text-xs text-amber-200 cursor-pointer select-none">
                      I have accepted the Orpheus model terms on the Groq Playground
                    </label>
                  </div>
                </div>

                {/* Groq Key Warning */}
                {!groqKey && (
                  <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300">Groq API key not configured. Add it in Settings to use Orpheus TTS.</p>
                  </div>
                )}

                {/* Orpheus Error */}
                {orpheusError && (
                  <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300">{orpheusError}</p>
                  </div>
                )}

                {/* Voice Picker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">Orpheus Voice</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ORPHEUS_VOICES.map(v => (
                        <button
                          key={v}
                          onClick={() => updateOrpheusSettings({ voice: v })}
                          className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border text-left ${
                            orpheusSettings.voice === v
                              ? 'bg-neo-tech-aurora-pink/30 border-neo-tech-aurora-pink text-white'
                              : 'border-white/20 text-white/60 hover:text-white hover:border-white/40 bg-white/5'
                          }`}
                        >
                          {ORPHEUS_VOICE_LABELS[v]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => handleClick('test-orpheus', handleTestOrpheusVoice)}
                      disabled={isSpeaking || !groqKey || !orpheusSettings.termsAccepted}
                      className={`w-full px-4 py-2 bg-gradient-to-r from-neo-tech-aurora-pink to-neo-tech-neon-violet text-white rounded-lg hover:shadow-neural-glow transition-all btn-hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-liquid-depth btn-interactive-effect ${isButtonClicked === 'test-orpheus' ? 'clicked' : ''}`}
                    >
                      <Play className="w-4 h-4" />
                      <span>Test Orpheus Voice</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 glass-premium rounded-lg border border-neo-tech-aurora-pink/20">
                  <p className="text-xs text-white/70">
                    <strong className="text-white">Orpheus</strong> by Canopy Labs delivers expressive, human-quality English speech trained on 100k+ hours of audio.
                    Priced at ~$0.022 per 1,000 characters. Supports vocal direction tags like <code className="font-mono bg-white/10 px-1 rounded">[cheerful]</code> or <code className="font-mono bg-white/10 px-1 rounded">[whisper]</code>.
                  </p>
                </div>
              </div>
            )}

            {/* Browser Voice Settings (shown when native engine selected) */}
            {!orpheusSettings.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Voice & Language ({availableVoices.length} available)
                  </label>
                  <select
                    value={voiceSettings.voice?.name || ''}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className="voice-core-select w-full px-3 py-2 border border-white/20 bg-white/10 backdrop-blur-sm text-white rounded-lg focus:ring-2 focus:ring-neo-tech-neon-violet focus:border-transparent outline-none transition-all"
                  >
                    {availableVoices
                      .sort((a, b) => {
                        if (a.lang !== b.lang) return a.lang.localeCompare(b.lang);
                        return a.name.localeCompare(b.name);
                      })
                      .map((voice) => (
                        <option
                          key={voice.name}
                          value={voice.name}
                          style={{ backgroundColor: '#1a1a2e', color: '#ffffff', padding: '12px 16px' }}
                        >
                          {voice.name} - {voice.lang} {voice.localService ? '(Local)' : '(Network)'}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-white/60 mt-1">
                    Current: {voiceSettings.voice?.name || 'Default'}
                    {voiceSettings.voice?.lang && ` (${voiceSettings.voice.lang})`}
                  </p>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleClick('test-voice', handleTestVoice)}
                    className={`w-full px-4 py-2 bg-gradient-to-r from-neo-tech-quantum-cyan to-neo-tech-plasma-blue text-white rounded-lg hover:shadow-neural-glow focus:ring-4 focus:ring-neo-tech-quantum-cyan/30 transition-all btn-hover-lift flex items-center justify-center space-x-2 disabled:opacity-50 shadow-liquid-depth btn-interactive-effect ${isButtonClicked === 'test-voice' ? 'clicked' : ''}`}
                    disabled={!voiceSettings.voice}
                    title={voiceSettings.voice ? `Test voice in ${voiceSettings.voice.lang}` : 'No voice selected'}
                  >
                    <Play className="w-4 h-4" />
                    <span>Test Voice {voiceSettings.voice?.lang && `(${voiceSettings.voice.lang.split('-')[0].toUpperCase()})`}</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Speech Rate: {voiceSettings.rate.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider backdrop-blur-sm"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Slow (0.1x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Fast (2.0x)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Speech Pitch: {voiceSettings.pitch.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider backdrop-blur-sm"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Low (0.1)</span>
                    <span>Normal (1.0)</span>
                    <span>High (2.0)</span>
                  </div>
                </div>
              </div>
            )}

            {!orpheusSettings.enabled && (
              <div className="mt-4 p-3 glass-premium rounded-lg border border-neo-tech-quantum-cyan/30">
                <p className="text-sm text-white/80">
                  <strong>Tip:</strong> Voice settings are automatically saved. Indian languages include Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and more.
                  Switch to <strong>Orpheus (Groq AI)</strong> above for premium AI-generated voice.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Storage Info Panel */}
        {showStorageInfo && (
          <div className="mt-4 p-3 sm:p-4 glass-premium rounded-2xl border border-voice-core-panel max-w-4xl mx-auto animate-slide-up shadow-cosmic-glow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Voice Core Memory</h3>
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
              Your voice conversations are automatically saved locally. Export to backup or import to restore.
            </p>
          </div>
        )}
      </div>

      {/* Main Voice Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 backdrop-blur-2xl">
        <div className="text-center space-y-8 max-w-2xl">
          <div className="relative animate-fade-in">
            <VoiceVisualizer
              isListening={isListening}
              isSpeaking={isSpeaking}
              isProcessing={isProcessing}
            />

            <button
              onClick={toggleActive}
              className={`absolute inset-0 m-auto w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 btn-hover-lift bg-voice-core-power-orb shadow-power-orb-glow border-power-orb relative overflow-hidden group ${
                isActive
                  ? 'animate-power-orb-pulse shadow-cosmic-glow'
                  : 'hover:shadow-neural-glow'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 animate-shimmer rounded-full"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neo-tech-neon-violet/30 to-neo-tech-aurora-pink/30 animate-echo-bloom opacity-0 group-active:opacity-100 group-active:animate-echo-ripple"></div>
              <div className="relative z-10 flex items-center justify-center">
                {isActive ? (
                  <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-breathe drop-shadow-glow" />
                ) : (
                  <Power className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-glow" />
                )}
              </div>
            </button>
          </div>

          {/* Orpheus Active Badge */}
          {orpheusSettings.enabled && orpheusSettings.termsAccepted && groqKey && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neo-tech-aurora-pink/20 border border-neo-tech-aurora-pink/50 text-xs text-neo-tech-aurora-pink font-medium">
                <Volume2 className="w-3 h-3" />
                Orpheus TTS Active — {ORPHEUS_VOICE_LABELS[orpheusSettings.voice]}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h2 className={`text-2xl sm:text-3xl font-bold gradient-text animate-fade-in-up ${isActive ? 'animate-text-glow-pulse' : ''}`}>
              {getStatusText()}
            </h2>

            {!isActive && (
              <p className="text-white/50 text-sm animate-fade-in-up">
                Awaiting activation<span className="animate-blinking-dot">...</span>
              </p>
            )}

            {transcript && (
              <div className="glass-premium backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-cosmic-glow animate-bounce-in">
                <p className="text-white/70 text-sm mb-2">Neural input detected:</p>
                <p className="text-white font-medium">{transcript}</p>
              </div>
            )}

            {lastResponse && (
              <div className="glass-premium rounded-2xl p-6 border border-neo-tech-neon-violet/30 shadow-cosmic-glow animate-bounce-in">
                <p className="text-neo-tech-quantum-cyan text-sm mb-2">Core response:</p>
                <p className="text-white">{lastResponse}</p>
              </div>
            )}
          </div>

          {isActive && !autoMode && (
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 animate-fade-in-up">
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isProcessing || isSpeaking}
                className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none btn-hover-lift shadow-neural-glow backdrop-blur-sm border w-full sm:w-auto ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse border-red-400/50'
                    : 'bg-gradient-to-r from-neo-tech-neon-violet to-neo-tech-aurora-pink text-white hover:shadow-cosmic-glow border-neo-tech-neon-violet/50'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5 inline mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 inline mr-2" />
                    Start Listening
                  </>
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-cosmic-glow transition-all transform hover:scale-105 btn-hover-lift shadow-neural-glow backdrop-blur-sm border border-orange-400/50 w-full sm:w-auto"
                >
                  <VolumeX className="w-5 h-5 inline mr-2" />
                  Stop Speaking
                </button>
              )}
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={() => handleClick('clear-neural-memory', clearChat)}
              className={`glass-button-pill px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all text-sm btn-hover-lift backdrop-blur-sm border border-white/10 hover:border-white/20 opacity-0 group-hover:opacity-100 hover:animate-shimmer btn-interactive-effect ${isButtonClicked === 'clear-neural-memory' ? 'clicked' : ''}`}
            >
              <span className="flex items-center space-x-2">
                <span>Clear Neural Memory</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <input
        ref={importInputRef}
        type="file"
        onChange={handleImportInputChange}
        accept=".json"
        className="hidden"
      />

      {showPersonaSelector && (
        <PersonaSelector
          currentPersonaId={currentConversation?.personaId || 'default'}
          onPersonaChange={handlePersonaChange}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}

      {showResponseStyleSelector && (
        <ResponseStyleSelector
          currentResponseStyleId={currentConversation?.responseStyleId || 'default'}
          onResponseStyleChange={handleResponseStyleChange}
          onClose={() => setShowResponseStyleSelector(false)}
        />
      )}
    </div>
  );
};
