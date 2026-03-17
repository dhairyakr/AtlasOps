/*
  # Fix unindexed foreign keys and drop unused indexes

  ## Summary
  Three foreign keys lacked covering indexes causing potential full table scans.
  Two previously added indexes were flagged as unused and are being removed.

  ## Changes

  ### New indexes (covering unindexed foreign keys)
  - `idx_atlas_signals_source_query_id` on `atlas_signals(source_query_id)`
    covers `atlas_signals_source_query_id_fkey`
  - `idx_axon_connections_target_id` on `axon_connections(target_id)`
    covers `axon_connections_target_id_fkey`
  - `idx_quantis_watchlist_last_analysis_id` on `quantis_watchlist(last_analysis_id)`
    covers `quantis_watchlist_last_analysis_id_fkey`

  ### Dropped indexes (unused)
  - `idx_axon_connections_source_id` on `axon_connections`
  - `idx_rag_chunks_document_id` on `rag_chunks`
*/

DROP INDEX IF EXISTS public.idx_axon_connections_source_id;
DROP INDEX IF EXISTS public.idx_rag_chunks_document_id;

CREATE INDEX IF NOT EXISTS idx_atlas_signals_source_query_id
  ON public.atlas_signals (source_query_id);

CREATE INDEX IF NOT EXISTS idx_axon_connections_target_id
  ON public.axon_connections (target_id);

CREATE INDEX IF NOT EXISTS idx_quantis_watchlist_last_analysis_id
  ON public.quantis_watchlist (last_analysis_id);
