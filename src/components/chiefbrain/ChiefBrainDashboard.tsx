import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Inbox, Target, Zap, Activity, AlertTriangle,
  ArrowRight, Sparkles, RefreshCw, TrendingUp
} from 'lucide-react';
import { Memory, Pattern, Goal, ChiefAction, InboxItem, ChiefBrainView } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  memories: Memory[];
  patterns: Pattern[];
  goals: Goal[];
  actions: ChiefAction[];
  inboxItems: InboxItem[];
  onNavigate: (view: ChiefBrainView) => void;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const categoryColors: Record<string, string> = {
  regret: '#ef4444', energy: '#10b981', decision: '#3b82f6',
  communication: '#f59e0b', financial: '#06b6d4', behavior: '#8b5cf6',
  preference: '#ec4899', relationship: '#84cc16',
};

const priorityColors: Record<string, string> = {
  urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  skip: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`rounded-lg bg-white/[0.04] animate-pulse ${className}`} />;
}

export function ChiefBrainDashboard({ memories, patterns, goals, actions, inboxItems, onNavigate, getAI, addToast }: Props) {
  const [brief, setBrief] = useState<{ greeting: string; brief: string; focus: string } | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);

  const urgentInbox = inboxItems.filter(i => !i.is_handled && (i.priority === 'urgent' || i.priority === 'high'));
  const pendingActions = actions.filter(a => a.status === 'pending');
  const driftingGoals = goals.filter(g => g.drift_alert && g.status === 'active');
  const activeGoals = goals.filter(g => g.status === 'active');
  const topPatterns = [...patterns].sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 3);
  const recentMemories = memories.slice(0, 4);

  const now = new Date();
  const hour = now.getHours();
  const timeLabel = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const generateBrief = useCallback(async () => {
    const ai = getAI();
    if (!ai) {
      addToast('Configure an AI key in Settings to generate briefs', 'info');
      return;
    }
    setBriefLoading(true);
    try {
      const result = await ai.generateDailyBrief({ memories, goals, actions, inboxItems, patterns });
      setBrief(result);
      setBriefGenerated(true);
    } catch {
      addToast('Failed to generate brief', 'error');
    } finally {
      setBriefLoading(false);
    }
  }, [getAI, memories, goals, actions, inboxItems, patterns, addToast]);

  useEffect(() => {
    if (!briefGenerated && memories.length > 0) {
      generateBrief();
    }
  }, [memories.length]);

  const regretRate = actions.length > 0
    ? Math.round((actions.filter(a => a.regret_logged).length / actions.filter(a => a.status === 'completed' || a.status === 'regretted').length || 0) * 100)
    : 0;

  const stats = [
    { label: 'Memories', value: memories.length.toString(), sub: `${memories.filter(m => m.is_pinned).length} pinned`, icon: Brain, color: '#8b5cf6', view: 'memory' as ChiefBrainView },
    { label: 'Inbox', value: urgentInbox.length > 0 ? `${urgentInbox.length} urgent` : 'Clear', sub: `${inboxItems.filter(i => !i.is_handled).length} unhandled`, icon: Inbox, color: urgentInbox.length > 0 ? '#ef4444' : '#10b981', view: 'inbox' as ChiefBrainView },
    { label: 'Actions', value: `${pendingActions.length} queued`, sub: `${actions.filter(a => a.status === 'completed').length} completed`, icon: Zap, color: '#f59e0b', view: 'actions' as ChiefBrainView },
    { label: 'Goals', value: `${activeGoals.length} active`, sub: driftingGoals.length > 0 ? `${driftingGoals.length} drifting` : 'On track', icon: Target, color: driftingGoals.length > 0 ? '#f59e0b' : '#10b981', view: 'goals' as ChiefBrainView },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          {brief ? (
            <div>
              <h2 className="text-2xl font-bold text-white">{brief.greeting}</h2>
              <p className="text-white/50 text-sm mt-1 max-w-lg leading-relaxed">{brief.brief}</p>
              {brief.focus && (
                <div className="mt-2 flex items-start gap-2">
                  <TrendingUp size={12} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-blue-400/80 text-xs">{brief.focus}</p>
                </div>
              )}
            </div>
          ) : briefLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white">Good {timeLabel}.</h2>
              <p className="text-white/50 text-sm mt-0.5">Here's your intelligence overview.</p>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-white/30 uppercase tracking-widest">{dateLabel}</div>
          <div className="text-white/50 text-sm">{timeStr}</div>
          <button
            onClick={generateBrief}
            disabled={briefLoading}
            className="mt-1.5 flex items-center gap-1 text-white/20 hover:text-white/40 transition-colors text-xs ml-auto"
          >
            <RefreshCw size={11} className={briefLoading ? 'animate-spin' : ''} />
            <span>Refresh brief</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.view)}
            className="relative rounded-2xl p-4 border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm overflow-hidden group hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 text-left"
          >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 pointer-events-none transition-opacity group-hover:opacity-20" style={{ background: stat.color, transform: 'translate(30%,-30%)' }} />
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: stat.color + '20', border: `1px solid ${stat.color}40` }}>
                <stat.icon size={15} style={{ color: stat.color }} />
              </div>
              <ArrowRight size={12} className="text-white/15 group-hover:text-white/40 transition-colors mt-0.5" />
            </div>
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
            <div className="text-white/25 text-xs mt-1">{stat.sub}</div>
          </button>
        ))}
      </div>

      {driftingGoals.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Goal Drift Detected</span>
          </div>
          <div className="space-y-2">
            {driftingGoals.map(goal => (
              <div key={goal.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/80 text-sm font-medium">{goal.title}</div>
                  <div className="text-amber-400/80 text-xs mt-0.5">{goal.drift_message}</div>
                </div>
                <button onClick={() => onNavigate('goals')} className="text-amber-400/60 hover:text-amber-400 transition-colors shrink-0">
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox size={14} className="text-red-400" />
              <span className="text-white/70 text-sm font-medium">Priority Inbox</span>
            </div>
            <button onClick={() => onNavigate('inbox')} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {inboxItems.filter(i => !i.is_handled).length === 0 ? (
            <div className="text-center py-6 text-white/25 text-sm">Inbox clear</div>
          ) : (
            <div className="space-y-2.5">
              {inboxItems.filter(i => !i.is_handled).slice(0, 3).map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer group" onClick={() => onNavigate('inbox')}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/70 text-xs font-bold shrink-0">
                    {item.sender_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white/80 text-sm font-medium truncate">{item.sender_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md border ${priorityColors[item.priority]}`}>{item.priority}</span>
                    </div>
                    <div className="text-white/35 text-xs truncate">{item.ai_summary}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-white/70 text-sm font-medium">Queued Actions</span>
            </div>
            <button onClick={() => onNavigate('actions')} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {pendingActions.length === 0 ? (
            <div className="text-center py-6 text-white/25 text-sm">No pending actions</div>
          ) : (
            <div className="space-y-2.5">
              {pendingActions.slice(0, 3).map(action => (
                <div key={action.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer" onClick={() => onNavigate('actions')}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${action.consent_tier === 'autonomous' ? 'bg-green-400' : action.consent_tier === 'draft_review' ? 'bg-amber-400' : action.consent_tier === 'auto_draft' ? 'bg-blue-400' : 'bg-red-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-sm font-medium truncate">{action.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white/25 text-xs capitalize">{action.consent_tier.replace(/_/g, ' ')}</span>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-white/25 text-xs">{Math.round(action.confidence_score * 100)}% confidence</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-400" />
              <span className="text-white/70 text-sm font-medium">What I Know About You</span>
            </div>
            <button onClick={() => onNavigate('patterns')} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
              {patterns.length} patterns <ArrowRight size={11} />
            </button>
          </div>
          {topPatterns.length === 0 ? (
            <div className="text-center py-6 text-white/25 text-sm">No patterns discovered yet</div>
          ) : (
            <div className="space-y-2.5">
              {topPatterns.map(pattern => (
                <div key={pattern.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: categoryColors[pattern.category] }} />
                    <div className="flex-1">
                      <p className="text-white/70 text-xs leading-relaxed">{pattern.pattern_text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-16 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pattern.confidence_score * 100}%`, background: categoryColors[pattern.category] }} />
                          </div>
                          <span className="text-white/30 text-xs">{Math.round(pattern.confidence_score * 100)}%</span>
                        </div>
                        <span className="text-white/20 text-xs">{pattern.evidence_count} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-blue-400" />
              <span className="text-white/70 text-sm font-medium">Goal Tracker</span>
            </div>
            <button onClick={() => onNavigate('goals')} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {activeGoals.length === 0 ? (
            <div className="text-center py-6 text-white/25 text-sm">No active goals</div>
          ) : (
            <div className="space-y-3">
              {activeGoals.slice(0, 4).map(goal => (
                <div key={goal.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-white/70 text-sm font-medium truncate pr-2">{goal.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {goal.drift_alert && <AlertTriangle size={11} className="text-amber-400" />}
                      <span className="text-white/40 text-xs">{goal.progress_percent}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.07] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress_percent}%`, background: goal.drift_alert ? '#f59e0b' : 'linear-gradient(90deg, #3b82f6, #10b981)' }} />
                  </div>
                  <div className="text-white/25 text-xs mt-1 capitalize">{goal.horizon} horizon</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-violet-400" />
            <span className="text-white/70 text-sm font-medium">Recent Memory Ingestions</span>
          </div>
          <button onClick={() => onNavigate('memory')} className="text-white/30 hover:text-white/60 text-xs transition-colors flex items-center gap-1">
            {memories.length} total <ArrowRight size={11} />
          </button>
        </div>
        {recentMemories.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-white/25 text-sm">No memories yet — use Quick Capture (⌘K) to start</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentMemories.map(memory => (
              <div key={memory.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer" onClick={() => onNavigate('memory')}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-white/25 text-xs px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.05] capitalize">{memory.memory_type.replace('_', ' ')}</span>
                  <span className={`text-xs ${memory.sentiment === 'positive' ? 'text-emerald-400/60' : memory.sentiment === 'negative' ? 'text-red-400/60' : 'text-white/25'}`}>
                    {memory.sentiment}
                  </span>
                  {memory.is_pinned && <span className="text-amber-400/60 text-xs">pinned</span>}
                </div>
                <div className="text-white/70 text-sm font-medium truncate">{memory.title}</div>
                <div className="text-white/35 text-xs mt-0.5 line-clamp-2">{memory.summary}</div>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {memory.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-white/20 text-xs px-1.5 py-0.5 rounded bg-white/[0.04]">#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {actions.filter(a => a.status === 'completed' || a.status === 'regretted').length > 0 && (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-white/30" />
            <span className="text-white/40 text-xs font-medium uppercase tracking-wider">AI Performance</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-lg font-bold text-white">{actions.filter(a => a.status === 'completed').length}</div>
              <div className="text-white/30 text-xs">Actions completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{actions.filter(a => a.regret_logged).length}</div>
              <div className="text-white/30 text-xs">Regrets logged</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${regretRate > 20 ? 'text-red-400' : 'text-emerald-400'}`}>{regretRate}%</div>
              <div className="text-white/30 text-xs">Regret rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
