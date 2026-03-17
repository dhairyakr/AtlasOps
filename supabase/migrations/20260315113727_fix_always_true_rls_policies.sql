/*
  # Fix Always-True RLS Policies

  ## Summary
  Replace RLS policies with USING/WITH CHECK = true with proper session-based
  or user-based access controls. Tables using session_id use current_setting
  matching; tables using user_id (text type) cast auth.uid() to text.

  ## Tables Modified
  - agent_runs, embedding_sessions, ethics_tests, model_comparisons,
    multimodal_analyses, prompt_runs: session_id-based INSERT restriction
  - cb_actions, cb_daily_briefs, cb_goals, cb_inbox_items, cb_memories,
    cb_patterns, cb_relationships: user_id (text) based restriction
  - osint_findings, osint_graphs, osint_investigations, osint_reports,
    osint_targets: session_id-based restriction
  - rag_chunks, rag_documents, rag_queries, rag_sessions: session_id-based restriction
*/

-- agent_runs
DROP POLICY IF EXISTS "Anyone can insert agent runs" ON public.agent_runs;
CREATE POLICY "Anyone can insert agent runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- cb_actions (user_id is text, cast auth.uid() to text)
DROP POLICY IF EXISTS "cb_actions_delete" ON public.cb_actions;
DROP POLICY IF EXISTS "cb_actions_insert" ON public.cb_actions;
DROP POLICY IF EXISTS "cb_actions_update" ON public.cb_actions;

CREATE POLICY "cb_actions_delete"
  ON public.cb_actions FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_actions_insert"
  ON public.cb_actions FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_actions_update"
  ON public.cb_actions FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_daily_briefs
DROP POLICY IF EXISTS "cb_daily_briefs_insert" ON public.cb_daily_briefs;
DROP POLICY IF EXISTS "cb_daily_briefs_update" ON public.cb_daily_briefs;

CREATE POLICY "cb_daily_briefs_insert"
  ON public.cb_daily_briefs FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_daily_briefs_update"
  ON public.cb_daily_briefs FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_goals
DROP POLICY IF EXISTS "cb_goals_delete" ON public.cb_goals;
DROP POLICY IF EXISTS "cb_goals_insert" ON public.cb_goals;
DROP POLICY IF EXISTS "cb_goals_update" ON public.cb_goals;

CREATE POLICY "cb_goals_delete"
  ON public.cb_goals FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_goals_insert"
  ON public.cb_goals FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_goals_update"
  ON public.cb_goals FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_inbox_items
DROP POLICY IF EXISTS "cb_inbox_items_delete" ON public.cb_inbox_items;
DROP POLICY IF EXISTS "cb_inbox_items_insert" ON public.cb_inbox_items;
DROP POLICY IF EXISTS "cb_inbox_items_update" ON public.cb_inbox_items;

CREATE POLICY "cb_inbox_items_delete"
  ON public.cb_inbox_items FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_inbox_items_insert"
  ON public.cb_inbox_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_inbox_items_update"
  ON public.cb_inbox_items FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_memories
DROP POLICY IF EXISTS "cb_memories_delete" ON public.cb_memories;
DROP POLICY IF EXISTS "cb_memories_insert" ON public.cb_memories;
DROP POLICY IF EXISTS "cb_memories_update" ON public.cb_memories;

CREATE POLICY "cb_memories_delete"
  ON public.cb_memories FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_memories_insert"
  ON public.cb_memories FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_memories_update"
  ON public.cb_memories FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_patterns
DROP POLICY IF EXISTS "cb_patterns_delete" ON public.cb_patterns;
DROP POLICY IF EXISTS "cb_patterns_insert" ON public.cb_patterns;
DROP POLICY IF EXISTS "cb_patterns_update" ON public.cb_patterns;

CREATE POLICY "cb_patterns_delete"
  ON public.cb_patterns FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_patterns_insert"
  ON public.cb_patterns FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_patterns_update"
  ON public.cb_patterns FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- cb_relationships
DROP POLICY IF EXISTS "cb_relationships_delete" ON public.cb_relationships;
DROP POLICY IF EXISTS "cb_relationships_insert" ON public.cb_relationships;
DROP POLICY IF EXISTS "cb_relationships_update" ON public.cb_relationships;

CREATE POLICY "cb_relationships_delete"
  ON public.cb_relationships FOR DELETE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_relationships_insert"
  ON public.cb_relationships FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "cb_relationships_update"
  ON public.cb_relationships FOR UPDATE
  TO anon, authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

