import React from 'react';
import { Image, Grid3x3, Cpu, GitMerge, Hash, Wand2 } from 'lucide-react';

interface MultimodalPipelineDiagramProps {
  activeStep: number;
}

const steps = [
  { icon: Image, label: 'Image Input', desc: 'JPG/PNG uploaded and base64 encoded', color: 'from-sky-500 to-cyan-500' },
  { icon: Grid3x3, label: 'Patch Embedding', desc: 'Image split into 16x16 patches, linearly projected', color: 'from-teal-500 to-emerald-500' },
  { icon: Cpu, label: 'Vision Encoder', desc: 'ViT processes visual tokens through self-attention', color: 'from-amber-500 to-orange-500' },
  { icon: GitMerge, label: 'Cross-Attention Fusion', desc: 'Text and image token streams merged', color: 'from-violet-500 to-purple-500' },
  { icon: Hash, label: 'Text Tokens', desc: 'Instruction and context tokenized alongside vision', color: 'from-rose-500 to-pink-500' },
  { icon: Wand2, label: 'Output', desc: 'Decoder generates multimodally-grounded response', color: 'from-green-500 to-emerald-500' },
];

export const MultimodalPipelineDiagram: React.FC<MultimodalPipelineDiagramProps> = ({ activeStep }) => {
  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Vision Pipeline</p>
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
