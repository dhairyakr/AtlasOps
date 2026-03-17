import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2, VolumeX, Loader2, Play } from 'lucide-react';
import { SpeechService } from '../services/speechService';
import { OrpheusTtsService, loadOrpheusTtsSettings } from '../services/orpheusTtsService';
import { useApiSettings } from '../contexts/ApiSettingsContext';

interface VoiceControlsProps {
  onVoiceInput: (text: string) => void;
  isProcessing: boolean;
  lastBotMessage?: string;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  onVoiceInput,
  isProcessing,
  lastBotMessage
}) => {
  const { groqKey } = useApiSettings();
  const [speechService] = useState(() => new SpeechService());
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const spokenMessageRef = useRef<string | undefined>(undefined);
  const orpheusTtsRef = useRef<OrpheusTtsService | null>(null);

  useEffect(() => {
    setIsSupported(speechService.isSupported());

    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {
        speechService.isSupported();
      };
    }

    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
      orpheusTtsRef.current?.stop();
    };
  }, [speechService]);

  useEffect(() => {
    if (
      autoSpeak &&
      lastBotMessage &&
      lastBotMessage !== spokenMessageRef.current &&
      !isProcessing &&
      !isListening
    ) {
      spokenMessageRef.current = lastBotMessage;
      const timer = setTimeout(() => {
        handleSpeak(lastBotMessage);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lastBotMessage, autoSpeak, isProcessing, isListening]);

  const handleStartListening = () => {
    if (!isSupported || isListening || isSpeaking) return;

    setError('');
    setTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        setTranscript(transcript);
        if (isFinal && transcript.trim()) {
          onVoiceInput(transcript.trim());
          setTranscript('');
        }
      },
      (error) => {
        setError(error);
        setIsListening(false);
      },
      () => {
        setIsListening(true);
        setError('');
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleStopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    setTranscript('');
  };

  const cleanText = (text: string): string => {
    return text
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
  };

  const handleSpeak = (text: string) => {
    if (!text.trim() || isListening) return;

    const cleanedText = cleanText(text);
    const orpheusConfig = loadOrpheusTtsSettings();

    if (orpheusConfig.enabled && orpheusConfig.termsAccepted && groqKey) {
      const svc = new OrpheusTtsService(groqKey);
      orpheusTtsRef.current = svc;
      svc.speak(
        cleanedText,
        orpheusConfig.voice,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          orpheusTtsRef.current = null;
          setError('');
        },
        (err) => {
          setError(err.message);
          setIsSpeaking(false);
          orpheusTtsRef.current = null;
        }
      );
    } else {
      speechService.speak(
        cleanedText,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          setError('');
        },
        (error) => {
          setError(error);
          setIsSpeaking(false);
        }
      );
    }
  };

  const handleStopSpeaking = () => {
    orpheusTtsRef.current?.stop();
    orpheusTtsRef.current = null;
    speechService.stopSpeaking();
    setIsSpeaking(false);
    setError('');
  };

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    if (!next) {
      handleStopSpeaking();
    }
  };

  const handleManualSpeak = () => {
    if (isSpeaking) {
      handleStopSpeaking();
      return;
    }
    if (lastBotMessage && !isListening) {
      handleSpeak(lastBotMessage);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center space-x-2 text-white/60">
        <Mic className="w-4 h-4" />
        <span className="text-xs">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Voice Input Button */}
      <div className="relative group">
        <button
          onClick={isListening ? handleStopListening : handleStartListening}
          disabled={isProcessing || isSpeaking}
          className={`p-2 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening
              ? 'bg-neo-tech-aurora-pink text-white shadow-cosmic-glow animate-pulse btn-premium'
              : 'glass-premium text-white/60 hover:text-white hover:bg-white/10 shadow-enhanced btn-hover-lift'
          }`}
          title={isListening ? 'Stop listening' : 'Detect speech'}
        >
          {isListening ? (
            <Mic className="w-5 h-5 animate-breathe" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {transcript && (
          <div className="absolute bottom-full left-0 mb-2 glass-premium text-white text-xs px-3 py-2 rounded-lg max-w-48 shadow-cosmic-glow animate-fade-in whitespace-normal break-words z-50">
            {transcript}
          </div>
        )}

        <div className="absolute bottom-full left-0 mb-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/80 whitespace-nowrap pointer-events-none">
          {isListening ? 'Listening...' : 'Detect speech'}
        </div>
      </div>

      {/* Manual Speak Button */}
      <button
        onClick={handleManualSpeak}
        disabled={!lastBotMessage || isProcessing || isListening}
        className={`p-2 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
          isSpeaking
            ? 'bg-neo-tech-quantum-cyan text-white shadow-cosmic-glow animate-pulse btn-premium'
            : 'glass-premium text-white/60 hover:text-white hover:bg-white/10 shadow-enhanced btn-hover-lift'
        }`}
        title={isSpeaking ? 'Stop speaking' : 'Speak response'}
      >
        {isSpeaking ? (
          <Volume2 className="w-5 h-5 animate-breathe" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>

      {/* Auto-Speak Toggle */}
      <button
        onClick={toggleAutoSpeak}
        className={`p-2 rounded-lg transition-all transform hover:scale-105 ${
          autoSpeak
            ? 'bg-neo-tech-neon-violet text-white shadow-cosmic-glow'
            : 'glass-premium text-white/60 hover:text-white hover:bg-white/10 shadow-enhanced btn-hover-lift'
        }`}
        title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
      >
        {autoSpeak ? (
          <Volume2 className="w-5 h-5 animate-pulse" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {isSpeaking && (
        <div className="flex items-center space-x-2 text-neo-tech-quantum-cyan glass-premium px-2 py-1 rounded-lg shadow-cosmic-glow animate-fade-in ml-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span className="text-xs font-medium">Speaking</span>
          <button
            onClick={handleStopSpeaking}
            className="text-xs bg-neo-tech-aurora-pink text-white px-2 py-0.5 rounded hover:bg-neo-tech-aurora-pink/80 transition-all btn-hover-lift"
          >
            Stop
          </button>
        </div>
      )}

      {error && (
        <div className="text-neo-tech-aurora-pink text-xs glass-premium px-2 py-1 rounded-lg shadow-cosmic-glow animate-wiggle truncate max-w-40" title={error}>
          {error}
        </div>
      )}
    </div>
  );
};
