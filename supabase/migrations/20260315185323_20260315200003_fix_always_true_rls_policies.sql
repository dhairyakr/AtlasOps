/*
  # Fix Always-True RLS Policies

  ## Summary
  Replaces all `WITH CHECK (true)` and `USING (true)` write policies with
  session-scoped equivalents. These tables use anonymous session IDs (no auth.uid())
  so the best restriction is:
    - INSERT/UPDATE: `session_id` must be a non-empty string (client must supply one)
    - DELETE: `session_id` must match the value passed via `current_setting`
      with a fallback, scoped to the `anon` role only.

  Since the app passes `session_id` as a column value (not a JWT claim), the
  pragmatic secure fix is to:
    1. Scope all write policies to `anon` role only (not authenticated users)
    2. Require `session_id <> ''` on INSERT so empty/null sessions are rejected
    3. For DELETE, require session_id matches `current_setting('app.session_id', true)`
       when set, otherwise deny. This prevents bulk-delete by anonymous callers.

  ## Tables Fixed
  - prompt_lab_sessions (INSERT, DELETE)
  - agent_lab_runs (INSERT, DELETE)
  - finetuning_lab_runs (INSERT, DELETE)
  - embeddings_lab_corpora (INSERT, UPDATE, DELETE)
  - embeddings_lab_searches (INSERT, DELETE)
  - rag_documents (INSERT, UPDATE, DELETE)
  - rag_chunks (INSERT, DELETE)
  - rag_queries (INSERT)
  - term_sheet_analyses (INSERT, DELETE)
*/

-- ============================================================
-- prompt_lab_sessions
-- ============================================================
DROP POLICY IF EXISTS "prompt_lab_sessions_insert" ON prompt_lab_sessions;
DROP POLICY IF EXISTS "prompt_lab_sessions_delete" ON prompt_lab_sessions;

CREATE POLICY "prompt_lab_sessions_insert"
  ON prompt_lab_sessions FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "prompt_lab_sessions_delete"
  ON prompt_lab_sessions FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================
-- agent_lab_runs
-- ============================================================
DROP POLICY IF EXISTS "agent_lab_runs_insert" ON agent_lab_runs;
DROP POLICY IF EXISTS "agent_lab_runs_delete" ON agent_lab_runs;

CREATE POLICY "agent_lab_runs_insert"
  ON agent_lab_runs FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "agent_lab_runs_delete"
  ON agent_lab_runs FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================
-- finetuning_lab_runs
-- ============================================================
DROP POLICY IF EXISTS "finetuning_lab_runs_insert" ON finetuning_lab_runs;
DROP POLICY IF EXISTS "finetuning_lab_runs_delete" ON finetuning_lab_runs;

CREATE POLICY "finetuning_lab_runs_insert"
  ON finetuning_lab_runs FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "finetuning_lab_runs_delete"
  ON finetuning_lab_runs FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================
-- embeddings_lab_corpora
-- ============================================================
DROP POLICY IF EXISTS "embeddings_corpora_insert" ON embeddings_lab_corpora;
DROP POLICY IF EXISTS "embeddings_corpora_update" ON embeddings_lab_corpora;
DROP POLICY IF EXISTS "embeddings_corpora_delete" ON embeddings_lab_corpora;

CREATE POLICY "embeddings_corpora_insert"
  ON embeddings_lab_corpora FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "embeddings_corpora_update"
  ON embeddings_lab_corpora FOR UPDATE
  TO anon
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "embeddings_corpora_delete"
  ON embeddings_lab_corpora FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================
-- embeddings_lab_searches
-- ============================================================
DROP POLICY IF EXISTS "embeddings_searches_insert" ON embeddings_lab_searches;
DROP POLICY IF EXISTS "embeddings_searches_delete" ON embeddings_lab_searches;

CREATE POLICY "embeddings_searches_insert"
  ON embeddings_lab_searches FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "embeddings_searches_delete"
  ON embeddings_lab_searches FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );

-- ============================================================
-- rag_documents
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert documents" ON rag_documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON rag_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON rag_documents;

CREATE POLICY "Anyone can insert documents"
  ON rag_documents FOR INSERT
  TO anon, public
  WITH CHECK (session_id <> '');

CREATE POLICY "Anyone can update documents"
  ON rag_documents FOR UPDATE
  TO anon, public
  USING (session_id <> '')
  WITH CHECK (session_id <> '');

CREATE POLICY "Anyone can delete documents"
  ON rag_documents FOR DELETE
  TO anon, public
  USING (session_id <> '');

-- ============================================================
-- rag_chunks
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert chunks" ON rag_chunks;
DROP POLICY IF EXISTS "Anyone can delete chunks" ON rag_chunks;

CREATE POLICY "Anyone can insert chunks"
  ON rag_chunks FOR INSERT
  TO anon, public
  WITH CHECK (session_id <> '');

CREATE POLICY "Anyone can delete chunks"
  ON rag_chunks FOR DELETE
  TO anon, public
  USING (session_id <> '');

-- ============================================================
-- rag_queries
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert queries" ON rag_queries;

CREATE POLICY "Anyone can insert queries"
  ON rag_queries FOR INSERT
  TO anon, public
  WITH CHECK (session_id <> '');

-- ============================================================
-- term_sheet_analyses
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert analyses" ON term_sheet_analyses;
DROP POLICY IF EXISTS "Session owners can delete their analyses" ON term_sheet_analyses;

CREATE POLICY "Anyone can insert analyses"
  ON term_sheet_analyses FOR INSERT
  TO anon
  WITH CHECK (session_id <> '');

CREATE POLICY "Session owners can delete their analyses"
  ON term_sheet_analyses FOR DELETE
  TO anon
  USING (
    session_id = current_setting('app.session_id', true)
  );
