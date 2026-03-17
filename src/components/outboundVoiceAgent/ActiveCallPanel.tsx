import React from 'react';
import { Phone, PhoneOff, Loader, Radio, Volume2, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { ActiveCallState } from './VoiceAgentTypes';
import { LiveTranscriptPanel } from './LiveTranscriptPanel';
import { twilioAgentService } from '../../services/twilioAgentService';

interface ActiveCallPanelProps {
  callState: ActiveCallState;
  onEndCall: () => void;
}

const CallStatusBadge: React.FC<{ status: ActiveCallState['status'] }> = ({ status }) => {
  const configs: Record<ActiveCallState['status'], { label: string; color: string; pulse: boolean }> = {
    idle: { label: 'Idle', color: 'bg-white/10 text-white/40', pulse: false },
    connecting: { label: 'Connecting', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', pulse: true },
    ringing: { label: 'Ringing', color: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', pulse: true },
    'in-progress': { label: 'Live', color: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', pulse: true },
    ending: { label: 'Ending', color: 'bg-white/10 text-white/50', pulse: false },
    ended: { label: 'Ended', color: 'bg-sky-500/15 text-sky-300 border border-sky-500/25', pulse: false },
  };

  const cfg = configs[status] ?? configs['idle'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      {cfg.label}
    </span>
  );
};

const WaveformVisualizer: React.FC<{ active: boolean }> = ({ active }) => {
  const bars = [3, 6, 8, 5, 9, 4, 7, 6, 3, 8, 5, 7];
  return (
    <div className="flex items-center justify-center gap-0.5 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${active ? 'bg-emerald-400' : 'bg-white/15'}`}
          style={{
            height: active ? `${h * 2 + 8}px` : '4px',
            animationDelay: `${i * 0.08}s`,
            animation: active ? `pulse ${0.5 + (i % 3) * 0.15}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
    </div>
  );
};

const CallEndedSummary: React.FC<{ callState: ActiveCallState }> = ({ callState }) => (
  <div className="flex flex-col gap-4">
    <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
        <CheckCircle className="w-6 h-6 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white/90">Call Completed</p>
        <p className="text-xs text-white/40 mt-0.5">{callState.toNumber}</p>
      </div>
      <div className="w-full grid grid-cols-2 gap-3 mt-1">
        <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 flex flex-col items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sm font-mono font-semibold text-white/80">
            {twilioAgentService.formatDuration(callState.elapsedSeconds)}
          </span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Duration</span>
        </div>
        <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 flex flex-col items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sm font-semibold text-white/80">{callState.transcript.length}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-wider">Turns</span>
        </div>
      </div>
      {callState.agentTask && (
        <p className="text-xs text-white/35 italic">"{callState.agentTask}"</p>
      )}
    </div>

    {callState.transcript.length > 0 && (
      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
          <Radio className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs font-semibold text-white/40">Transcript</span>
          <span className="ml-auto text-xs text-white/25">{callState.transcript.length} turns</span>
        </div>
        <div className="overflow-y-auto max-h-72 p-4 cyber-scrollbar">
          <LiveTranscriptPanel
            transcript={callState.transcript}
            toolUses={callState.toolUses}
            isLive={false}
          />
        </div>
      </div>
    )}
  </div>
);

export const ActiveCallPanel: React.FC<ActiveCallPanelProps> = ({ callState, onEndCall }) => {
  const isActive = callState.status === 'in-progress';
  const isConnecting = callState.status === 'connecting' || callState.status === 'ringing';
  const isEnded = callState.status === 'ended';
  const canEnd = isActive || isConnecting;

  if (isEnded) {
    return <CallEndedSummary callState={callState} />;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-500/20 border border-emerald-500/30' : isConnecting ? 'bg-amber-500/20 border border-amber-500/30 animate-pulse' : 'bg-white/8 border border-white/10'}`}>
              {isConnecting ? <Loader className="w-5 h-5 text-amber-400 animate-spin" /> : isActive ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <Phone className="w-5 h-5 text-white/40" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">{callState.toNumber || 'No number'}</p>
              <p className="text-xs text-white/40 truncate max-w-48">{callState.agentTask || 'No task specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CallStatusBadge status={callState.status} />
            {isActive && (
              <span className="text-sm font-mono text-white/50">
                {twilioAgentService.formatDuration(callState.elapsedSeconds)}
              </span>
            )}
          </div>
        </div>

        {(isActive || isConnecting) && (
          <div className="mt-4">
            <WaveformVisualizer active={isActive} />
          </div>
        )}

        {callState.error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
            <p className="text-xs text-red-400">{callState.error}</p>
          </div>
        )}

        {canEnd && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onEndCall}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-4 h-4" />
              End Call
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white/3 border border-white/8 rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6">
          <Radio className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-xs font-semibold text-white/60">Live Transcript</span>
          {callState.transcript.length > 0 && (
            <span className="ml-auto text-xs text-white/25">{callState.transcript.length} turns</span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 cyber-scrollbar">
          <LiveTranscriptPanel
            transcript={callState.transcript}
            toolUses={callState.toolUses}
            isLive={isActive}
          />
        </div>
      </div>
    </div>
  );
};
