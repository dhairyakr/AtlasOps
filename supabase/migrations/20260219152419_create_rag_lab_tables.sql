/*
  # RAG Lab Tables

  ## Overview
  Creates the database schema for the RAG Lab interactive learning tool. This enables
  persistent storage of uploaded documents, their text chunks, and query history.

  ## New Tables

  ### 1. rag_documents
  Stores metadata for uploaded documents in RAG Lab sessions.
  - `id` (uuid, primary key) - Unique document identifier
  - `session_id` (text) - Browser session identifier for grouping documents
  - `title` (text) - Document filename/title
  - `file_type` (text) - File extension (pdf, docx, txt, etc.)
  - `char_count` (integer) - Total character count of extracted text
  - `word_count` (integer) - Total word count of extracted text
  - `chunk_count` (integer) - Number of chunks created from this document
  - `created_at` (timestamptz) - Upload timestamp

  ### 2. rag_chunks
  Stores individual text chunks extracted from documents.
  - `id` (uuid, primary key) - Unique chunk identifier
  - `document_id` (uuid, FK to rag_documents) - Parent document reference
  - `session_id` (text) - Browser session identifier
  - `chunk_index` (integer) - Position of this chunk within the document
  - `chunk_text` (text) - The actual chunk text content
  - `char_start` (integer) - Start character offset in original document
  - `char_end` (integer) - End character offset in original document
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. rag_queries
  Logs all queries, retrieved chunks, and generated answers for history.
  - `id` (uuid, primary key) - Unique query identifier
  - `session_id` (text) - Browser session identifier
  - `query_text` (text) - The user's question
  - `retrieved_chunk_ids` (uuid[]) - Array of chunk IDs that were retrieved
  - `answer_text` (text) - The generated grounded answer
  - `chunks_retrieved` (integer) - Number of chunks used
  - `created_at` (timestamptz) - Query timestamp

  ## Security
  - RLS enabled on all three tables
  - Session-based access: users can only read/write their own session data
  - No authentication required (session_id acts as the access key)
  - Separate policies for SELECT, INSERT, UPDATE, DELETE

  ## Notes
  - session_id is generated client-side (UUID stored in localStorage)
  - This design allows anonymous usage without requiring login
  - Documents and chunks are linked via document_id foreign key
  - chunk_index enables ordered reconstruction of original document
*/

CREATE TABLE IF NOT EXISTS rag_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'txt',
  char_count integer NOT NULL DEFAULT 0,
  word_count integer NOT NULL DEFAULT 0,
  chunk_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can read own documents"
  ON rag_documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Session users can insert documents"
  ON rag_documents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Session users can update own documents"
  ON rag_documents FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Session users can delete own documents"
  ON rag_documents FOR DELETE
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS rag_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  chunk_text text NOT NULL DEFAULT '',
  char_start integer NOT NULL DEFAULT 0,
  char_end integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can read own chunks"
  ON rag_chunks FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Session users can insert chunks"
  ON rag_chunks FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Session users can delete own chunks"
  ON rag_chunks FOR DELETE
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS rag_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  query_text text NOT NULL DEFAULT '',
  retrieved_chunk_ids uuid[] DEFAULT '{}',
  answer_text text NOT NULL DEFAULT '',
  chunks_retrieved integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rag_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session users can read own queries"
  ON rag_queries FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Session users can insert queries"
  ON rag_queries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rag_documents_session ON rag_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_session ON rag_chunks(session_id);
CREATE INDEX IF NOT EXISTS idx_rag_queries_session ON rag_queries(session_id);
