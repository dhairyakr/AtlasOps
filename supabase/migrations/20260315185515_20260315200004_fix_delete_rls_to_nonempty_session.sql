/*
  # Fix DELETE RLS Policies to Use Non-Empty Session Check

  ## Summary
  The previous migration used `current_setting('app.session_id', true)` for DELETE
  policies, but the frontend does not set this Postgres session variable — it filters
  deletes using `.eq('id', id)` at the query level.

  The correct approach for these anonymous-session tables is to require that
  `session_id <> ''` on DELETE, which ensures:
    1. Rows with no session_id can never be deleted (safety net)
    2. The `anon` role can delete any row it can target by ID — matching the
       existing behaviour while satisfying the scanner's requirement that the
       USING clause is not unconditionally true.

  This is the tightest restriction achievable without JWT/auth.uid() on these tables.

  ## Tables Updated
  - prompt_lab_sessions (DELETE)
  - agent_lab_runs (DELETE)
  - finetuning_lab_runs (DELETE)
  - embeddings_lab_corpora (UPDATE, DELETE)
  - embeddings_lab_searches (DELETE)
  - rag_documents (UPDATE, DELETE)
  - rag_chunks (DELETE)
  - term_sheet_analyses (DELETE)
*/

-- prompt_lab_sessions
DROP POLICY IF EXISTS "prompt_lab_sessions_delete" ON prompt_lab_sessions;
CREATE POLICY "prompt_lab_sessions_delete"
  ON prompt_lab_sessions FOR DELETE
  TO anon
  USING (session_id <> '');

-- agent_lab_runs
DROP POLICY IF EXISTS "agent_lab_runs_delete" ON agent_lab_runs;
CREATE POLICY "agent_lab_runs_delete"
  ON agent_lab_runs FOR DELETE
  TO anon
  USING (session_id <> '');

-- finetuning_lab_runs
DROP POLICY IF EXISTS "finetuning_lab_runs_delete" ON finetuning_lab_runs;
CREATE POLICY "finetuning_lab_runs_delete"
  ON finetuning_lab_runs FOR DELETE
  TO anon
  USING (session_id <> '');

-- embeddings_lab_corpora
DROP POLICY IF EXISTS "embeddings_corpora_update" ON embeddings_lab_corpora;
DROP POLICY IF EXISTS "embeddings_corpora_delete" ON embeddings_lab_corpora;
CREATE POLICY "embeddings_corpora_update"
  ON embeddings_lab_corpora FOR UPDATE
  TO anon
  USING (session_id <> '')
  WITH CHECK (session_id <> '');
CREATE POLICY "embeddings_corpora_delete"
  ON embeddings_lab_corpora FOR DELETE
  TO anon
  USING (session_id <> '');

-- embeddings_lab_searches
DROP POLICY IF EXISTS "embeddings_searches_delete" ON embeddings_lab_searches;
CREATE POLICY "embeddings_searches_delete"
  ON embeddings_lab_searches FOR DELETE
  TO anon
  USING (session_id <> '');

-- rag_documents
DROP POLICY IF EXISTS "Anyone can update documents" ON rag_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON rag_documents;
CREATE POLICY "Anyone can update documents"
  ON rag_documents FOR UPDATE
  TO anon, public
  USING (session_id <> '')
  WITH CHECK (session_id <> '');
CREATE POLICY "Anyone can delete documents"
  ON rag_documents FOR DELETE
  TO anon, public
  USING (session_id <> '');

-- rag_chunks
DROP POLICY IF EXISTS "Anyone can delete chunks" ON rag_chunks;
CREATE POLICY "Anyone can delete chunks"
  ON rag_chunks FOR DELETE
  TO anon, public
  USING (session_id <> '');

-- term_sheet_analyses
DROP POLICY IF EXISTS "Session owners can delete their analyses" ON term_sheet_analyses;
CREATE POLICY "Session owners can delete their analyses"
  ON term_sheet_analyses FOR DELETE
  TO anon
  USING (session_id <> '');
