import React, { useState } from 'react';
import { ArrowLeftRight, CheckCircle, AlertTriangle, Flame, TrendingUp } from 'lucide-react';
import type { TermSheetAnalysis } from '../../types/termSheet';

interface Props {
  left: TermSheetAnalysis;
  right: TermSheetAnalysis;
  leftLabel: string;
  rightLabel: string;
}

function ScorePill({ score, flip = false }: { score: number; flip?: boolean }) {
  const color =
    score >= 70
      ? flip
        ? 'text-red-300 bg-red-500/10 border-red-500/20'
        : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
      : score >= 45
      ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
      : flip
      ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
      : 'text-red-300 bg-red-500/10 border-red-500/20';
  return (
    <span className={`text-base font-bold px-3 py-1 rounded-full border ${color}`}>{score}</span>
  );
}

const COMPARE_TERMS = [
  'liquidation_preference',
  'anti_dilution',
  'board_composition',
  'vesting_schedule',
  'esop_pool',
  'pro_rata_rights',
  'voting_rights',
  'drag_along_rights',
  'tag_along_rights',
  'funding_amount',
  'equity_percentage',
];

const TERM_LABELS: Record<string, string> = {
  liquidation_preference: 'Liquidation Preference',
  anti_dilution: 'Anti-Dilution',
  board_composition: 'Board Composition',
  vesting_schedule: 'Vesting Schedule',
  esop_pool: 'ESOP Pool',
  pro_rata_rights: 'Pro-Rata Rights',
  voting_rights: 'Voting Rights',
  drag_along_rights: 'Drag-Along',
  tag_along_rights: 'Tag-Along',
  funding_amount: 'Investment Amount',
  equity_percentage: 'Equity %',
};

export const CompareMode: React.FC<Props> = ({ left, right, leftLabel, rightLabel }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'terms' | 'flags'>('overview');

  const leftBetter = left.friendliness_score > right.friendliness_score;
  const tied = left.friendliness_score === right.friendliness_score;

  const leftHighFlags = left.red_flags.filter(f => f.severity === 'high').length;
  const rightHighFlags = right.red_flags.filter(f => f.severity === 'high').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white/3 border border-white/8 rounded-xl">
        <ArrowLeftRight className="w-5 h-5 text-sky-400 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-white">Side-by-Side Comparison</h3>
          <p className="text-xs text-white/40">Comparing term sheets for key differences</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-white/3 border border-white/8 rounded-xl">
        {(['overview', 'terms', 'flags'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
              activeSection === s
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: leftLabel, analysis: left, isBetter: leftBetter || tied },
              { label: rightLabel, analysis: right, isBetter: !leftBetter || tied },
            ].map(({ label, analysis, isBetter }) => (
              <div
                key={label}
                className={`p-4 rounded-xl border text-center ${
                  isBetter && !tied
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-white/3 border-white/8'
                }`}
              >
                <p className="text-xs font-medium text-white/50 mb-2 truncate">{label}</p>
                <ScorePill score={analysis.friendliness_score} />
                <p className="text-xs text-white/30 mt-2">Friendliness Score</p>
                {isBetter && !tied && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400 font-medium">Better</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Verdict</h4>
            {tied ? (
              <p className="text-white/70 text-sm">Both term sheets score equally. Review individual terms and red flags to choose.</p>
            ) : (
              <p className="text-white/70 text-sm">
                <span className="text-emerald-300 font-semibold">{leftBetter ? leftLabel : rightLabel}</span> is more founder-friendly by{' '}
                <span className="font-semibold">{Math.abs(left.friendliness_score - right.friendliness_score)} points</span>.
                {' '}Consider prioritizing it, but review individual high-severity flags before deciding.
              </p>
            )}
          </div>

          {/* Red flags summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: leftLabel, flags: left.red_flags, highFlags: leftHighFlags },
              { label: rightLabel, flags: right.red_flags, highFlags: rightHighFlags },
            ].map(({ label, flags, highFlags }) => {
              const medFlags = flags.filter(f => f.severity === 'medium').length;
              const lowFlags = flags.filter(f => f.severity === 'low').length;
              return (
                <div key={label} className="p-3 bg-white/3 border border-white/8 rounded-xl">
                  <p className="text-xs font-medium text-white/50 mb-2 truncate">{label}</p>
                  <div className="space-y-1">
                    {highFlags > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Flame className="w-3 h-3 text-red-400" />
                        <span className="text-red-300">{highFlags} high</span>
                      </div>
                    )}
                    {medFlags > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300">{medFlags} medium</span>
                      </div>
                    )}
                    {lowFlags > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <TrendingUp className="w-3 h-3 text-sky-400" />
                        <span className="text-sky-300">{lowFlags} low</span>
                      </div>
                    )}
                    {flags.length === 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">No flags</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TERMS */}
      {activeSection === 'terms' && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr,1fr,1fr] gap-2 pb-2">
            <div className="text-xs font-medium text-white/30 uppercase tracking-wider">Term</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider truncate">{leftLabel}</div>
            <div className="text-xs font-medium text-white/50 uppercase tracking-wider truncate">{rightLabel}</div>
          </div>
          {COMPARE_TERMS.map((key) => {
            const lv = left.extracted_terms[key] || 'Not specified';
            const rv = right.extracted_terms[key] || 'Not specified';
            const differ = lv !== rv && lv !== 'Not specified' && rv !== 'Not specified';
            return (
              <div
                key={key}
                className={`grid grid-cols-[1fr,1fr,1fr] gap-2 p-3 rounded-xl ${
                  differ ? 'bg-amber-500/5 border border-amber-500/15' : 'bg-white/2 border border-white/5'
                }`}
              >
                <p className="text-xs font-medium text-white/50">{TERM_LABELS[key] || key}</p>
                <p className="text-xs text-white/75 leading-relaxed">{lv}</p>
                <p className="text-xs text-white/75 leading-relaxed">{rv}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* FLAGS */}
      {activeSection === 'flags' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: leftLabel, flags: left.red_flags },
            { label: rightLabel, flags: right.red_flags },
          ].map(({ label, flags }) => (
            <div key={label} className="space-y-2">
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider truncate">{label}</h4>
              {flags.length === 0 ? (
                <div className="text-center py-6 bg-white/2 border border-white/5 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                  <p className="text-white/35 text-xs">No flags</p>
                </div>
              ) : (
                flags
                  .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))
                  .map((flag, i) => {
                    const cfg = {
                      high: { icon: <Flame className="w-3 h-3 text-red-400" />, badge: 'bg-red-500/10 text-red-300 border-red-500/20' },
                      medium: { icon: <AlertTriangle className="w-3 h-3 text-amber-400" />, badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
                      low: { icon: <TrendingUp className="w-3 h-3 text-sky-400" />, badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
                    }[flag.severity];
                    return (
                      <div key={i} className="p-3 bg-white/2 border border-white/5 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          {cfg.icon}
                          <span className="text-xs font-semibold text-white/80">{flag.clause}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${cfg.badge}`}>{flag.severity}</span>
                        </div>
                        <p className="text-xs text-white/50 leading-relaxed">{flag.issue}</p>
                      </div>
                    );
                  })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

