import React, { useState } from 'react';
import { Settings, Eye, EyeOff, CheckCircle, ExternalLink, Zap } from 'lucide-react';
import { AgentConfig } from './VoiceAgentTypes';

interface VoiceAgentConfigProps {
  config: AgentConfig;
  onChange: (config: AgentConfig) => void;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secret?: boolean;
  hint?: string;
  link?: string;
}

const ConfigField: React.FC<FieldProps> = ({ label, value, onChange, placeholder, secret, hint, link }) => {
  const [show, setShow] = useState(false);
  const filled = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-1.5">
          {label}
          {filled && <CheckCircle className="w-3 h-3 text-emerald-400" />}
        </label>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
            Get key <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-sky-500/50 focus:bg-white/8 transition-all pr-9"
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  );
};

export const VoiceAgentConfig: React.FC<VoiceAgentConfigProps> = ({ config, onChange }) => {
  const update = (key: keyof AgentConfig) => (val: string) => onChange({ ...config, [key]: val });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-3 border-b border-white/8">
        <Settings className="w-4 h-4 text-sky-400" />
        <span className="text-sm font-semibold text-white/80">Agent Configuration</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Twilio</p>
        <div className="space-y-3">
          <ConfigField label="Account SID" value={config.twilioAccountSid} onChange={update('twilioAccountSid')} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" secret link="https://console.twilio.com" />
          <ConfigField label="Auth Token" value={config.twilioAuthToken} onChange={update('twilioAuthToken')} placeholder="Your auth token" secret />
          <ConfigField label="From Number" value={config.twilioFromNumber} onChange={update('twilioFromNumber')} placeholder="+17014038249" hint="Your Twilio phone number (E.164 format)" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">AI Services</p>
        <div className="space-y-3">
          <ConfigField label="Groq API Key" value={config.groqApiKey} onChange={update('groqApiKey')} placeholder="gsk_xxxxxxxxxxxxxxxx" secret link="https://console.groq.com" />
          <ConfigField label="Serper API Key" value={config.serperApiKey} onChange={update('serperApiKey')} placeholder="Your Serper key (optional, for web search)" secret link="https://serper.dev" />
        </div>
      </div>

      <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 flex items-start gap-3">
        <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-emerald-400">No backend server required</p>
          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
            Speech recognition and text-to-speech are handled natively by Twilio — no Deepgram or ElevenLabs required. Only Groq is needed for AI responses.
          </p>
        </div>
      </div>
    </div>
  );
};
