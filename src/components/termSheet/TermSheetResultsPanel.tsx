import React, { useState } from 'react';
import {
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clipboard,
  Swords,
  BarChart3,
  Flame,
  Info,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Percent,
  Shield,
} from 'lucide-react';
import type {
  TermSheetAnalysis,
  PersonaView,
  ActiveTab,
  RedFlag,
  NegotiationTactic,
} from '../../types/termSheet';

interface Props {
  analysis: TermSheetAnalysis;
  personaView: PersonaView;
  sourceText: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition-all flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const getColors = (s: number) => {
    if (s >= 70) return { start: '#10B981', end: '#34D399' };
    if (s >= 45) return { start: '#F59E0B', end: '#FCD34D' };
    return { start: '#EF4444', end: '#F87171' };
  };
  const colors = getColors(score);
  const label = score >= 70 ? 'Founder-Friendly' : score >= 45 ? 'Balanced' : 'Investor-Favorable';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="2.5"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={`url(#gauge-${score})`}
            strokeWidth="2.5"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id={`gauge-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold text-white leading-none">{score}</div>
            <div className="text-xs text-white/40 mt-1">/ 100</div>
          </div>
        </div>
      </div>
      <span
        className={`text-xs font-semibold mt-2 px-3 py-1 rounded-full ${
          score >= 70
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
            : score >= 45
            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            : 'bg-red-500/10 text-red-300 border border-red-500/20'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function RedFlagCard({ flag, index }: { flag: RedFlag; index: number }) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    high: {
      border: 'border-red-500/25',
      bg: 'bg-red-500/5',
      badge: 'bg-red-500/10 text-red-300 border-red-500/20',
      icon: <Flame className="w-4 h-4 text-red-400" />,
    },
    medium: {
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/5',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    low: {
      border: 'border-sky-500/25',
      bg: 'bg-sky-500/5',
      badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      icon: <Info className="w-4 h-4 text-sky-400" />,
    },
  };

  const cfg = severityConfig[flag.severity];

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => flag.negotiation_tactic && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{cfg.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h4 className="font-semibold text-white text-sm">{flag.clause}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase border ${cfg.badge}`}>
                {flag.severity}
              </span>
              {flag.negotiation_tactic && (
                <span className="px-2 py-0.5 bg-white/5 text-white/40 text-xs rounded border border-white/10">
                  Tactic available
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{flag.issue}</p>
          </div>
          {flag.negotiation_tactic && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex-shrink-0 p-1 text-white/30 hover:text-white/60 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {expanded && flag.negotiation_tactic && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5">
          <div className="flex items-start gap-2 mt-3">
            <Swords className="w-3.5 h-3.5 text-white/40 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">Negotiation Tactic</p>
              <p className="text-white/70 text-sm leading-relaxed">{flag.negotiation_tactic}</p>
            </div>
            <CopyButton text={flag.negotiation_tactic} />
          </div>
        </div>
      )}
    </div>
  );
}

const priorityConfig: Record<NegotiationTactic['priority'], { color: string; label: string }> = {
  critical: { color: 'bg-red-500/10 text-red-300 border-red-500/20', label: 'Critical' },
  high: { color: 'bg-orange-500/10 text-orange-300 border-orange-500/20', label: 'High' },
  medium: { color: 'bg-amber-500/10 text-amber-300 border-amber-500/20', label: 'Medium' },
  low: { color: 'bg-sky-500/10 text-sky-300 border-sky-500/20', label: 'Low' },
};

function NegotiationCard({ tactic }: { tactic: NegotiationTactic }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = priorityConfig[tactic.priority];

  return (
    <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
      <div
        className="flex items-start justify-between gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <h4 className="font-semibold text-white text-sm">{tactic.topic}</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <p className="text-white/50 text-xs truncate">{tactic.current_position}</p>
        </div>
        <button className="flex-shrink-0 p-1 text-white/30 hover:text-white/60 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pt-3 border-t border-white/5">
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Current</p>
            <p className="text-white/60 text-sm">{tactic.current_position}</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-xs font-medium text-emerald-400/70 uppercase tracking-wider mb-1">Ask For</p>
              <p className="text-white/80 text-sm font-medium">{tactic.suggested_ask}</p>
            </div>
            <CopyButton text={tactic.suggested_ask} />
          </div>
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Rationale</p>
            <p className="text-white/60 text-sm leading-relaxed">{tactic.rationale}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const TABS: { id: ActiveTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'summary', label: 'Summary', Icon: Eye },
  { id: 'terms', label: 'Terms', Icon: FileText },
  { id: 'redFlags', label: 'Red Flags', Icon: AlertTriangle },
  { id: 'suggestions', label: 'Suggestions', Icon: CheckCircle },
  { id: 'negotiate', label: 'Negotiate', Icon: Swords },
  { id: 'compare', label: 'Benchmark', Icon: BarChart3 },
  { id: 'fullText', label: 'Raw Text', Icon: Clipboard },
];

const TERM_DISPLAY_NAMES: Record<string, string> = {
  valuation_premoney: 'Pre-Money Valuation',
  valuation_postmoney: 'Post-Money Valuation',
  funding_amount: 'Investment Amount',
  equity_percentage: 'Equity %',
  security_type: 'Security Type',
  liquidation_preference: 'Liquidation Preference',
  liquidation_multiple: 'Liquidation Multiple',
  participation_rights: 'Participation Rights',
  anti_dilution: 'Anti-Dilution',
  anti_dilution_type: 'Anti-Dilution Type',
  board_composition: 'Board Composition',
  investor_board_seats: 'Investor Board Seats',
  voting_rights: 'Voting Rights',
  protective_provisions: 'Protective Provisions',
  vesting_schedule: 'Vesting Schedule',
  vesting_cliff: 'Vesting Cliff',
  acceleration: 'Acceleration',
  esop_pool: 'ESOP Pool',
  pro_rata_rights: 'Pro-Rata Rights',
  tag_along_rights: 'Tag-Along Rights',
  drag_along_rights: 'Drag-Along Rights',
  information_rights: 'Information Rights',
  pay_to_play: 'Pay-to-Play',
  redemption_rights: 'Redemption Rights',
  conversion_mechanics: 'Conversion Mechanics',
  break_up_fee: 'Break-Up Fee',
  exclusivity_period: 'Exclusivity Period',
  closing_conditions: 'Closing Conditions',
};

const KEY_NUMBER_TERMS = ['valuation_premoney', 'funding_amount', 'equity_percentage', 'liquidation_preference'];

const KEY_NUMBER_ICONS: Record<string, React.ReactNode> = {
  valuation_premoney: <DollarSign className="w-4 h-4 text-sky-400" />,
  funding_amount: <TrendingUp className="w-4 h-4 text-emerald-400" />,
  equity_percentage: <Percent className="w-4 h-4 text-amber-400" />,
  liquidation_preference: <Shield className="w-4 h-4 text-red-400" />,
};

export const TermSheetResultsPanel: React.FC<Props> = ({ analysis, personaView, sourceText }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  const highFlags = analysis.red_flags.filter(f => f.severity === 'high').length;
  const medFlags = analysis.red_flags.filter(f => f.severity === 'medium').length;
  const lowFlags = analysis.red_flags.filter(f => f.severity === 'low').length;

  const personaInsight = analysis.persona_insights?.[personaView];

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 pb-4 border-b border-white/5 flex-shrink-0">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          let badge: number | undefined;
          if (id === 'redFlags') badge = analysis.red_flags.length;
          if (id === 'suggestions') badge = analysis.suggestions.length;
          if (id === 'negotiate') badge = analysis.negotiation_tactics.length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all relative ${
                isActive
                  ? 'bg-white/10 text-white border border-white/15'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  id === 'redFlags' && highFlags > 0
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-white/10 text-white/50'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto pt-4">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Key Numbers Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {KEY_NUMBER_TERMS.map(key => {
                const value = analysis.extracted_terms[key];
                if (!value || value === 'Not specified') return null;
                return (
                  <div key={key} className="p-3 bg-white/3 border border-white/8 rounded-xl">
                    <div className="flex items-center gap-2 mb-1.5">
                      {KEY_NUMBER_ICONS[key]}
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wider truncate">
                        {TERM_DISPLAY_NAMES[key] || key}
                      </p>
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{value}</p>
                  </div>
                );
              })}
            </div>

            {/* Score + Summary */}
            <div className="p-5 bg-white/3 border border-white/8 rounded-2xl">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="flex-shrink-0">
                  <ScoreGauge score={analysis.friendliness_score} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Summary</h3>
                  <p className="text-white/80 leading-relaxed text-sm">{analysis.plain_summary}</p>
                  {personaInsight && (
                    <div className="mt-3 p-3 bg-white/3 border border-white/8 rounded-xl">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1 capitalize">{personaView} Perspective</p>
                      <p className="text-white/70 text-sm leading-relaxed">{personaInsight}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Red flag severity breakdown */}
            {analysis.red_flags.length > 0 && (
              <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Risk Overview</h4>
                <div className="flex gap-4">
                  {highFlags > 0 && (
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span className="text-red-300 font-semibold text-sm">{highFlags}</span>
                      <span className="text-white/40 text-xs">High</span>
                    </div>
                  )}
                  {medFlags > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300 font-semibold text-sm">{medFlags}</span>
                      <span className="text-white/40 text-xs">Medium</span>
                    </div>
                  )}
                  {lowFlags > 0 && (
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-sky-400" />
                      <span className="text-sky-300 font-semibold text-sm">{lowFlags}</span>
                      <span className="text-white/40 text-xs">Low</span>
                    </div>
                  )}
                  {analysis.red_flags.length === 0 && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 text-sm">No red flags detected</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Missing sections */}
            {analysis.missing_sections.length > 0 && (
              <div className="p-4 bg-amber-500/3 border border-amber-500/15 rounded-xl">
                <h4 className="text-xs font-semibold text-amber-400/70 uppercase tracking-wider mb-3">Missing Sections</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_sections.map((section, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-500/8 border border-amber-500/20 text-amber-300/80 rounded-full text-xs">
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TERMS */}
        {activeTab === 'terms' && (
          <div className="space-y-2">
            {Object.entries(analysis.extracted_terms)
              .filter(([, v]) => v && v !== 'Not specified' && v !== 'N/A')
              .map(([key, value]) => (
                <div key={key} className="p-4 bg-white/3 border border-white/8 rounded-xl group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5">
                        {TERM_DISPLAY_NAMES[key] || key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-white/80 text-sm leading-relaxed">{value}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={value} />
                    </div>
                  </div>
                </div>
              ))}
            {Object.values(analysis.extracted_terms).every(v => !v || v === 'Not specified') && (
              <div className="text-center py-12 text-white/30 text-sm">No terms extracted</div>
            )}
          </div>
        )}

        {/* RED FLAGS */}
        {activeTab === 'redFlags' && (
          <div className="space-y-3">
            {analysis.red_flags.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/8 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-white/50 text-sm font-medium">No red flags detected</p>
                <p className="text-white/30 text-xs mt-1">This term sheet appears founder-friendly</p>
              </div>
            ) : (
              <>
                <div className="flex gap-3 text-xs text-white/40 mb-1">
                  {highFlags > 0 && <span className="text-red-300">{highFlags} high</span>}
                  {medFlags > 0 && <span className="text-amber-300">{medFlags} medium</span>}
                  {lowFlags > 0 && <span className="text-sky-300">{lowFlags} low</span>}
                </div>
                {analysis.red_flags
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.severity] - order[b.severity];
                  })
                  .map((flag, i) => (
                    <RedFlagCard key={i} flag={flag} index={i} />
                  ))}
              </>
            )}
          </div>
        )}

        {/* SUGGESTIONS */}
        {activeTab === 'suggestions' && (
          <div className="space-y-2">
            {analysis.suggestions.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/8 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
                <p className="text-white/50 text-sm font-medium">No improvements needed</p>
                <p className="text-white/30 text-xs mt-1">The term sheet looks clean</p>
              </div>
            ) : (
              analysis.suggestions.map((s, i) => (
                <div key={i} className="p-4 bg-white/3 border border-white/8 rounded-xl group">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-xs font-bold">{i + 1}</span>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed flex-1">{s}</p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton text={s} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NEGOTIATE */}
        {activeTab === 'negotiate' && (
          <div className="space-y-3">
            {analysis.negotiation_tactics.length === 0 ? (
              <div className="text-center py-16 bg-white/2 border border-white/8 rounded-2xl">
                <Swords className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm font-medium">No negotiation tactics generated</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/30 pb-1">
                  Click a tactic to expand the full counter-proposal. Sorted by priority.
                </p>
                {analysis.negotiation_tactics
                  .sort((a, b) => {
                    const order = { critical: 0, high: 1, medium: 2, low: 3 };
                    return order[a.priority] - order[b.priority];
                  })
                  .map((t, i) => (
                    <NegotiationCard key={i} tactic={t} />
                  ))}
              </>
            )}
          </div>
        )}

        {/* BENCHMARK */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            {analysis.benchmark_comparison.overall_verdict && (
              <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Market Assessment</h4>
                <p className="text-white/70 text-sm leading-relaxed">{analysis.benchmark_comparison.overall_verdict}</p>
              </div>
            )}
            {analysis.benchmark_comparison.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-xs font-medium text-white/30 uppercase tracking-wider pb-3 pr-4">Term</th>
                      <th className="text-left text-xs font-medium text-white/30 uppercase tracking-wider pb-3 pr-4">YC SAFE</th>
                      <th className="text-left text-xs font-medium text-white/30 uppercase tracking-wider pb-3 pr-4">Series A</th>
                      <th className="text-left text-xs font-medium text-white/30 uppercase tracking-wider pb-3 pr-4">Series B</th>
                      <th className="text-left text-xs font-medium text-white/30 uppercase tracking-wider pb-3">This Deal</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {analysis.benchmark_comparison.items.map((item, i) => {
                      const statusColor = {
                        good: 'text-emerald-300',
                        warning: 'text-amber-300',
                        danger: 'text-red-300',
                        neutral: 'text-white/60',
                      }[item.status];
                      return (
                        <tr key={i} className="border-b border-white/3">
                          <td className="py-3 pr-4 text-white/80 font-medium text-xs whitespace-nowrap">{item.label}</td>
                          <td className="py-3 pr-4 text-white/40 text-xs">{item.ycSafe}</td>
                          <td className="py-3 pr-4 text-white/40 text-xs">{item.seriesA}</td>
                          <td className="py-3 pr-4 text-white/40 text-xs">{item.seriesB}</td>
                          <td className={`py-3 font-semibold text-xs ${statusColor}`}>{item.current}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-white/30 text-sm">No benchmark data available</div>
            )}
          </div>
        )}

        {/* FULL TEXT */}
        {activeTab === 'fullText' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Source Document</h3>
              <CopyButton text={sourceText} />
            </div>
            <div className="p-4 bg-white/2 border border-white/8 rounded-xl max-h-[60vh] overflow-auto">
              <pre className="text-white/50 text-xs whitespace-pre-wrap font-mono leading-relaxed">{sourceText || 'No source text available'}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
