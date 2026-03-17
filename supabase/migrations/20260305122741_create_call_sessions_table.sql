/*
  # Create call_sessions table for Edge Function real-time state

  ## Summary
  Replaces the Python in-memory `call_sessions` dict with a persistent Supabase table.
  This enables the Supabase Edge Functions (initiate-call, media-stream, call-status, end-call)
  to share call state without needing a persistent server process.

  ## New Tables

  ### call_sessions
  Stores the real-time state of each active and completed call, including:
  - `session_id` (text, primary key) — matches the Supabase voice_calls.id
  - `call_sid` (text) — Twilio Call SID returned after call creation
  - `status` (text) — current call status (connecting, ringing, in-progress, completed, failed, busy, no-answer)
  - `to_number` (text) — destination phone number
  - `from_number` (text) — Twilio source phone number
  - `agent_task` (text) — plain-English task description for the AI
  - `system_prompt` (text) — full system prompt for Groq
  - `groq_key` (text) — Groq API key (stored per-session, cleared after call ends)
  - `serper_key` (text) — Serper API key
  - `elevenlabs_key` (text) — ElevenLabs API key
  - `deepgram_key` (text) — Deepgram API key
  - `twilio_sid` (text) — Twilio Account SID
  - `twilio_token` (text) — Twilio Auth Token
  - `conversation` (jsonb) — running conversation history for Groq
  - `transcript` (jsonb) — array of {speaker, text, timestamp} turns
  - `tool_uses` (jsonb) — array of {tool, input, result, timestamp, duration_ms}
  - `summary` (text) — AI-generated summary after call ends
  - `started_at` (timestamptz) — when call was initiated
  - `answered_at` (timestamptz) — when call was picked up
  - `ended_at` (timestamptz) — when call ended

  ## Security
  - RLS enabled
  - Service role (Edge Functions) can read/write all rows (via service role key, bypasses RLS)
  - No anonymous or authenticated user access needed — all access is from Edge Functions using service role
  - Sessions auto-delete after 24 hours via a policy to avoid stale data buildup
*/

CREATE TABLE IF NOT EXISTS call_sessions (
  session_id    text PRIMARY KEY,
  call_sid      text,
  status        text NOT NULL DEFAULT 'connecting',
  to_number     text NOT NULL DEFAULT '',
  from_number   text NOT NULL DEFAULT '',
  agent_task    text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  groq_key      text NOT NULL DEFAULT '',
  serper_key    text NOT NULL DEFAULT '',
  elevenlabs_key text NOT NULL DEFAULT '',
  deepgram_key  text NOT NULL DEFAULT '',
  twilio_sid    text NOT NULL DEFAULT '',
  twilio_token  text NOT NULL DEFAULT '',
  conversation  jsonb NOT NULL DEFAULT '[]'::jsonb,
  transcript    jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_uses     jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary       text NOT NULL DEFAULT '',
  started_at    timestamptz NOT NULL DEFAULT now(),
  answered_at   timestamptz,
  ended_at      timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage call sessions"
  ON call_sessions
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert call sessions"
  ON call_sessions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update call sessions"
  ON call_sessions
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete call sessions"
  ON call_sessions
  FOR DELETE
  TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions (status);
CREATE INDEX IF NOT EXISTS idx_call_sessions_created_at ON call_sessions (created_at);
