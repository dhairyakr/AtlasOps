import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, GitBranch, Brain, Terminal, MessageSquare, Layers, TreePine } from 'lucide-react';

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

export const PromptConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: Zap,
      title: 'Zero-Shot',
      term: 'Direct Instruction',
      description: 'The model receives only a task description with no examples. It relies entirely on knowledge from pre-training. Effective for general tasks but can be inconsistent on highly specific or nuanced problems.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: MessageSquare,
      title: 'One-Shot',
      term: 'Single Example',
      description: 'One labeled example is prepended to the prompt. The model pattern-matches the format and reasoning style of the example. Great for formatting tasks like JSON extraction or classification.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Layers,
      title: 'Few-Shot',
      term: 'In-Context Learning',
      description: 'Multiple input/output examples are injected into the prompt. This form of in-context learning does not update model weights — it primes the attention mechanism to follow demonstrated patterns.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Brain,
      title: 'Chain-of-Thought',
      term: 'Intermediate Reasoning',
      description: 'Adding "Let\'s think step by step" or including reasoning traces in examples dramatically improves accuracy on math, logic, and multi-hop questions by externalizing the reasoning process.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: TreePine,
      title: 'Tree-of-Thought',
      term: 'Search-Based Reasoning',
      description: 'The model explores multiple reasoning branches simultaneously, evaluates each path, and backtracks from dead ends. Particularly useful for planning, creative writing, and puzzles requiring exploration.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: GitBranch,
      title: 'Role Prompting',
      term: 'Persona Activation',
      description: 'Assigning a persona ("You are an expert oncologist") shifts the model\'s output distribution toward expert-level vocabulary, reasoning patterns, and framing specific to that domain.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Terminal,
      title: 'ReAct',
      term: 'Reason + Act',
      description: 'Interleaves reasoning traces with action calls (tool use). The model reasons about what to do, executes a tool, observes the result, then reasons again. Foundation of modern AI agents.',
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
