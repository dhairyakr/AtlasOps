/*
  # Drop unused indexes

  ## Summary
  Four indexes were identified as unused (never accessed by any query plan).
  Removing them reduces write overhead on inserts/updates and reclaims storage.

  ## Indexes dropped
  - idx_atlas_signals_source_query_id on public.atlas_signals
  - idx_axon_connections_target_id on public.axon_connections
  - idx_quantis_watchlist_last_analysis_id on public.quantis_watchlist
  - idx_user_settings_user_id on public.user_settings
*/

DROP INDEX IF EXISTS public.idx_atlas_signals_source_query_id;
DROP INDEX IF EXISTS public.idx_axon_connections_target_id;
DROP INDEX IF EXISTS public.idx_quantis_watchlist_last_analysis_id;
DROP INDEX IF EXISTS public.idx_user_settings_user_id;
