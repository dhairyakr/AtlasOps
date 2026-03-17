import React, { useState } from 'react';
import { History, Trash2, FileText, Image, TrendingUp, Users, Scale, ChevronRight, AlertCircle } from 'lucide-react';
import type { AnalysisHistoryRecord, PersonaView } from '../../types/termSheet';
import { deleteAnalysis, formatFileSize } from '../../services/termSheetService';

interface Props {
  history: AnalysisHistoryRecord[];
  onLoad: (record: AnalysisHistoryRecord) => void;
  onHistoryChange: () => void;
  activeId?: string;
}

const personaIcons: Record<PersonaView, React.ReactNode> = {
  founder: <TrendingUp className="w-3 h-3" />,
  investor: <Users className="w-3 h-3" />,
  legal: <Scale className="w-3 h-3" />,
};

function ScoreChip({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
      : score >= 45
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
      : 'text-red-300 bg-red-500/10 border-red-500/20';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const TermSheetHistoryPanel: React.FC<Props> = ({ history, onLoad, onHistoryChange, activeId }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteAnalysis(id);
    setDeletingId(null);
    onHistoryChange();
  };

  if (history.length === 0) {
    return (
      <div className="p-4 text-center">
        <History className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/30 text-xs">No analyses yet</p>
        <p className="text-white/20 text-xs mt-1">Analyzed term sheets will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {history.map((record) => {
        const isActive = record.id === activeId;
        const isImage = record.file_type.startsWith('image/');
        return (
          <div
            key={record.id}
            onClick={() => onLoad(record)}
            className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
              isActive
                ? 'bg-white/8 border-white/20'
                : 'bg-white/2 border-white/5 hover:bg-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                {isImage ? (
                  <Image className="w-3.5 h-3.5 text-white/40" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <p className="text-xs font-medium text-white/80 truncate max-w-[120px]">
                    {record.file_name}
                  </p>
                  <ScoreChip score={record.friendliness_score} />
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    {personaIcons[record.persona_view as PersonaView]}
                    <span className="capitalize">{record.persona_view}</span>
                  </span>
                  <span>•</span>
                  <span>{formatDate(record.created_at)}</span>
                </div>
                {record.file_size > 0 && (
                  <p className="text-xs text-white/20 mt-0.5">{formatFileSize(record.file_size)}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
              </div>
            </div>

            <button
              onClick={(e) => handleDelete(e, record.id)}
              disabled={deletingId === record.id}
              className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
              title="Delete"
            >
              {deletingId === record.id ? (
                <AlertCircle className="w-3 h-3 animate-pulse" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
