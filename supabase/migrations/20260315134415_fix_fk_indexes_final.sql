/*
  # Fix unindexed foreign keys and drop unused indexes (final pass)

  ## Summary
  Resolves a swap situation where the correct FK columns still lack indexes
  and the previously created ones are unused by the query planner.

  ## Changes

  ### Dropped indexes (unused by query planner)
  - `idx_atlas_signals_source_query_id` on `atlas_signals`
  - `idx_axon_connections_target_id` on `axon_connections`
  - `idx_quantis_watchlist_last_analysis_id` on `quantis_watchlist`

  ### New indexes (covering the reported unindexed foreign keys)
  - `idx_axon_connections_source_id` on `axon_connections(source_id)`
    covers `axon_connections_source_id_fkey`
  - `idx_rag_chunks_document_id` on `rag_chunks(document_id)`
    covers `rag_chunks_document_id_fkey`
*/

DROP INDEX IF EXISTS public.idx_atlas_signals_source_query_id;
DROP INDEX IF EXISTS public.idx_axon_connections_target_id;
DROP INDEX IF EXISTS public.idx_quantis_watchlist_last_analysis_id;

CREATE INDEX IF NOT EXISTS idx_axon_connections_source_id
  ON public.axon_connections (source_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id
  ON public.rag_chunks (document_id);
