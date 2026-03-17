import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Lightbulb, Eye, MessageCircle, BookOpen, Zap } from 'lucide-react';
import { AxonCapture } from '../../services/axonService';
import { SpeechService } from '../../services/speechService';

interface AxonCaptureBarProps {
  onSave: (text: string, type: AxonCapture['capture_type'], isVoice: boolean) => Promise<void>;
  isSaving: boolean;
}

const captureTypes: Array<{
  id: AxonCapture['capture_type'];
  icon: React.FC<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
  border: string;
}> = [
  { id: 'Thought', icon: MessageCircle, label: 'Thought', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)' },
  { id: 'Idea', icon: Lightbulb, label: 'Idea', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  { id: 'Observation', icon: Eye, label: 'Observe', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  { id: 'Reflection', icon: BookOpen, label: 'Reflect', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)' },
];

const speechService = new SpeechService();

export const AxonCaptureBar: React.FC<AxonCaptureBarProps> = ({ onSave, isSaving }) => {
  const [text, setText] = useState('');
  const [captureType, setCaptureType] = useState<AxonCapture['capture_type']>('Thought');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceCapture, setIsVoiceCapture] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedType = captureTypes.find(t => t.id === captureType) || captureTypes[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [text]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSaving) return;
    await onSave(trimmed, captureType, isVoiceCapture);
    setText('');
    setIsVoiceCapture(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      speechService.stopListening();
      setIsRecording(false);
      setInterimText('');
    } else {
      if (!speechService.isSupported()) return;
      setIsRecording(true);
      setIsVoiceCapture(true);
      speechService.startListening(
        (transcript, isFinal) => {
          if (isFinal) {
            setText(prev => (prev ? prev + ' ' + transcript : transcript));
            setInterimText('');
          } else {
            setInterimText(transcript);
          }
        },
        () => { setIsRecording(false); setInterimText(''); },
        () => {},
        () => { setIsRecording(false); setInterimText(''); }
      );
    }
  };

  const displayText = text + (interimText ? (text ? ' ' : '') + interimText : '');
  const canSubmit = text.trim().length > 0 && !isSaving;
  const charCount = text.length;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-400"
      style={{
        background: isFocused
          ? 'rgba(10,10,22,0.95)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isRecording
          ? `rgba(217,119,6,0.5)`
          : isFocused
            ? `${selectedType.border}`
            : 'rgba(255,255,255,0.08)'}`,
        boxShadow: isRecording
          ? '0 0 30px rgba(217,119,6,0.12), inset 0 0 20px rgba(217,119,6,0.04)'
          : isFocused
            ? `0 0 20px ${selectedType.color}12`
            : 'none',
      }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-3 pb-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {captureTypes.map(({ id, icon: Icon, label, color, bg, border }) => (
          <button
            key={id}
            onClick={() => setCaptureType(id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
            style={captureType === id ? {
              background: bg,
              border: `1px solid ${border}`,
              color,
            } : {
              background: 'transparent',
              border: '1px solid transparent',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        {charCount > 0 && (
          <span className="text-[10px] tabular-nums transition-all duration-200"
            style={{ color: charCount > 400 ? 'rgba(244,63,94,0.6)' : 'rgba(255,255,255,0.2)' }}>
            {charCount}
          </span>
        )}
      </div>

      <div className="relative px-3 py-3">
        <textarea
          ref={textareaRef}
          value={displayText}
          onChange={e => {
            if (!isRecording) {
              setText(e.target.value);
              setIsVoiceCapture(false);
            }
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={`Capture a ${captureType.toLowerCase()}...`}
          rows={2}
          className="w-full bg-transparent text-white/85 text-sm leading-relaxed placeholder-white/15 outline-none resize-none"
          style={{ minHeight: '52px' }}
        />

        {isRecording && (
          <div className="flex items-center gap-2 mt-1.5 px-1">
            <div className="flex items-end gap-0.5 h-4">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-amber-400"
                  style={{
                    height: `${4 + Math.sin(Date.now() / 200 + i) * 8 + 8}px`,
                    animationDelay: `${i * 0.1}s`,
                    transition: 'height 0.1s ease',
                    animation: `pulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-amber-400/70 font-medium">Recording...</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 pb-3">
        <button
          onClick={toggleRecording}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
          style={isRecording ? {
            background: 'rgba(217,119,6,0.15)',
            border: '1px solid rgba(217,119,6,0.35)',
            color: '#fbbf24',
            boxShadow: '0 0 12px rgba(217,119,6,0.2)',
          } : {
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {isRecording ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          {isRecording ? 'Stop' : 'Voice'}
        </button>

        <span className="text-[10px] text-white/15">Cmd+Enter</span>

        <div className="flex-1" />

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 relative overflow-hidden"
          style={canSubmit ? {
            background: justSaved
              ? 'rgba(16,185,129,0.9)'
              : `${selectedType.color}dd`,
            color: 'white',
            boxShadow: justSaved
              ? '0 0 16px rgba(16,185,129,0.3)'
              : `0 0 12px ${selectedType.color}30`,
            transform: isSaving ? 'scale(0.97)' : 'scale(1)',
          } : {
            background: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {isSaving ? (
            <div className="flex items-center gap-1.5">
              <div className="flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white/70 animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
              <span>Tagging...</span>
            </div>
          ) : justSaved ? (
            <>
              <Zap className="w-3 h-3" />
              Saved
            </>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Capture
            </>
          )}
        </button>
      </div>
    </div>
  );
};
