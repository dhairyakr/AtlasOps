import React from 'react';
import { Shield, AlertTriangle, TrendingUp, Eye, CheckCircle } from 'lucide-react';
import { IntelBrief, AtlasQuery } from '../../services/atlasService';

interface AtlasIntelBriefProps {
  brief: IntelBrief;
  query: AtlasQuery;
}

const severityConfig = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'CRITICAL' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', label: 'HIGH' },
  medium: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.25)', label: 'MEDIUM' },
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)', label: 'LOW' },
};

export const AtlasIntelBrief: React.FC<AtlasIntelBriefProps> = ({ brief, query }) => {
  const confidenceColor = brief.confidence >= 70 ? '#22c55e' : brief.confidence >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400/70" />
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Intelligence Brief</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/30">Confidence</span>
            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${brief.confidence}%`, background: confidenceColor }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: confidenceColor }}>
              {brief.confidence}%
            </span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
            query.mode === 'live'
              ? 'text-emerald-400 border border-emerald-400/20'
              : 'text-slate-400 border border-slate-400/20'
          }`}
            style={query.mode === 'live' ? { background: 'rgba(16,185,129,0.08)' } : { background: 'rgba(255,255,255,0.04)' }}
          >
            {query.mode === 'live' ? 'Live Intelligence' : 'Reasoned Analysis'}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-1 h-4 rounded-full bg-teal-400" />
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Situation</span>
          </div>
          <p className="text-sm text-white/75 leading-relaxed">{brief.situation_summary}</p>
        </div>

        {brief.key_signals.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1 h-4 rounded-full bg-amber-400" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Key Signals</span>
            </div>
            <div className="space-y-2">
              {brief.key_signals.map((signal, i) => {
                const sev = severityConfig[signal.severity] || severityConfig.medium;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: sev.bg, border: `1px solid ${sev.border}` }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: sev.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/75 leading-relaxed">{signal.signal}</p>
                      <span className="text-[10px] mt-0.5 inline-block" style={{ color: sev.color }}>
                        {signal.region} · {sev.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {brief.probability_assessments.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1 h-4 rounded-full bg-sky-400" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Probability Assessment</span>
            </div>
            <div className="space-y-3">
              {brief.probability_assessments.map((assessment, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-white/65 flex-1 mr-4">{assessment.scenario}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-white/30">{assessment.timeframe}</span>
                      <span className="text-xs font-bold text-white/80">{assessment.probability}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1 rounded-full bg-white/8 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${assessment.probability}%`,
                        background: assessment.probability >= 70
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : assessment.probability >= 40
                          ? 'linear-gradient(90deg, #eab308, #ca8a04)'
                          : 'linear-gradient(90deg, #ef4444, #dc2626)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {brief.watchpoints.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1 h-4 rounded-full bg-rose-400" />
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Watchpoints</span>
            </div>
            <div className="space-y-1.5">
              {brief.watchpoints.map((wp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Eye className="w-3 h-3 text-rose-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60 leading-relaxed">{wp}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
