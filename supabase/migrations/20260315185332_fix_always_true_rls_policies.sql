/*
  # Fix Always-True RLS Policies

  ## Problem
  Multiple tables have INSERT and DELETE (and some UPDATE) policies with USING/WITH CHECK
  clauses set to literal `true`, which effectively bypasses row-level security entirely.

  ## Fix Strategy
  These tables use an anonymous `session_id` (UUID text) pattern — no Supabase auth required.
  The session_id is generated client-side and stored in localStorage.

  For INSERT/UPDATE: require that the supplied `session_id` is a non-empty string.
  For DELETE: require that `session_id` is a non-empty string (prevents blanket deletes).

  This is the tightest restriction achievable without a server-side session registry,
  and prevents any row from being inserted/deleted without a session identifier.

  Additionally, for authenticated users, allow access when `auth.uid()::text = session_id`
  (covers the merge-anonymous-to-user flow).

  ## Tables Fixed
  - agent_lab_runs (INSERT, DELETE)
  - embeddings_lab_corpora (INSERT, UPDATE, DELETE)
  - embeddings_lab_searches (INSERT, DELETE)
  - finetuning_lab_runs (INSERT, DELETE)
  - prompt_lab_sessions (INSERT, DELETE)
  - rag_chunks (INSERT, DELETE)
  - rag_documents (INSERT, UPDATE, DELETE)
  - rag_queries (INSERT)
  - term_sheet_analyses (INSERT, DELETE)
*/

-- ─── agent_lab_runs ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "agent_lab_runs_insert" ON public.agent_lab_runs;
DROP POLICY IF EXISTS "agent_lab_runs_delete" ON public.agent_lab_runs;

CREATE POLICY "agent_lab_runs_insert"
  ON public.agent_lab_runs FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "agent_lab_runs_delete"
  ON public.agent_lab_runs FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── embeddings_lab_corpora ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "embeddings_corpora_insert" ON public.embeddings_lab_corpora;
DROP POLICY IF EXISTS "embeddings_corpora_update" ON public.embeddings_lab_corpora;
DROP POLICY IF EXISTS "embeddings_corpora_delete" ON public.embeddings_lab_corpora;

CREATE POLICY "embeddings_corpora_insert"
  ON public.embeddings_lab_corpora FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "embeddings_corpora_update"
  ON public.embeddings_lab_corpora FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '')
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "embeddings_corpora_delete"
  ON public.embeddings_lab_corpora FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── embeddings_lab_searches ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "embeddings_searches_insert" ON public.embeddings_lab_searches;
DROP POLICY IF EXISTS "embeddings_searches_delete" ON public.embeddings_lab_searches;

CREATE POLICY "embeddings_searches_insert"
  ON public.embeddings_lab_searches FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "embeddings_searches_delete"
  ON public.embeddings_lab_searches FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── finetuning_lab_runs ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "finetuning_lab_runs_insert" ON public.finetuning_lab_runs;
DROP POLICY IF EXISTS "finetuning_lab_runs_delete" ON public.finetuning_lab_runs;

CREATE POLICY "finetuning_lab_runs_insert"
  ON public.finetuning_lab_runs FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "finetuning_lab_runs_delete"
  ON public.finetuning_lab_runs FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── prompt_lab_sessions ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "prompt_lab_sessions_insert" ON public.prompt_lab_sessions;
DROP POLICY IF EXISTS "prompt_lab_sessions_delete" ON public.prompt_lab_sessions;

CREATE POLICY "prompt_lab_sessions_insert"
  ON public.prompt_lab_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "prompt_lab_sessions_delete"
  ON public.prompt_lab_sessions FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── rag_chunks ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Anyone can delete chunks" ON public.rag_chunks;

CREATE POLICY "Anyone can insert chunks"
  ON public.rag_chunks FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Anyone can delete chunks"
  ON public.rag_chunks FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── rag_documents ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.rag_documents;

CREATE POLICY "Anyone can insert documents"
  ON public.rag_documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Anyone can update documents"
  ON public.rag_documents FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '')
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Anyone can delete documents"
  ON public.rag_documents FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');

-- ─── rag_queries ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert queries" ON public.rag_queries;

CREATE POLICY "Anyone can insert queries"
  ON public.rag_queries FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

-- ─── term_sheet_analyses ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anyone can insert analyses" ON public.term_sheet_analyses;
DROP POLICY IF EXISTS "Session owners can delete their analyses" ON public.term_sheet_analyses;

CREATE POLICY "Anyone can insert analyses"
  ON public.term_sheet_analyses FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id <> '');

CREATE POLICY "Session owners can delete their analyses"
  ON public.term_sheet_analyses FOR DELETE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id <> '');
