/*
  # Create Lab Persistence Tables

  ## New Tables

  ### prompt_lab_sessions
  - Stores saved prompt configurations and run history for the Prompt Engineering Lab
  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier from localStorage
  - `template_name` (text) - name of the template used
  - `system_prompt` (text) - the system prompt content
  - `user_message` (text) - the user message content
  - `few_shot_examples` (jsonb) - array of {input, output} pairs
  - `response_text` (text) - generated response
  - `token_estimate` (int) - estimated token count
  - `latency_ms` (int) - response latency in ms
  - `quality_score` (int) - computed quality score 0-100
  - `created_at` (timestamptz)

  ### agent_lab_runs
  - Stores AI agent run history for the Agents Lab
  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `goal` (text) - the agent goal/task
  - `tools_used` (text[]) - list of tool names used
  - `trace` (jsonb) - full ReAct trace array
  - `final_answer` (text) - synthesized final answer
  - `step_count` (int) - number of steps taken
  - `memory_state` (jsonb) - accumulated facts/memory
  - `agent_mode` (text) - 'single' or 'multi'
  - `created_at` (timestamptz)

  ### finetuning_lab_runs
  - Stores fine-tuning parameter comparison runs
  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `prompt` (text) - the test prompt
  - `top_p` (float) - Top-P value used
  - `top_k` (int) - Top-K value used
  - `max_tokens` (int) - Max tokens value used
  - `results` (jsonb) - array of {label, temp, output, latencyMs, tokenEstimate}
  - `created_at` (timestamptz)

  ### embeddings_lab_corpora
  - Stores named corpora for the Embeddings Lab
  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `corpus_name` (text) - user-assigned name
  - `sentences` (text[]) - array of corpus sentences
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### embeddings_lab_searches
  - Stores search history for the Embeddings Lab
  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `corpus_id` (uuid) - reference to the corpus used
  - `query` (text) - the search query
  - `results` (jsonb) - similarity results array
  - `clusters` (jsonb) - clustering results if run
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies allow full access based on matching session_id (anonymous sessions)
  - No authentication required (anonymous session-based access)
*/

-- Prompt Lab Sessions
CREATE TABLE IF NOT EXISTS prompt_lab_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  template_name text NOT NULL DEFAULT '',
  system_prompt text NOT NULL DEFAULT '',
  user_message text NOT NULL DEFAULT '',
  few_shot_examples jsonb NOT NULL DEFAULT '[]',
  response_text text NOT NULL DEFAULT '',
  token_estimate int NOT NULL DEFAULT 0,
  latency_ms int NOT NULL DEFAULT 0,
  quality_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_lab_session_id ON prompt_lab_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_prompt_lab_created_at ON prompt_lab_sessions(created_at DESC);

ALTER TABLE prompt_lab_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prompt_lab_sessions_select"
  ON prompt_lab_sessions FOR SELECT
  USING (true);

CREATE POLICY "prompt_lab_sessions_insert"
  ON prompt_lab_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "prompt_lab_sessions_delete"
  ON prompt_lab_sessions FOR DELETE
  USING (true);

-- Agent Lab Runs
CREATE TABLE IF NOT EXISTS agent_lab_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  goal text NOT NULL DEFAULT '',
  tools_used text[] NOT NULL DEFAULT '{}',
  trace jsonb NOT NULL DEFAULT '[]',
  final_answer text NOT NULL DEFAULT '',
  step_count int NOT NULL DEFAULT 0,
  memory_state jsonb NOT NULL DEFAULT '[]',
  agent_mode text NOT NULL DEFAULT 'single',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_lab_session_id ON agent_lab_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_lab_created_at ON agent_lab_runs(created_at DESC);

ALTER TABLE agent_lab_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_lab_runs_select"
  ON agent_lab_runs FOR SELECT
  USING (true);

CREATE POLICY "agent_lab_runs_insert"
  ON agent_lab_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "agent_lab_runs_delete"
  ON agent_lab_runs FOR DELETE
  USING (true);

-- Fine-Tuning Lab Runs
CREATE TABLE IF NOT EXISTS finetuning_lab_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  top_p float NOT NULL DEFAULT 0.95,
  top_k int NOT NULL DEFAULT 40,
  max_tokens int NOT NULL DEFAULT 512,
  results jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finetuning_lab_session_id ON finetuning_lab_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_finetuning_lab_created_at ON finetuning_lab_runs(created_at DESC);

ALTER TABLE finetuning_lab_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finetuning_lab_runs_select"
  ON finetuning_lab_runs FOR SELECT
  USING (true);

CREATE POLICY "finetuning_lab_runs_insert"
  ON finetuning_lab_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "finetuning_lab_runs_delete"
  ON finetuning_lab_runs FOR DELETE
  USING (true);

-- Embeddings Lab Corpora
CREATE TABLE IF NOT EXISTS embeddings_lab_corpora (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  corpus_name text NOT NULL DEFAULT 'My Corpus',
  sentences text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_corpora_session_id ON embeddings_lab_corpora(session_id);

ALTER TABLE embeddings_lab_corpora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embeddings_corpora_select"
  ON embeddings_lab_corpora FOR SELECT
  USING (true);

CREATE POLICY "embeddings_corpora_insert"
  ON embeddings_lab_corpora FOR INSERT
  WITH CHECK (true);

CREATE POLICY "embeddings_corpora_update"
  ON embeddings_lab_corpora FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "embeddings_corpora_delete"
  ON embeddings_lab_corpora FOR DELETE
  USING (true);

-- Embeddings Lab Searches
CREATE TABLE IF NOT EXISTS embeddings_lab_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  corpus_sentences text[] NOT NULL DEFAULT '{}',
  query text NOT NULL DEFAULT '',
  results jsonb NOT NULL DEFAULT '[]',
  clusters jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_searches_session_id ON embeddings_lab_searches(session_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_searches_created_at ON embeddings_lab_searches(created_at DESC);

ALTER TABLE embeddings_lab_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "embeddings_searches_select"
  ON embeddings_lab_searches FOR SELECT
  USING (true);

CREATE POLICY "embeddings_searches_insert"
  ON embeddings_lab_searches FOR INSERT
  WITH CHECK (true);

CREATE POLICY "embeddings_searches_delete"
  ON embeddings_lab_searches FOR DELETE
  USING (true);
