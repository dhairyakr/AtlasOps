import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Grid3x3, Link, Cpu, Eye, FileText, Zap } from 'lucide-react';

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

export const MultimodalConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: Grid3x3,
      title: 'Vision Transformers',
      term: 'ViT Architecture',
      description: 'ViT splits an image into fixed-size patches (e.g., 16x16 pixels), linearly embeds each patch, adds positional encodings, and processes them through a standard transformer encoder. This treats image patches exactly like text tokens.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Link,
      title: 'CLIP',
      term: 'Contrastive Learning',
      description: 'CLIP (Contrastive Language-Image Pretraining) trains image and text encoders jointly using contrastive loss — pushing matching image-text pairs together and non-matching pairs apart in a shared embedding space.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Cpu,
      title: 'Multimodal Fusion',
      term: 'Cross-Modal Attention',
      description: 'Models like Gemini and GPT-4V fuse visual and text tokens via cross-attention. The text decoder can attend to image patch embeddings, allowing fine-grained visual reasoning over specific image regions.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Eye,
      title: 'Patch Embeddings',
      term: 'Visual Tokenization',
      description: 'Images are tokenized into a grid of patches. Each patch becomes a vector via a linear projection layer. More patches = finer detail but longer sequence (ViT-H uses 14x14 patches for 336px images = 576 visual tokens).',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: FileText,
      title: 'OCR vs. Vision',
      term: 'Text Extraction Types',
      description: 'Classic OCR (Tesseract, AWS Textract) uses CV pipelines to detect and transcribe text. Vision LLMs "read" text contextually — they understand layout, formatting, and meaning, not just characters.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Zap,
      title: 'Multimodal Prompting',
      term: 'Visual Instruction Tuning',
      description: 'Models fine-tuned on (image, instruction, response) triplets can follow complex visual instructions. This allows tasks like "circle all errors in this code screenshot" or "describe the mood of this painting."',
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
