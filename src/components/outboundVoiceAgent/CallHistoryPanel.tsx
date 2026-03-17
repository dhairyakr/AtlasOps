import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Clock, CheckCircle, XCircle, PhoneMissed, PhoneOff, Loader, Bot, User, Wrench } from 'lucide-react';
import { VoiceCall, CallTranscript, CallToolUse, twilioAgentService } from '../../services/twilioAgentService';

interface CallHistoryPanelProps {
  calls: VoiceCall[];
  loading: boolean;
  onRefresh: () => void;
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'completed': return <CheckCircle className="w-4 h-4 text-sky-400" />;
    case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
    case 'no-answer': return <PhoneMissed className="w-4 h-4 text-white/40" />;
    case 'busy': return <PhoneOff className="w-4 h-4 text-orange-400" />;
    case 'in-progress': return <Phone className="w-4 h-4 text-emerald-400 animate-pulse" />;
    default: return <Clock className="w-4 h-4 text-white/30" />;
  }
};

const CallDetailDrawer: React.FC<{ callId: string }> = ({ callId }) => {
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [toolUses, setToolUses] = useState<CallToolUse[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'tools'>('transcript');

  React.useEffect(() => {
    if (loaded) return;
    setLoading(true);
    Promise.all([
      twilioAgentService.fetchCallTranscripts(callId),
      twilioAgentService.fetchCallToolUses(callId),
    ]).then(([t, u]) => {
      setTranscripts(t);
      setToolUses(u);
      setLoaded(true);
      setLoading(false);
    });
  }, [callId, loaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader className="w-4 h-4 text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'transcript' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-white/40 hover:text-white/60'}`}
        >
          Transcript ({transcripts.length} turns)
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'tools' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-white/40 hover:text-white/60'}`}
        >
          Tools ({toolUses.length} calls)
        </button>
      </div>

      {activeTab === 'transcript' && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 cyber-scrollbar">
          {transcripts.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-4">No transcript recorded</p>
          ) : transcripts.map(t => (
            <div key={t.id} className={`flex gap-2 text-xs ${t.speaker === 'agent' ? '' : 'flex-row-reverse'}`}>
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${t.speaker === 'agent' ? 'bg-sky-500/20' : 'bg-emerald-500/20'}`}>
                {t.speaker === 'agent' ? <Bot className="w-3 h-3 text-sky-400" /> : <User className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className={`max-w-[75%] rounded-xl px-2.5 py-1.5 ${t.speaker === 'agent' ? 'bg-sky-500/8 text-white/70' : 'bg-emerald-500/8 text-white/70'}`}>
                {t.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 cyber-scrollbar">
          {toolUses.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-4">No tools were used</p>
          ) : toolUses.map(t => (
            <div key={t.id} className="bg-amber-500/8 border border-amber-500/15 rounded-xl px-3 py-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <Wrench className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-semibold text-amber-400">{t.tool_name}</span>
                {t.duration_ms > 0 && <span className="text-[10px] text-white/25">{t.duration_ms}ms</span>}
              </div>
              <p className="text-xs text-white/50 line-clamp-1"><span className="text-white/30">Query: </span>{t.tool_input}</p>
              <p className="text-xs text-white/50 line-clamp-2"><span className="text-white/30">Result: </span>{t.tool_result}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CallHistoryPanel: React.FC<CallHistoryPanelProps> = ({ calls, loading, onRefresh }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-5 h-5 text-white/30 animate-spin" />
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-white/25">
        <Phone className="w-8 h-8" />
        <p className="text-sm">No calls yet — start your first outbound call above</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/40">{calls.length} call{calls.length !== 1 ? 's' : ''}</span>
        <button onClick={onRefresh} className="text-xs text-sky-400 hover:text-sky-300 transition-colors">Refresh</button>
      </div>

      {calls.map(call => {
        const isExpanded = expanded === call.id;
        return (
          <div key={call.id} className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <button
              onClick={() => setExpanded(isExpanded ? null : call.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors text-left"
            >
              <StatusIcon status={call.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white/80 truncate">{call.to_number}</span>
                  <span className={`text-xs font-semibold ${twilioAgentService.getStatusColor(call.status as any)}`}>
                    {twilioAgentService.getStatusLabel(call.status as any)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-white/35 truncate">{call.agent_task || 'No task specified'}</span>
                  {call.duration_seconds > 0 && (
                    <span className="text-xs text-white/25 flex-shrink-0">
                      {twilioAgentService.formatDuration(call.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] text-white/25">
                  {new Date(call.created_at).toLocaleDateString()}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-white/5">
                {call.summary && (
                  <div className="mt-3 bg-sky-500/8 border border-sky-500/15 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-semibold text-sky-400 mb-1">AI Summary</p>
                    <p className="text-xs text-white/60 leading-relaxed">{call.summary}</p>
                  </div>
                )}
                <CallDetailDrawer callId={call.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
