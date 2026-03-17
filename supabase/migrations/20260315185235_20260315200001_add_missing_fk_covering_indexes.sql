/*
  # Add Missing FK Covering Indexes

  ## Summary
  Adds covering indexes for foreign key columns that were missing indexes,
  which caused suboptimal query performance on JOIN and DELETE operations.

  ## Changes

  ### atlas_signals
  - Add index on `source_query_id` (FK to atlas_queries)

  ### axon_connections
  - Add index on `source_id` (FK to axon_nodes)
  - Add index on `target_id` (FK to axon_nodes)

  ### quantis_watchlist
  - Add index on `last_analysis_id` (FK to quantis_analyses)

  ### rag_chunks
  - Add index on `document_id` (FK to rag_documents) — separate from the
    existing idx_rag_chunks_document which may not exist in all environments
*/

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
