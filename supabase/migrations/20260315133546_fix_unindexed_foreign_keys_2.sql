/*
  # Add missing covering indexes for foreign keys

  ## Summary
  Two foreign keys were missing covering indexes, causing suboptimal query
  performance when joining or filtering by these columns.

  ## Changes
  1. `public.axon_connections` - add index on `source_id` column
     (covers `axon_connections_source_id_fkey`)
  2. `public.rag_chunks` - add index on `document_id` column
     (covers `rag_chunks_document_id_fkey`)
*/

CREATE INDEX IF NOT EXISTS idx_axon_connections_source_id
  ON public.axon_connections (source_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_document_id
  ON public.rag_chunks (document_id);
