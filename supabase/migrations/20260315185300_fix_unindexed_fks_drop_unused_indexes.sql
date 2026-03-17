/*
  # Fix Unindexed Foreign Keys and Drop Unused Indexes

  ## Summary
  Addresses two categories of performance/maintenance issues flagged by Supabase advisor:

  ## 1. Missing FK Covering Indexes
  Foreign key columns without indexes cause full-table scans on JOIN and CASCADE operations.
  Adding B-tree indexes on each unindexed FK column:

  - `atlas_signals.source_query_id` → references atlas_queries
  - `axon_connections.source_id` → references axon_nodes
  - `axon_connections.target_id` → references axon_nodes
  - `quantis_watchlist.last_analysis_id` → references quantis_analyses
  - `rag_chunks.document_id` → references rag_documents

  ## 2. Unused Indexes Being Dropped
  These indexes have never been used (per pg_stat_user_indexes) and only add write overhead:

  - `idx_term_sheet_analyses_created_at`
  - `idx_term_sheet_analyses_comparison_pair`
  - `idx_prompt_lab_created_at`
  - `idx_agent_lab_session_id`
  - `idx_agent_lab_created_at`
  - `idx_finetuning_lab_created_at`
  - `idx_embeddings_searches_created_at`

  ## Notes
  - All CREATE INDEX use IF NOT EXISTS to be idempotent
  - All DROP INDEX use IF EXISTS to be safe
*/

-- ─── FK Covering Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_atlas_signals_source_query_id
  ON public.atlas_signals(source_query_id);

CREATE INDEX IF NOT EXISTS idx_axon_connections_source_id
  ON public.axon_connections(source_id);

CREATE INDEX IF NOT EXISTS idx_axon_connections_target_id
  ON public.axon_connections(target_id);

CREATE INDEX IF NOT EXISTS idx_quantis_watchlist_last_analysis_id
  ON public.quantis_watchlist(last_analysis_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id
  ON public.rag_chunks(document_id);

-- ─── Drop Unused Indexes ─────────────────────────────────────────────────────

DROP INDEX IF EXISTS public.idx_term_sheet_analyses_created_at;
DROP INDEX IF EXISTS public.idx_term_sheet_analyses_comparison_pair;
DROP INDEX IF EXISTS public.idx_prompt_lab_created_at;
DROP INDEX IF EXISTS public.idx_agent_lab_session_id;
DROP INDEX IF EXISTS public.idx_agent_lab_created_at;
DROP INDEX IF EXISTS public.idx_finetuning_lab_created_at;
DROP INDEX IF EXISTS public.idx_embeddings_searches_created_at;
