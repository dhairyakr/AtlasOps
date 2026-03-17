/*
  # Create Web Agent Tasks Table

  ## Summary
  Stores the history of web research agent runs so users can retrieve past research sessions.

  ## New Tables

  ### agent_tasks
  - `id` (uuid, primary key) — unique task identifier
  - `user_session_id` (text) — anonymous browser session ID for grouping tasks per visitor
  - `goal` (text) — the user's research goal/query
  - `steps` (jsonb) — array of agent steps with status, results, timing
  - `result` (jsonb) — structured result: summary, items, links, actions
  - `status` (text) — 'running' | 'done' | 'error'
  - `error` (text, nullable) — error message if status is 'error'
  - `created_at` (timestamptz) — when the task was created
  - `completed_at` (timestamptz, nullable) — when the task finished

  ## Security
  - RLS enabled
  - Users can only read/write tasks matching their session ID
  - No authenticated user required (anonymous sessions)

  ## Notes
  - The session ID is generated client-side (stored in localStorage)
  - This enables task persistence across page reloads without auth
*/

CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_session_id text NOT NULL,
  goal text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  result jsonb,
  status text NOT NULL DEFAULT 'running',
  error text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_session ON agent_tasks (user_session_id, created_at DESC);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (user_session_id = current_setting('request.headers', true)::json->>'x-session-id');

CREATE POLICY "Session users can select own tasks"
  ON agent_tasks FOR SELECT
  USING (user_session_id = current_setting('request.headers', true)::json->>'x-session-id');

CREATE POLICY "Session users can update own tasks"
  ON agent_tasks FOR UPDATE
  USING (user_session_id = current_setting('request.headers', true)::json->>'x-session-id')
  WITH CHECK (user_session_id = current_setting('request.headers', true)::json->>'x-session-id');

CREATE POLICY "Session users can delete own tasks"
  ON agent_tasks FOR DELETE
  USING (user_session_id = current_setting('request.headers', true)::json->>'x-session-id');
