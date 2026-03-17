/*
  # Add missing FK covering indexes

  ## Summary
  Three foreign key columns were confirmed to lack covering indexes.
  This migration adds the missing indexes without touching existing ones.

  ## New indexes

  - `idx_atlas_signals_source_query_id` on `atlas_signals(source_query_id)`
    covers `atlas_signals_source_query_id_fkey`

  - `idx_axon_connections_target_id` on `axon_connections(target_id)`
    covers `axon_connections_target_id_fkey`

  - `idx_quantis_watchlist_last_analysis_id` on `quantis_watchlist(last_analysis_id)`
    covers `quantis_watchlist_last_analysis_id_fkey`

  ## Notes
  - `idx_axon_connections_source_id` and `idx_rag_chunks_document_id` are retained
    as they cover valid FK columns (`source_id` and `document_id` respectively)
  - No indexes are dropped in this migration
*/

CREATE INDEX IF NOT EXISTS idx_atlas_signals_source_query_id
  ON public.atlas_signals (source_query_id);

CREATE INDEX IF NOT EXISTS idx_axon_connections_target_id
  ON public.axon_connections (target_id);

CREATE INDEX IF NOT EXISTS idx_quantis_watchlist_last_analysis_id
  ON public.quantis_watchlist (last_analysis_id);
