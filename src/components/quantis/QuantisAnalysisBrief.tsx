import React, { useState } from 'react';
import {
  Bookmark, ChevronDown, ChevronRight, AlertTriangle, TrendingUp, Shield,
  Zap, Star, BarChart2, Target, Activity, CheckCircle, XCircle,
  BookOpen, Users, GitBranch, TrendingDown, ArrowUpRight, ArrowDownRight,
  Minus, AlertCircle, Layers, PieChart, Award, LineChart
} from 'lucide-react';
import {
  QuantisAnalysis, PricePoint, LynchType, CommodityCycle,
  PiotroskiScore, AltmanScore, ROICvsWACC, HistoricalValuation,
  MarginProfile, ManagementQuality, BeneishScore, LiquidityAnalysis,
  EarningsQuality, InsiderActivity,
} from '../../services/quantisService';
import { QuantisPriceChart } from './QuantisPriceChart';

interface QuantisAnalysisBriefProps {
  analysis: QuantisAnalysis;
  priceData: PricePoint[];
  currentPrice: { price: number; currency: string } | null;
  isOnWatchlist: boolean;
  onSaveToWatchlist: () => void;
}

const VERDICT_CONFIG = {
  avoid: { label: 'Avoid', bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  overvalued: { label: 'Overvalued — Wait', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  watchlist: { label: 'Watchlist', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  good_buy: { label: 'Good Buy', bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  strong_buy: { label: 'Strong Buy', bg: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: 'rgba(20,184,166,0.3)' },
};

const MOAT_LABELS: Record<string, string> = {
  brand: 'Brand', distribution: 'Distribution', technology: 'Technology',
  cost_advantage: 'Cost Advantage', switching_costs: 'Switching Costs',
  network_effects: 'Network Effects', patents: 'Patents',
};

const RISK_LABELS: Record<string, string> = {
  commodity_risk: 'Commodity',
  regulatory_risk: 'Regulatory',
  debt_risk: 'Debt',
  competition_risk: 'Competition',
  technology_disruption_risk: 'Tech Disruption',
  liquidity_risk: 'Liquidity',
  currency_risk: 'Currency',
  interest_rate_risk: 'Interest Rate',
  geopolitical_risk: 'Geopolitical',
  demand_cycle_risk: 'Demand Cycle',
};

const LYNCH_CONFIG: Record<LynchType, { label: string; color: string; bg: string; border: string; note: string }> = {
  fast_grower: { label: 'Fast Grower', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', note: 'Lynch: High growth, watch valuation carefully' },
  stalwart: { label: 'Stalwart', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.25)', note: 'Lynch: Steady compounder, good for long holds' },
  slow_grower: { label: 'Slow Grower', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', note: 'Lynch: Buy only if very cheap, focus on dividends' },
  cyclical: { label: 'Cyclical', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', note: 'Lynch: Buy near trough cycle, sell near peak' },
  turnaround: { label: 'Turnaround', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.25)', note: 'Lynch: High risk, high reward — track recovery progress' },
  asset_play: { label: 'Asset Play', color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', note: 'Lynch: Value in hidden assets — verify asset quality' },
};

const CYCLE_CONFIG: Record<CommodityCycle, { label: string; color: string; bg: string; border: string; note: string }> = {
  peak: { label: 'Cycle Peak', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', note: 'Caution: Margins at highs, fair value reduced 17%. Risk of reversion.' },
  mid: { label: 'Mid Cycle', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', note: 'Normalized conditions. Fair value adjusted -5%.' },
  recovery: { label: 'Recovery', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', note: 'Improving fundamentals. Good entry window developing.' },
  bottom: { label: 'Cycle Bottom', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.25)', note: 'Best structural buy zone for cyclicals. Patience required.' },
  not_applicable: { label: '', color: '', bg: '', border: '', note: '' },
};

const MARGIN_TREND_CONFIG = {
  expanding: { icon: ArrowUpRight, color: '#22c55e', label: 'Expanding' },
  stable: { icon: Minus, color: '#94a3b8', label: 'Stable' },
  contracting: { icon: ArrowDownRight, color: '#ef4444', label: 'Contracting' },
};

function fmtPrice(p: number, currency: string): string {
  if (!p) return 'N/A';
  if (currency === 'INR') return `\u20B9${p.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return `$${p.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function ScoreCircle({ score }: { score: number }) {
  const r = 26, circumference = 2 * Math.PI * r;
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
      <svg className="absolute inset-0" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <span className="text-sm font-bold text-white relative z-10">{score}</span>
    </div>
  );
}

function MiniScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const color = pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-bold font-mono w-5 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

function RiskBar({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? '#ef4444' : score >= 5 ? '#f59e0b' : '#22c55e';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/45">{label}</span>
        <span className="text-[10px] font-bold font-mono" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${(score / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function FactorCard({ factor, defaultOpen = false }: { factor: { name: string; score: number; rationale: string; data_points: string[] }; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = factor.score >= 7 ? '#22c55e' : factor.score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <button className="w-full flex items-center gap-3 p-3 text-left" onClick={() => setOpen(v => !v)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />}
          <span className="text-xs font-semibold text-white/80 truncate">{factor.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-20 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${(factor.score / 10) * 100}%`, background: color }} />
          </div>
          <span className="text-xs font-bold font-mono w-4 text-right" style={{ color }}>{factor.score}</span>
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <p className="text-xs text-white/55 leading-relaxed">{factor.rationale}</p>
          {factor.data_points?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {factor.data_points.map((dp, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md text-white/50" style={{ background: 'rgba(255,255,255,0.06)' }}>{dp}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RatioPill({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-[10px] text-white/35 mb-0.5">{label}</span>
      <span className="text-sm font-bold text-white/80 font-mono">{value}</span>
    </div>
  );
}

function QualityCheck({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {pass
        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        : <XCircle className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />}
      <span className={`text-xs ${pass ? 'text-white/70' : 'text-white/35'}`}>{label}</span>
    </div>
  );
}

function PeerBar({ label, company, industry, lowerIsBetter = false }: { label: string; company: number; industry: number; lowerIsBetter?: boolean }) {
  if (!company && !industry) return null;
  const max = Math.max(company, industry, 1);
  const beats = lowerIsBetter ? company <= industry : company >= industry;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">{label}</span>
        <div className="flex items-center gap-1.5">
          {beats
            ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
            : <ArrowDownRight className="w-3 h-3 text-red-400" />}
          <span className="text-[10px] font-bold font-mono" style={{ color: beats ? '#22c55e' : '#ef4444' }}>{company.toFixed(1)}</span>
          <span className="text-[10px] text-white/25">vs</span>
          <span className="text-[10px] text-white/40 font-mono">{industry.toFixed(1)}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/25 w-8 text-right">Co.</span>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(company / max) * 100}%`, background: beats ? '#22c55e' : '#f59e0b' }} />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-white/25 w-8 text-right">Ind.</span>
          <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full" style={{ width: `${(industry / max) * 100}%`, background: 'rgba(148,163,184,0.4)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PorterBar({ label, score, isPositive }: { label: string; score: number; isPositive: boolean }) {
  const pct = (score / 10) * 100;
  const color = isPositive
    ? (score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444')
    : (score >= 7 ? '#ef4444' : score >= 5 ? '#f59e0b' : '#22c55e');
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/40">{label}</span>
        <span className="text-[10px] font-bold font-mono" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function HealthBar({ label, score, weight }: { label: string; score: number; weight: string }) {
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-white/50">{label}</span>
          <span className="text-[9px] text-white/25">{weight}</span>
        </div>
        <span className="text-[10px] font-bold font-mono" style={{ color }}>{score}/10</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(score / 10) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function PiotroskiPanel({ p }: { p: PiotroskiScore }) {
  const color = p.score >= 7 ? '#22c55e' : p.score >= 5 ? '#f59e0b' : '#ef4444';
  const checks = [
    { pass: p.roa_positive, label: 'ROA Positive' },
    { pass: p.ocf_positive, label: 'OCF Positive' },
    { pass: p.roa_improving, label: 'ROA Improving YoY' },
    { pass: p.accruals_low, label: 'Low Accruals (OCF > Net Income)' },
    { pass: p.leverage_declining, label: 'Leverage Declining' },
    { pass: p.current_ratio_improving, label: 'Current Ratio Improving' },
    { pass: p.no_new_shares, label: 'No Share Dilution' },
    { pass: p.gross_margin_improving, label: 'Gross Margin Improving' },
    { pass: p.asset_turnover_improving, label: 'Asset Turnover Improving' },
  ];
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Piotroski F-Score</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono" style={{ color }}>{p.score}/9</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{p.label.split(' ')[0]}</span>
        </div>
      </div>
      <div className="mb-3 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(p.score / 9) * 100}%`, background: color }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-3">
        {checks.map((c, i) => <QualityCheck key={i} pass={c.pass} label={c.label} />)}
      </div>
    </div>
  );
}

function AltmanPanel({ a }: { a: AltmanScore }) {
  const zoneConfig = {
    safe: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)', label: 'Safe Zone (Z > 3.0)' },
    grey: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', label: 'Grey Zone (1.8 – 3.0)' },
    distress: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', label: 'Distress Zone (< 1.8)' },
  };
  const cfg = zoneConfig[a.zone];
  const segments = [
    { label: 'Distress', end: 1.8, color: '#ef4444' },
    { label: 'Grey', end: 3.0, color: '#f59e0b' },
    { label: 'Safe', end: 5.0, color: '#22c55e' },
  ];
  const clampedScore = Math.min(Math.max(a.score, 0), 5);
  const pct = (clampedScore / 5) * 100;
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Altman Z-Score</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-mono" style={{ color: cfg.color }}>{a.score.toFixed(1)}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{a.zone.charAt(0).toUpperCase() + a.zone.slice(1)}</span>
        </div>
      </div>
      <div className="relative h-3 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${(1.8 / 5) * 100}%`, background: 'rgba(239,68,68,0.35)' }} />
        <div className="absolute inset-y-0" style={{ left: `${(1.8 / 5) * 100}%`, width: `${((3.0 - 1.8) / 5) * 100}%`, background: 'rgba(245,158,11,0.35)' }} />
        <div className="absolute inset-y-0" style={{ left: `${(3.0 / 5) * 100}%`, right: 0, background: 'rgba(34,197,94,0.35)' }} />
        <div className="absolute top-0 bottom-0 w-1 -translate-x-1/2 rounded-full" style={{ left: `${pct}%`, background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
      </div>
      <div className="flex justify-between mb-2">
        {segments.map(s => (
          <span key={s.label} className="text-[9px] font-semibold" style={{ color: s.color }}>{s.label}</span>
        ))}
      </div>
      <p className="text-[10px] text-white/35">{cfg.label} — {a.label}</p>
    </div>
  );
}

function ROICWACCPanel({ r }: { r: ROICvsWACC }) {
  const spreadColor = r.spread > 5 ? '#22c55e' : r.spread > 0 ? '#14b8a6' : r.spread > -3 ? '#f59e0b' : '#ef4444';
  const irColor = r.incremental_roic > 15 ? '#22c55e' : r.incremental_roic > 8 ? '#f59e0b' : '#ef4444';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-3.5 h-3.5 text-teal-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">ROIC vs WACC</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${spreadColor}18`, color: spreadColor, border: `1px solid ${spreadColor}30` }}>
          {r.creates_value ? 'Value Creating' : 'Value Destroying'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">ROIC</p>
          <p className="text-sm font-bold font-mono" style={{ color: '#14b8a6' }}>{r.roic.toFixed(1)}%</p>
          <p className="text-[9px] text-white/25 mt-0.5">NOPAT / Inv. Cap.</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">WACC</p>
          <p className="text-sm font-bold font-mono text-white/60">{r.wacc.toFixed(1)}%</p>
          <p className="text-[9px] text-white/20 mt-0.5">CAPM-derived</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${spreadColor}10`, border: `1px solid ${spreadColor}25` }}>
          <p className="text-[10px] mb-1" style={{ color: `${spreadColor}99` }}>Spread</p>
          <p className="text-sm font-bold font-mono" style={{ color: spreadColor }}>{r.spread > 0 ? '+' : ''}{r.spread.toFixed(1)}%</p>
        </div>
      </div>
      <p className="text-[10px] text-white/35 mb-2">{r.label}</p>
      {r.incremental_roic !== 0 && (
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] text-white/35">Incremental ROIC (ΔNOPAT / ΔInv. Cap.)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold font-mono" style={{ color: irColor }}>{r.incremental_roic.toFixed(1)}%</span>
            <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: `${irColor}15`, color: irColor, border: `1px solid ${irColor}25` }}>{r.incremental_roic_label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BeneishPanel({ b }: { b: BeneishScore }) {
  const color = b.manipulation_risk ? '#ef4444' : '#22c55e';
  const factors = [
    { label: 'DSRI (Receivables)', value: b.dsri, warn: b.dsri > 1.465 },
    { label: 'GMI (Gross Margin)', value: b.gmi, warn: b.gmi > 1.193 },
    { label: 'AQI (Asset Quality)', value: b.aqi, warn: b.aqi > 1.254 },
    { label: 'SGI (Sales Growth)', value: b.sgi, warn: b.sgi > 1.607 },
    { label: 'DEPI (Depreciation)', value: b.depi, warn: b.depi > 1.082 },
    { label: 'SGAI (SGA)', value: b.sgai, warn: b.sgai > 1.041 },
    { label: 'LVGI (Leverage)', value: b.lvgi, warn: b.lvgi > 1.0 },
    { label: 'TATA (Accruals)', value: b.tata, warn: b.tata > 0.031 },
  ];
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Beneish M-Score (Fraud Detection)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold font-mono" style={{ color }}>{b.score.toFixed(2)}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{b.manipulation_risk ? 'Risk' : 'Clean'}</span>
        </div>
      </div>
      <p className="text-[10px] text-white/35 mb-3">{b.label} · Threshold: M &gt; −1.78 indicates manipulation risk</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {factors.map(f => (
          <div key={f.label} className="p-2 rounded-xl text-center" style={{ background: f.warn ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${f.warn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <p className="text-[9px] mb-0.5" style={{ color: f.warn ? '#ef4444' : 'rgba(255,255,255,0.35)' }}>{f.label}</p>
            <p className="text-xs font-bold font-mono" style={{ color: f.warn ? '#ef4444' : 'rgba(255,255,255,0.6)' }}>{f.value.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiquidityPanel({ l }: { l: LiquidityAnalysis }) {
  const riskColor = l.liquidity_risk === 'low' ? '#22c55e' : l.liquidity_risk === 'medium' ? '#f59e0b' : '#ef4444';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Liquidity Analysis</p>
        </div>
        <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-lg" style={{ background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}25` }}>
          {l.liquidity_risk} risk
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">Avg Daily Vol</p>
          <p className="text-xs font-bold font-mono text-white/70">{l.avg_daily_volume > 0 ? (l.avg_daily_volume / 1e6).toFixed(2) + 'M' : 'N/A'}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">Free Float</p>
          <p className="text-xs font-bold font-mono text-white/70">{l.free_float_pct > 0 ? l.free_float_pct.toFixed(1) + '%' : 'N/A'}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${riskColor}0e`, border: `1px solid ${riskColor}20` }}>
          <p className="text-[10px] mb-1" style={{ color: `${riskColor}99` }}>Liq. Score</p>
          <p className="text-xs font-bold font-mono" style={{ color: riskColor }}>{l.liquidity_score}/10</p>
        </div>
      </div>
      {l.notes && <p className="text-[10px] text-white/35">{l.notes}</p>}
    </div>
  );
}

function EarningsQualityPanel({ eq }: { eq: EarningsQuality }) {
  const color = eq.manipulation_risk ? '#ef4444' : eq.accrual_ratio > 0.05 ? '#f59e0b' : '#22c55e';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Earnings Quality</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>
          {eq.manipulation_risk ? 'Quality Risk' : 'Quality OK'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="text-center p-2.5 rounded-xl" style={{ background: eq.manipulation_risk ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)', border: `1px solid ${eq.manipulation_risk ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
          <p className="text-[10px] text-white/35 mb-1">Accrual Ratio</p>
          <p className="text-sm font-bold font-mono" style={{ color }}>{eq.accrual_ratio.toFixed(3)}</p>
          <p className="text-[9px] text-white/25 mt-0.5">(NI − OCF) / Assets</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">OCF / Net Income</p>
          <p className="text-sm font-bold font-mono" style={{ color: eq.ocf_ni_ratio >= 1 ? '#22c55e' : '#f59e0b' }}>{eq.ocf_ni_ratio.toFixed(2)}x</p>
          <p className="text-[9px] text-white/25 mt-0.5">Higher = better quality</p>
        </div>
      </div>
      <p className="text-[10px] text-white/35">{eq.label}</p>
    </div>
  );
}

function InsiderActivityPanel({ ia }: { ia: InsiderActivity }) {
  const signalColor = ia.signal === 'bullish' ? '#22c55e' : ia.signal === 'bearish' ? '#ef4444' : '#94a3b8';
  const isUS = ia.is_us_stock;
  const instTrendColor = ia.institutional_trend === 'increasing' ? '#22c55e' : ia.institutional_trend === 'decreasing' ? '#ef4444' : '#94a3b8';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{isUS ? 'Institutional & Insider Activity' : 'Insider Activity'}</p>
        </div>
        <span className="text-[10px] font-semibold capitalize px-2 py-0.5 rounded-lg" style={{ background: `${signalColor}15`, color: signalColor, border: `1px solid ${signalColor}25` }}>
          {ia.signal}
        </span>
      </div>
      {isUS ? (
        <div className="space-y-1.5 mb-2">
          <QualityCheck pass={!!ia.ceo_director_buying} label="CEO/Director buying shares" />
          <QualityCheck pass={!ia.insider_selling} label="No significant insider selling" />
          <QualityCheck pass={!!ia.buyback_active} label="Active share buyback program" />
          {ia.institutional_ownership_pct != null && ia.institutional_ownership_pct > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-white/40">Institutional ownership:</span>
              <span className="text-[10px] font-bold font-mono text-white/65">{ia.institutional_ownership_pct.toFixed(1)}%</span>
              {ia.institutional_trend && (
                <span className="text-[10px] font-semibold capitalize" style={{ color: instTrendColor }}>{ia.institutional_trend}</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 mb-2">
          <QualityCheck pass={ia.promoter_buying} label="Promoter increasing stake (bullish)" />
          <QualityCheck pass={!ia.insider_selling} label="No insider selling detected" />
          <QualityCheck pass={!ia.pledged_above_threshold} label="Pledged shares below 20% threshold" />
        </div>
      )}
      {ia.notes && <p className="text-[10px] text-white/35 mt-2">{ia.notes}</p>}
    </div>
  );
}

function HistoricalValPanel({ h, currency }: { h: HistoricalValuation; currency: string }) {
  const peColor = h.pe_vs_history === 'cheap' ? '#22c55e' : h.pe_vs_history === 'fair' ? '#f59e0b' : '#ef4444';
  const peLabel = h.pe_vs_history === 'cheap' ? 'Cheap vs History' : h.pe_vs_history === 'fair' ? 'Fairly Valued' : 'Expensive vs History';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LineChart className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Historical Valuation</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${peColor}18`, color: peColor, border: `1px solid ${peColor}30` }}>{peLabel}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${peColor}0e`, border: `1px solid ${peColor}20` }}>
          <p className="text-[10px] mb-1" style={{ color: `${peColor}99` }}>Current PE</p>
          <p className="text-sm font-bold font-mono" style={{ color: peColor }}>{h.pe_current.toFixed(1)}x</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">5-Yr Median PE</p>
          <p className="text-sm font-bold font-mono text-white/60">{h.pe_5yr_median.toFixed(1)}x</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">10-Yr Median PE</p>
          <p className="text-sm font-bold font-mono text-white/60">{h.pe_10yr_median.toFixed(1)}x</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">EV/EBITDA</p>
          <p className="text-sm font-bold font-mono text-white/60">{h.ev_ebitda_current.toFixed(1)}x</p>
          {h.ev_ebitda_5yr_median > 0 && <p className="text-[9px] text-white/25">5yr avg {h.ev_ebitda_5yr_median.toFixed(1)}x</p>}
        </div>
      </div>
      {h.pb_current > 0 && h.pb_5yr_median > 0 && (
        <div className="mt-2 flex items-center gap-2 text-[10px] text-white/35">
          <span>P/B: <span className="text-white/55 font-mono">{h.pb_current.toFixed(1)}x</span></span>
          <span className="text-white/20">vs 5yr</span>
          <span className="font-mono text-white/40">{h.pb_5yr_median.toFixed(1)}x</span>
        </div>
      )}
    </div>
  );
}

function MarginProfilePanel({ m }: { m: MarginProfile }) {
  const stabilityColor = m.margin_stability === 'excellent' ? '#22c55e' : m.margin_stability === 'moderate' ? '#f59e0b' : '#ef4444';
  const trendCfg = MARGIN_TREND_CONFIG[m.trend] || MARGIN_TREND_CONFIG.stable;
  const TrendIcon = trendCfg.icon;
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-teal-400" />
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Margin Profile</p>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3 h-3" style={{ color: trendCfg.color }} />
          <span className="text-[10px]" style={{ color: trendCfg.color }}>{trendCfg.label}</span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] font-semibold capitalize" style={{ color: stabilityColor }}>{m.margin_stability} Stability</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">Current Margin</p>
          <p className="text-sm font-bold font-mono text-white/70">{m.operating_margin_current.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">5-Yr Avg</p>
          <p className="text-sm font-bold font-mono text-white/70">{m.operating_margin_5yr_avg.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${stabilityColor}0e`, border: `1px solid ${stabilityColor}20` }}>
          <p className="text-[10px] mb-1" style={{ color: `${stabilityColor}99` }}>Std Dev</p>
          <p className="text-sm font-bold font-mono" style={{ color: stabilityColor }}>{m.margin_std_dev.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

function ManagementPanel({ mgmt }: { mgmt: ManagementQuality }) {
  const pledgeColor = mgmt.promoter_pledged_pct > 20 ? '#ef4444' : mgmt.promoter_pledged_pct > 10 ? '#f59e0b' : '#22c55e';
  const trendColor = mgmt.promoter_trend === 'increasing' ? '#22c55e' : mgmt.promoter_trend === 'stable' ? '#94a3b8' : '#ef4444';
  const roicTrendColor = mgmt.roic_trend === 'improving' ? '#22c55e' : mgmt.roic_trend === 'stable' ? '#94a3b8' : '#ef4444';
  const caColor = mgmt.capital_allocation_score >= 7 ? '#22c55e' : mgmt.capital_allocation_score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-sky-400" />
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Management Quality</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">Promoter Hold</p>
          <p className="text-sm font-bold font-mono text-white/70">{mgmt.promoter_holding_pct.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${pledgeColor}0e`, border: `1px solid ${pledgeColor}20` }}>
          <p className="text-[10px] mb-1" style={{ color: `${pledgeColor}99` }}>Pledged</p>
          <p className="text-sm font-bold font-mono" style={{ color: pledgeColor }}>{mgmt.promoter_pledged_pct.toFixed(1)}%</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: `${caColor}0e`, border: `1px solid ${caColor}20` }}>
          <p className="text-[10px] mb-1" style={{ color: `${caColor}99` }}>Cap. Allocation</p>
          <p className="text-sm font-bold font-mono" style={{ color: caColor }}>{mgmt.capital_allocation_score}/10</p>
        </div>
        <div className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] text-white/35 mb-1">ROIC Trend</p>
          <p className="text-xs font-semibold capitalize" style={{ color: roicTrendColor }}>{mgmt.roic_trend}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg" style={{ background: `${trendColor}10`, color: trendColor, border: `1px solid ${trendColor}25` }}>
          Promoter: <span className="font-semibold capitalize ml-0.5">{mgmt.promoter_trend}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg" style={{ background: mgmt.dividend_consistency ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', color: mgmt.dividend_consistency ? '#22c55e' : 'rgba(255,255,255,0.35)', border: `1px solid ${mgmt.dividend_consistency ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
          {mgmt.dividend_consistency ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span className="ml-0.5">Dividend Consistent</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg" style={{ background: mgmt.buyback_history ? 'rgba(20,184,166,0.1)' : 'rgba(255,255,255,0.04)', color: mgmt.buyback_history ? '#14b8a6' : 'rgba(255,255,255,0.35)', border: `1px solid ${mgmt.buyback_history ? 'rgba(20,184,166,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
          {mgmt.buyback_history ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span className="ml-0.5">Buyback History</span>
        </span>
      </div>
    </div>
  );
}

export const QuantisAnalysisBrief: React.FC<QuantisAnalysisBriefProps> = ({
  analysis, priceData, currentPrice, isOnWatchlist, onSaveToWatchlist,
}) => {
  const vc = VERDICT_CONFIG[analysis.verdict] || VERDICT_CONFIG.watchlist;
  const currency = currentPrice?.currency || analysis.entry_range?.currency || 'INR';
  const activeMoats = analysis.moat
    ? Object.entries(analysis.moat).filter(([, v]) => v).map(([k]) => MOAT_LABELS[k] || k)
    : [];
  const scorecardFactors = analysis.scorecard ? Object.values(analysis.scorecard) : [];
  const er = analysis.entry_range;
  const livePrice = currentPrice?.price || 0;
  const vm = analysis.valuation_model;
  const mb = analysis.multibagger;
  const qb = analysis.quality_badge;
  const rs = analysis.risk_scores;
  const gs = analysis.graham_score;
  const fh = analysis.financial_health;
  const pc = analysis.peer_comparison;
  const pf = analysis.porter_forces;
  const pio = analysis.piotroski;
  const alt = analysis.altman;
  const rw = analysis.roic_vs_wacc;
  const hv = analysis.historical_valuation;
  const mp = analysis.margin_profile;
  const mgmt = analysis.management;
  const bs = analysis.beneish;
  const liq = analysis.liquidity;
  const eq = analysis.earnings_quality;
  const ia = analysis.insider_activity;

  const entryMin = er?.margin_of_safety_low || 0;
  const entryMax = er?.margin_of_safety_high || 0;
  const fairValue = er?.fair_value || 0;
  const entryPrice = er?.entry_price_suggestion || 0;
  const mosPct = er?.margin_of_safety_pct || 25;
  const priceRangeMin = Math.min(entryMin, livePrice) * 0.92 || 0;
  const priceRangeMax = Math.max(fairValue, livePrice) * 1.08 || 1;
  const pRange = priceRangeMax - priceRangeMin || 1;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - priceRangeMin) / pRange) * 100));

  const mbColor = mb?.score >= 80 ? '#22c55e' : mb?.score >= 65 ? '#f59e0b' : mb?.score >= 50 ? '#f97316' : '#ef4444';
  const lynchCfg = LYNCH_CONFIG[analysis.lynch_type] || LYNCH_CONFIG.stalwart;
  const cycleCfg = CYCLE_CONFIG[analysis.commodity_cycle] || CYCLE_CONFIG.not_applicable;
  const marginTrendCfg = MARGIN_TREND_CONFIG[analysis.operating_margin_trend] || MARGIN_TREND_CONFIG.stable;
  const MarginIcon = marginTrendCfg.icon;

  const hasPeerData = pc && (pc.roe_industry > 0 || pc.roce_industry > 0 || pc.margin_industry > 0);
  const isPlaceholder = (v?: string) => !v || v.includes('actual') || v.includes('like') || v === 'N/A' || v.includes('secular only') || v.includes('omit') || v.includes('X%') || v.includes('Xx');

  const kr = analysis.key_ratios || {};
  const pills = [
    { label: 'P/E', value: kr.pe },
    { label: 'Norm. P/E', value: analysis.industry_type === 'cyclical' ? kr.normalized_pe : undefined },
    { label: 'P/B', value: kr.pb },
    { label: 'PEG', value: analysis.industry_type !== 'cyclical' ? kr.peg : undefined },
    { label: 'EV/EBITDA', value: kr.ev_ebitda },
    { label: 'ROE', value: kr.roe },
    { label: 'ROCE', value: kr.roce },
    { label: 'ROIC', value: kr.roic },
    { label: 'D/E', value: kr.debt_equity },
    { label: 'Int. Cov.', value: kr.interest_coverage },
    { label: 'Curr. Ratio', value: kr.current_ratio },
    { label: 'Net D/EBITDA', value: kr.net_debt_ebitda },
    { label: 'Op. Margin', value: kr.operating_margin },
    { label: 'Rev. CAGR', value: kr.revenue_cagr },
    { label: 'Profit CAGR', value: kr.profit_cagr },
    { label: 'EPS CAGR', value: kr.eps_cagr },
    { label: 'FCF Yield', value: kr.fcf_yield },
    { label: 'Promoter', value: kr.promoter_holding },
  ].filter(p => !isPlaceholder(p.value));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border p-4 sm:p-5" style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <ScoreCircle score={analysis.overall_score} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-white">{analysis.company_name}</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>{vc.label}</span>
                {analysis.industry_type && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize flex-shrink-0" style={{ background: analysis.industry_type === 'cyclical' ? 'rgba(245,158,11,0.12)' : 'rgba(20,184,166,0.12)', color: analysis.industry_type === 'cyclical' ? '#f59e0b' : '#14b8a6', border: `1px solid ${analysis.industry_type === 'cyclical' ? 'rgba(245,158,11,0.25)' : 'rgba(20,184,166,0.25)'}` }}>
                    {analysis.industry_type}
                  </span>
                )}
                {analysis.lynch_type && lynchCfg.label && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ background: lynchCfg.bg, color: lynchCfg.color, border: `1px solid ${lynchCfg.border}` }}>
                    {lynchCfg.label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-mono font-bold text-white/60">{analysis.ticker}</span>
                <span className="text-white/25">·</span>
                <span className="text-xs text-white/40">{analysis.exchange}</span>
                <span className="text-white/25">·</span>
                <span className="text-xs text-white/40">{analysis.sector}</span>
                {analysis.operating_margin_trend && (
                  <>
                    <span className="text-white/25">·</span>
                    <div className="flex items-center gap-0.5">
                      <MarginIcon className="w-3 h-3" style={{ color: marginTrendCfg.color }} />
                      <span className="text-[10px]" style={{ color: marginTrendCfg.color }}>{marginTrendCfg.label} Margins</span>
                    </div>
                  </>
                )}
              </div>
              {livePrice > 0 && (
                <p className="text-lg font-bold mt-1" style={{ color: '#14b8a6' }}>
                  {fmtPrice(livePrice, currency)}<span className="text-xs text-white/30 ml-1 font-normal">live</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={onSaveToWatchlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-[1.02]"
              style={{ background: isOnWatchlist ? 'rgba(20,184,166,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isOnWatchlist ? 'rgba(20,184,166,0.3)' : 'rgba(255,255,255,0.10)'}`, color: isOnWatchlist ? '#14b8a6' : 'rgba(255,255,255,0.5)' }}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isOnWatchlist ? 'fill-teal-400' : ''}`} />
              {isOnWatchlist ? 'Saved' : 'Watchlist'}
            </button>
            {qb && (
              <div className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: qb.is_elite ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)', color: qb.is_elite ? '#eab308' : 'rgba(255,255,255,0.4)', border: `1px solid ${qb.is_elite ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                {qb.is_elite ? '★ ' : ''}{qb.label}
              </div>
            )}
            {analysis.accrual_warning && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertCircle className="w-3 h-3" />
                Accrual Warning
              </div>
            )}
            {analysis.shares_dilution && (
              <div className="px-2 py-1 rounded-lg text-[10px] font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                Share Dilution
              </div>
            )}
          </div>
        </div>

        {lynchCfg.note && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: `${lynchCfg.bg}`, border: `1px solid ${lynchCfg.border}` }}>
            <BookOpen className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: lynchCfg.color }} />
            <p className="text-[11px] leading-relaxed" style={{ color: lynchCfg.color }}>{lynchCfg.note}</p>
          </div>
        )}

        {analysis.commodity_cycle !== 'not_applicable' && cycleCfg.label && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: cycleCfg.bg, border: `1px solid ${cycleCfg.border}` }}>
            <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: cycleCfg.color }} />
            <div>
              <span className="text-[10px] font-bold" style={{ color: cycleCfg.color }}>{cycleCfg.label} · </span>
              <span className="text-[10px]" style={{ color: cycleCfg.color }}>{cycleCfg.note}</span>
            </div>
          </div>
        )}

        {analysis.summary && (
          <p className="mt-3 text-sm text-white/55 leading-relaxed border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {analysis.summary}
          </p>
        )}

        {livePrice > 0 && fairValue > 0 && entryMin > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {(() => {
              const pctAboveFV = ((livePrice - fairValue) / fairValue * 100);
              const pctAboveBuyZone = ((livePrice - entryMax) / entryMax * 100);
              const inBuyZone = livePrice >= entryMin && livePrice <= entryMax;
              const belowBuyZone = livePrice < entryMin;
              const aboveFV = livePrice > fairValue;
              const bannerColor = belowBuyZone || inBuyZone ? '#22c55e' : aboveFV ? '#ef4444' : '#f59e0b';
              const bannerBg = belowBuyZone || inBuyZone ? 'rgba(34,197,94,0.08)' : aboveFV ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)';
              const bannerBorder = belowBuyZone || inBuyZone ? 'rgba(34,197,94,0.2)' : aboveFV ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)';
              let msg = '';
              if (belowBuyZone) msg = `Live price ${fmtPrice(livePrice, currency)} is ${Math.abs(pctAboveBuyZone).toFixed(1)}% below the buy zone (${fmtPrice(entryMin, currency)}–${fmtPrice(entryMax, currency)}). Strong entry opportunity.`;
              else if (inBuyZone) msg = `Live price ${fmtPrice(livePrice, currency)} is within the buy zone (${fmtPrice(entryMin, currency)}–${fmtPrice(entryMax, currency)}). Good entry range.`;
              else if (aboveFV) msg = `Live price ${fmtPrice(livePrice, currency)} is ${pctAboveFV.toFixed(1)}% above fair value (${fmtPrice(fairValue, currency)}). Wait for a pullback to the buy zone (${fmtPrice(entryMin, currency)}–${fmtPrice(entryMax, currency)}).`;
              else msg = `Live price ${fmtPrice(livePrice, currency)} is between the buy zone and fair value (${fmtPrice(fairValue, currency)}). Consider waiting for a dip to ${fmtPrice(entryMax, currency)} or below.`;
              return (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: bannerBg, border: `1px solid ${bannerBorder}` }}>
                  <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: bannerColor }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: bannerColor }}>{msg}</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Price chart */}
      {priceData.length > 1 && <QuantisPriceChart data={priceData} ticker={analysis.ticker} currency={currency} />}

      {/* Key Ratios */}
      {pills.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Key Ratios</p>
          {analysis.industry_type === 'cyclical' && vm?.normalized_eps_used > 0 && (
            <p className="text-[10px] text-amber-400/60 mb-2">Cyclical: valuations use normalized EPS of {currency === 'INR' ? '₹' : '$'}{vm.normalized_eps_used.toFixed(0)} (7-10yr avg)</p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2">
            {pills.map(p => <RatioPill key={p.label} label={p.label} value={p.value} />)}
          </div>
        </div>
      )}

      {/* Graham Safety Score */}
      {gs && gs.graham_number > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Graham Analysis</p>
            </div>
            {analysis.market_cap_b_usd > 50 ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(148,163,184,0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.25)' }}>Not Applicable — Mega Cap</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono" style={{ color: gs.score >= 7 ? '#22c55e' : gs.score >= 5 ? '#f59e0b' : '#ef4444' }}>{gs.score}/10</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: gs.score >= 7 ? 'rgba(34,197,94,0.12)' : gs.score >= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: gs.score >= 7 ? '#22c55e' : gs.score >= 5 ? '#f59e0b' : '#ef4444', border: `1px solid ${gs.score >= 7 ? 'rgba(34,197,94,0.25)' : gs.score >= 5 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}` }}>{gs.label}</span>
              </div>
            )}
          </div>
          {analysis.market_cap_b_usd > 50 ? (
            <p className="text-[10px] text-white/35 mb-3">Graham's framework was designed for industrial stocks in the 1940s. PE&lt;15 and PB&lt;1.5 criteria are not meaningful for mega-cap technology companies. The Graham Number is still shown as a theoretical floor.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              <QualityCheck pass={gs.pe_pass} label="P/E < 15" />
              <QualityCheck pass={gs.pb_pass} label="P/B < 1.5" />
              <QualityCheck pass={gs.debt_equity_pass} label="D/E < 0.5" />
              <QualityCheck pass={gs.interest_coverage_pass} label="Int. Coverage > 5x" />
              <QualityCheck pass={gs.current_ratio_pass} label="Current Ratio > 1.5" />
              <QualityCheck pass={gs.earnings_stability_pass} label="8+ Profitable Years" />
              <QualityCheck pass={gs.eps_growth_10yr_pass} label="10yr EPS Growth > 3%" />
              <QualityCheck pass={gs.dividend_history_pass} label="Dividend > 10yr History" />
              <QualityCheck pass={gs.low_volatility_pass} label="Low Margin Volatility" />
            </div>
          )}
          {gs.graham_number > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/35">Graham Number (√22.5 × EPS × BVPS) — theoretical floor</span>
                <span className="text-sm font-bold font-mono" style={{ color: gs.graham_number_pass ? '#22c55e' : '#f59e0b' }}>{fmtPrice(gs.graham_number, currency)}</span>
              </div>
              {gs.graham_number_pass
                ? <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>Below Floor</span>
                : <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>Above Floor</span>
              }
            </div>
          )}
        </div>
      )}

      {/* Piotroski + Altman row */}
      {(pio || alt) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pio && pio.score >= 0 && <PiotroskiPanel p={pio} />}
          {alt && alt.score >= 0 && <AltmanPanel a={alt} />}
        </div>
      )}

      {/* ROIC vs WACC + Historical Valuation row */}
      {(rw || hv) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rw && rw.roic > 0 && <ROICWACCPanel r={rw} />}
          {hv && hv.pe_current > 0 && <HistoricalValPanel h={hv} currency={currency} />}
        </div>
      )}

      {/* Beneish M-Score + Earnings Quality row */}
      {(bs || eq) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bs && bs.sgi > 0 && <BeneishPanel b={bs} />}
          {eq && <EarningsQualityPanel eq={eq} />}
        </div>
      )}

      {/* Liquidity + Insider Activity row */}
      {(liq || ia) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {liq && <LiquidityPanel l={liq} />}
          {ia && <InsiderActivityPanel ia={ia} />}
        </div>
      )}

      {/* Margin Profile + Management Quality row */}
      {(mp || mgmt) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mp && mp.operating_margin_current > 0 && <MarginProfilePanel m={mp} />}
          {mgmt && mgmt.promoter_holding_pct >= 0 && <ManagementPanel mgmt={mgmt} />}
        </div>
      )}

      {/* Financial Health Composite */}
      {fh && fh.composite > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Financial Health</p>
            </div>
            <span className="text-lg font-bold font-mono" style={{ color: fh.composite >= 7 ? '#22c55e' : fh.composite >= 5 ? '#f59e0b' : '#ef4444' }}>{fh.composite}/10</span>
          </div>
          <div className="space-y-2">
            <HealthBar label="ROCE" score={fh.roce_score} weight="25%" />
            <HealthBar label="ROE" score={fh.roe_score} weight="20%" />
            <HealthBar label="Debt Health" score={fh.debt_score} weight="20%" />
            <HealthBar label="Margin Quality" score={fh.margin_score} weight="20%" />
            <HealthBar label="Cash Flow" score={fh.cashflow_score} weight="15%" />
          </div>
          {fh.trend_adjustment !== 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] text-white/35">5-Year Trend Adjustment (ROCE + ROE + Margin)</span>
              <span className="text-xs font-bold font-mono" style={{ color: fh.trend_adjustment > 0 ? '#22c55e' : '#ef4444' }}>
                {fh.trend_adjustment > 0 ? '+' : ''}{fh.trend_adjustment} pts
              </span>
            </div>
          )}
        </div>
      )}

      {/* Multibagger Score */}
      {mb && mb.score > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5" style={{ color: mbColor }} />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Multibagger Probability</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-mono" style={{ color: mbColor }}>{mb.score}</span>
              <span className="text-[10px] text-white/30">/100</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg" style={{ background: `${mbColor}18`, color: mbColor, border: `1px solid ${mbColor}30` }}>{mb.verdict}</span>
            </div>
          </div>
          <div className="mb-3 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mb.score}%`, background: mbColor, boxShadow: `0 0 8px ${mbColor}50` }} />
          </div>
          {analysis.market_cap_b_usd > 500 && (
            <p className="text-[10px] text-amber-400/60 mb-2">Mega cap (&gt;$500B) — 10x return not realistic. Score capped at 30.</p>
          )}
          {analysis.market_cap_b_usd > 100 && analysis.market_cap_b_usd <= 500 && (
            <p className="text-[10px] text-amber-400/60 mb-2">Large cap (&gt;$100B) — significant market cap limits upside. Score capped at 45.</p>
          )}
          {analysis.industry_type === 'cyclical' && analysis.market_cap_b_usd <= 100 && (
            <p className="text-[10px] text-amber-400/60 mb-2">Cyclical cap applied — structural limit on compounding</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Revenue Growth', score: mb.factors.revenue_growth_score },
              { label: 'ROCE', score: mb.factors.roce_score },
              { label: 'Low Debt', score: mb.factors.debt_score },
              { label: 'Insider Hold', score: mb.factors.insider_holding_score },
              { label: 'Margin Expand', score: mb.factors.margin_expansion_score },
              { label: 'Market Size', score: mb.factors.market_size_score },
              { label: 'Industry Growth', score: mb.factors.industry_growth_score },
            ].map(f => (
              <div key={f.label} className="space-y-1">
                <span className="text-[10px] text-white/35">{f.label}</span>
                <MiniScoreBar score={f.score} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quality Badge + Moat + Key Risks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {qb && (
          <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className={`w-3.5 h-3.5 ${qb.is_elite ? 'text-yellow-400' : 'text-white/30'}`} />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Buffett Quality Filter</p>
            </div>
            <div className="space-y-2">
              <QualityCheck pass={qb.roe_pass} label="ROE > 15%" />
              <QualityCheck pass={qb.debt_pass} label="D/E < 0.5" />
              <QualityCheck pass={qb.profit_growth_pass} label="Profit Growth > 10%" />
              <QualityCheck pass={qb.fcf_pass} label="Positive FCF" />
            </div>
          </div>
        )}

        {activeMoats.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Economic Moat</p>
              </div>
              {analysis.moat_score > 0 && (
                <span className="text-xs font-bold font-mono" style={{ color: analysis.industry_type === 'cyclical' ? '#f59e0b' : '#14b8a6' }}>{analysis.moat_score}/10</span>
              )}
            </div>
            {analysis.industry_type === 'cyclical' && (
              <p className="text-[10px] text-amber-400/70 mb-2">Moat capped at 5 for cyclical</p>
            )}
            <div className="flex flex-wrap gap-2">
              {activeMoats.map((m, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.25)' }}>{m}</span>
              ))}
            </div>
          </div>
        )}

        {analysis.risks?.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Key Risks</p>
            </div>
            <ul className="space-y-1.5">
              {analysis.risks.slice(0, 4).map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400/60 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-white/50 leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Quantification — all 10 risks */}
      {rs && rs.overall_risk_score > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Risk Quantification</p>
            </div>
            <span className="text-[10px] text-white/35">Overall: <span className="font-bold font-mono" style={{ color: rs.overall_risk_score >= 7 ? '#ef4444' : rs.overall_risk_score >= 5 ? '#f59e0b' : '#22c55e' }}>{rs.overall_risk_score}/10</span></span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(RISK_LABELS).map(([key, label]) => (
              <RiskBar key={key} label={label} score={(rs as any)[key] || 0} />
            ))}
          </div>
        </div>
      )}

      {/* Peer Comparison */}
      {hasPeerData && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Peer Comparison vs Industry (with Percentile Rank)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pc.roe_industry > 0 && (
              <div className="space-y-1">
                <PeerBar label="ROE (%)" company={pc.roe_company} industry={pc.roe_industry} />
                {pc.roe_percentile > 0 && <p className="text-[9px] text-white/30">Sector rank: <span style={{ color: pc.roe_percentile > 70 ? '#22c55e' : pc.roe_percentile > 40 ? '#f59e0b' : '#ef4444' }}>{pc.roe_percentile}th percentile</span></p>}
              </div>
            )}
            {pc.roce_industry > 0 && (
              <div className="space-y-1">
                <PeerBar label="ROCE (%)" company={pc.roce_company} industry={pc.roce_industry} />
                {pc.roce_percentile > 0 && <p className="text-[9px] text-white/30">Sector rank: <span style={{ color: pc.roce_percentile > 70 ? '#22c55e' : pc.roce_percentile > 40 ? '#f59e0b' : '#ef4444' }}>{pc.roce_percentile}th percentile</span></p>}
              </div>
            )}
            {pc.margin_industry > 0 && (
              <div className="space-y-1">
                <PeerBar label="Operating Margin (%)" company={pc.margin_company} industry={pc.margin_industry} />
                {pc.margin_percentile > 0 && <p className="text-[9px] text-white/30">Sector rank: <span style={{ color: pc.margin_percentile > 70 ? '#22c55e' : pc.margin_percentile > 40 ? '#f59e0b' : '#ef4444' }}>{pc.margin_percentile}th percentile</span></p>}
              </div>
            )}
            {pc.ebitda_margin_industry > 0 && <PeerBar label="EBITDA Margin (%)" company={pc.ebitda_margin_company} industry={pc.ebitda_margin_industry} />}
            {pc.cost_efficiency_industry > 0 && <PeerBar label="Cost Efficiency (lower=better)" company={pc.cost_efficiency_company} industry={pc.cost_efficiency_industry} lowerIsBetter={true} />}
            {pc.growth_industry > 0 && (
              <div className="space-y-1">
                <PeerBar label="Revenue Growth (%)" company={pc.growth_company} industry={pc.growth_industry} />
                {pc.growth_percentile > 0 && <p className="text-[9px] text-white/30">Sector rank: <span style={{ color: pc.growth_percentile > 70 ? '#22c55e' : pc.growth_percentile > 40 ? '#f59e0b' : '#ef4444' }}>{pc.growth_percentile}th percentile</span></p>}
              </div>
            )}
            {pc.debt_industry > 0 && (
              <div className="space-y-1">
                <PeerBar label="D/E Ratio (lower=better)" company={pc.debt_company} industry={pc.debt_industry} lowerIsBetter={true} />
                {pc.debt_percentile > 0 && <p className="text-[9px] text-white/30">Sector rank: <span style={{ color: pc.debt_percentile > 70 ? '#22c55e' : pc.debt_percentile > 40 ? '#f59e0b' : '#ef4444' }}>{pc.debt_percentile}th percentile</span></p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Porter's 5 Forces */}
      {pf && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Industry Structure — Porter's Forces</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PorterBar label="Entry Barriers" score={pf.entry_barriers} isPositive={true} />
            <PorterBar label="Competition Intensity" score={pf.competition_intensity} isPositive={false} />
            <PorterBar label="Supplier Power" score={pf.supplier_power} isPositive={false} />
            <PorterBar label="Buyer Power" score={pf.buyer_power} isPositive={false} />
            <PorterBar label="Substitute Threat" score={pf.substitute_threat} isPositive={false} />
          </div>
          <p className="text-[10px] text-white/25 mt-2">Green = favorable. High entry barriers and low competition = stronger industry position.</p>
        </div>
      )}

      {/* 4-Model Valuation */}
      {vm && (vm.earnings_based_fair_value > 0 || vm.dcf_fair_value > 0 || vm.ev_ebitda_fair_value > 0) && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Valuation Models (4-Model Blend: 40/30/30)</p>
            </div>
            {vm.cycle_adjustment_pct !== 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background: vm.cycle_adjustment_pct < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: vm.cycle_adjustment_pct < 0 ? '#ef4444' : '#22c55e', border: `1px solid ${vm.cycle_adjustment_pct < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                Cycle adj: {vm.cycle_adjustment_pct > 0 ? '+' : ''}{vm.cycle_adjustment_pct.toFixed(0)}%
              </span>
            )}
          </div>
          {analysis.industry_type === 'cyclical' && vm.normalized_eps_used > 0 && (
            <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <AlertTriangle className="w-3 h-3 text-amber-400/60 flex-shrink-0" />
              <p className="text-[10px] text-amber-400/60">Cyclical: earnings model uses normalized EPS of {currency === 'INR' ? '₹' : '$'}{vm.normalized_eps_used.toFixed(0)} (7-10yr avg), not peak EPS</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-white/35 mb-1">Earnings-Based</p>
              <p className="text-sm font-bold text-white/80 font-mono">{fmtPrice(vm.earnings_based_fair_value, currency)}</p>
              {vm.fair_pe_used > 0 && <p className="text-[10px] text-white/25 mt-0.5">PE × {vm.fair_pe_used}</p>}
              <p className="text-[9px] text-white/20 mt-0.5">40% weight</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-white/35 mb-1">Historical PE</p>
              <p className="text-sm font-bold text-white/80 font-mono">{vm.historical_pe_fair_value > 0 ? fmtPrice(vm.historical_pe_fair_value, currency) : 'N/A'}</p>
              <p className="text-[10px] text-white/25 mt-0.5">EPS × 10yr med PE</p>
              <p className="text-[9px] text-white/20 mt-0.5">30% weight</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-white/35 mb-1">DCF (Multi-Stage)</p>
              <p className="text-sm font-bold text-white/80 font-mono">{fmtPrice(vm.multistage_dcf > 0 ? vm.multistage_dcf : vm.dcf_fair_value, currency)}</p>
              {vm.growth_rate_used > 0 && <p className="text-[10px] text-white/25 mt-0.5">{vm.growth_rate_used}% stage 1</p>}
              <p className="text-[9px] text-white/20 mt-0.5">30% weight</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-white/35 mb-1">EV/EBITDA</p>
              <p className="text-sm font-bold text-white/80 font-mono">{vm.ev_ebitda_fair_value > 0 ? fmtPrice(vm.ev_ebitda_fair_value, currency) : 'N/A'}</p>
              {vm.ev_ebitda_multiple_used > 0 && <p className="text-[10px] text-white/25 mt-0.5">× {vm.ev_ebitda_multiple_used}x</p>}
              <p className="text-[9px] text-white/20 mt-0.5">reference</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
              <p className="text-[10px] text-teal-400/70 mb-1">Blended Fair Value</p>
              <p className="text-sm font-bold text-teal-400 font-mono">{fmtPrice(vm.blended_fair_value, currency)}</p>
              <p className="text-[10px] text-white/25 mt-0.5">Weighted blend</p>
            </div>
          </div>
          {vm.graham_number > 0 && (
            <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] text-white/35">Graham Number (absolute floor)</span>
              <span className="text-xs font-bold font-mono text-sky-400">{fmtPrice(vm.graham_number, currency)}</span>
            </div>
          )}
          {vm.methodology_note && <p className="text-[10px] text-white/30 leading-relaxed mt-2">{vm.methodology_note}</p>}
        </div>
      )}

      {/* Entry Range */}
      {er && (fairValue > 0 || entryMin > 0) && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Entry Range</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              {mosPct}% Margin of Safety
            </span>
          </div>
          <div className="space-y-3">
            <div className="relative h-7">
              <div className="absolute inset-y-2.5 left-0 right-0 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
              {entryMin > 0 && entryMax > 0 && (
                <div className="absolute inset-y-2.5 rounded-full" style={{ left: `${pct(entryMin)}%`, right: `${100 - pct(entryMax)}%`, background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)' }} />
              )}
              {fairValue > 0 && <div className="absolute inset-y-1.5 w-0.5 rounded-full" style={{ left: `${pct(fairValue)}%`, background: '#f59e0b', boxShadow: '0 0 4px rgba(245,158,11,0.6)' }} />}
              {entryPrice > 0 && entryPrice !== entryMin && (
                <div className="absolute w-2 h-2 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct(entryPrice)}%`, background: '#22c55e', border: '2px solid white', boxShadow: '0 0 6px rgba(34,197,94,0.6)' }} />
              )}
              {livePrice > 0 && <div className="absolute w-3 h-3 rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${pct(livePrice)}%`, background: '#14b8a6', border: '2px solid white', boxShadow: '0 0 8px rgba(20,184,166,0.6)' }} />}
            </div>
            <div className="flex items-center justify-between text-[10px] text-white/40 flex-wrap gap-2">
              {entryMin > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: 'rgba(34,197,94,0.4)' }} /><span>Buy Zone: {fmtPrice(entryMin, currency)} – {fmtPrice(entryMax, currency)}</span></div>}
              {fairValue > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-0.5 rounded" style={{ background: '#f59e0b' }} /><span>Fair Value: {fmtPrice(fairValue, currency)}</span></div>}
              {entryPrice > 0 && <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} /><span>Suggested Entry: {fmtPrice(entryPrice, currency)}</span></div>}
              {livePrice > 0 && <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: '#14b8a6' }} /><span>Live: {fmtPrice(livePrice, currency)}</span></div>}
            </div>
            {er.current_price_context && <p className="text-xs text-white/45 leading-relaxed">{er.current_price_context}</p>}
          </div>
        </div>
      )}

      {/* Earnings Consistency + Capital Allocation */}
      {(analysis.earnings_consistency > 0 || analysis.capital_allocation_score > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400/60" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Earnings Consistency</p>
            </div>
            <MiniScoreBar score={analysis.earnings_consistency} />
            <p className="text-[10px] text-white/25 mt-1">Profitability stability over years</p>
          </div>
          <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-sky-400/60" />
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Capital Allocation</p>
            </div>
            <MiniScoreBar score={analysis.capital_allocation_score} />
            <p className="text-[10px] text-white/25 mt-1">ROIC, dilution & dividend quality</p>
          </div>
        </div>
      )}

      {/* 12-Factor Scorecard */}
      {scorecardFactors.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">12-Factor Scorecard</p>
          </div>
          <div className="space-y-1.5">
            {scorecardFactors.map((factor, i) => <FactorCard key={i} factor={factor as any} defaultOpen={i === 0} />)}
          </div>
        </div>
      )}
    </div>
  );
};
