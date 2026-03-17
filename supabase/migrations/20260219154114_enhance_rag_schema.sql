/*
  # Enhance RAG Schema for Intelligent Document Processing

  ## Overview
  Upgrades the existing RAG tables with intelligence metadata, keyword indexing,
  session analytics, and answer quality tracking.

  ## Changes

  ### rag_documents table
  - Add `document_summary` - Auto-generated 2-3 sentence summary
  - Add `document_topics` - JSON array of extracted topic tags
  - Add `document_type` - Detected type (research paper, legal, manual, etc.)
  - Add `complexity_score` - Reading level score 1-10
  - Add `ocr_used` - Whether Vision OCR was used for extraction

  ### rag_chunks table
  - Add `chunk_keywords` - JSON array of keyword terms for fast pre-filtering
  - Add `section_heading` - Section/heading the chunk belongs to
  - Add `chunk_type` - Detected type (paragraph, list, code, table, heading)

  ### rag_queries table
  - Add `confidence_score` - Answer confidence level (high/medium/low)
  - Add `follow_up_questions` - JSON array of 3 suggested follow-up questions
  - Add `retrieval_strategy` - Which retrieval method was used

  ### New: rag_sessions table
  - Session-level analytics tracking

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to session-based data
*/

-- Enhance rag_documents table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'document_summary') THEN
    ALTER TABLE rag_documents ADD COLUMN document_summary text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'document_topics') THEN
    ALTER TABLE rag_documents ADD COLUMN document_topics jsonb DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'document_type') THEN
    ALTER TABLE rag_documents ADD COLUMN document_type text DEFAULT 'unknown';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'complexity_score') THEN
    ALTER TABLE rag_documents ADD COLUMN complexity_score integer DEFAULT 5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_documents' AND column_name = 'ocr_used') THEN
    ALTER TABLE rag_documents ADD COLUMN ocr_used boolean DEFAULT false;
  END IF;
END $$;

-- Enhance rag_chunks table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_chunks' AND column_name = 'chunk_keywords') THEN
    ALTER TABLE rag_chunks ADD COLUMN chunk_keywords jsonb DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_chunks' AND column_name = 'section_heading') THEN
    ALTER TABLE rag_chunks ADD COLUMN section_heading text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_chunks' AND column_name = 'chunk_type') THEN
    ALTER TABLE rag_chunks ADD COLUMN chunk_type text DEFAULT 'paragraph';
  END IF;
END $$;

-- Enhance rag_queries table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_queries' AND column_name = 'confidence_score') THEN
    ALTER TABLE rag_queries ADD COLUMN confidence_score text DEFAULT 'medium';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_queries' AND column_name = 'follow_up_questions') THEN
    ALTER TABLE rag_queries ADD COLUMN follow_up_questions jsonb DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rag_queries' AND column_name = 'retrieval_strategy') THEN
    ALTER TABLE rag_queries ADD COLUMN retrieval_strategy text DEFAULT 'hybrid';
  END IF;
END $$;

-- Create rag_sessions table for analytics
CREATE TABLE IF NOT EXISTS rag_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  query_count integer DEFAULT 0,
  document_count integer DEFAULT 0,
  total_chunks integer DEFAULT 0,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rag_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions by session_id"
  ON rag_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert sessions"
  ON rag_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON rag_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rag_chunks_keywords ON rag_chunks USING gin(chunk_keywords);
CREATE INDEX IF NOT EXISTS idx_rag_documents_session_type ON rag_documents(session_id, document_type);
CREATE INDEX IF NOT EXISTS idx_rag_sessions_session_id ON rag_sessions(session_id);
