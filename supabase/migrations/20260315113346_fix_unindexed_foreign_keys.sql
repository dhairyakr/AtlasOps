/*
  # Fix Unindexed Foreign Keys

  1. Changes
    - Add covering index on `atlas_signals.source_query_id` for FK `atlas_signals_source_query_id_fkey`
    - Add covering index on `axon_connections.target_id` for FK `axon_connections_target_id_fkey`
    - Add covering index on `quantis_watchlist.last_analysis_id` for FK `quantis_watchlist_last_analysis_id_fkey`

  2. Purpose
    - Prevents full table scans when joining or filtering on these foreign key columns
    - Improves query performance for related record lookups
*/

CREATE INDEX IF NOT EXISTS idx_atlas_signals_source_query_id ON public.atlas_signals (source_query_id);
CREATE INDEX IF NOT EXISTS idx_axon_connections_target_id ON public.axon_connections (target_id);
CREATE INDEX IF NOT EXISTS idx_quantis_watchlist_last_analysis_id ON public.quantis_watchlist (last_analysis_id);