-- embedding_sessions
DROP POLICY IF EXISTS "Anyone can insert embedding sessions" ON public.embedding_sessions;
CREATE POLICY "Anyone can insert embedding sessions"
  ON public.embedding_sessions FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- ethics_tests
DROP POLICY IF EXISTS "Anyone can insert ethics tests" ON public.ethics_tests;
CREATE POLICY "Anyone can insert ethics tests"
  ON public.ethics_tests FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- model_comparisons
DROP POLICY IF EXISTS "Anyone can insert model comparisons" ON public.model_comparisons;
CREATE POLICY "Anyone can insert model comparisons"
  ON public.model_comparisons FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- multimodal_analyses
DROP POLICY IF EXISTS "Anyone can insert multimodal analyses" ON public.multimodal_analyses;
CREATE POLICY "Anyone can insert multimodal analyses"
  ON public.multimodal_analyses FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- osint_findings
DROP POLICY IF EXISTS "osint_findings session delete" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session insert" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session update" ON public.osint_findings;

CREATE POLICY "osint_findings session delete"
  ON public.osint_findings FOR DELETE
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_findings session insert"
  ON public.osint_findings FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_findings session update"
  ON public.osint_findings FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- osint_graphs
DROP POLICY IF EXISTS "osint_graphs session delete" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session insert" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session update" ON public.osint_graphs;

CREATE POLICY "osint_graphs session delete"
  ON public.osint_graphs FOR DELETE
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_graphs session insert"
  ON public.osint_graphs FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_graphs session update"
  ON public.osint_graphs FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- osint_investigations: fix always-true DELETE/INSERT/UPDATE and fix SELECT (OR true)
DROP POLICY IF EXISTS "osint_investigations session delete" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session insert" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session update" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session select" ON public.osint_investigations;

CREATE POLICY "osint_investigations session select"
  ON public.osint_investigations FOR SELECT
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_investigations session delete"
  ON public.osint_investigations FOR DELETE
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_investigations session insert"
  ON public.osint_investigations FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_investigations session update"
  ON public.osint_investigations FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- osint_reports
DROP POLICY IF EXISTS "osint_reports session delete" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session insert" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session update" ON public.osint_reports;

CREATE POLICY "osint_reports session delete"
  ON public.osint_reports FOR DELETE
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_reports session insert"
  ON public.osint_reports FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_reports session update"
  ON public.osint_reports FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- osint_targets
DROP POLICY IF EXISTS "osint_targets session delete" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session insert" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session update" ON public.osint_targets;

CREATE POLICY "osint_targets session delete"
  ON public.osint_targets FOR DELETE
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_targets session insert"
  ON public.osint_targets FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "osint_targets session update"
  ON public.osint_targets FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- prompt_runs
DROP POLICY IF EXISTS "Anyone can insert prompt runs" ON public.prompt_runs;
CREATE POLICY "Anyone can insert prompt runs"
  ON public.prompt_runs FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- rag_chunks
DROP POLICY IF EXISTS "Session users can delete own chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Session users can insert chunks" ON public.rag_chunks;

CREATE POLICY "Session users can delete own chunks"
  ON public.rag_chunks FOR DELETE
  TO anon
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Session users can insert chunks"
  ON public.rag_chunks FOR INSERT
  TO anon
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- rag_documents
DROP POLICY IF EXISTS "Session users can delete own documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Session users can insert documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Session users can update own documents" ON public.rag_documents;

CREATE POLICY "Session users can delete own documents"
  ON public.rag_documents FOR DELETE
  TO anon
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Session users can insert documents"
  ON public.rag_documents FOR INSERT
  TO anon
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "Session users can update own documents"
  ON public.rag_documents FOR UPDATE
  TO anon
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- rag_queries
DROP POLICY IF EXISTS "Session users can insert queries" ON public.rag_queries;
CREATE POLICY "Session users can insert queries"
  ON public.rag_queries FOR INSERT
  TO anon
  WITH CHECK (session_id = current_setting('app.session_id', true));

-- rag_sessions
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.rag_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.rag_sessions;

CREATE POLICY "Anyone can insert sessions"
  ON public.rag_sessions FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id', true));

CREATE POLICY "Anyone can update sessions"
  ON public.rag_sessions FOR UPDATE
  USING (session_id = current_setting('app.session_id', true))
  WITH CHECK (session_id = current_setting('app.session_id', true));
