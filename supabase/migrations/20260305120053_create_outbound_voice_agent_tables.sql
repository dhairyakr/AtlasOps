/*
  # Outbound Voice Agent Tables

  ## Overview
  Creates the database schema for the autonomous AI voice agent module.
  Tracks all outbound calls, real-time conversation transcripts, and tool usage logs.

  ## New Tables

  ### 1. `voice_calls`
  Stores metadata and outcomes for every outbound call.
  - `id` (uuid) - Primary key
  - `call_sid` (text) - Twilio call SID for cross-referencing
  - `to_number` (text) - The phone number that was dialed
  - `from_number` (text) - The Twilio caller ID used
  - `status` (text) - Call status: pending, ringing, in-progress, completed, failed, busy, no-answer
  - `agent_task` (text) - The task/goal the agent was given for the call
  - `system_prompt` (text) - The system prompt used for this call
  - `duration_seconds` (integer) - Total call duration in seconds
  - `summary` (text) - AI-generated summary after the call ends
  - `outcome` (text) - resolved, unresolved, voicemail, no-answer, busy, error
  - `started_at` (timestamptz) - When the call was initiated
  - `answered_at` (timestamptz) - When the person picked up
  - `ended_at` (timestamptz) - When the call ended
  - `created_at` (timestamptz) - Record creation timestamp
  - `user_id` (uuid) - Supabase auth user who initiated the call

  ### 2. `voice_call_transcripts`
  Stores each turn of conversation in a call (both AI and human speech).
  - `id` (uuid) - Primary key
  - `call_id` (uuid) - Foreign key to voice_calls
  - `speaker` (text) - 'agent' or 'user'
  - `text` (text) - The spoken text for this turn
  - `turn_number` (integer) - Order of the turn in the conversation
  - `spoken_at` (timestamptz) - When this turn occurred
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `voice_call_tool_uses`
  Logs every tool the agent invoked during a call (web search, browser actions).
  - `id` (uuid) - Primary key
  - `call_id` (uuid) - Foreign key to voice_calls
  - `tool_name` (text) - Name of the tool: 'serper_search', 'browser_action'
  - `tool_input` (text) - The query or task sent to the tool
  - `tool_result` (text) - The result returned by the tool
  - `duration_ms` (integer) - How long the tool call took in milliseconds
  - `turn_number` (integer) - Which conversation turn triggered this tool use
  - `used_at` (timestamptz) - When the tool was invoked
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - RLS enabled on all three tables
  - Users can only access calls they initiated (via user_id)
  - Transcripts and tool uses are accessible via call ownership
  - Anonymous users have no access

  ## Notes
  - call_sid is nullable initially (set after Twilio confirms the call)
  - status transitions: pending → ringing → in-progress → completed/failed/busy/no-answer
*/

CREATE TABLE IF NOT EXISTS voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text,
  to_number text NOT NULL,
  from_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  agent_task text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  duration_seconds integer DEFAULT 0,
  summary text DEFAULT '',
  outcome text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  answered_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS voice_call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
  speaker text NOT NULL DEFAULT 'agent',
  text text NOT NULL DEFAULT '',
  turn_number integer NOT NULL DEFAULT 0,
  spoken_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_call_tool_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES voice_calls(id) ON DELETE CASCADE,
  tool_name text NOT NULL DEFAULT '',
  tool_input text NOT NULL DEFAULT '',
  tool_result text DEFAULT '',
  duration_ms integer DEFAULT 0,
  turn_number integer DEFAULT 0,
  used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_call_tool_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calls"
  ON voice_calls FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls"
  ON voice_calls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calls"
  ON voice_calls FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calls"
  ON voice_calls FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view transcripts of own calls"
  ON voice_call_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transcripts for own calls"
  ON voice_call_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view tool uses of own calls"
  ON voice_call_tool_uses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tool uses for own calls"
  ON voice_call_tool_uses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
      AND voice_calls.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_voice_calls_user_id ON voice_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_calls_status ON voice_calls(status);
CREATE INDEX IF NOT EXISTS idx_voice_calls_created_at ON voice_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_call_transcripts_call_id ON voice_call_transcripts(call_id);
CREATE INDEX IF NOT EXISTS idx_voice_call_transcripts_turn ON voice_call_transcripts(call_id, turn_number);
CREATE INDEX IF NOT EXISTS idx_voice_call_tool_uses_call_id ON voice_call_tool_uses(call_id);
