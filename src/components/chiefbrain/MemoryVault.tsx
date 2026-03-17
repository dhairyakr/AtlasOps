import React, { useState, useCallback } from 'react';
import { Brain, Search, Pin, Trash2, CreditCard as Edit3, Check, X, Plus, Sparkles, Mail, Mic, FileText, Camera, DollarSign, Lightbulb, Users, Plane, Heart, StickyNote } from 'lucide-react';
import { Memory, MemoryType } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  memories: Memory[];
  onAddMemory: (mem: Omit<Memory, 'id' | 'user_id'>) => Promise<Memory | null>;
  onUpdateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onTogglePin: (id: string, is_pinned: boolean) => Promise<void>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const typeIcons: Record<MemoryType, React.FC<{ size?: number; className?: string }>> = {
  email: Mail, voice_memo: Mic, document: FileText, screenshot: Camera,
  transaction: DollarSign, thought: Lightbulb, meeting: Users, travel: Plane,
  health: Heart, note: StickyNote,
};

const typeColors: Record<MemoryType, string> = {
  email: '#3b82f6', voice_memo: '#8b5cf6', document: '#06b6d4', screenshot: '#ec4899',
  transaction: '#10b981', thought: '#f59e0b', meeting: '#ef4444', travel: '#14b8a6',
  health: '#22c55e', note: '#94a3b8',
};

const memoryTypes: MemoryType[] = ['email', 'voice_memo', 'document', 'screenshot', 'transaction', 'thought', 'meeting', 'travel', 'health', 'note'];

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  negative: 'text-red-400 bg-red-500/10 border-red-500/20',
  neutral: 'text-white/40 bg-white/5 border-white/10',
  mixed: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

