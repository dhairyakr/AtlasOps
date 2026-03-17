import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, LogOut, Phone, History, Settings, ChevronRight } from 'lucide-react';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { AgentConfig, ActiveCallState } from './VoiceAgentTypes';
import { VoiceAgentConfig } from './VoiceAgentConfig';
import { DialerPanel } from './DialerPanel';
import { ActiveCallPanel } from './ActiveCallPanel';
import { CallHistoryPanel } from './CallHistoryPanel';
import { twilioAgentService, VoiceCall } from '../../services/twilioAgentService';

interface OutboundVoiceAgentProps {
  onBack: () => void;
}

const CONFIG_STORAGE_KEY = 'voice_agent_config';

function loadConfig(): AgentConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      delete parsed.backendUrl;
      return { twilioAccountSid: '', twilioAuthToken: '', twilioFromNumber: '', groqApiKey: '', serperApiKey: '', webSearchEnabled: true, responseStyle: 'balanced' as const, ...parsed };
    }
  } catch { }
  return {
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioFromNumber: '',
    groqApiKey: '',
    serperApiKey: '',
    webSearchEnabled: true,
    responseStyle: 'balanced' as const,
  };
}

type Tab = 'dialer' | 'active' | 'history' | 'settings';

export const OutboundVoiceAgent: React.FC<OutboundVoiceAgentProps> = ({ onBack }) => {
  const { groqKey, serperKey } = useApiSettings();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dialer');
  const [config, setConfig] = useState<AgentConfig>(() => {
    const loaded = loadConfig();
    return {
      ...loaded,
      groqApiKey: loaded.groqApiKey || groqKey,
      serperApiKey: loaded.serperApiKey || serperKey,
    };
  });

  const [callState, setCallState] = useState<ActiveCallState>({
    callId: null,
    callSid: null,
    status: 'idle',
    toNumber: '',
    agentTask: '',
    transcript: [],
    toolUses: [],
    elapsedSeconds: 0,
    error: null,
  });

  const [callHistory, setCallHistory] = useState<VoiceCall[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const saveConfig = useCallback((cfg: AgentConfig) => {
    setConfig(cfg);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(cfg));
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const history = await twilioAgentService.fetchCallHistory(30);
    setCallHistory(history);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setCallState(prev => ({ ...prev, elapsedSeconds: prev.elapsedSeconds + 1 }));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPolling = useCallback((callId: string) => {
    pollRef.current = setInterval(async () => {
      const status = await twilioAgentService.pollCallStatus(callId);
      if (!status) return;

      setCallState(prev => {
        const newTranscript = status.transcript.map((t, i) => ({
          speaker: t.speaker,
          text: t.text,
          timestamp: t.timestamp,
          isStreaming: false,
        }));

        const newToolUses = status.tool_uses.map(t => ({
          tool: t.tool,
          input: t.input,
          result: t.result,
          timestamp: t.timestamp,
        }));

        const knownStatuses: ActiveCallState['status'][] = ['idle', 'connecting', 'ringing', 'in-progress', 'ending', 'ended'];
        const newStatus: ActiveCallState['status'] = knownStatuses.includes(status.status as ActiveCallState['status'])
          ? (status.status as ActiveCallState['status'])
          : 'ended';

        return {
          ...prev,
          status: newStatus,
          transcript: newTranscript,
          toolUses: newToolUses,
        };
      });

      if (['completed', 'failed', 'busy', 'no-answer'].includes(status.status)) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        stopTimer();

        try {
          await twilioAgentService.updateCallStatus(callId, {
            status: status.status as any,
            duration_seconds: status.duration ?? 0,
            summary: status.summary ?? '',
            outcome: status.status,
            ended_at: new Date().toISOString(),
          });

          for (let i = 0; i < status.transcript.length; i++) {
            const t = status.transcript[i];
            await twilioAgentService.saveTranscriptTurn(callId, t.speaker, t.text, i);
          }

          for (let i = 0; i < status.tool_uses.length; i++) {
            const t = status.tool_uses[i];
            await twilioAgentService.saveToolUse(callId, t.tool, t.input, t.result, 0, i);
          }

          if (!status.summary) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const finalStatus = await twilioAgentService.pollCallStatus(callId);
            if (finalStatus?.summary) {
              await twilioAgentService.updateCallStatus(callId, {
                status: status.status as any,
                duration_seconds: finalStatus.duration ?? status.duration ?? 0,
                summary: finalStatus.summary,
                outcome: status.status,
                ended_at: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('Post-call save error:', err);
        } finally {
          setCallState(prev => ({ ...prev, status: 'ended' }));
          loadHistory();
        }
      }
    }, 1500);
  }, [stopTimer, loadHistory]);

  const handleDial = useCallback(async (toNumber: string, agentTask: string, systemPrompt: string, webSearchEnabled: boolean) => {
    setCallState({
      callId: null,
      callSid: null,
      status: 'connecting',
      toNumber,
      agentTask,
      transcript: [],
      toolUses: [],
      elapsedSeconds: 0,
      error: null,
    });
    setActiveTab('active');

    const callRecord = await twilioAgentService.createCallRecord({
      toNumber,
      fromNumber: config.twilioFromNumber,
      agentTask,
      systemPrompt,
    });

    if (!callRecord) {
      setCallState(prev => ({ ...prev, status: 'ended', error: 'Failed to create call record in database' }));
      return;
    }

    const result = await twilioAgentService.initiateBackendCall({
      toNumber,
      fromNumber: config.twilioFromNumber,
      agentTask,
      systemPrompt,
      groqApiKey: config.groqApiKey,
      serperApiKey: config.serperApiKey,
      twilioAccountSid: config.twilioAccountSid,
      twilioAuthToken: config.twilioAuthToken,
      webSearchEnabled,
    }, callRecord.id);

    if (!result.success) {
      setCallState(prev => ({ ...prev, status: 'ended', error: result.error ?? 'Unknown error from backend' }));
      await twilioAgentService.updateCallStatus(callRecord.id, { status: 'failed', outcome: 'error', ended_at: new Date().toISOString() });
      return;
    }

    setCallState(prev => ({
      ...prev,
      callId: callRecord.id,
      callSid: result.callSid ?? null,
      status: 'ringing',
    }));

    await twilioAgentService.updateCallStatus(callRecord.id, {
      call_sid: result.callSid,
      status: 'ringing',
    });

    startTimer();
    startPolling(callRecord.id);
  }, [config, startTimer, startPolling]);

  const handleEndCall = useCallback(async () => {
    if (callState.callSid) {
      await twilioAgentService.endBackendCall(callState.callSid);
    }
    stopTimer();
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (callState.callId) {
      await twilioAgentService.updateCallStatus(callState.callId, {
        status: 'completed',
        outcome: 'ended-by-user',
        ended_at: new Date().toISOString(),
        duration_seconds: callState.elapsedSeconds,
      });
    }
    setCallState(prev => ({ ...prev, status: 'ended' }));
    loadHistory();
  }, [callState, stopTimer, loadHistory]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dialer', label: 'Dial', icon: <Phone className="w-4 h-4" /> },
    { id: 'active', label: 'Live', icon: <span className={`w-2 h-2 rounded-full ${callState.status === 'in-progress' ? 'bg-emerald-400 animate-ping' : 'bg-white/20'}`} /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, badge: callHistory.length },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <div className="border-b border-white/8 bg-white/2 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          {user ? (
            <button onClick={signOut} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">InsightVoice</h1>
              <p className="text-xs text-white/35 mt-0.5 leading-none">Autonomous Outbound AI Agent</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all relative ${activeTab === tab.id ? 'bg-white/10 text-white font-medium' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'dialer' && (
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <DialerPanel
                config={config}
                onDial={handleDial}
                isDisabled={callState.status !== 'idle' && callState.status !== 'ended'}
              />
            </div>

            <div className="bg-white/2 border border-white/6 rounded-2xl p-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">How it works</p>
              <div className="space-y-2.5">
                {[
                  { step: '1', text: 'Configure your API keys in Settings', done: !!config.twilioAccountSid },
                  { step: '2', text: 'Enter a phone number and describe the task', done: false },
                  { step: '3', text: 'Click Initiate Call — the AI dials and talks', done: false },
                  { step: '4', text: 'Watch the live transcript as the AI converses', done: false },
                  { step: '5', text: 'Call logs saved automatically to database', done: false },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-2.5">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center ${item.done ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'border-white/15 text-white/30'}`}>
                      {item.step}
                    </div>
                    <p className={`text-xs leading-relaxed ${item.done ? 'text-white/60' : 'text-white/35'}`}>{item.text}</p>
                    {item.done && <ChevronRight className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="h-[calc(100vh-130px)]">
            <ActiveCallPanel callState={callState} onEndCall={handleEndCall} />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto">
            <CallHistoryPanel calls={callHistory} loading={historyLoading} onRefresh={loadHistory} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg mx-auto bg-white/3 border border-white/8 rounded-2xl p-5">
            <VoiceAgentConfig config={config} onChange={saveConfig} />
          </div>
        )}
      </div>

      <div className="border-t border-white/5 bg-white/1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/25">
            <span>Twilio {config.twilioFromNumber || 'not configured'}</span>
            <span>•</span>
            <span>Groq {config.groqApiKey ? 'connected' : 'not configured'}</span>
            <span>•</span>
            <span className={config.webSearchEnabled ? 'text-sky-400/50' : 'text-amber-400/50'}>
              {config.webSearchEnabled ? 'Web Search' : 'Fast Mode'}
            </span>
          </div>
          <p className="text-[10px] text-white/15">All calls are disclosed and logged</p>
        </div>
      </div>
    </div>
  );
};
