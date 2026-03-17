/*
  # Fix RAG Lab RLS Policies

  ## Problem
  The INSERT, UPDATE, and DELETE policies on rag_documents, rag_chunks, and rag_queries
  use `current_setting('app.session_id')` which is a Postgres session variable the
  frontend never sets. This silently blocks every write operation.

  ## Fix
  Drop the broken write policies and replace them with open policies that allow any
  public/anon role to perform writes. This matches the open-read model already in place
  (SELECT policies use `USING (true)`) and mirrors how all other lab tables in the DB work.

  ## Changes
  - rag_documents: drop broken INSERT, UPDATE, DELETE → add open INSERT, UPDATE, DELETE
  - rag_chunks: drop broken INSERT, DELETE → add open INSERT, DELETE
  - rag_queries: drop broken INSERT → add open INSERT
*/

DROP POLICY IF EXISTS "Session users can insert documents" ON rag_documents;
DROP POLICY IF EXISTS "Session users can update own documents" ON rag_documents;
DROP POLICY IF EXISTS "Session users can delete own documents" ON rag_documents;

DROP POLICY IF EXISTS "Session users can insert chunks" ON rag_chunks;
DROP POLICY IF EXISTS "Session users can delete own chunks" ON rag_chunks;

DROP POLICY IF EXISTS "Session users can insert queries" ON rag_queries;

CREATE POLICY "Anyone can insert documents"
  ON rag_documents FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Anyone can update documents"
  ON rag_documents FOR UPDATE
  TO anon, public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete documents"
  ON rag_documents FOR DELETE
  TO anon, public
  USING (true);

CREATE POLICY "Anyone can insert chunks"
  ON rag_chunks FOR INSERT
  TO anon, public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete chunks"
  ON rag_chunks FOR DELETE
  TO anon, public
  USING (true);

CREATE POLICY "Anyone can insert queries"
  ON rag_queries FOR INSERT
  TO anon, public
  WITH CHECK (true);
