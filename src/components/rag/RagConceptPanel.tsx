import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Layers, Cpu, Search, Database } from 'lucide-react';

interface ConceptCardProps {
  icon: React.ElementType;
  title: string;
  term: string;
  description: string;
  color: string;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ icon: Icon, title, term, description, color }) => {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left rounded-xl border border-white/10 bg-transparent hover:border-white/20 transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white/80">{title}</div>
          <div className={`text-xs font-mono bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{term}</div>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
      </div>
      {open && (
        <div className="px-3 pb-3 text-xs text-white/50 leading-relaxed border-t border-white/5 pt-2">
          {description}
        </div>
      )}
    </button>
  );
};

export const RagConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: Layers,
      title: 'Chunking',
      term: 'NLP Tokenization',
      description: 'Large documents are split into smaller, overlapping text segments called chunks. Overlap (typically 10-15%) ensures that context spanning chunk boundaries is not lost. Chunk size is a key hyperparameter — too small loses context, too large reduces retrieval precision.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Database,
      title: 'Vector Store',
      term: 'Semantic Indexing',
      description: 'In production RAG systems, chunks are converted to dense vector embeddings using encoder models (like BERT or sentence-transformers). These vectors are stored in a vector database (Pinecone, FAISS, pgvector). Here we simulate this using LLM-based relevance scoring.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Search,
      title: 'Retrieval',
      term: 'Semantic Search',
      description: 'At query time, the query is also embedded and cosine similarity is computed against all chunk embeddings. The top-k most similar chunks are retrieved. This is fundamentally a nearest-neighbor search problem in high-dimensional vector space.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Cpu,
      title: 'Augmentation',
      term: 'Prompt Engineering',
      description: 'Retrieved chunks are injected into the LLM prompt as context. This is the "augmentation" in RAG. The LLM is instructed to answer only from the provided context, grounding its response in your documents and preventing hallucination.',
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Key Concepts</p>
      {concepts.map(c => (
        <ConceptCard key={c.title} {...c} />
      ))}
    </div>
  );
};
