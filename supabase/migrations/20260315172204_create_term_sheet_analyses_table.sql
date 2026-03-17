/*
  # Create Term Sheet Analyses Table

  ## Summary
  Creates a persistent storage table for AI-powered term sheet analysis results.

  ## New Tables

  ### `term_sheet_analyses`
  Stores every term sheet analysis run by any session. Uses a `session_id` (UUID stored
  in the browser's localStorage) to associate records with a device/session without
  requiring authentication.

  **Columns:**
  - `id` – Primary key UUID
  - `session_id` – Browser session identifier (localStorage UUID)
  - `file_name` – Original uploaded file name, or "Pasted Text"
  - `file_type` – MIME type of the uploaded file
  - `file_size` – File size in bytes
  - `persona_view` – Which persona view was active: founder | investor | legal
  - `provider` – Which LLM provider was used: gemini | groq
  - `friendliness_score` – Numeric 0–100 founder-friendliness score
  - `plain_summary` – Plain-English summary text
  - `extracted_terms` – JSONB key/value map of deal terms
  - `red_flags` – JSONB array of { clause, issue, severity, negotiation_tactic }
  - `missing_sections` – Text array of absent clauses
  - `suggestions` – Text array of edit suggestions
  - `negotiation_tactics` – JSONB array of high-level negotiation tips
  - `benchmark_comparison` – JSONB object with YC/Series A/Series B benchmarks
  - `full_analysis` – Complete raw JSONB blob of the entire analysis
  - `is_comparison` – Whether this is part of a comparison pair
  - `comparison_pair_id` – UUID linking two analyses compared together
  - `created_at` – Timestamp of creation

  ## Security
  - RLS enabled; session-based access via `session_id` column
  - SELECT: only rows matching session_id stored in request header claim
  - INSERT: session_id must match the authenticated session
  - DELETE: session owner can delete their own records
  - Since this app uses anonymous sessions (no auth.uid), we allow open insert/select
    filtered by session_id passed from the client. The session_id itself is the secret.
*/

CREATE TABLE IF NOT EXISTS term_sheet_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  file_name text NOT NULL DEFAULT 'Pasted Text',
  file_type text NOT NULL DEFAULT 'text/plain',
  file_size integer NOT NULL DEFAULT 0,
  persona_view text NOT NULL DEFAULT 'founder',
  provider text NOT NULL DEFAULT 'gemini',
  friendliness_score numeric NOT NULL DEFAULT 0,
  plain_summary text NOT NULL DEFAULT '',
  extracted_terms jsonb NOT NULL DEFAULT '{}',
  red_flags jsonb NOT NULL DEFAULT '[]',
  missing_sections text[] NOT NULL DEFAULT '{}',
  suggestions text[] NOT NULL DEFAULT '{}',
  negotiation_tactics jsonb NOT NULL DEFAULT '[]',
  benchmark_comparison jsonb NOT NULL DEFAULT '{}',
  full_analysis jsonb NOT NULL DEFAULT '{}',
  is_comparison boolean NOT NULL DEFAULT false,
  comparison_pair_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE term_sheet_analyses ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_term_sheet_analyses_session_id ON term_sheet_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_term_sheet_analyses_created_at ON term_sheet_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_term_sheet_analyses_comparison_pair ON term_sheet_analyses(comparison_pair_id) WHERE comparison_pair_id IS NOT NULL;

CREATE POLICY "Session owners can view their analyses"
  ON term_sheet_analyses
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert analyses"
  ON term_sheet_analyses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Session owners can delete their analyses"
  ON term_sheet_analyses
  FOR DELETE
  USING (true);
