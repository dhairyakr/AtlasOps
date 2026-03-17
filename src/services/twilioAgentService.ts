import { supabase } from './supabaseClient';

export interface VoiceCall {
  id: string;
  call_sid: string | null;
  to_number: string;
  from_number: string;
  status: CallStatus;
  agent_task: string;
  system_prompt: string;
  duration_seconds: number;
  summary: string;
  outcome: string;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface CallTranscript {
  id: string;
  call_id: string;
  speaker: 'agent' | 'user';
  text: string;
  turn_number: number;
  spoken_at: string;
}

export interface CallToolUse {
  id: string;
  call_id: string;
  tool_name: string;
  tool_input: string;
  tool_result: string;
  duration_ms: number;
  turn_number: number;
  used_at: string;
}

export type CallStatus =
  | 'pending'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer';

export interface InitiateCallParams {
  toNumber: string;
  fromNumber: string;
  agentTask: string;
  systemPrompt: string;
  groqApiKey: string;
  serperApiKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  webSearchEnabled: boolean;
}

export interface BackendCallStatus {
  call_id: string;
  call_sid: string;
  status: CallStatus;
  transcript: Array<{ speaker: 'agent' | 'user'; text: string; timestamp: string }>;
  tool_uses: Array<{ tool: string; input: string; result: string; timestamp: string }>;
  summary?: string;
  duration?: number;
}

function edgeFunctionUrl(slug: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/functions/v1/${slug}`;
}

function edgeFunctionHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
    ...extra,
  };
}

export const twilioAgentService = {
  async createCallRecord(params: {
    toNumber: string;
    fromNumber: string;
    agentTask: string;
    systemPrompt: string;
  }): Promise<VoiceCall | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('voice_calls')
      .insert({
        to_number: params.toNumber,
        from_number: params.fromNumber,
        agent_task: params.agentTask,
        system_prompt: params.systemPrompt,
        status: 'pending',
        user_id: user?.id ?? null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to create call record:', error);
      return null;
    }
    return data;
  },

  async updateCallStatus(callId: string, updates: Partial<VoiceCall>): Promise<void> {
    const { error } = await supabase
      .from('voice_calls')
      .update(updates)
      .eq('id', callId);

    if (error) console.error('Failed to update call:', error);
  },

  async saveTranscriptTurn(callId: string, speaker: 'agent' | 'user', text: string, turnNumber: number): Promise<void> {
    const { error } = await supabase
      .from('voice_call_transcripts')
      .upsert(
        {
          call_id: callId,
          speaker,
          text,
          turn_number: turnNumber,
          spoken_at: new Date().toISOString(),
        },
        { onConflict: 'call_id,turn_number', ignoreDuplicates: true }
      );

    if (error) console.error('Failed to save transcript turn:', error);
  },

  async saveToolUse(callId: string, toolName: string, toolInput: string, toolResult: string, durationMs: number, turnNumber: number): Promise<void> {
    const { error } = await supabase
      .from('voice_call_tool_uses')
      .insert({
        call_id: callId,
        tool_name: toolName,
        tool_input: toolInput,
        tool_result: toolResult,
        duration_ms: durationMs,
        turn_number: turnNumber,
        used_at: new Date().toISOString(),
      });

    if (error) console.error('Failed to save tool use:', error);
  },

  async fetchCallHistory(limit = 20): Promise<VoiceCall[]> {
    const { data, error } = await supabase
      .from('voice_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch call history:', error);
      return [];
    }
    return data || [];
  },

  async fetchCallTranscripts(callId: string): Promise<CallTranscript[]> {
    const { data, error } = await supabase
      .from('voice_call_transcripts')
      .select('*')
      .eq('call_id', callId)
      .order('turn_number', { ascending: true });

    if (error) return [];
    return data || [];
  },

  async fetchCallToolUses(callId: string): Promise<CallToolUse[]> {
    const { data, error } = await supabase
      .from('voice_call_tool_uses')
      .select('*')
      .eq('call_id', callId)
      .order('used_at', { ascending: true });

    if (error) return [];
    return data || [];
  },

  async initiateBackendCall(params: InitiateCallParams, callId: string): Promise<{ success: boolean; callSid?: string; error?: string }> {
    try {
      const response = await fetch(edgeFunctionUrl('initiate-call'), {
        method: 'POST',
        headers: edgeFunctionHeaders(),
        body: JSON.stringify({
          to_number: params.toNumber,
          from_number: params.fromNumber,
          agent_task: params.agentTask,
          system_prompt: params.systemPrompt,
          call_id: callId,
          groq_api_key: params.groqApiKey,
          serper_api_key: params.serperApiKey,
          twilio_account_sid: params.twilioAccountSid,
          twilio_auth_token: params.twilioAuthToken,
          web_search_enabled: params.webSearchEnabled,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || errData.detail || `Server error: ${response.status}` };
      }

      const data = await response.json();
      return { success: true, callSid: data.call_sid };
    } catch (err) {
      return { success: false, error: `Failed to reach Edge Function: ${String(err)}` };
    }
  },

  async endBackendCall(callSid: string): Promise<void> {
    try {
      await fetch(edgeFunctionUrl('end-call'), {
        method: 'POST',
        headers: edgeFunctionHeaders(),
        body: JSON.stringify({ call_sid: callSid }),
      });
    } catch {
      console.error('Failed to end call via Edge Function');
    }
  },

  async pollCallStatus(callId: string): Promise<BackendCallStatus | null> {
    try {
      const response = await fetch(edgeFunctionUrl(`call-status/${callId}`), {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  },

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  getStatusColor(status: CallStatus): string {
    switch (status) {
      case 'in-progress': return 'text-emerald-400';
      case 'completed': return 'text-sky-400';
      case 'ringing': return 'text-amber-400';
      case 'pending': return 'text-white/50';
      case 'failed': return 'text-red-400';
      case 'busy': return 'text-orange-400';
      case 'no-answer': return 'text-white/40';
      default: return 'text-white/50';
    }
  },

  getStatusLabel(status: CallStatus): string {
    switch (status) {
      case 'in-progress': return 'Live';
      case 'completed': return 'Completed';
      case 'ringing': return 'Ringing';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'busy': return 'Busy';
      case 'no-answer': return 'No Answer';
      default: return status;
    }
  },
};
