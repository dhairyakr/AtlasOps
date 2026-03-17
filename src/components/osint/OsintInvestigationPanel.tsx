import React, { useState } from 'react';
import { Plus, Folder, Archive, Flag, Trash2, ChevronRight, X, Check } from 'lucide-react';
import { OsintInvestigation } from '../../services/osintService';

interface OsintInvestigationPanelProps {
  investigations: OsintInvestigation[];
  activeInvestigation: OsintInvestigation | null;
  onSelect: (inv: OsintInvestigation) => void;
  onCreate: (title: string, description: string) => void;
  onUpdate: (id: string, updates: Partial<OsintInvestigation>) => void;
  onDelete: (id: string) => void;
}

const STATUS_COLORS = {
  active: { dot: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)', text: '#22d3ee' },
  archived: { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', text: '#94a3b8' },
  flagged: { dot: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', text: '#f87171' },
};

export const OsintInvestigationPanel: React.FC<OsintInvestigationPanelProps> = ({
  investigations, activeInvestigation, onSelect, onCreate, onUpdate, onDelete,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreate(newTitle.trim(), newDesc.trim());
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full" onClick={closeContextMenu}>
      <div className="p-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(34,211,238,0.5)', fontFamily: 'monospace' }}>
            Investigations
          </span>
          <button
            onClick={() => setShowCreate(p => !p)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all duration-200"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee' }}
          >
            {showCreate ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{investigations.length} case{investigations.length !== 1 ? 's' : ''}</p>
      </div>

      {showCreate && (
        <div className="p-3 border-b" style={{ borderColor: 'rgba(34,211,238,0.08)', background: 'rgba(34,211,238,0.03)' }}>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Case title..."
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none mb-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(34,211,238,0.2)', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-white/20 outline-none resize-none mb-2"
            rows={2}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-40"
              style={{ background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
            >
              <Check className="w-3 h-3" />
              Create
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewTitle(''); setNewDesc(''); }}
              className="px-3 py-1.5 rounded-lg text-xs transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto cyber-scrollbar p-2 space-y-1">
        {investigations.length === 0 && !showCreate && (
          <div className="text-center py-8">
            <Folder className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(34,211,238,0.2)' }} />
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>No investigations yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 text-[10px] underline"
              style={{ color: 'rgba(34,211,238,0.5)' }}
            >
              Create one
            </button>
          </div>
        )}

        {investigations.map(inv => {
          const isActive = activeInvestigation?.id === inv.id;
          const colors = STATUS_COLORS[inv.status] || STATUS_COLORS.active;

          return (
            <button
              key={inv.id}
              onClick={() => onSelect(inv)}
              onContextMenu={e => handleContextMenu(e, inv.id)}
              className="w-full text-left px-2.5 py-2 rounded-lg transition-all duration-200 group relative"
              style={isActive ? {
                background: 'rgba(34,211,238,0.08)',
                border: '1px solid rgba(34,211,238,0.2)',
              } : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 animate-pulse"
                    style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}60` }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: isActive ? '#22d3ee' : 'rgba(255,255,255,0.75)' }}>
                      {inv.title}
                    </p>
                    {inv.description && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {inv.description}
                      </p>
                    )}
                    <p className="text-[9px] mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {formatDate(inv.updated_at)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: isActive ? '#22d3ee' : 'rgba(255,255,255,0.2)' }} />
              </div>

              {inv.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {inv.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                      style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.12)', color: 'rgba(34,211,238,0.6)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
        <p className="text-[9px] font-mono text-center" style={{ color: 'rgba(255,255,255,0.1)' }}>
          Right-click to manage
        </p>
      </div>

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 rounded-xl overflow-hidden shadow-2xl"
            style={{
              left: contextMenu.x, top: contextMenu.y,
              background: 'rgba(10,15,22,0.98)',
              border: '1px solid rgba(34,211,238,0.15)',
              backdropFilter: 'blur(16px)',
              minWidth: '160px',
            }}
          >
            {[
              { label: 'Mark Active', icon: <div className="w-2 h-2 rounded-full bg-cyan-400" />, action: () => onUpdate(contextMenu.id, { status: 'active' }) },
              { label: 'Flag Case', icon: <Flag className="w-3 h-3 text-red-400" />, action: () => onUpdate(contextMenu.id, { status: 'flagged' }) },
              { label: 'Archive', icon: <Archive className="w-3 h-3 text-slate-400" />, action: () => onUpdate(contextMenu.id, { status: 'archived' }) },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => { item.action(); closeContextMenu(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => { onDelete(contextMenu.id); closeContextMenu(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all duration-150"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};
