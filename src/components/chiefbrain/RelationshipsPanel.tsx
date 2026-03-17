import React, { useState, useCallback } from 'react';
import { Users, MessageSquare, Clock, TrendingUp, Star, Plus, X, CreditCard as Edit2, Trash2, Sparkles, Mail, Phone, ChevronDown, ChevronUp, Heart, Briefcase } from 'lucide-react';
import { Relationship, RelationshipType, InboxItem } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  relationships: Relationship[];
  inboxItems: InboxItem[];
  onAddRelationship: (r: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Relationship | null>;
  onUpdateRelationship: (id: string, updates: Partial<Relationship>) => Promise<void>;
  onDeleteRelationship: (id: string) => Promise<void>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const typeConfig: Record<RelationshipType, { label: string; color: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  professional: { label: 'Professional', color: '#3b82f6', icon: Briefcase },
  personal: { label: 'Personal', color: '#ec4899', icon: Heart },
  family: { label: 'Family', color: '#10b981', icon: Users },
  mentor: { label: 'Mentor', color: '#f59e0b', icon: Star },
  client: { label: 'Client', color: '#06b6d4', icon: TrendingUp },
  vendor: { label: 'Vendor', color: '#6b7280', icon: Briefcase },
  friend: { label: 'Friend', color: '#a855f7', icon: Heart },
};

const relationshipTypes: RelationshipType[] = ['professional', 'personal', 'family', 'mentor', 'client', 'vendor', 'friend'];

function HealthBar({ score }: { score: number }) {
  const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="w-1.5 h-3 rounded-sm transition-all" style={{ background: i < score ? color : 'rgba(255,255,255,0.08)' }} />
      ))}
    </div>
  );
}

const emptyForm = {
  name: '',
  email: '',
  relationship_type: 'professional' as RelationshipType,
  communication_style: '',
  notes: '',
  health_score: 7,
  tags: '',
};