export function MemoryVault({ memories, onAddMemory, onUpdateMemory, onDeleteMemory, onTogglePin, getAI, addToast }: Props) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MemoryType | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', content: '', memory_type: 'note' as MemoryType,
    source: '', tags: '', importance_score: 5,
  });

  const handleAIClassify = useCallback(async () => {
    if (!form.content.trim()) { addToast('Add content first', 'info'); return; }
    const ai = getAI();
    if (!ai) { addToast('Configure AI key first', 'info'); return; }
    setAiLoading(true);
    try {
      const result = await ai.classifyMemory(form.content, form.title);
      setForm(prev => ({
        ...prev,
        title: result.title,
        memory_type: result.memory_type,
        tags: result.tags.join(', '),
        importance_score: result.importance_score,
      }));
      addToast('AI classification complete', 'success');
    } catch {
      addToast('AI classification failed', 'error');
    } finally {
      setAiLoading(false);
    }
  }, [form.content, form.title, getAI, addToast]);

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim() || !form.content.trim()) { addToast('Title and content required', 'info'); return; }
    const now = new Date().toISOString();
    await onAddMemory({
      title: form.title,
      content: form.content,
      summary: form.content.slice(0, 120),
      memory_type: form.memory_type,
      source: form.source || 'Manual Entry',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      entities: [],
      sentiment: 'neutral',
      importance_score: form.importance_score,
      is_pinned: false,
      metadata: {},
      created_at: now,
      ingested_at: now,
    });
    setForm({ title: '', content: '', memory_type: 'note', source: '', tags: '', importance_score: 5 });
    setShowAdd(false);
  }, [form, onAddMemory, addToast]);

  const handleSaveEdit = useCallback(async (id: string, updates: Partial<Memory>) => {
    await onUpdateMemory(id, updates);
    setEditId(null);
  }, [onUpdateMemory]);

  const filtered = memories.filter(m => {
    const matchType = filterType === 'all' || m.memory_type === filterType;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const typeCounts = memoryTypes.reduce((acc, t) => ({ ...acc, [t]: memories.filter(m => m.memory_type === t).length }), {} as Record<string, number>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Memory Vault</h2>
          <p className="text-white/40 text-sm mt-0.5">{memories.length} memories · {memories.filter(m => m.is_pinned).length} pinned</p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white/60 text-sm"
        >
          <Plus size={14} /> Add Memory
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={14} className="text-blue-400" />
              <span className="text-white/70 text-sm font-medium">New Memory</span>
            </div>
            <button
              onClick={handleAIClassify}
              disabled={aiLoading || !form.content.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-40"
              style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#93c5fd' }}
            >
              {aiLoading ? <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <Sparkles size={11} />}
              AI Classify
            </button>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder="Paste content, notes, emails, or anything to remember..."
            className="w-full h-24 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none"
          />
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Title (or let AI generate it)"
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {memoryTypes.map(t => {
              const Icon = typeIcons[t];
              return (
                <button
                  key={t}
                  onClick={() => setForm(p => ({ ...p, memory_type: t }))}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all capitalize`}
                  style={form.memory_type === t ? { background: typeColors[t] + '20', borderColor: typeColors[t] + '50', color: typeColors[t] } : { color: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
                >
                  <Icon size={11} />{t.replace('_', ' ')}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} placeholder="Source (e.g. Gmail)" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma-separated)" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/40 text-xs">Importance: {form.importance_score}/10</span>
            </div>
            <input type="range" min={1} max={10} value={form.importance_score} onChange={e => setForm(p => ({ ...p, importance_score: +e.target.value }))} className="w-full accent-blue-500" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-white/40 hover:text-white/60 text-sm transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              Save Memory
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search memories..." className="w-full pl-8 pr-4 py-2 bg-white/[0.03] border border-white/[0.07] rounded-xl text-white/70 text-sm placeholder-white/25 outline-none" />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterType('all')} className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
          All ({memories.length})
        </button>
        {memoryTypes.filter(t => typeCounts[t] > 0).map(t => (
          <button key={t} onClick={() => setFilterType(filterType === t ? 'all' : t)}
            className="px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all capitalize"
            style={filterType === t ? { background: typeColors[t] + '20', color: typeColors[t] } : { color: 'rgba(255,255,255,0.3)' }}>
            {t.replace('_', ' ')} ({typeCounts[t]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/25 text-sm">No memories match your filters</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(memory => {
            const Icon = typeIcons[memory.memory_type];
            const color = typeColors[memory.memory_type];
            const isExpanded = expandedId === memory.id;
            const isEditing = editId === memory.id;

            return (
              <div key={memory.id} className={`rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
                <div className="p-4 cursor-pointer" onClick={() => !isEditing && setExpandedId(isExpanded ? null : memory.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: color + '15', border: `1px solid ${color}30` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 text-sm font-medium">{memory.title}</span>
                        {memory.is_pinned && <span className="text-amber-400/70 text-xs">pinned</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${sentimentColors[memory.sentiment] || sentimentColors.neutral}`}>{memory.sentiment}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{memory.summary}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-12 rounded-full bg-white/10 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${memory.importance_score * 10}%`, background: color }} />
                          </div>
                          <span className="text-white/25 text-xs">{memory.importance_score}/10</span>
                        </div>
                        <span className="text-white/20 text-xs">{memory.source}</span>
                        <span className="text-white/20 text-xs">{new Date(memory.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {memory.tags.map(tag => (
                          <span key={tag} className="text-white/25 text-xs px-1.5 py-0.5 rounded bg-white/[0.04]">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => onTogglePin(memory.id, !memory.is_pinned)} className={`p-1.5 rounded-lg transition-colors ${memory.is_pinned ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`} title="Toggle pin">
                        <Pin size={13} />
                      </button>
                      <button onClick={() => { setEditId(memory.id); setExpandedId(memory.id); }} className="p-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors" title="Edit">
                        <Edit3 size={13} />
                      </button>
                      {confirmDelete === memory.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { onDeleteMemory(memory.id); setConfirmDelete(null); }} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Check size={13} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg text-white/30 hover:text-white/50 transition-colors"><X size={13} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(memory.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && !isEditing && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="h-px bg-white/[0.05] mb-3" />
                    <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">{memory.content}</p>
                    {memory.entities.length > 0 && (
                      <div className="mt-3">
                        <span className="text-white/30 text-xs">Entities: </span>
                        {memory.entities.map(e => <span key={e} className="text-white/50 text-xs mr-2">{e}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {isEditing && (
                  <EditMemoryForm memory={memory} onSave={handleSaveEdit} onCancel={() => setEditId(null)} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditMemoryForm({ memory, onSave, onCancel }: {
  memory: Memory;
  onSave: (id: string, updates: Partial<Memory>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(memory.title);
  const [content, setContent] = useState(memory.content);
  const [tags, setTags] = useState(memory.tags.join(', '));
  const [importance, setImportance] = useState(memory.importance_score);

  return (
    <div className="px-4 pb-4 pt-0 space-y-3">
      <div className="h-px bg-white/[0.05] mb-3" />
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm outline-none" placeholder="Title" />
      <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm resize-none outline-none" placeholder="Content" />
      <input value={tags} onChange={e => setTags(e.target.value)} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm outline-none" placeholder="Tags (comma-separated)" />
      <div className="flex items-center gap-3">
        <span className="text-white/40 text-xs whitespace-nowrap">Importance: {importance}/10</span>
        <input type="range" min={1} max={10} value={importance} onChange={e => setImportance(+e.target.value)} className="flex-1 accent-blue-500" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-white/40 hover:text-white/60 text-sm transition-colors">Cancel</button>
        <button onClick={() => onSave(memory.id, { title, content, summary: content.slice(0, 120), tags: tags.split(',').map(t => t.trim()).filter(Boolean), importance_score: importance })}
          className="px-3 py-1.5 rounded-lg text-sm text-blue-400 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 transition-all">
          <Check size={13} className="inline mr-1" />Save
        </button>
      </div>
    </div>
  );
}
