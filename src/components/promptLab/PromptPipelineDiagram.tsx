import React from 'react';
import { PenLine, Database, Hash, Cpu, FileOutput } from 'lucide-react';

interface PromptPipelineDiagramProps {
  activeStep: number;
}

const steps = [
  { icon: PenLine, label: 'Write Prompt', desc: 'System + few-shot + user message composed', color: 'from-sky-500 to-cyan-500' },
  { icon: Database, label: 'Inject Context', desc: 'System instructions and examples prepended', color: 'from-teal-500 to-emerald-500' },
  { icon: Hash, label: 'Tokenize', desc: 'Text split into subword tokens via BPE/SentencePiece', color: 'from-amber-500 to-orange-500' },
  { icon: Cpu, label: 'Generate', desc: 'Transformer forward pass, autoregressive decoding', color: 'from-violet-500 to-purple-500' },
  { icon: FileOutput, label: 'Decode', desc: 'Token IDs mapped back to text, streamed to output', color: 'from-rose-500 to-pink-500' },
];

export const PromptPipelineDiagram: React.FC<PromptPipelineDiagramProps> = ({ activeStep }) => {
  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Prompt Pipeline</p>
      <div className="space-y-1">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeStep === i;
          const isDone = activeStep > i;
          return (
            <div key={i}>
              <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/8 border border-white/15' : 'border border-transparent'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-gradient-to-br ${isActive || isDone ? step.color : 'from-white/10 to-white/5'}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive || isDone ? 'text-white' : 'text-white/30'}`} />
                </div>
                <div>
                  <p className={`text-xs font-semibold transition-colors duration-300 ${isActive ? 'text-white' : isDone ? 'text-white/60' : 'text-white/30'}`}>{step.label}</p>
                  <p className={`text-xs transition-colors duration-300 ${isActive ? 'text-white/60' : 'text-white/20'}`}>{step.desc}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className={`ml-[18px] w-px h-3 transition-colors duration-300 ${isDone ? 'bg-white/30' : 'bg-white/10'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
