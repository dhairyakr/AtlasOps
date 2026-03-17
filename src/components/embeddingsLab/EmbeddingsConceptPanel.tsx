import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GitMerge, Database, Search, Ruler, Hash, Zap } from 'lucide-react';

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

export const EmbeddingsConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: GitMerge,
      title: 'What are Embeddings',
      term: 'Dense Vector Representations',
      description: 'Embeddings map text to points in a high-dimensional vector space (e.g., 768 or 1536 dimensions). Semantically similar texts are mapped to nearby points. This allows semantic search without keyword matching.',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Hash,
      title: 'Dense vs Sparse',
      term: 'Neural vs. BM25',
      description: 'Sparse vectors (TF-IDF, BM25) are high-dimensional with most values zero — great for keyword overlap. Dense vectors are low-dimensional and capture meaning. Hybrid search combines both for best recall.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Ruler,
      title: 'Similarity Metrics',
      term: 'Cosine, Dot, Euclidean',
      description: 'Cosine similarity measures the angle between vectors (ignores magnitude, good for normalized embeddings). Dot product also considers magnitude. Euclidean distance measures straight-line distance in the vector space.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Database,
      title: 'Vector Databases',
      term: 'FAISS, Pinecone, pgvector',
      description: 'Vector databases store and index millions of embeddings for fast retrieval. They support approximate nearest neighbor (ANN) search using algorithms like HNSW or IVF, trading tiny accuracy loss for massive speed gains.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Search,
      title: 'ANN Search',
      term: 'Approximate Nearest Neighbor',
      description: 'Exact nearest-neighbor search is O(n) and too slow at scale. ANN algorithms (HNSW, IVF, ANNOY) build index structures that find near-exact neighbors in O(log n) or O(1) time with controllable recall tradeoffs.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Embedding Models',
      term: 'BERT, E5, GTE, OpenAI',
      description: 'Encoder-only models (BERT, RoBERTa) produce contextual embeddings. Sentence-transformers (SBERT) fine-tune these for semantic similarity. OpenAI text-embedding-3-small and E5 are state-of-the-art for RAG.',
      color: 'from-green-500 to-teal-500',
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
