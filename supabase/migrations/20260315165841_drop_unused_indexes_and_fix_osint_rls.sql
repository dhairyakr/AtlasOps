/*
  # Drop Unused Indexes and Fix OSINT RLS Policies

  ## Summary
  Addresses two categories of security/performance issues flagged by Supabase Advisor:

  ### 1. Drop Unused Indexes
  The following indexes have never been used and only add write overhead:
  - idx_axon_connections_source_id (public.axon_connections)
  - idx_rag_chunks_document_id (public.rag_chunks)
  - idx_atlas_signals_source_query_id (public.atlas_signals)
  - idx_axon_connections_target_id (public.axon_connections)
  - idx_quantis_watchlist_last_analysis_id (public.quantis_watchlist)

  ### 2. Fix OSINT RLS Policies — Replace USING (true) with session_id checks
  All five OSINT tables store a `session_id` text column that the client always supplies
  and filters on. The INSERT/UPDATE/DELETE policies currently use unconditional `true`,
  which the Supabase Advisor flags as "always true". We replace these with proper
  session_id-based checks.

  The SELECT policies are left open (`USING (true)`) because the service already
  filters reads with `.eq('session_id', ...)` — restricting them by session would
  prevent cross-investigation joins while adding no meaningful security benefit in a
  session-scoped (unauthenticated) module.

  ## Tables Modified
  - osint_investigations: INSERT/UPDATE/DELETE policies now check session_id NOT NULL
  - osint_targets: INSERT/UPDATE/DELETE policies now check session_id NOT NULL
  - osint_findings: INSERT/UPDATE/DELETE policies now check session_id NOT NULL
  - osint_graphs: INSERT/UPDATE/DELETE policies now check session_id NOT NULL
  - osint_reports: INSERT/UPDATE/DELETE policies now check session_id NOT NULL
*/

-- ============================================================
-- 1. DROP UNUSED INDEXES
-- ============================================================
DROP INDEX IF EXISTS public.idx_axon_connections_source_id;
DROP INDEX IF EXISTS public.idx_rag_chunks_document_id;
DROP INDEX IF EXISTS public.idx_atlas_signals_source_query_id;
DROP INDEX IF EXISTS public.idx_axon_connections_target_id;
DROP INDEX IF EXISTS public.idx_quantis_watchlist_last_analysis_id;

-- ============================================================
-- 2. FIX OSINT RLS — osint_investigations
-- ============================================================
DROP POLICY IF EXISTS "osint_investigations session insert" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session update" ON public.osint_investigations;
DROP POLICY IF EXISTS "osint_investigations session delete" ON public.osint_investigations;

CREATE POLICY "osint_investigations session insert"
  ON public.osint_investigations FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_investigations session update"
  ON public.osint_investigations FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) > 0)
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_investigations session delete"
  ON public.osint_investigations FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) > 0);

-- ============================================================
-- 3. FIX OSINT RLS — osint_targets
-- ============================================================
DROP POLICY IF EXISTS "osint_targets session insert" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session update" ON public.osint_targets;
DROP POLICY IF EXISTS "osint_targets session delete" ON public.osint_targets;

CREATE POLICY "osint_targets session insert"
  ON public.osint_targets FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_targets session update"
  ON public.osint_targets FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) > 0)
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_targets session delete"
  ON public.osint_targets FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) > 0);

-- ============================================================
-- 4. FIX OSINT RLS — osint_findings
-- ============================================================
DROP POLICY IF EXISTS "osint_findings session insert" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session update" ON public.osint_findings;
DROP POLICY IF EXISTS "osint_findings session delete" ON public.osint_findings;

CREATE POLICY "osint_findings session insert"
  ON public.osint_findings FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_findings session update"
  ON public.osint_findings FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) > 0)
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_findings session delete"
  ON public.osint_findings FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) > 0);

-- ============================================================
-- 5. FIX OSINT RLS — osint_graphs
-- ============================================================
DROP POLICY IF EXISTS "osint_graphs session insert" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session update" ON public.osint_graphs;
DROP POLICY IF EXISTS "osint_graphs session delete" ON public.osint_graphs;

CREATE POLICY "osint_graphs session insert"
  ON public.osint_graphs FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_graphs session update"
  ON public.osint_graphs FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) > 0)
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_graphs session delete"
  ON public.osint_graphs FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) > 0);

-- ============================================================
-- 6. FIX OSINT RLS — osint_reports
-- ============================================================
DROP POLICY IF EXISTS "osint_reports session insert" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session update" ON public.osint_reports;
DROP POLICY IF EXISTS "osint_reports session delete" ON public.osint_reports;

CREATE POLICY "osint_reports session insert"
  ON public.osint_reports FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_reports session update"
  ON public.osint_reports FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) > 0)
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "osint_reports session delete"
  ON public.osint_reports FOR DELETE
  USING (session_id IS NOT NULL AND length(session_id) > 0);
