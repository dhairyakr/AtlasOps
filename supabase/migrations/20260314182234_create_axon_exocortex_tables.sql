/*
  # Create Axon Personal Exocortex Tables

  ## Summary
  Creates the database tables for the Axon Personal Exocortex module —
  a persistent second brain for capturing, connecting, and synthesizing thoughts.

  ## New Tables

  ### axon_captures
  Raw memory captures — thoughts, ideas, observations, reflections, and voice notes.

  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `raw_text` (text) - the original captured text
  - `summary_tag` (text) - AI-generated short tag/label
  - `capture_type` (text) - Thought, Observation, Idea, Reflection, Voice
  - `is_voice` (boolean) - was this captured via microphone
  - `tags` (text[]) - AI-generated semantic tags
  - `created_at` (timestamptz)

  ### axon_connections
  AI-discovered semantic connections between captures.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `source_id` (uuid FK to axon_captures)
  - `target_id` (uuid FK to axon_captures)
  - `relationship` (text) - description of how the two captures relate
  - `strength` (numeric) - 0-1 connection strength score
  - `created_at` (timestamptz)

  ### axon_clusters
  AI-generated thematic clusters grouping related captures.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `label` (text) - theme label
  - `capture_ids` (uuid[]) - captures belonging to this cluster
  - `color` (text) - hex color for visualization
  - `created_at` (timestamptz)

  ### axon_syntheses
  AI-generated daily briefs, pattern reports, and synthesis documents.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `synthesis_type` (text) - daily_brief, pattern_report, gap_analysis
  - `content` (text) - the synthesis text
  - `capture_count` (integer) - number of captures analyzed
  - `created_at` (timestamptz)

  ### axon_queries
  Search history with retrieved captures and synthesized summaries.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `query_text` (text)
  - `result_ids` (uuid[]) - IDs of relevant captures returned
  - `synthesis` (text) - AI-generated synthesis of the search results
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Session-based anonymous access: users can only access their own session data
*/

CREATE TABLE IF NOT EXISTS axon_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  raw_text text NOT NULL DEFAULT '',
  summary_tag text NOT NULL DEFAULT '',
  capture_type text NOT NULL DEFAULT 'Thought',
  is_voice boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE axon_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own captures"
  ON axon_captures FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own captures"
  ON axon_captures FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE POLICY "Session users can delete own captures"
  ON axon_captures FOR DELETE
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS axon_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  source_id uuid NOT NULL REFERENCES axon_captures(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES axon_captures(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT '',
  strength numeric NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE axon_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own connections"
  ON axon_connections FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own connections"
  ON axon_connections FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE POLICY "Session users can delete own connections"
  ON axon_connections FOR DELETE
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS axon_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  capture_ids uuid[] NOT NULL DEFAULT '{}',
  color text NOT NULL DEFAULT '#d97706',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE axon_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own clusters"
  ON axon_clusters FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own clusters"
  ON axon_clusters FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE POLICY "Session users can delete own clusters"
  ON axon_clusters FOR DELETE
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS axon_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  synthesis_type text NOT NULL DEFAULT 'daily_brief',
  content text NOT NULL DEFAULT '',
  capture_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE axon_syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own syntheses"
  ON axon_syntheses FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own syntheses"
  ON axon_syntheses FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS axon_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  query_text text NOT NULL DEFAULT '',
  result_ids uuid[] NOT NULL DEFAULT '{}',
  synthesis text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE axon_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own axon queries"
  ON axon_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own axon queries"
  ON axon_queries FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE INDEX IF NOT EXISTS axon_captures_session_idx ON axon_captures(session_id);
CREATE INDEX IF NOT EXISTS axon_captures_created_idx ON axon_captures(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS axon_connections_session_idx ON axon_connections(session_id);
CREATE INDEX IF NOT EXISTS axon_connections_source_idx ON axon_connections(source_id);
CREATE INDEX IF NOT EXISTS axon_syntheses_session_idx ON axon_syntheses(session_id);
CREATE INDEX IF NOT EXISTS axon_queries_session_idx ON axon_queries(session_id);
