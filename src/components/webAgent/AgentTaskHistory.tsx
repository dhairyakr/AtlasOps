import React from 'react';
import { Clock, CheckCircle, XCircle, Trash2, ChevronRight } from 'lucide-react';
import { AgentTask } from '../../services/agentService';

interface AgentTaskHistoryProps {
  tasks: AgentTask[];
  activeTaskId: string | null;
  onSelectTask: (task: AgentTask) => void;
  onDeleteTask: (id: string) => void;
}

function formatElapsed(task: AgentTask): string {
  if (!task.completedAt) return 'Running...';
  const ms = task.completedAt - task.createdAt;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export const AgentTaskHistory: React.FC<AgentTaskHistoryProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
  onDeleteTask,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-8 h-8 text-white/20 mb-3" />
        <p className="text-sm text-white/35">No research history yet</p>
        <p className="text-xs text-white/25 mt-1">Run a goal to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...tasks].reverse().map((task) => {
        const isActive = task.id === activeTaskId;
        return (
          <div
            key={task.id}
            className={`group relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200
              ${isActive
                ? 'bg-cyan-500/10 border-cyan-500/30'
                : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/16'
              }`}
            onClick={() => onSelectTask(task)}
          >
            <div className="shrink-0 mt-0.5">
              {task.status === 'running' ? (
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              ) : task.status === 'done' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight truncate ${isActive ? 'text-white' : 'text-white/75'}`}>
                {task.goal}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/30">{timeAgo(task.createdAt)}</span>
                <span className="text-white/15">·</span>
                <span className="text-xs text-white/30">{formatElapsed(task)}</span>
                <span className="text-white/15">·</span>
                <span className="text-xs text-white/30">{task.steps.length} steps</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-white/20'}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
