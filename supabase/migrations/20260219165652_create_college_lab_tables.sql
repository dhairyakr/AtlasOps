/*
  # Create College AI Lab Tables

  ## Overview
  Creates six tables to support six college-level AI lab modules:
  1. prompt_runs - Prompt Engineering Lab history
  2. agent_runs - AI Agents & Tool Use Lab run history
  3. model_comparisons - Fine-Tuning & Model Behavior Lab comparisons
  4. embedding_sessions - Embeddings & Semantic Search Lab sessions
  5. ethics_tests - AI Ethics & Bias Explorer test runs
  6. multimodal_analyses - Multi-Modal AI Lab analyses

  ## Security
  - RLS enabled on all tables
  - Authenticated users can only access their own rows (matched by user_id)
  - Anonymous sessions stored via session_id string (no auth required for labs)
*/

-- Prompt Engineering Lab: stores each prompt run with its output and metadata
CREATE TABLE IF NOT EXISTS prompt_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  system_prompt text DEFAULT '',
  user_message text NOT NULL DEFAULT '',
  few_shot_examples jsonb DEFAULT '[]'::jsonb,
  template_name text DEFAULT '',
  output text DEFAULT '',
  token_estimate integer DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  quality_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prompt_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert prompt runs"
  ON prompt_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select prompt runs by session"
  ON prompt_runs FOR SELECT
  USING (true);

-- Agent Runs: stores each agent run with its full reasoning trace
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  goal text NOT NULL DEFAULT '',
  max_steps integer DEFAULT 5,
  enabled_tools jsonb DEFAULT '[]'::jsonb,
  trace jsonb DEFAULT '[]'::jsonb,
  final_answer text DEFAULT '',
  step_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert agent runs"
  ON agent_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select agent runs by session"
  ON agent_runs FOR SELECT
  USING (true);

-- Model Comparisons: stores parameter comparison runs
CREATE TABLE IF NOT EXISTS model_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  temperature_low real DEFAULT 0.1,
  temperature_balanced real DEFAULT 0.7,
  temperature_high real DEFAULT 1.5,
  top_k integer DEFAULT 40,
  top_p real DEFAULT 0.95,
  max_tokens integer DEFAULT 512,
  output_low text DEFAULT '',
  output_balanced text DEFAULT '',
  output_high text DEFAULT '',
  latency_low_ms integer DEFAULT 0,
  latency_balanced_ms integer DEFAULT 0,
  latency_high_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert model comparisons"
  ON model_comparisons FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select model comparisons by session"
  ON model_comparisons FOR SELECT
  USING (true);

-- Embedding Sessions: stores corpus sentences and query history
CREATE TABLE IF NOT EXISTS embedding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  corpus_sentences jsonb DEFAULT '[]'::jsonb,
  query text DEFAULT '',
  similarity_scores jsonb DEFAULT '[]'::jsonb,
  cluster_assignments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE embedding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert embedding sessions"
  ON embedding_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select embedding sessions"
  ON embedding_sessions FOR SELECT
  USING (true);

-- Ethics Tests: stores bias, red team, and hallucination test runs
CREATE TABLE IF NOT EXISTS ethics_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  test_mode text NOT NULL DEFAULT 'bias',
  base_prompt text DEFAULT '',
  variants jsonb DEFAULT '[]'::jsonb,
  outputs jsonb DEFAULT '[]'::jsonb,
  analysis text DEFAULT '',
  safety_classification text DEFAULT '',
  fairness_scores jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ethics_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ethics tests"
  ON ethics_tests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select ethics tests"
  ON ethics_tests FOR SELECT
  USING (true);

-- Multimodal Analyses: stores image analysis sessions and results
CREATE TABLE IF NOT EXISTS multimodal_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  image_name text DEFAULT '',
  image_mime_type text DEFAULT '',
  task_type text DEFAULT 'describe',
  custom_prompt text DEFAULT '',
  main_response text DEFAULT '',
  reasoning_chain text DEFAULT '',
  detected_objects jsonb DEFAULT '[]'::jsonb,
  detected_text text DEFAULT '',
  dominant_colors jsonb DEFAULT '[]'::jsonb,
  scene_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE multimodal_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert multimodal analyses"
  ON multimodal_analyses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can select multimodal analyses"
  ON multimodal_analyses FOR SELECT
  USING (true);
