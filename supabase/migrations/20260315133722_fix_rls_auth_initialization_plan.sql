/*
  # Fix RLS Auth Initialization Plan warnings

  ## Summary
  All RLS policies using current_setting() or auth.uid() directly cause
  Postgres to re-evaluate those expressions for every row. Wrapping them in
  a sub-select (select expr) forces a single evaluation per query statement,
  significantly improving performance at scale.

  ## Tables fixed
  - rag_documents (delete, insert, update)
  - rag_chunks (delete, insert)
  - rag_queries (insert)
  - rag_sessions (insert, update)
  - prompt_runs (insert)
  - agent_runs (insert)
  - model_comparisons (insert)
  - embedding_sessions (insert)
  - ethics_tests (insert)
  - multimodal_analyses (insert)
  - agent_tasks (delete, insert, select, update)
  - osint_investigations (delete, insert, select, update)
  - osint_targets (delete, insert, update)
  - osint_findings (delete, insert, update)
  - osint_graphs (delete, insert, update)
  - osint_reports (delete, insert, update)
  - user_settings (delete, insert, update, select)
*/

-- rag_documents
DROP POLICY IF EXISTS "Session users can delete own documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Session users can insert documents" ON public.rag_documents;
DROP POLICY IF EXISTS "Session users can update own documents" ON public.rag_documents;

CREATE POLICY "Session users can delete own documents"
  ON public.rag_documents FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "Session users can insert documents"
  ON public.rag_documents FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "Session users can update own documents"
  ON public.rag_documents FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- rag_chunks
DROP POLICY IF EXISTS "Session users can delete own chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Session users can insert chunks" ON public.rag_chunks;

CREATE POLICY "Session users can delete own chunks"
  ON public.rag_chunks FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "Session users can insert chunks"
  ON public.rag_chunks FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- rag_queries
DROP POLICY IF EXISTS "Session users can insert queries" ON public.rag_queries;

CREATE POLICY "Session users can insert queries"
  ON public.rag_queries FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- rag_sessions
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.rag_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.rag_sessions;

CREATE POLICY "Anyone can insert sessions"
  ON public.rag_sessions FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "Anyone can update sessions"
  ON public.rag_sessions FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- prompt_runs
DROP POLICY IF EXISTS "Anyone can insert prompt runs" ON public.prompt_runs;

CREATE POLICY "Anyone can insert prompt runs"
  ON public.prompt_runs FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- agent_runs
DROP POLICY IF EXISTS "Anyone can insert agent runs" ON public.agent_runs;

CREATE POLICY "Anyone can insert agent runs"
  ON public.agent_runs FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- model_comparisons
DROP POLICY IF EXISTS "Anyone can insert model comparisons" ON public.model_comparisons;

CREATE POLICY "Anyone can insert model comparisons"
  ON public.model_comparisons FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- embedding_sessions
DROP POLICY IF EXISTS "Anyone can insert embedding sessions" ON public.embedding_sessions;

CREATE POLICY "Anyone can insert embedding sessions"
  ON public.embedding_sessions FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- ethics_tests
DROP POLICY IF EXISTS "Anyone can insert ethics tests" ON public.ethics_tests;

CREATE POLICY "Anyone can insert ethics tests"
  ON public.ethics_tests FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- multimodal_analyses
DROP POLICY IF EXISTS "Anyone can insert multimodal analyses" ON public.multimodal_analyses;

CREATE POLICY "Anyone can insert multimodal analyses"
  ON public.multimodal_analyses FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- agent_tasks
DROP POLICY IF EXISTS "Session users can delete own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Session users can insert own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Session users can select own tasks" ON public.agent_tasks;
DROP POLICY IF EXISTS "Session users can update own tasks" ON public.agent_tasks;

CREATE POLICY "Session users can delete own tasks"
  ON public.agent_tasks FOR DELETE TO public
  USING (user_session_id = ((select current_setting('request.headers', true))::json ->> 'x-session-id'));

CREATE POLICY "Session users can insert own tasks"
  ON public.agent_tasks FOR INSERT TO public
  WITH CHECK (user_session_id = ((select current_setting('request.headers', true))::json ->> 'x-session-id'));

CREATE POLICY "Session users can select own tasks"
  ON public.agent_tasks FOR SELECT TO public
  USING (user_session_id = ((select current_setting('request.headers', true))::json ->> 'x-session-id'));

CREATE POLICY "Session users can update own tasks"
  ON public.agent_tasks FOR UPDATE TO public
  USING (user_session_id = ((select current_setting('request.headers', true))::json ->> 'x-session-id'))
  WITH CHECK (user_session_id = ((select current_setting('request.headers', true))::json ->> 'x-session-id'));

-- osint_investigations
DROP POLICY IF EXISTS "osint_investigations session delete" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session insert" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session select" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session update" ON public.osint_investigations;

CREATE POLICY "osint_investigations session delete"
  ON public.osint_investigations FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_investigations session insert"
  ON public.osint_investigations FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_investigations session select"
  ON public.osint_investigations FOR SELECT TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_investigations session update"
  ON public.osint_investigations FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- osint_targets
DROP POLICY IF EXISTS "osint_targets session delete" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session insert" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session update" ON public.osint_targets;

CREATE POLICY "osint_targets session delete"
  ON public.osint_targets FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_targets session insert"
  ON public.osint_targets FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_targets session update"
  ON public.osint_targets FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- osint_findings
DROP POLICY IF EXISTS "osint_findings session delete" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session insert" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session update" ON public.osint_findings;

CREATE POLICY "osint_findings session delete"
  ON public.osint_findings FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_findings session insert"
  ON public.osint_findings FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_findings session update"
  ON public.osint_findings FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- osint_graphs
DROP POLICY IF EXISTS "osint_graphs session delete" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session insert" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session update" ON public.osint_graphs;

CREATE POLICY "osint_graphs session delete"
  ON public.osint_graphs FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_graphs session insert"
  ON public.osint_graphs FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_graphs session update"
  ON public.osint_graphs FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- osint_reports
DROP POLICY IF EXISTS "osint_reports session delete" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session insert" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session update" ON public.osint_reports;

CREATE POLICY "osint_reports session delete"
  ON public.osint_reports FOR DELETE TO public
  USING (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_reports session insert"
  ON public.osint_reports FOR INSERT TO public
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

CREATE POLICY "osint_reports session update"
  ON public.osint_reports FOR UPDATE TO public
  USING (session_id = (select current_setting('app.session_id', true)))
  WITH CHECK (session_id = (select current_setting('app.session_id', true)));

-- user_settings
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);