export function RelationshipsPanel({ relationships, inboxItems, onAddRelationship, onUpdateRelationship, onDeleteRelationship, getAI, addToast }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiBreifsMap, setAiBriefsMap] = useState<Record<string, string>>({});
  const [generatingBriefId, setGeneratingBriefId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<typeof emptyForm | null>(null);

  const filtered = relationships.filter(r => filterType === 'all' || r.relationship_type === filterType)
    .sort((a, b) => b.health_score - a.health_score);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) { addToast('Name required', 'info'); return; }
    await onAddRelationship({
      name: form.name,
      email: form.email,
      relationship_type: form.relationship_type,
      communication_style: form.communication_style,
      notes: form.notes,
      health_score: form.health_score,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      last_interaction_at: null,
      interaction_count: 0,
    });
    setForm(emptyForm);
    setShowAdd(false);
    addToast('Relationship added', 'success');
  }, [form, onAddRelationship, addToast]);

  const handleSaveEdit = useCallback(async (id: string) => {
    if (!editForm) return;
    await onUpdateRelationship(id, {
      name: editForm.name,
      email: editForm.email,
      relationship_type: editForm.relationship_type,
      communication_style: editForm.communication_style,
      notes: editForm.notes,
      health_score: editForm.health_score,
      tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
    setEditingId(null);
    setEditForm(null);
    addToast('Relationship updated', 'success');
  }, [editForm, onUpdateRelationship, addToast]);

  const handleGenerateBrief = useCallback(async (rel: Relationship) => {
    const ai = getAI();
    if (!ai) { addToast('Configure an AI API key to generate briefs', 'info'); return; }
    setGeneratingBriefId(rel.id);
    const recentEmails = inboxItems
      .filter(i => i.sender_email === rel.email || i.sender_name === rel.name)
      .slice(0, 3)
      .map(i => `Email: ${i.subject} — ${i.ai_summary}`)
      .join('\n');
    try {
      const brief = await ai.getRelationshipBrief(
        { name: rel.name, notes: rel.notes, communication_style: rel.communication_style, relationship_type: rel.relationship_type },
        recentEmails || 'No recent interactions in inbox'
      );
      setAiBriefsMap(prev => ({ ...prev, [rel.id]: brief }));
      addToast('AI brief generated', 'success');
    } catch {
      addToast('Brief generation failed', 'error');
    }
    setGeneratingBriefId(null);
  }, [getAI, inboxItems, addToast]);

  const handleDelete = useCallback(async (id: string) => {
    await onDeleteRelationship(id);
    setDeletingId(null);
    setExpandedId(null);
    addToast('Relationship removed', 'info');
  }, [onDeleteRelationship, addToast]);

  const startEdit = (rel: Relationship) => {
    setEditingId(rel.id);
    setEditForm({
      name: rel.name,
      email: rel.email,
      relationship_type: rel.relationship_type,
      communication_style: rel.communication_style,
      notes: rel.notes,
      health_score: rel.health_score,
      tags: rel.tags.join(', '),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Relationship Graph</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {relationships.length} people · communication styles and context preserved
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white/60 text-sm"
        >
          <Plus size={14} /> Add Contact
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">New Contact</span>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/50"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name *" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
            <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          </div>
          <div>
            <span className="text-white/30 text-xs mb-1.5 block">Relationship type</span>
            <div className="flex flex-wrap gap-1.5">
              {relationshipTypes.map(t => {
                const cfg = typeConfig[t];
                return (
                  <button key={t} onClick={() => setForm(p => ({ ...p, relationship_type: t }))}
                    className="px-2.5 py-1 rounded-lg text-xs border transition-all"
                    style={form.relationship_type === t ? { color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '40' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input value={form.communication_style} onChange={e => setForm(p => ({ ...p, communication_style: e.target.value }))} placeholder="Communication style (e.g. direct, formal, casual)" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes about this person..." className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none" />
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs shrink-0">Health score: {form.health_score}/10</span>
            <input type="range" min={1} max={10} value={form.health_score} onChange={e => setForm(p => ({ ...p, health_score: +e.target.value }))} className="flex-1 h-1 accent-blue-500" />
          </div>
          <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma-separated)" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-white/40 text-sm">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              Add Contact
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType('all')} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filterType === 'all' ? 'bg-white/[0.07] border-white/20 text-white/60' : 'border-white/[0.05] text-white/30'}`}>
          All ({relationships.length})
        </button>
        {(Object.keys(typeConfig) as RelationshipType[]).filter(t => relationships.some(r => r.relationship_type === t)).map(type => {
          const cfg = typeConfig[type];
          const count = relationships.filter(r => r.relationship_type === type).length;
          const isActive = filterType === type;
          return (
            <button key={type} onClick={() => setFilterType(isActive ? 'all' : type)} className="px-2.5 py-1.5 rounded-lg text-xs border transition-all" style={isActive ? { color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '40' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map(rel => {
          const cfg = typeConfig[rel.relationship_type];
          const isExpanded = expandedId === rel.id;
          const isEditing = editingId === rel.id;
          const brief = aiBreifsMap[rel.id];
          const isGenerating = generatingBriefId === rel.id;
          const relEmails = inboxItems.filter(i => i.sender_email === rel.email || i.sender_name === rel.name).length;

          return (
            <div key={rel.id} className={`rounded-2xl border bg-white/[0.02] transition-all duration-200 ${isExpanded ? 'border-white/[0.12]' : 'border-white/[0.06] hover:border-white/[0.1]'}`}>
              <div
                className="p-4 cursor-pointer"
                onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : rel.id); }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 text-sm font-bold shrink-0" style={{ background: cfg.color + '15', border: `1px solid ${cfg.color}30` }}>
                    {rel.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/85 text-sm font-semibold">{rel.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ color: cfg.color, background: cfg.color + '12' }}>{cfg.label}</span>
                      {relEmails > 0 && (
                        <span className="text-xs text-white/20"><Mail size={9} className="inline mr-0.5" />{relEmails}</span>
                      )}
                    </div>
                    {rel.email && <div className="text-white/30 text-xs mt-0.5 truncate">{rel.email}</div>}
                    <div className="mt-2">
                      <HealthBar score={rel.health_score} />
                    </div>
                  </div>
                  <div className="shrink-0 text-white/20">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                </div>
              </div>

              {isExpanded && !isEditing && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="h-px bg-white/[0.05]" />

                  {rel.communication_style && (
                    <div>
                      <span className="text-white/25 text-xs uppercase tracking-wider">Communication style</span>
                      <p className="text-white/55 text-sm mt-1 italic">"{rel.communication_style}"</p>
                    </div>
                  )}

                  {rel.notes && (
                    <div>
                      <span className="text-white/25 text-xs uppercase tracking-wider">Notes</span>
                      <p className="text-white/55 text-sm mt-1 leading-relaxed">{rel.notes}</p>
                    </div>
                  )}

                  {brief && (
                    <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={11} className="text-amber-400" />
                        <span className="text-white/30 text-xs uppercase tracking-wide">AI Brief</span>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{brief}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-white/25 text-xs">
                    <div className="flex items-center gap-1">
                      <MessageSquare size={10} />
                      {rel.interaction_count} interactions
                    </div>
                    {rel.last_interaction_at && (
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(rel.last_interaction_at).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>

                  {rel.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {rel.tags.map(tag => (
                        <span key={tag} className="text-white/20 text-xs px-1.5 py-0.5 rounded bg-white/[0.04]">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => handleGenerateBrief(rel)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-amber-400 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-all disabled:opacity-50"
                    >
                      {isGenerating ? <div className="w-3 h-3 border border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> : <Sparkles size={12} />}
                      {isGenerating ? 'Generating...' : (brief ? 'Refresh Brief' : 'AI Brief')}
                    </button>
                    <button
                      onClick={() => startEdit(rel)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-white/50 border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] transition-all"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {deletingId === rel.id ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/40 text-xs">Confirm?</span>
                        <button onClick={() => handleDelete(rel.id)} className="px-2.5 py-1.5 rounded-xl text-xs text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all">Yes</button>
                        <button onClick={() => setDeletingId(null)} className="px-2.5 py-1.5 rounded-xl text-xs text-white/40 border border-white/10 hover:border-white/20 transition-all">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(rel.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-400 border border-red-500/20 bg-red-500/[0.05] hover:bg-red-500/10 transition-all">
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isExpanded && isEditing && editForm && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="h-px bg-white/[0.05]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={editForm.name} onChange={e => setEditForm(p => p ? { ...p, name: e.target.value } : p)} placeholder="Full name" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
                    <input value={editForm.email} onChange={e => setEditForm(p => p ? { ...p, email: e.target.value } : p)} placeholder="Email" className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {relationshipTypes.map(t => {
                      const cfg = typeConfig[t];
                      return (
                        <button key={t} onClick={() => setEditForm(p => p ? { ...p, relationship_type: t } : p)}
                          className="px-2.5 py-1 rounded-lg text-xs border transition-all"
                          style={editForm.relationship_type === t ? { color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '40' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                  <input value={editForm.communication_style} onChange={e => setEditForm(p => p ? { ...p, communication_style: e.target.value } : p)} placeholder="Communication style" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
                  <textarea value={editForm.notes} onChange={e => setEditForm(p => p ? { ...p, notes: e.target.value } : p)} placeholder="Notes" className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none" />
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs shrink-0">Health: {editForm.health_score}/10</span>
                    <input type="range" min={1} max={10} value={editForm.health_score} onChange={e => setEditForm(p => p ? { ...p, health_score: +e.target.value } : p)} className="flex-1 h-1 accent-blue-500" />
                  </div>
                  <input value={editForm.tags} onChange={e => setEditForm(p => p ? { ...p, tags: e.target.value } : p)} placeholder="Tags (comma-separated)" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingId(null); setEditForm(null); }} className="px-4 py-2 rounded-xl text-white/40 text-sm">Cancel</button>
                    <button onClick={() => handleSaveEdit(rel.id)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Users size={28} className="text-white/10 mx-auto mb-3" />
          <div className="text-white/30 text-sm">No relationships found</div>
          <div className="text-white/15 text-xs mt-1">Add contacts to track communication styles and context</div>
        </div>
      )}
    </div>
  );
}
