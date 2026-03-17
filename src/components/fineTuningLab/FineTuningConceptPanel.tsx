import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sliders, Award, Scissors, BookOpen, Cpu, Thermometer } from 'lucide-react';

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

export const FineTuningConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: Cpu,
      title: 'What is Fine-Tuning',
      term: 'Weight Adaptation',
      description: 'Fine-tuning updates a pre-trained model\'s weights on a task-specific dataset. Unlike prompt engineering, it permanently shifts the model\'s behavior, often improving accuracy and reducing latency for specific tasks.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Award,
      title: 'RLHF',
      term: 'Human Feedback Alignment',
      description: 'Reinforcement Learning from Human Feedback trains a reward model on human preference data, then uses PPO to update the LLM to maximize the reward model score. This is how ChatGPT, Claude, and Gemini are aligned.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Scissors,
      title: 'LoRA / PEFT',
      term: 'Low-Rank Adaptation',
      description: 'Low-Rank Adaptation freezes the base model and adds small trainable matrices (rank decomposition) to attention layers. Reduces trainable parameters by 99% vs. full fine-tuning while achieving comparable performance.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: BookOpen,
      title: 'Instruction Tuning',
      term: 'FLAN / Alpaca Style',
      description: 'Training on thousands of (instruction, response) pairs generalizes the model\'s ability to follow natural language instructions. This is what turns a base language model into an instruction-following assistant.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Sliders,
      title: 'Base vs. Instruction Model',
      term: 'Pre-training vs. Alignment',
      description: 'Base models predict the next token from raw web data — they complete text, not instructions. Instruction-tuned models are fine-tuned on human conversations, making them respond to queries as assistants.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Thermometer,
      title: 'Temperature',
      term: 'Output Randomness',
      description: 'Temperature T scales logits before softmax. T→0 makes outputs deterministic (always pick top token). T→2 flattens the distribution, increasing diversity but also incoherence. Typical range: 0.1 (factual) to 1.5 (creative).',
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
