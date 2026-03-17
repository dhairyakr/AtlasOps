import React, { useState, useCallback } from 'react';
import {
  Inbox, Send, CheckCircle, ChevronDown, ChevronUp, Copy, RefreshCw,
  Trash2, X, Check, Plus, Sparkles
} from 'lucide-react';
import { InboxItem, Relationship } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  items: InboxItem[];
  relationships: Relationship[];
  onHandled: (id: string) => Promise<void>;
  onUpdateDraft: (id: string, draft: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const priorityColors: Record<string, string> = {
  urgent: 'text-red-400 bg-red-500/10 border-red-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-green-400 bg-green-500/10 border-green-500/30',
  skip: 'text-gray-500 bg-gray-500/10 border-gray-500/20',
};

type ToneType = 'professional' | 'casual' | 'brief' | 'detailed';

export function InboxCommander({ items, relationships, onHandled, onUpdateDraft, onDelete, getAI, addToast }: Props) {
  const [filter, setFilter] = useState<'unread' | 'urgent' | 'all'>('unread');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Record<string, string>>({});
  const [generatingDraft, setGeneratingDraft] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [tone, setTone] = useState<ToneType>('professional');

  const [newItem, setNewItem] = useState({
    sender_name: '', sender_email: '', subject: '', original_body: '', priority: 'medium' as InboxItem['priority'],
  });

  const filtered = items.filter(item => {
    if (filter === 'unread') return !item.is_handled;
    if (filter === 'urgent') return !item.is_handled && (item.priority === 'urgent' || item.priority === 'high');
    return true;
  }).sort((a, b) => {
    const order = { urgent: 0, high: 1, medium: 2, low: 3, skip: 4 };
    return (order[a.priority] || 5) - (order[b.priority] || 5);
  });

  const unhandledCount = items.filter(i => !i.is_handled && i.priority !== 'skip').length;

  const getDraft = (item: InboxItem) => editingDraft[item.id] !== undefined ? editingDraft[item.id] : item.ai_draft_reply;

  const handleGenerateDraft = useCallback(async (item: InboxItem) => {
    const ai = getAI();
    if (!ai) { addToast('Configure AI key first', 'info'); return; }
    setGeneratingDraft(prev => new Set(prev).add(item.id));
    try {
      const relContexts = relationships.map(r => ({ name: r.name, communication_style: r.communication_style, notes: r.notes }));
      const draft = await ai.generateInboxDraft(item, relContexts);
      setEditingDraft(prev => ({ ...prev, [item.id]: draft }));
      await onUpdateDraft(item.id, draft);
      addToast('AI draft generated', 'success');
    } catch {
      addToast('Failed to generate draft', 'error');
    } finally {
      setGeneratingDraft(prev => { const s = new Set(prev); s.delete(item.id); return s; });
    }
  }, [getAI, relationships, onUpdateDraft, addToast]);

  const handleSaveDraft = useCallback(async (id: string) => {
    const draft = editingDraft[id];
    if (draft !== undefined) {
      await onUpdateDraft(id, draft);
      addToast('Draft saved', 'success');
    }
  }, [editingDraft, onUpdateDraft, addToast]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  }, [addToast]);

  const handleMarkHandled = useCallback(async (id: string) => {
    await onHandled(id);
    setExpandedId(null);
  }, [onHandled]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Inbox Commander</h2>
          <p className="text-white/40 text-sm mt-0.5">{unhandledCount} items need attention</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white/50 text-xs transition-all">
            <Plus size={12} /> Add Item
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">New Inbox Item</span>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/50"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={newItem.sender_name} onChange={e => setNewItem(p => ({ ...p, sender_name: e.target.value }))} placeholder="Sender name" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm placeholder-white/20 outline-none" />
            <input value={newItem.sender_email} onChange={e => setNewItem(p => ({ ...p, sender_email: e.target.value }))} placeholder="Email" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm placeholder-white/20 outline-none" />
          </div>
          <input value={newItem.subject} onChange={e => setNewItem(p => ({ ...p, subject: e.target.value }))} placeholder="Subject" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm placeholder-white/20 outline-none" />
          <textarea value={newItem.original_body} onChange={e => setNewItem(p => ({ ...p, original_body: e.target.value }))} placeholder="Message body..." className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm placeholder-white/20 resize-none outline-none" />
          <div className="flex items-center gap-2">
            {(['urgent', 'high', 'medium', 'low', 'skip'] as InboxItem['priority'][]).map(p => (
              <button key={p} onClick={() => setNewItem(prev => ({ ...prev, priority: p }))}
                className={`px-2.5 py-1 rounded-lg text-xs border transition-all capitalize ${newItem.priority === p ? priorityColors[p] : 'text-white/30 border-white/10'}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-white/40 text-sm">Cancel</button>
            <button
              disabled={!newItem.sender_name || !newItem.subject}
              onClick={async () => {
                const ai = getAI();
                const now = new Date().toISOString();
                const draft = ai ? await ai.generateInboxDraft({ ...newItem, id: '', user_id: 'demo', original_body: newItem.original_body, ai_summary: '', ai_draft_reply: '', sentiment: 'neutral', action_required: true, action_type: '', is_handled: false, relationship_context: '', tags: [], received_at: now, processed_at: now, created_at: now }, []) : '';
                addToast('Item added', 'success');
                setShowAdd(false);
                setNewItem({ sender_name: '', sender_email: '', subject: '', original_body: '', priority: 'medium' });
              }}
              className="px-3 py-1.5 rounded-lg text-sm text-blue-400 border border-blue-500/30 bg-blue-500/10 disabled:opacity-40">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(['unread', 'urgent', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${filter === f ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
            {f === 'unread' ? `Unread (${items.filter(i => !i.is_handled).length})` : f === 'urgent' ? `Urgent (${items.filter(i => !i.is_handled && (i.priority === 'urgent' || i.priority === 'high')).length})` : `All (${items.length})`}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-white/25 text-xs">Reply tone:</span>
          {(['professional', 'casual', 'brief', 'detailed'] as ToneType[]).map(t => (
            <button key={t} onClick={() => setTone(t)} className={`px-2 py-1 rounded-md text-xs capitalize transition-all ${tone === t ? 'bg-white/10 text-white/70' : 'text-white/25 hover:text-white/40'}`}>{t}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle size={24} className="text-emerald-400/40 mx-auto mb-2" />
          <p className="text-white/25 text-sm">Inbox clear for this filter</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(item => {
            const isExpanded = expandedId === item.id;
            const draft = getDraft(item);
            const isGenerating = generatingDraft.has(item.id);

            return (
              <div key={item.id} className={`rounded-2xl border transition-all duration-200 ${item.is_handled ? 'opacity-40' : ''} ${isExpanded ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-white/70 text-sm font-bold shrink-0">
                      {item.sender_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 text-sm font-medium">{item.sender_name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${priorityColors[item.priority]}`}>{item.priority}</span>
                        {item.is_handled && <span className="text-emerald-400/60 text-xs">handled</span>}
                      </div>
                      <div className="text-white/50 text-xs mt-0.5 truncate">{item.subject}</div>
                      <div className="text-white/30 text-xs mt-0.5 truncate">{item.ai_summary}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {confirmDelete === item.id ? (
                        <>
                          <button onClick={() => { onDelete(item.id); setConfirmDelete(null); }} className="p-1.5 rounded-lg text-red-400"><Check size={13} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg text-white/30"><X size={13} /></button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(item.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      )}
                      <div className="p-1 text-white/20">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-white/[0.05]" />

                    {item.relationship_context && (
                      <div className="p-3 rounded-xl bg-blue-500/[0.07] border border-blue-500/15">
                        <span className="text-blue-400/70 text-xs font-medium">Relationship context: </span>
                        <span className="text-white/50 text-xs">{item.relationship_context}</span>
                      </div>
                    )}

                    <div>
                      <div className="text-white/30 text-xs mb-2 uppercase tracking-wide">Original message</div>
                      <p className="text-white/55 text-sm leading-relaxed bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">{item.original_body}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={12} className="text-emerald-400" />
                          <span className="text-white/30 text-xs uppercase tracking-wide">AI Draft Reply</span>
                        </div>
                        <button
                          onClick={() => handleGenerateDraft(item)}
                          disabled={isGenerating}
                          className="flex items-center gap-1.5 text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors disabled:opacity-40"
                        >
                          <RefreshCw size={11} className={isGenerating ? 'animate-spin' : ''} />
                          {isGenerating ? 'Generating...' : 'Regenerate'}
                        </button>
                      </div>
                      {isGenerating ? (
                        <div className="h-20 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-center gap-2">
                          <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          <span className="text-white/30 text-xs">Generating reply in {tone} tone...</span>
                        </div>
                      ) : draft ? (
                        <div>
                          <textarea
                            value={draft}
                            onChange={e => setEditingDraft(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full h-32 bg-white/[0.02] border border-white/[0.08] rounded-xl p-3 text-white/65 text-sm resize-none outline-none leading-relaxed"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <button onClick={() => handleSaveDraft(item.id)} className="text-white/25 hover:text-white/50 text-xs transition-colors">Save edits</button>
                            <div className="flex gap-2">
                              <button onClick={() => handleCopy(draft)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/60 transition-all">
                                <Copy size={11} /> Copy
                              </button>
                              <button onClick={() => { handleCopy(draft); handleMarkHandled(item.id); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all">
                                <Send size={11} /> Copy & Handle
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                          <span className="text-white/25 text-xs">No draft yet</span>
                          <button onClick={() => handleGenerateDraft(item)} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            <Sparkles size={11} /> Generate with AI
                          </button>
                        </div>
                      )}
                    </div>

                    {!item.is_handled && (
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => handleMarkHandled(item.id)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all">
                          <CheckCircle size={13} /> Mark Handled
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
