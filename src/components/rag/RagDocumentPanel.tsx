import React, { useRef, useState } from 'react';
import {
  Upload, FileText, Trash2, Loader2, CheckCircle2, X, Eye, Scan,
  Tag, FileType, BarChart3, ChevronDown, ChevronUp
} from 'lucide-react';
import { parseFileContent } from '../../utils/fileParsers';
import { saveDocument, deleteDocument, RagDocument } from '../../services/ragService';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';

interface IngestionStep {
  label: string;
  done: boolean;
  active: boolean;
}

interface RagDocumentPanelProps {
  sessionId: string;
  documents: RagDocument[];
  onDocumentAdded: (doc: RagDocument) => void;
  onDocumentDeleted: (docId: string) => void;
  onPipelineStep: (step: number) => void;
}

interface DocumentIntelligence {
  summary: string;
  topics: string[];
  documentType: string;
  complexityScore: number;
}

async function analyzeDocumentIntelligence(
  text: string,
  llm: LLMService
): Promise<DocumentIntelligence> {
  const gemini = llm;
  const sampleText = text.slice(0, 3000);
  const tailText = text.slice(-1000);

  const prompt = `Analyze this document and return a JSON object with exactly this structure:
{
  "summary": "2-3 sentence summary of what this document is about",
  "topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "documentType": "one of: research_paper | legal_document | technical_manual | article | report | book | code | spreadsheet | presentation | other",
  "complexityScore": 5
}

Rules:
- summary: plain English, no markdown, 2-3 sentences max
- topics: 4-6 key topic tags, single words or short phrases
- documentType: pick the best match from the options
- complexityScore: integer 1-10 (1=very simple, 10=highly technical/complex)
- Return ONLY the JSON, no explanation, no markdown code blocks

DOCUMENT START:
${sampleText}
...
${tailText}
DOCUMENT END`;

  try {
    const response = await gemini.generateResponse(prompt);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary ?? '',
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 6) : [],
      documentType: parsed.documentType ?? 'other',
      complexityScore: typeof parsed.complexityScore === 'number' ? Math.min(10, Math.max(1, parsed.complexityScore)) : 5,
    };
  } catch {
    return { summary: '', topics: [], documentType: 'other', complexityScore: 5 };
  }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  research_paper: 'Research Paper',
  legal_document: 'Legal Doc',
  technical_manual: 'Technical Manual',
  article: 'Article',
  report: 'Report',
  book: 'Book',
  code: 'Code',
  spreadsheet: 'Spreadsheet',
  presentation: 'Presentation',
  other: 'Document',
  unknown: 'Document',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  research_paper: 'from-sky-500/20 to-blue-500/20 border-sky-500/25 text-sky-300',
  legal_document: 'from-amber-500/20 to-yellow-500/20 border-amber-500/25 text-amber-300',
  technical_manual: 'from-violet-500/20 to-purple-500/20 border-violet-500/25 text-violet-300',
  article: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/25 text-emerald-300',
  report: 'from-orange-500/20 to-red-500/20 border-orange-500/25 text-orange-300',
  book: 'from-pink-500/20 to-rose-500/20 border-pink-500/25 text-pink-300',
  code: 'from-green-500/20 to-emerald-500/20 border-green-500/25 text-green-300',
  other: 'from-white/10 to-white/5 border-white/15 text-white/50',
  unknown: 'from-white/10 to-white/5 border-white/15 text-white/50',
};

const ComplexityBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = (score / 10) * 100;
  const color = score <= 3 ? 'from-emerald-500 to-teal-500' : score <= 6 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/30 w-4 text-right">{score}</span>
    </div>
  );
};

