import React from 'react';
import { FileText, Scissors, Database, Search, Cpu, MessageSquare, ArrowRight } from 'lucide-react';

interface PipelineStep {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  color: string;
  active: boolean;
  done: boolean;
}

interface RagPipelineDiagramProps {
  activeStep: number;
}

export const RagPipelineDiagram: React.FC<RagPipelineDiagramProps> = ({ activeStep }) => {
  const steps: PipelineStep[] = [
    {
      icon: FileText,
      label: 'Extract',
      sublabel: 'Parse raw text from document',
      color: 'from-sky-500 to-cyan-500',
      active: activeStep === 0,
      done: activeStep > 0,
    },
    {
      icon: Scissors,
      label: 'Chunk',
      sublabel: 'Split into overlapping segments',
      color: 'from-teal-500 to-emerald-500',
      active: activeStep === 1,
      done: activeStep > 1,
    },
    {
      icon: Database,
      label: 'Store',
      sublabel: 'Persist chunks in vector store',
      color: 'from-emerald-500 to-green-500',
      active: activeStep === 2,
      done: activeStep > 2,
    },
    {
      icon: Search,
      label: 'Retrieve',
      sublabel: 'Find relevant chunks by query',
      color: 'from-amber-500 to-orange-500',
      active: activeStep === 3,
      done: activeStep > 3,
    },
    {
      icon: Cpu,
      label: 'Augment',
      sublabel: 'Inject context into LLM prompt',
      color: 'from-orange-500 to-red-500',
      active: activeStep === 4,
      done: activeStep > 4,
    },
    {
      icon: MessageSquare,
      label: 'Generate',
      sublabel: 'LLM produces grounded answer',
      color: 'from-rose-500 to-pink-500',
      active: activeStep === 5,
      done: activeStep > 5,
    },
  ];

  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">RAG Pipeline</p>
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                  step.active
                    ? `bg-gradient-to-br ${step.color} shadow-lg scale-110`
                    : step.done
                    ? `bg-gradient-to-br ${step.color} opacity-60`
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${step.active || step.done ? 'text-white' : 'text-white/30'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold transition-colors duration-300 ${step.active ? 'text-white' : step.done ? 'text-white/60' : 'text-white/30'}`}>
                  {step.label}
                </div>
                <div className={`text-xs transition-colors duration-300 truncate ${step.active ? 'text-white/70' : 'text-white/20'}`}>
                  {step.sublabel}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
