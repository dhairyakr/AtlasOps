import React, { useState } from 'react';
import { ChevronDown, ChevronUp, GitBranch, Wrench, Calendar, Database, Users, Lightbulb } from 'lucide-react';

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

export const AgentConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: GitBranch,
      title: 'ReAct Framework',
      term: 'Reason + Act Loop',
      description: 'ReAct interleaves reasoning traces (Thought) with grounded actions (Action) and observations (Observation). This synergy prevents hallucination by grounding reasoning in real tool outputs at each step.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Wrench,
      title: 'Tool Use',
      term: 'Function Calling',
      description: 'Modern LLMs can call external functions/APIs via structured JSON outputs. The model decides which tool to invoke and with what arguments — the host system executes the tool and returns the result to the model.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Calendar,
      title: 'Planning',
      term: 'Goal Decomposition',
      description: 'Agents decompose high-level goals into sequences of sub-tasks. Planning strategies include chain-of-thought, task decomposition prompts, and hierarchical planning where sub-agents handle specific domains.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Database,
      title: 'Memory Types',
      term: 'Short vs Long Term',
      description: 'Short-term memory is the context window — recent messages and observations. Long-term memory uses external storage (vector DB, SQL) for facts that persist across sessions. Episodic memory stores past experiences.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Multi-Agent Systems',
      term: 'Orchestration Patterns',
      description: 'Multiple specialized agents collaborate: an orchestrator decomposes tasks, sub-agents execute in parallel, a critic evaluates outputs, and a synthesizer combines results. This enables parallelism and specialization.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Lightbulb,
      title: 'Self-Reflection',
      term: 'Metacognitive Loops',
      description: 'Agents can evaluate their own outputs, identify failures, and retry with improved strategies. Reflexion and Self-Refine are frameworks where the agent critiques its own previous response before finalizing.',
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
