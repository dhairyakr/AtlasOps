import React from 'react';
import { Search, Brain, Cloud, Calculator, BookOpen, Layers, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { AgentStep } from '../../services/agentService';

interface AgentStepFeedProps {
  steps: AgentStep[];
}

const stepIcons: Record<AgentStep['type'], React.FC<{ className?: string }>> = {
  think: Brain,
  search: Search,
  weather: Cloud,
  calculate: Calculator,
  wikipedia: BookOpen,
  synthesize: Layers,
  action: Zap,
};

const stepColors: Record<AgentStep['type'], string> = {
  think: 'text-sky-400',
  search: 'text-emerald-400',
  weather: 'text-blue-400',
  calculate: 'text-amber-400',
  wikipedia: 'text-orange-400',
  synthesize: 'text-cyan-400',
  action: 'text-rose-400',
};

const stepBg: Record<AgentStep['type'], string> = {
  think: 'bg-sky-500/10 border-sky-500/20',
  search: 'bg-emerald-500/10 border-emerald-500/20',
  weather: 'bg-blue-500/10 border-blue-500/20',
  calculate: 'bg-amber-500/10 border-amber-500/20',
  wikipedia: 'bg-orange-500/10 border-orange-500/20',
  synthesize: 'bg-cyan-500/10 border-cyan-500/20',
  action: 'bg-rose-500/10 border-rose-500/20',
};

function ElapsedBadge({ step }: { step: AgentStep }) {
  if (!step.startedAt) return null;
  const end = step.completedAt ?? Date.now();
  const ms = end - step.startedAt;
  const label = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  return (
    <span className="text-xs text-white/30 ml-auto shrink-0">{label}</span>
  );
}

export const AgentStepFeed: React.FC<AgentStepFeedProps> = ({ steps }) => {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const Icon = stepIcons[step.type] ?? Brain;
        const colorClass = stepColors[step.type] ?? 'text-white/60';
        const bgClass = stepBg[step.type] ?? 'bg-white/5 border-white/10';

        return (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-xl border ${bgClass} transition-all duration-300`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className={`mt-0.5 shrink-0 ${colorClass}`}>
              {step.status === 'running' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step.status === 'done' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : step.status === 'error' ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : (
                <Icon className="w-4 h-4 opacity-40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${step.status === 'running' ? 'text-white' : step.status === 'done' ? 'text-white/80' : 'text-white/50'}`}>
                  {step.label}
                </span>
                <ElapsedBadge step={step} />
              </div>
              {step.detail && step.status !== 'done' && (
                <p className="text-xs text-white/40 mt-0.5 truncate">{step.detail}</p>
              )}
              {step.result && step.status === 'done' && (
                <p className="text-xs text-white/55 mt-1 line-clamp-2">{step.result}</p>
              )}
              {step.result && step.status === 'error' && (
                <p className="text-xs text-red-400/80 mt-1">{step.result}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
