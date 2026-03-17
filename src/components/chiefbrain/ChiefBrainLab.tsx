import React, { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Brain, Inbox, Target, Activity, Users, Zap, LayoutDashboard,
  Sparkles, ChevronRight, Plus, Send, X, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { ChiefBrainView } from './types';
import { ChiefBrainDashboard } from './ChiefBrainDashboard';
import { MemoryVault } from './MemoryVault';
import { InboxCommander } from './InboxCommander';
import { GoalsPanel } from './GoalsPanel';
import { PatternsPanel } from './PatternsPanel';
import { ActionsPanel } from './ActionsPanel';
import { RelationshipsPanel } from './RelationshipsPanel';
import { useChiefBrain, Toast } from './useChiefBrain';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';

interface Props {
  onBack: () => void;
}

const navItems: {
  view: ChiefBrainView;
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
}[] = [
  { view: 'dashboard', label: 'Command Center', icon: LayoutDashboard, color: '#3b82f6' },
  { view: 'inbox', label: 'Inbox', icon: Inbox, color: '#ef4444' },
  { view: 'actions', label: 'Action Queue', icon: Zap, color: '#f59e0b' },
  { view: 'memory', label: 'Memory Vault', icon: Brain, color: '#8b5cf6' },
  { view: 'goals', label: 'Goals', icon: Target, color: '#10b981' },
  { view: 'patterns', label: 'Patterns', icon: Activity, color: '#06b6d4' },
  { view: 'relationships', label: 'Relationships', icon: Users, color: '#ec4899' },
];

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: <CheckCircle size={14} className="text-emerald-400 shrink-0" />,
    error: <AlertCircle size={14} className="text-red-400 shrink-0" />,
    info: <Info size={14} className="text-blue-400 shrink-0" />,
  };
  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  };
  return (
    <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border backdrop-blur-xl text-sm text-white/80 shadow-xl animate-slide-up ${colors[toast.type]}`}
      style={{ animation: 'slideUp 0.25s ease-out' }}>
      {icons[toast.type]}
      <span>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="ml-2 text-white/30 hover:text-white/60 transition-colors">
        <X size={12} />
      </button>
    </div>
  );
}

export function ChiefBrainLab({ onBack }: Props) {
  const apiCtx = useApiSettings();
  const [view, setView] = useState<ChiefBrainView>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickCapture, setQuickCapture] = useState('');
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureLoading, setQuickCaptureLoading] = useState(false);

  const store = useChiefBrain();

  const getAI = useCallback(() => {
    if (!apiCtx) return null;
    const llm = new LLMService(apiCtx.provider, apiCtx.geminiKey, apiCtx.groqKey);
    return new ChiefBrainAI(llm);
  }, [apiCtx]);

  const handleQuickCapture = useCallback(async () => {
    if (!quickCapture.trim()) return;
    setQuickCaptureLoading(true);
    const text = quickCapture.trim();
    setQuickCapture('');
    setQuickCaptureOpen(false);

    const ai = getAI();
    let classification = null;
    if (ai) {
      store.addToast('Classifying memory with AI...', 'info');
      try {
        classification = await ai.classifyMemory(text);
      } catch { /* use fallback */ }
    }

    const now = new Date().toISOString();
    await store.addMemory({
      title: classification?.title || text.slice(0, 50),
      content: text,
      summary: classification?.summary || text.slice(0, 100),
      memory_type: classification?.memory_type || 'note',
      source: 'Quick Capture',
      tags: classification?.tags || [],
      entities: classification?.entities || [],
      sentiment: classification?.sentiment || 'neutral',
      importance_score: classification?.importance_score || 5,
      is_pinned: false,
      metadata: {},
      created_at: now,
      ingested_at: now,
    });

    if (ai && store.patterns.length > 0) {
      try {
        const newAction = await ai.generateActionFromMemory(
          { id: 'new', user_id: 'demo', title: classification?.title || text.slice(0, 50), content: text, summary: classification?.summary || '', memory_type: classification?.memory_type || 'note', source: 'Quick Capture', tags: classification?.tags || [], entities: classification?.entities || [], sentiment: classification?.sentiment || 'neutral', importance_score: classification?.importance_score || 5, is_pinned: false, metadata: {}, created_at: now, ingested_at: now },
          store.patterns
        );
        if (newAction) {
          await store.addAction(newAction);
          store.addToast('AI generated a new action from this memory', 'info');
        }
      } catch { /* silent */ }
    }

    setQuickCaptureLoading(false);
  }, [quickCapture, getAI, store]);

  const badges: Record<ChiefBrainView, number> = {
    inbox: store.inboxItems.filter(i => !i.is_handled && i.priority !== 'skip').length,
    actions: store.actions.filter(a => a.status === 'pending').length,
    goals: store.goals.filter(g => g.drift_alert && g.status === 'active').length,
    dashboard: 0, memory: 0, patterns: 0, relationships: 0,
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickCaptureOpen(v => !v);
      }
      if (e.key === 'Escape') setQuickCaptureOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at top left, rgba(8,8,20,1) 0%, rgba(5,5,15,1) 60%, rgba(0,0,0,1) 100%)' }}>
      <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), rgba(16,185,129,0.4), transparent)' }} />

      <div className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.05]" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(40px)' }}>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-sm">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="h-4 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Brain size={14} className="text-blue-400" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-black animate-pulse" />
          </div>
          <div>
            <div className="text-white/85 text-sm font-bold tracking-tight leading-none">ChiefBrain</div>
            <div className="text-white/25 text-xs leading-none mt-0.5">Personal AI Operating System</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!store.loading && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-white/25">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{store.memories.length} memories · {store.patterns.length} patterns</span>
            </div>
          )}
          <button
            onClick={() => setQuickCaptureOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/[0.07] hover:bg-blue-500/[0.12] transition-all"
            title="Quick Capture (⌘K)"
          >
            <Plus size={11} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">Capture</span>
            <kbd className="hidden sm:block text-blue-400/40 text-xs ml-0.5">⌘K</kbd>
          </button>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07]">
            <Sparkles size={11} className="text-emerald-400" />
            <span className="text-emerald-400 text-xs font-medium">AI Active</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 border-r border-white/[0.05] flex flex-col transition-all duration-300`} style={{ background: 'rgba(0,0,0,0.2)' }}>
          <div className="p-3 flex-1">
            <div className="space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = view === item.view;
                const badge = badges[item.view];
                return (
                  <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    title={!sidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left relative group ${isActive ? 'bg-white/[0.07] text-white/80' : 'text-white/35 hover:text-white/55 hover:bg-white/[0.03]'}`}
                  >
                    <div className="shrink-0 transition-colors" style={{ color: isActive ? item.color : undefined }}>
                      <Icon size={15} />
                    </div>
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                        {badge > 0 && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 font-medium">
                            {badge}
                          </span>
                        )}
                        {isActive && <ChevronRight size={12} className="text-white/20 shrink-0" />}
                      </>
                    )}
                    {!sidebarOpen && badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center font-bold" style={{ fontSize: '9px' }}>
                        {badge}
                      </span>
                    )}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 rounded-lg bg-black/90 border border-white/10 text-white/80 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-white/[0.04]">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/20 hover:text-white/40 transition-colors"
            >
              <div className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
                <ChevronRight size={13} />
              </div>
              {sidebarOpen && <span className="text-xs">Collapse</span>}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.05) transparent' }}>
          {store.loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Brain size={18} className="text-blue-400 animate-pulse" />
                </div>
                <p className="text-white/30 text-sm">Loading your intelligence layer...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto p-5 sm:p-6">
              {view === 'dashboard' && (
                <ChiefBrainDashboard
                  memories={store.memories}
                  patterns={store.patterns}
                  goals={store.goals}
                  actions={store.actions}
                  inboxItems={store.inboxItems}
                  onNavigate={setView}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'memory' && (
                <MemoryVault
                  memories={store.memories}
                  onAddMemory={store.addMemory}
                  onUpdateMemory={store.updateMemory}
                  onDeleteMemory={store.deleteMemory}
                  onTogglePin={store.togglePinMemory}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'inbox' && (
                <InboxCommander
                  items={store.inboxItems}
                  relationships={store.relationships}
                  onHandled={store.markHandled}
                  onUpdateDraft={store.updateInboxDraft}
                  onDelete={store.deleteInboxItem}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'goals' && (
                <GoalsPanel
                  goals={store.goals}
                  patterns={store.patterns}
                  memories={store.memories}
                  onAddGoal={store.addGoal}
                  onUpdateGoal={store.updateGoal}
                  onDeleteGoal={store.deleteGoal}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'patterns' && (
                <PatternsPanel
                  patterns={store.patterns}
                  memories={store.memories}
                  onAddPattern={store.addPattern}
                  onUpdatePattern={store.updatePattern}
                  onDismissPattern={store.dismissPattern}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'actions' && (
                <ActionsPanel
                  actions={store.actions}
                  onApprove={store.approveAction}
                  onReject={store.rejectAction}
                  onRegret={store.regretAction}
                  onAddAction={store.addAction}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
              {view === 'relationships' && (
                <RelationshipsPanel
                  relationships={store.relationships}
                  inboxItems={store.inboxItems}
                  onAddRelationship={store.addRelationship}
                  onUpdateRelationship={store.updateRelationship}
                  onDeleteRelationship={store.deleteRelationship}
                  getAI={getAI}
                  addToast={store.addToast}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {quickCaptureOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }} onClick={e => { if (e.target === e.currentTarget) setQuickCaptureOpen(false); }}>
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.1] overflow-hidden shadow-2xl" style={{ background: 'rgba(10,10,20,0.98)' }}>
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <Brain size={13} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white/80 text-sm font-semibold">Quick Capture</div>
                <div className="text-white/30 text-xs">AI will classify and extract intelligence</div>
              </div>
              <button onClick={() => setQuickCaptureOpen(false)} className="ml-auto text-white/20 hover:text-white/50 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-4">
              <textarea
                autoFocus
                value={quickCapture}
                onChange={e => setQuickCapture(e.target.value)}
                placeholder="Paste an email, type a thought, record an observation, drop a transaction detail... AI handles classification."
                className="w-full h-32 bg-transparent text-white/80 text-sm placeholder-white/20 resize-none outline-none leading-relaxed"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleQuickCapture();
                  if (e.key === 'Escape') setQuickCaptureOpen(false);
                }}
              />
            </div>
            <div className="px-4 pb-4 flex items-center justify-between">
              <span className="text-white/20 text-xs">⌘↩ to capture</span>
              <button
                onClick={handleQuickCapture}
                disabled={!quickCapture.trim() || quickCaptureLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
              >
                {quickCaptureLoading ? (
                  <div className="w-3.5 h-3.5 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                {quickCaptureLoading ? 'Processing...' : 'Capture'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 items-end">
        {store.toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={store.removeToast} />
        ))}
      </div>
    </div>
  );
}
