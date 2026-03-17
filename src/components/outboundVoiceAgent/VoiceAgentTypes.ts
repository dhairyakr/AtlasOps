export type ResponseStyle = 'concise' | 'balanced' | 'detailed';

export interface AgentConfig {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
  groqApiKey: string;
  serperApiKey: string;
  webSearchEnabled: boolean;
  responseStyle: ResponseStyle;
}

export interface LiveTranscriptTurn {
  speaker: 'agent' | 'user';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface LiveToolUse {
  tool: string;
  input: string;
  result: string;
  timestamp: string;
  durationMs?: number;
}

export interface ActiveCallState {
  callId: string | null;
  callSid: string | null;
  status: 'idle' | 'connecting' | 'ringing' | 'in-progress' | 'ending' | 'ended';
  toNumber: string;
  agentTask: string;
  transcript: LiveTranscriptTurn[];
  toolUses: LiveToolUse[];
  elapsedSeconds: number;
  error: string | null;
}
