/*
  # Create Atlas World Intelligence Tables

  ## Summary
  Creates the database tables for the Atlas World Intelligence Dashboard module.

  ## New Tables

  ### atlas_queries
  Stores each intelligence query made by users including the question, generated brief,
  target regions, and session information.

  - `id` (uuid, primary key)
  - `session_id` (text) - anonymous session identifier
  - `question` (text) - the natural language intelligence question
  - `brief` (text) - the AI-generated intelligence brief
  - `regions` (text[]) - array of geographic regions referenced
  - `mode` (text) - 'live' for Serper-backed, 'reasoned' for LLM-only
  - `created_at` (timestamptz)

  ### atlas_watchlist
  Saved queries that users want to monitor over time.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `question` (text)
  - `regions` (text[])
  - `last_brief` (text) - cached last result
  - `created_at` (timestamptz)

  ### atlas_signals
  Individual signal data points keyed by region and category.

  - `id` (uuid, primary key)
  - `session_id` (text)
  - `region` (text)
  - `category` (text) - Geopolitical, Economic, Environmental, etc.
  - `summary` (text)
  - `severity` (text) - low, medium, high, critical
  - `trend` (text) - up, down, stable
  - `source_query_id` (uuid, nullable FK to atlas_queries)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Session-based anonymous access: users can only access their own session data
*/

CREATE TABLE IF NOT EXISTS atlas_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  question text NOT NULL DEFAULT '',
  brief text NOT NULL DEFAULT '',
  regions text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'reasoned',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own atlas queries"
  ON atlas_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own atlas queries"
  ON atlas_queries FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS atlas_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  question text NOT NULL DEFAULT '',
  regions text[] NOT NULL DEFAULT '{}',
  last_brief text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own watchlist entries"
  ON atlas_watchlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own watchlist entries"
  ON atlas_watchlist FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE POLICY "Session users can delete own watchlist entries"
  ON atlas_watchlist FOR DELETE
  TO anon, authenticated
  USING (session_id != '');

CREATE TABLE IF NOT EXISTS atlas_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'low',
  trend text NOT NULL DEFAULT 'stable',
  source_query_id uuid REFERENCES atlas_queries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE atlas_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can insert own signals"
  ON atlas_signals FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id != '');

CREATE POLICY "Session users can select own signals"
  ON atlas_signals FOR SELECT
  TO anon, authenticated
  USING (session_id != '');

CREATE INDEX IF NOT EXISTS atlas_queries_session_idx ON atlas_queries(session_id);
CREATE INDEX IF NOT EXISTS atlas_watchlist_session_idx ON atlas_watchlist(session_id);
CREATE INDEX IF NOT EXISTS atlas_signals_session_idx ON atlas_signals(session_id);
CREATE INDEX IF NOT EXISTS atlas_signals_region_idx ON atlas_signals(region);
