import React, { useState } from 'react';
import { Phone, ChevronDown, ChevronUp, Sparkles, Globe, Zap } from 'lucide-react';
import { AgentConfig, ResponseStyle } from './VoiceAgentTypes';

const STYLE_DIRECTIVES: Record<ResponseStyle, string> = {
  concise: 'RESPONSE LENGTH: Keep every reply to 1-2 short sentences. Be direct and avoid elaboration.',
  balanced: 'RESPONSE LENGTH: Use natural conversational length — typically 2-3 sentences. Match the caller\'s pace.',
  detailed: 'RESPONSE LENGTH: Give thorough, helpful answers. Explain clearly and include relevant context.',
};

interface DialerPanelProps {
  config: AgentConfig;
  onDial: (toNumber: string, agentTask: string, systemPrompt: string, webSearchEnabled: boolean) => void;
  isDisabled: boolean;
}

const DEFAULT_SYSTEM_PROMPT = `You are InsightVoice, a professional AI voice assistant on an active outbound call.

Guidelines:
- The opening greeting has already been spoken automatically — do NOT repeat it, do NOT re-introduce yourself, do NOT say "this call may be recorded" again at any point
- You are already in an ongoing conversation; respond naturally to what the caller just said
- Be natural, warm, and conversational — not robotic
- Listen carefully and respond to what the person actually says
- Use the search_web tool when you need current information, facts, or status updates
- Keep responses concise — this is a phone call, not a chat
- If the person wants to end the call, say a polite goodbye
- Always confirm before taking any action on behalf of the caller`;

export const DialerPanel: React.FC<DialerPanelProps> = ({ config, onDial, isDisabled }) => {
  const [toNumber, setToNumber] = useState('');
  const [agentTask, setAgentTask] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(config.responseStyle ?? 'balanced');

  const isReady = config.twilioAccountSid && config.twilioAuthToken && config.twilioFromNumber &&
    config.groqApiKey && toNumber.trim();

  const handleDial = () => {
    if (!isReady || isDisabled) return;
    const styleDirective = STYLE_DIRECTIVES[responseStyle];
    const finalPrompt = `${styleDirective}\n\n${systemPrompt.trim()}`;
    onDial(toNumber.trim(), agentTask.trim(), finalPrompt, webSearchEnabled);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Phone Number to Call</label>
          <input
            type="tel"
            value={toNumber}
            onChange={e => setToNumber(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all font-mono"
          />
          <p className="text-xs text-white/30">Enter in E.164 format, e.g. +12025551234 or +919876543210</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Agent Task / Goal</label>
          <textarea
            value={agentTask}
            onChange={e => setAgentTask(e.target.value)}
            placeholder="e.g. Qualify this lead for our EV charging service, confirm their address and budget range"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all resize-none leading-relaxed"
          />
        </div>

        <div className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all ${webSearchEnabled ? 'bg-sky-500/8 border-sky-500/20' : 'bg-white/3 border-white/8'}`}>
          <div className="flex items-center gap-2.5">
            {webSearchEnabled ? (
              <Globe className="w-4 h-4 text-sky-400 flex-shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-xs font-semibold ${webSearchEnabled ? 'text-sky-300' : 'text-amber-300'}`}>
                {webSearchEnabled ? 'Web Search On' : 'Fast Mode'}
              </p>
              <p className="text-[10px] text-white/35 leading-tight mt-0.5">
                {webSearchEnabled
                  ? 'Agent can look up live data mid-call'
                  : 'Direct Groq replies — no tool round-trips'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setWebSearchEnabled(v => !v)}
            className={`relative w-10 h-5.5 rounded-full transition-all duration-200 flex-shrink-0 ${webSearchEnabled ? 'bg-sky-500' : 'bg-white/15'}`}
            style={{ width: '40px', height: '22px' }}
          >
            <span
              className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all duration-200 ${webSearchEnabled ? 'left-[18px]' : 'left-0.5'}`}
              style={{ width: '18px', height: '18px', top: '2px', left: webSearchEnabled ? '20px' : '2px' }}
            />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">Response Style</label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { value: 'concise', label: 'Concise', desc: '1–2 sentences' },
              { value: 'balanced', label: 'Balanced', desc: 'Natural pace' },
              { value: 'detailed', label: 'Detailed', desc: 'Full answers' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setResponseStyle(opt.value)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl border text-center transition-all ${responseStyle === opt.value ? 'bg-sky-500/15 border-sky-500/40 text-sky-300' : 'bg-white/3 border-white/8 text-white/40 hover:text-white/60 hover:bg-white/5'}`}
              >
                <span className="text-xs font-semibold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => setShowSystemPrompt(s => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-white/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            System Prompt (Advanced)
            {showSystemPrompt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showSystemPrompt && (
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={8}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/70 focus:outline-none focus:border-sky-500/40 transition-all resize-none leading-relaxed font-mono"
            />
          )}
        </div>
      </div>

      {!isReady && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2.5">
          <p className="text-xs text-amber-400/80">
            {!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber ? 'Complete Twilio credentials in settings' :
              !config.groqApiKey ? 'Add your Groq API key in settings' :
                !toNumber.trim() ? 'Enter a phone number to dial' : ''}
          </p>
        </div>
      )}

      <button
        onClick={handleDial}
        disabled={!isReady || isDisabled}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${isReady && !isDisabled ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-sky-500/20' : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/8'}`}
      >
        <Phone className="w-4 h-4" />
        Initiate Call
      </button>
    </div>
  );
};