const DocumentCard: React.FC<{
  doc: RagDocument;
  onDelete: (id: string) => void;
  onPreview: (doc: RagDocument) => void;
}> = ({ doc, onDelete, onPreview }) => {
  const [expanded, setExpanded] = useState(false);
  const typeKey = doc.document_type ?? 'unknown';
  const typeColorClass = DOC_TYPE_COLORS[typeKey] ?? DOC_TYPE_COLORS.unknown;
  const typeLabel = DOC_TYPE_LABELS[typeKey] ?? 'Document';

  return (
    <div className="rounded-xl bg-white/4 border border-white/10 overflow-hidden group hover:border-white/20 transition-all duration-200">
      <div className="flex items-center gap-3 p-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500/25 to-emerald-500/25 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-white/85 truncate">{doc.title}</p>
            {doc.ocr_used && (
              <span className="flex-shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300">
                <Scan className="w-2.5 h-2.5" />
                OCR
              </span>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5">
            {doc.chunk_count} chunks · {doc.word_count.toLocaleString()} words
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPreview(doc)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-teal-400 hover:bg-teal-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
            title="Preview document info"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/8 transition-all duration-200"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDelete(doc.id)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-white/6 pt-2.5 space-y-3">
          {doc.document_summary && (
            <p className="text-xs text-white/50 leading-relaxed">{doc.document_summary}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {doc.document_type && doc.document_type !== 'unknown' && (
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r border ${typeColorClass}`}>
                <FileType className="w-2.5 h-2.5" />
                {typeLabel}
              </span>
            )}
            {(doc.document_topics ?? []).slice(0, 5).map(topic => (
              <span key={topic} className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/12 text-white/45 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {topic}
              </span>
            ))}
          </div>

          {doc.complexity_score !== undefined && (
            <div>
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-white/25" />
                <span className="text-xs text-white/30">Complexity</span>
              </div>
              <ComplexityBar score={doc.complexity_score} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const RagDocumentPanel: React.FC<RagDocumentPanelProps> = ({
  sessionId,
  documents,
  onDocumentAdded,
  onDocumentDeleted,
  onPipelineStep,
}) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingesting, setIngesting] = useState(false);
  const [steps, setSteps] = useState<IngestionStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<RagDocument | null>(null);

  const baseSteps: IngestionStep[] = [
    { label: 'Extracting text from document...', done: false, active: false },
    { label: 'Analyzing document intelligence...', done: false, active: false },
    { label: 'Building semantic chunks...', done: false, active: false },
    { label: 'Saving to knowledge base...', done: false, active: false },
  ];

  const runIngestion = async (file: File) => {
    setError(null);
    setIngesting(true);
    setSteps(baseSteps.map((s, i) => ({ ...s, active: i === 0 })));
    onPipelineStep(0);

    try {
      const llm = new LLMService(provider, geminiKey, groqKey);
      const parsed = await parseFileContent(file, geminiKey);

      if (!parsed.text || parsed.text.trim().length < 20) {
        throw new Error('Could not extract enough text from this file.');
      }

      const ocrUsed = parsed.metadata?.ocrUsed ?? false;

      setSteps(prev => prev.map((s, i) => ({ ...s, done: i < 1, active: i === 1 })));
      onPipelineStep(1);

      let intelligence: DocumentIntelligence = {
        summary: '',
        topics: [],
        documentType: 'other',
        complexityScore: 5,
      };

      if (geminiKey || groqKey) {
        try {
          intelligence = await analyzeDocumentIntelligence(parsed.text, llm);
        } catch {
          // non-fatal
        }
      }

      setSteps(prev => prev.map((s, i) => ({ ...s, done: i < 2, active: i === 2 })));
      onPipelineStep(1);

      await new Promise(r => setTimeout(r, 300));

      setSteps(prev => prev.map((s, i) => ({ ...s, done: i < 3, active: i === 3 })));
      onPipelineStep(2);

      const ext = file.name.split('.').pop() || 'txt';
      const result = await saveDocument(sessionId, file.name, ext, parsed.text, {
        summary: intelligence.summary,
        topics: intelligence.topics,
        documentType: intelligence.documentType,
        complexityScore: intelligence.complexityScore,
        ocrUsed,
      });

      if (!result) throw new Error('Failed to save document to database.');

      setSteps(prev => prev.map(s => ({ ...s, done: true, active: false })));
      onPipelineStep(3);
      onDocumentAdded(result.document);

      setTimeout(() => {
        setSteps([]);
        setIngesting(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed.');
      setIngesting(false);
      setSteps([]);
      onPipelineStep(-1);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    runIngestion(files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (docId: string) => {
    const ok = await deleteDocument(docId);
    if (ok) onDocumentDeleted(docId);
  };

  const totalChunks = documents.reduce((acc, d) => acc + d.chunk_count, 0);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Knowledge Base</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {documents.length} doc{documents.length !== 1 ? 's' : ''} · {totalChunks} chunks indexed
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !ingesting && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${
          dragging
            ? 'border-teal-400/60 bg-teal-500/10 scale-[1.01]'
            : ingesting
            ? 'border-white/10 bg-white/3 cursor-default'
            : 'border-white/12 bg-white/2 hover:border-teal-400/40 hover:bg-teal-500/5'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt,.md,.csv,.json,.xlsx,.pptx"
          onChange={e => handleFiles(e.target.files)}
          disabled={ingesting}
        />
        {ingesting ? (
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${dragging ? 'bg-teal-500/20' : 'bg-white/5'}`}>
            <Upload className={`w-5 h-5 transition-colors duration-200 ${dragging ? 'text-teal-400' : 'text-white/25'}`} />
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-white/60">
            {ingesting ? 'Processing document...' : dragging ? 'Drop to upload' : 'Drop file or click to upload'}
          </p>
          <p className="text-xs text-white/25 mt-1">PDF · DOCX · TXT · MD · CSV · JSON · XLSX · PPTX</p>
        </div>
      </div>

      {ingesting && steps.length > 0 && (
        <div className="rounded-xl bg-white/4 border border-white/10 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Ingestion Pipeline</p>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : step.active ? (
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0" />
                )}
              </div>
              <span className={`text-xs transition-all duration-200 ${
                step.done ? 'text-white/35 line-through' : step.active ? 'text-white/80' : 'text-white/22'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-500/8 border border-red-500/20 p-3">
          <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2 min-h-0">
        {documents.length === 0 && !ingesting && (
          <div className="text-center py-10 text-white/18 text-sm">
            No documents yet. Upload one to begin.
          </div>
        )}
        {documents.map(doc => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            onDelete={handleDelete}
            onPreview={setPreviewDoc}
          />
        ))}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewDoc(null)}>
          <div className="glass-premium border border-neo-tech-neon-violet/20 rounded-2xl max-w-md w-full p-5 shadow-cosmic-glow" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/25 to-emerald-500/25 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/90 truncate max-w-[220px]">{previewDoc.title}</p>
                  <p className="text-xs text-white/35 mt-0.5">{DOC_TYPE_LABELS[previewDoc.document_type ?? 'unknown']}</p>
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewDoc.document_summary && (
              <div className="mb-4 p-3 rounded-xl bg-white/4 border border-white/8">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">Summary</p>
                <p className="text-xs text-white/65 leading-relaxed">{previewDoc.document_summary}</p>
              </div>
            )}

            {(previewDoc.document_topics ?? []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {(previewDoc.document_topics ?? []).map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/12 border border-teal-500/20 text-teal-300/80">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Chunks', value: previewDoc.chunk_count },
                { label: 'Words', value: previewDoc.word_count.toLocaleString() },
                { label: 'Complexity', value: `${previewDoc.complexity_score ?? 5}/10` },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-white/4 border border-white/8 p-2.5 text-center">
                  <p className="text-sm font-bold text-white/80">{stat.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {previewDoc.ocr_used && (
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <Scan className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300/80">Extracted via Vision OCR (image-based PDF)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
