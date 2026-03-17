import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Scale, Shield, AlertTriangle, Heart, Users, Search } from 'lucide-react';

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

export const EthicsConceptPanel: React.FC = () => {
  const concepts = [
    {
      icon: Scale,
      title: 'Types of AI Bias',
      term: 'Representation & Measurement',
      description: 'Bias enters through training data (representation bias), label collection (measurement bias), model architecture (inductive bias), and deployment (deployment bias). Mitigating one often introduces another.',
      color: 'from-rose-500 to-pink-500',
    },
    {
      icon: Shield,
      title: 'AI Safety & Alignment',
      term: 'Goal Misspecification',
      description: 'Alignment is the problem of ensuring AI systems pursue goals beneficial to humans. Misaligned systems can be deceptive (saying what users want to hear) or reward-hacking (exploiting specification gaps).',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: AlertTriangle,
      title: 'Hallucination',
      term: 'Confabulation',
      description: 'LLMs generate plausible-sounding but factually incorrect content because they predict statistically likely token sequences, not truth. Mitigation: RAG, citation grounding, calibrated uncertainty, chain-of-thought.',
      color: 'from-sky-500 to-cyan-500',
    },
    {
      icon: Heart,
      title: 'RLHF & Constitutional AI',
      term: 'Value Learning',
      description: 'RLHF trains a model to match human preferences. Constitutional AI (Anthropic) uses a set of principles to self-critique and revise responses, reducing reliance on human annotators for harmlessness.',
      color: 'from-teal-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Responsible AI',
      term: 'Fairness, Accountability, Transparency',
      description: 'The FAT framework: models should be fair across demographic groups, developers should be accountable for harms, and model decisions should be explainable. Fairness definitions (demographic parity, equalized odds) can conflict.',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Search,
      title: 'Red Teaming',
      term: 'Adversarial Probing',
      description: 'Systematic testing of AI models for unsafe behavior using adversarial prompts. Includes jailbreaks (bypassing safety), prompt injection (hijacking via context), and persona attacks (persona override to remove filters).',
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
