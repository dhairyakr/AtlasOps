import { supabase } from './supabaseClient';

export interface RagDocument {
  id: string;
  session_id: string;
  title: string;
  file_type: string;
  char_count: number;
  word_count: number;
  chunk_count: number;
  created_at: string;
  document_summary?: string;
  document_topics?: string[];
  document_type?: string;
  complexity_score?: number;
  ocr_used?: boolean;
}

export interface RagChunk {
  id: string;
  document_id: string;
  session_id: string;
  chunk_index: number;
  chunk_text: string;
  char_start: number;
  char_end: number;
  created_at: string;
  relevance_score?: number;
  chunk_keywords?: string[];
  section_heading?: string;
  chunk_type?: string;
}

export interface RagQuery {
  id: string;
  session_id: string;
  query_text: string;
  retrieved_chunk_ids: string[];
  answer_text: string;
  chunks_retrieved: number;
  created_at: string;
  confidence_score?: string;
  follow_up_questions?: string[];
  retrieval_strategy?: string;
}

export function getOrCreateSessionId(userId?: string | null): string {
  if (userId) return userId;
  const key = 'rag_lab_session_id';
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(key, sid);
  }
  return sid;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'its', 'our', 'their', 'not', 'if', 'can', 'also', 'as', 'so', 'than',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));
  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function detectChunkType(text: string): string {
  const trimmed = text.trim();
  if (/^(#{1,6}|\*\*[^*]+\*\*|[A-Z][A-Z\s]{5,}:)/.test(trimmed)) return 'heading';
  if (/^(\s*[-*•]\s|\s*\d+\.\s)/.test(trimmed) || (trimmed.match(/\n\s*[-*•]/g) || []).length > 2) return 'list';
  if (/```|^\s{4}|\t/.test(trimmed) && /[{};=()]/.test(trimmed)) return 'code';
  if (/\|.*\|/.test(trimmed) && (trimmed.match(/\|/g) || []).length > 4) return 'table';
  return 'paragraph';
}

function detectSectionHeading(text: string, precedingText: string): string {
  const headingPatterns = [
    /^#{1,4}\s+(.+)$/m,
    /^([A-Z][A-Za-z\s]{3,50})\n/,
    /\*\*([^*]{5,60})\*\*/,
    /^(\d+\.\s+[A-Z][A-Za-z\s]{3,50})\n/m,
  ];
  for (const pattern of headingPatterns) {
    const match = precedingText.slice(-300).match(pattern);
    if (match) return match[1].trim().slice(0, 80);
  }
  return '';
}

export function semanticChunkText(
  text: string
): Array<{ text: string; charStart: number; charEnd: number; keywords: string[]; chunkType: string; sectionHeading: string }> {
  const TARGET_MIN = 150;
  const TARGET_MAX = 400;
  const OVERLAP_SENTENCES = 1;

  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(p => p.length > 10);

  const chunks: Array<{
    text: string;
    charStart: number;
    charEnd: number;
    keywords: string[];
    chunkType: string;
    sectionHeading: string;
  }> = [];

  let currentChunk = '';
  let currentStart = 0;
  let charOffset = 0;
  let overlapBuffer = '';

  for (const para of paragraphs) {
    const paraStart = text.indexOf(para, charOffset);
    const wordCount = para.split(/\s+/).length;

    if (wordCount > TARGET_MAX) {
      if (currentChunk.trim()) {
        const chunkStart = text.indexOf(currentChunk.trim(), currentStart);
        chunks.push({
          text: currentChunk.trim(),
          charStart: Math.max(0, chunkStart),
          charEnd: chunkStart + currentChunk.trim().length,
          keywords: extractKeywords(currentChunk),
          chunkType: detectChunkType(currentChunk),
          sectionHeading: detectSectionHeading(currentChunk, text.slice(0, chunkStart)),
        });
        const sentences = currentChunk.trim().split(/(?<=[.!?])\s+/);
        overlapBuffer = sentences.slice(-OVERLAP_SENTENCES).join(' ');
        currentChunk = overlapBuffer + ' ';
        currentStart = chunkStart + currentChunk.length;
      }

      const sentences = para.split(/(?<=[.!?])\s+/);
      let sentenceChunk = overlapBuffer ? overlapBuffer + ' ' : '';
      let sentenceStart = paraStart;

      for (const sentence of sentences) {
        const nextChunk = sentenceChunk + sentence + ' ';
        const nextWordCount = nextChunk.split(/\s+/).length;

        if (nextWordCount >= TARGET_MIN && nextWordCount <= TARGET_MAX) {
          const cStart = text.indexOf(sentenceChunk.trim(), sentenceStart);
          chunks.push({
            text: nextChunk.trim(),
            charStart: Math.max(0, cStart),
            charEnd: cStart + nextChunk.trim().length,
            keywords: extractKeywords(nextChunk),
            chunkType: detectChunkType(nextChunk),
            sectionHeading: detectSectionHeading(nextChunk, text.slice(0, Math.max(0, cStart))),
          });
          const lastSentences = nextChunk.trim().split(/(?<=[.!?])\s+/);
          overlapBuffer = lastSentences.slice(-OVERLAP_SENTENCES).join(' ');
          sentenceChunk = overlapBuffer + ' ';
          sentenceStart = cStart + nextChunk.trim().length;
        } else if (nextWordCount > TARGET_MAX) {
          if (sentenceChunk.trim()) {
            const cStart = text.indexOf(sentenceChunk.trim(), sentenceStart);
            chunks.push({
              text: sentenceChunk.trim(),
              charStart: Math.max(0, cStart),
              charEnd: cStart + sentenceChunk.trim().length,
              keywords: extractKeywords(sentenceChunk),
              chunkType: detectChunkType(sentenceChunk),
              sectionHeading: detectSectionHeading(sentenceChunk, text.slice(0, Math.max(0, cStart))),
            });
            overlapBuffer = sentence;
            sentenceChunk = sentence + ' ';
            sentenceStart = cStart + sentenceChunk.trim().length;
          } else {
            sentenceChunk = nextChunk;
          }
        } else {
          sentenceChunk = nextChunk;
        }
      }

      if (sentenceChunk.trim().length > 50) {
        currentChunk = sentenceChunk;
        currentStart = text.indexOf(sentenceChunk.trim(), sentenceStart);
      }

      charOffset = paraStart + para.length;
      continue;
    }

    const combinedWordCount = (currentChunk + ' ' + para).split(/\s+/).length;

    if (combinedWordCount <= TARGET_MAX) {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    } else {
      if (currentChunk.trim()) {
        const cStart = text.indexOf(currentChunk.trim(), currentStart);
        chunks.push({
          text: currentChunk.trim(),
          charStart: Math.max(0, cStart),
          charEnd: cStart + currentChunk.trim().length,
          keywords: extractKeywords(currentChunk),
          chunkType: detectChunkType(currentChunk),
          sectionHeading: detectSectionHeading(currentChunk, text.slice(0, Math.max(0, cStart))),
        });
        const sentences = currentChunk.trim().split(/(?<=[.!?])\s+/);
        overlapBuffer = sentences.slice(-OVERLAP_SENTENCES).join(' ');
        currentStart = cStart + currentChunk.trim().length;
      }
      currentChunk = (overlapBuffer ? overlapBuffer + '\n\n' : '') + para;
    }

    charOffset = paraStart + para.length;
  }

  if (currentChunk.trim().length > 50) {
    const cStart = text.indexOf(currentChunk.trim(), currentStart);
    chunks.push({
      text: currentChunk.trim(),
      charStart: Math.max(0, cStart),
      charEnd: cStart + currentChunk.trim().length,
      keywords: extractKeywords(currentChunk),
      chunkType: detectChunkType(currentChunk),
      sectionHeading: detectSectionHeading(currentChunk, text.slice(0, Math.max(0, cStart))),
    });
  }

  return chunks.filter(c => c.text.split(/\s+/).length >= 10);
}

export function keywordScore(query: string, chunkKeywords: string[]): number {
  const queryTerms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (queryTerms.length === 0 || chunkKeywords.length === 0) return 0;

  let matches = 0;
  for (const term of queryTerms) {
    if (chunkKeywords.some(k => k.includes(term) || term.includes(k))) {
      matches++;
    }
  }
  return matches / queryTerms.length;
}

export function hybridPreFilter(
  query: string,
  chunks: RagChunk[],
  topK = 25
): RagChunk[] {
  if (chunks.length <= topK) return chunks;

  const scored = chunks.map(chunk => ({
    chunk,
    score: keywordScore(query, chunk.chunk_keywords ?? []),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(s => s.chunk);
}

export async function saveDocument(
  sessionId: string,
  title: string,
  fileType: string,
  text: string,
  intelligence?: {
    summary?: string;
    topics?: string[];
    documentType?: string;
    complexityScore?: number;
    ocrUsed?: boolean;
  }
): Promise<{ document: RagDocument; chunks: RagChunk[] } | null> {
  const rawChunks = semanticChunkText(text);

  const { data: doc, error: docError } = await supabase
    .from('rag_documents')
    .insert({
      session_id: sessionId,
      title,
      file_type: fileType,
      char_count: text.length,
      word_count: text.split(/\s+/).filter(Boolean).length,
      chunk_count: rawChunks.length,
      document_summary: intelligence?.summary ?? '',
      document_topics: intelligence?.topics ?? [],
      document_type: intelligence?.documentType ?? 'unknown',
      complexity_score: intelligence?.complexityScore ?? 5,
      ocr_used: intelligence?.ocrUsed ?? false,
    })
    .select()
    .single();

  if (docError || !doc) {
    console.error('Error saving document:', docError);
    return null;
  }

  const chunkInserts = rawChunks.map((c, i) => ({
    document_id: doc.id,
    session_id: sessionId,
    chunk_index: i,
    chunk_text: c.text,
    char_start: c.charStart,
    char_end: c.charEnd,
    chunk_keywords: c.keywords,
    chunk_type: c.chunkType,
    section_heading: c.sectionHeading,
  }));

  const { data: savedChunks, error: chunkError } = await supabase
    .from('rag_chunks')
    .insert(chunkInserts)
    .select();

  if (chunkError || !savedChunks) {
    console.error('Error saving chunks:', chunkError);
    return null;
  }

  return { document: doc as RagDocument, chunks: savedChunks as RagChunk[] };
}

export async function getDocuments(sessionId: string): Promise<RagDocument[]> {
  const { data, error } = await supabase
    .from('rag_documents')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
  return (data as RagDocument[]) || [];
}

export async function getChunksBySession(sessionId: string): Promise<RagChunk[]> {
  const { data, error } = await supabase
    .from('rag_chunks')
    .select('*')
    .eq('session_id', sessionId)
    .order('document_id', { ascending: true })
    .order('chunk_index', { ascending: true });

  if (error) {
    console.error('Error fetching chunks:', error);
    return [];
  }
  return (data as RagChunk[]) || [];
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('rag_documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Error deleting document:', error);
    return false;
  }
  return true;
}

export async function saveQuery(
  sessionId: string,
  queryText: string,
  retrievedChunkIds: string[],
  answerText: string,
  confidenceScore?: string,
  followUpQuestions?: string[],
  retrievalStrategy?: string
): Promise<RagQuery | null> {
  const { data, error } = await supabase
    .from('rag_queries')
    .insert({
      session_id: sessionId,
      query_text: queryText,
      retrieved_chunk_ids: retrievedChunkIds,
      answer_text: answerText,
      chunks_retrieved: retrievedChunkIds.length,
      confidence_score: confidenceScore ?? 'medium',
      follow_up_questions: followUpQuestions ?? [],
      retrieval_strategy: retrievalStrategy ?? 'hybrid',
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving query:', error);
    return null;
  }
  return data as RagQuery;
}

export async function getQueryHistory(sessionId: string): Promise<RagQuery[]> {
  const { data, error } = await supabase
    .from('rag_queries')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching query history:', error);
    return [];
  }
  return (data as RagQuery[]) || [];
}
