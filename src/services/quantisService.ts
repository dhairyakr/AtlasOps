import { LLMService } from './llmService';
import { serperSearch } from './webSearchService';
import { supabase } from './supabaseClient';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FactorScore {
  name: string;
  score: number;
  rationale: string;
  data_points: string[];
}

export interface StockScorecard {
  business_understanding: FactorScore;
  industry_analysis: FactorScore;
  financial_growth: FactorScore;
  profitability_ratios: FactorScore;
  debt_analysis: FactorScore;
  cash_flow: FactorScore;
  valuation: FactorScore;
  management_quality: FactorScore;
  competitive_advantage: FactorScore;
  growth_triggers: FactorScore;
  risk_analysis: FactorScore;
  entry_price: FactorScore;
}

export interface KeyRatios {
  pe?: string;
  pb?: string;
  peg?: string;
  roe?: string;
  roce?: string;
  roic?: string;
  debt_equity?: string;
  interest_coverage?: string;
  current_ratio?: string;
  net_debt_ebitda?: string;
  ev_ebitda?: string;
  revenue_cagr?: string;
  profit_cagr?: string;
  eps_cagr?: string;
  promoter_holding?: string;
  fcf_yield?: string;
  operating_margin?: string;
  normalized_pe?: string;
}

export interface MoatType {
  brand: boolean;
  distribution: boolean;
  technology: boolean;
  cost_advantage: boolean;
  switching_costs: boolean;
  network_effects: boolean;
  patents: boolean;
}

export interface ValuationModel {
  earnings_based_fair_value: number;
  ev_ebitda_fair_value: number;
  dcf_fair_value: number;
  historical_pe_fair_value: number;
  blended_fair_value: number;
  fair_pe_used: number;
  ev_ebitda_multiple_used: number;
  eps_used: number;
  normalized_eps_used: number;
  ebitda_used: number;
  growth_rate_used: number;
  terminal_pe_used: number;
  cycle_adjustment_pct: number;
  methodology_note: string;
  graham_number: number;
  multistage_dcf: number;
}

export interface RiskScores {
  commodity_risk: number;
  regulatory_risk: number;
  debt_risk: number;
  competition_risk: number;
  technology_disruption_risk: number;
  liquidity_risk: number;
  currency_risk: number;
  interest_rate_risk: number;
  geopolitical_risk: number;
  demand_cycle_risk: number;
  overall_risk_score: number;
}

export interface GrahamScore {
  score: number;
  label: string;
  pe_pass: boolean;
  pb_pass: boolean;
  debt_equity_pass: boolean;
  interest_coverage_pass: boolean;
  current_ratio_pass: boolean;
  earnings_stability_pass: boolean;
  eps_growth_10yr_pass: boolean;
  dividend_history_pass: boolean;
  low_volatility_pass: boolean;
  graham_number: number;
  graham_number_pass: boolean;
}

export interface PiotroskiScore {
  score: number;
  label: string;
  roa_positive: boolean;
  ocf_positive: boolean;
  roa_improving: boolean;
  accruals_low: boolean;
  leverage_declining: boolean;
  current_ratio_improving: boolean;
  no_new_shares: boolean;
  gross_margin_improving: boolean;
  asset_turnover_improving: boolean;
}

export interface AltmanScore {
  score: number;
  label: string;
  zone: 'safe' | 'grey' | 'distress';
}

export interface BeneishScore {
  score: number;
  manipulation_risk: boolean;
  label: string;
  dsri: number;
  gmi: number;
  aqi: number;
  sgi: number;
  depi: number;
  sgai: number;
  lvgi: number;
  tata: number;
}

export interface ROICvsWACC {
  roic: number;
  wacc: number;
  spread: number;
  creates_value: boolean;
  label: string;
  incremental_roic: number;
  incremental_roic_label: string;
}

export interface HistoricalValuation {
  pe_current: number;
  pe_5yr_median: number;
  pe_10yr_median: number;
  pe_vs_history: 'cheap' | 'fair' | 'expensive';
  ev_ebitda_current: number;
  ev_ebitda_5yr_median: number;
  pb_current: number;
  pb_5yr_median: number;
}

export interface MarginProfile {
  operating_margin_current: number;
  operating_margin_5yr_avg: number;
  margin_std_dev: number;
  margin_stability: 'excellent' | 'moderate' | 'unstable';
  trend: 'expanding' | 'stable' | 'contracting';
}

export interface ManagementQuality {
  promoter_holding_pct: number;
  promoter_pledged_pct: number;
  promoter_trend: 'increasing' | 'stable' | 'decreasing';
  capital_allocation_score: number;
  roic_trend: 'improving' | 'stable' | 'declining';
  dividend_consistency: boolean;
  buyback_history: boolean;
}

export interface FinancialHealthScore {
  composite: number;
  roce_score: number;
  roe_score: number;
  debt_score: number;
  margin_score: number;
  cashflow_score: number;
  trend_adjustment: number;
}

export interface PeerComparison {
  roe_company: number;
  roe_industry: number;
  roe_percentile: number;
  roce_company: number;
  roce_industry: number;
  roce_percentile: number;
  margin_company: number;
  margin_industry: number;
  margin_percentile: number;
  growth_company: number;
  growth_industry: number;
  growth_percentile: number;
  debt_company: number;
  debt_industry: number;
  debt_percentile: number;
  ebitda_margin_company: number;
  ebitda_margin_industry: number;
  cost_efficiency_company: number;
  cost_efficiency_industry: number;
}

export interface PorterForces {
  competition_intensity: number;
  entry_barriers: number;
  supplier_power: number;
  buyer_power: number;
  substitute_threat: number;
}

export interface MultibaggerScore {
  score: number;
  factors: {
    revenue_growth_score: number;
    roce_score: number;
    debt_score: number;
    industry_growth_score: number;
    insider_holding_score: number;
    margin_expansion_score: number;
    market_size_score: number;
    market_cap_penalty: number;
  };
  verdict: string;
}

export interface EntryRange {
  fair_value: number;
  margin_of_safety_pct: number;
  margin_of_safety_low: number;
  margin_of_safety_high: number;
  entry_price_suggestion: number;
  current_price_context: string;
  currency: string;
}

export interface QualityBadge {
  is_elite: boolean;
  roe_pass: boolean;
  debt_pass: boolean;
  profit_growth_pass: boolean;
  fcf_pass: boolean;
  label: string;
}

export interface LiquidityAnalysis {
  avg_daily_volume: number;
  free_float_pct: number;
  liquidity_risk: 'low' | 'medium' | 'high';
  liquidity_score: number;
  notes: string;
}

export interface EarningsQuality {
  accrual_ratio: number;
  manipulation_risk: boolean;
  ocf_ni_ratio: number;
  label: string;
}

export interface InsiderActivity {
  promoter_buying: boolean;
  insider_selling: boolean;
  pledged_above_threshold: boolean;
  signal: 'bullish' | 'neutral' | 'bearish';
  notes: string;
  is_us_stock?: boolean;
  ceo_director_buying?: boolean;
  institutional_ownership_pct?: number;
  institutional_trend?: 'increasing' | 'stable' | 'decreasing';
  buyback_active?: boolean;
}

export type LynchType = 'fast_grower' | 'stalwart' | 'slow_grower' | 'cyclical' | 'turnaround' | 'asset_play';
export type CommodityCycle = 'peak' | 'mid' | 'recovery' | 'bottom' | 'not_applicable';

export interface QuantisAnalysis {
  id: string;
  session_id: string;
  ticker: string;
  company_name: string;
  exchange: string;
  sector: string;
  industry_type: 'secular' | 'cyclical';
  lynch_type: LynchType;
  commodity_cycle: CommodityCycle;
  verdict: 'avoid' | 'watchlist' | 'good_buy' | 'strong_buy' | 'overvalued';
  overall_score: number;
  scorecard: StockScorecard;
  key_ratios: KeyRatios;
  moat: MoatType;
  moat_score: number;
  risks: string[];
  risk_scores: RiskScores;
  entry_range: EntryRange;
  valuation_model: ValuationModel;
  multibagger: MultibaggerScore;
  quality_badge: QualityBadge;
  graham_score: GrahamScore;
  piotroski: PiotroskiScore;
  altman: AltmanScore;
  beneish: BeneishScore;
  roic_vs_wacc: ROICvsWACC;
  historical_valuation: HistoricalValuation;
  margin_profile: MarginProfile;
  management: ManagementQuality;
  financial_health: FinancialHealthScore;
  peer_comparison: PeerComparison;
  porter_forces: PorterForces;
  liquidity: LiquidityAnalysis;
  earnings_quality: EarningsQuality;
  insider_activity: InsiderActivity;
  earnings_consistency: number;
  capital_allocation_score: number;
  accrual_warning: boolean;
  shares_dilution: boolean;
  operating_margin_trend: 'expanding' | 'stable' | 'contracting';
  market_cap_b_usd: number;
  wacc_used: number;
  beta_used: number;
  summary: string;
  created_at: string;
}

export interface DiscoveryStock {
  ticker: string;
  company_name: string;
  exchange: string;
  sector: string;
  thesis: string;
  quick_scores: { business: number; financials: number; valuation: number };
  verdict: 'avoid' | 'watchlist' | 'good_buy' | 'strong_buy';
}

export interface PricePoint { date: string; close: number }

export interface QuantisWatchlistEntry {
  id: string;
  session_id: string;
  ticker: string;
  company_name: string;
  exchange: string;
  notes: string;
  verdict: string;
  last_analysis_id: string | null;
  created_at: string;
}

// ─── Structured Industry → Sector Mapping ────────────────────────────────────

type SectorCategory = 'technology' | 'financials' | 'fmcg' | 'pharma' | 'metals' | 'energy' | 'infrastructure' | 'consumer' | 'realestate' | 'chemicals' | 'default';

const INDUSTRY_TO_SECTOR: Record<string, SectorCategory> = {
  'steel': 'metals',
  'steel pipes': 'metals',
  'steel tubes': 'metals',
  'aluminium': 'metals',
  'aluminum': 'metals',
  'copper': 'metals',
  'zinc': 'metals',
  'iron ore': 'metals',
  'mining': 'metals',
  'mineral': 'metals',
  'metal fabrication': 'metals',
  'non-ferrous metals': 'metals',
  'ferrous metals': 'metals',
  'oil': 'energy',
  'gas': 'energy',
  'petroleum': 'energy',
  'crude oil': 'energy',
  'natural gas': 'energy',
  'refinery': 'energy',
  'refining': 'energy',
  'coal': 'energy',
  'power': 'energy',
  'renewable energy': 'energy',
  'solar': 'energy',
  'wind energy': 'energy',
  'oil & gas': 'energy',
  'it services': 'technology',
  'software': 'technology',
  'information technology': 'technology',
  'saas': 'technology',
  'cloud computing': 'technology',
  'internet': 'technology',
  'data analytics': 'technology',
  'semiconductors': 'technology',
  'electronics manufacturing': 'technology',
  'telecom equipment': 'technology',
  'banking': 'financials',
  'bank': 'financials',
  'nbfc': 'financials',
  'insurance': 'financials',
  'life insurance': 'financials',
  'general insurance': 'financials',
  'brokerage': 'financials',
  'asset management': 'financials',
  'microfinance': 'financials',
  'housing finance': 'financials',
  'fmcg': 'fmcg',
  'fast moving consumer goods': 'fmcg',
  'food': 'fmcg',
  'beverages': 'fmcg',
  'dairy': 'fmcg',
  'personal care': 'fmcg',
  'household products': 'fmcg',
  'tobacco': 'fmcg',
  'packaged foods': 'fmcg',
  'edible oil': 'fmcg',
  'pharma': 'pharma',
  'pharmaceuticals': 'pharma',
  'healthcare': 'pharma',
  'biotech': 'pharma',
  'biotechnology': 'pharma',
  'hospitals': 'pharma',
  'diagnostics': 'pharma',
  'medical devices': 'pharma',
  'active pharmaceutical ingredients': 'pharma',
  'api': 'pharma',
  'cement': 'infrastructure',
  'construction': 'infrastructure',
  'infrastructure': 'infrastructure',
  'roads': 'infrastructure',
  'ports': 'infrastructure',
  'airports': 'infrastructure',
  'logistics': 'infrastructure',
  'shipping': 'infrastructure',
  'railways': 'infrastructure',
  'engineering': 'infrastructure',
  'capital goods': 'infrastructure',
  'real estate': 'realestate',
  'realty': 'realestate',
  'property': 'realestate',
  'housing': 'realestate',
  'reit': 'realestate',
  'real estate investment trust': 'realestate',
  'automobiles': 'consumer',
  'auto': 'consumer',
  'automobile ancillaries': 'consumer',
  'auto components': 'consumer',
  'two wheelers': 'consumer',
  'passenger vehicles': 'consumer',
  'commercial vehicles': 'consumer',
  'retail': 'consumer',
  'apparel': 'consumer',
  'fashion': 'consumer',
  'consumer durables': 'consumer',
  'white goods': 'consumer',
  'paints': 'consumer',
  'footwear': 'consumer',
  'jewellery': 'consumer',
  'textiles': 'consumer',
  'specialty chemicals': 'chemicals',
  'chemicals': 'chemicals',
  'agrochemicals': 'chemicals',
  'fertilizers': 'chemicals',
  'petrochemicals': 'chemicals',
  'dyes': 'chemicals',
  'adhesives': 'chemicals',
  'coatings': 'chemicals',
};

interface SectorProfile {
  category: SectorCategory;
  isCyclical: boolean;
  fairPE: number;
  normalizedPE: number;
  terminalPE: number;
  evEbitdaMultiple: number;
  primaryValuation: 'pe' | 'ev_ebitda' | 'pb';
  usePEG: boolean;
  roceThreshold: number;
  moatCap: number;
  multibaggerCap: number;
  waccDefault: number;
  marginBaseline: number;
}

const SECTOR_PROFILES: Record<SectorCategory, SectorProfile> = {
  technology:     { category: 'technology',     isCyclical: false, fairPE: 25, normalizedPE: 25, terminalPE: 22, evEbitdaMultiple: 16, primaryValuation: 'pe',       usePEG: true,  roceThreshold: 18, moatCap: 10, multibaggerCap: 100, waccDefault: 9,  marginBaseline: 20 },
  financials:     { category: 'financials',     isCyclical: false, fairPE: 15, normalizedPE: 15, terminalPE: 13, evEbitdaMultiple: 10, primaryValuation: 'pb',       usePEG: false, roceThreshold: 14, moatCap: 8,  multibaggerCap: 85,  waccDefault: 9,  marginBaseline: 18 },
  fmcg:           { category: 'fmcg',           isCyclical: false, fairPE: 30, normalizedPE: 30, terminalPE: 25, evEbitdaMultiple: 20, primaryValuation: 'pe',       usePEG: false, roceThreshold: 20, moatCap: 10, multibaggerCap: 80,  waccDefault: 8,  marginBaseline: 15 },
  pharma:         { category: 'pharma',         isCyclical: false, fairPE: 22, normalizedPE: 22, terminalPE: 20, evEbitdaMultiple: 14, primaryValuation: 'pe',       usePEG: true,  roceThreshold: 16, moatCap: 10, multibaggerCap: 95,  waccDefault: 10, marginBaseline: 16 },
  metals:         { category: 'metals',         isCyclical: true,  fairPE: 11, normalizedPE: 9,  terminalPE: 8,  evEbitdaMultiple: 6,  primaryValuation: 'ev_ebitda',usePEG: false, roceThreshold: 12, moatCap: 5,  multibaggerCap: 65,  waccDefault: 11, marginBaseline: 12 },
  energy:         { category: 'energy',         isCyclical: true,  fairPE: 12, normalizedPE: 10, terminalPE: 9,  evEbitdaMultiple: 6,  primaryValuation: 'ev_ebitda',usePEG: false, roceThreshold: 12, moatCap: 5,  multibaggerCap: 65,  waccDefault: 10, marginBaseline: 10 },
  infrastructure: { category: 'infrastructure', isCyclical: true,  fairPE: 14, normalizedPE: 12, terminalPE: 11, evEbitdaMultiple: 8,  primaryValuation: 'ev_ebitda',usePEG: false, roceThreshold: 12, moatCap: 6,  multibaggerCap: 70,  waccDefault: 10, marginBaseline: 10 },
  consumer:       { category: 'consumer',       isCyclical: false, fairPE: 22, normalizedPE: 22, terminalPE: 18, evEbitdaMultiple: 15, primaryValuation: 'pe',       usePEG: false, roceThreshold: 16, moatCap: 9,  multibaggerCap: 90,  waccDefault: 10, marginBaseline: 10 },
  realestate:     { category: 'realestate',     isCyclical: true,  fairPE: 12, normalizedPE: 10, terminalPE: 9,  evEbitdaMultiple: 9,  primaryValuation: 'ev_ebitda',usePEG: false, roceThreshold: 10, moatCap: 5,  multibaggerCap: 65,  waccDefault: 11, marginBaseline: 12 },
  chemicals:      { category: 'chemicals',      isCyclical: false, fairPE: 20, normalizedPE: 20, terminalPE: 17, evEbitdaMultiple: 13, primaryValuation: 'pe',       usePEG: false, roceThreshold: 16, moatCap: 8,  multibaggerCap: 90,  waccDefault: 10, marginBaseline: 14 },
  default:        { category: 'default',        isCyclical: false, fairPE: 18, normalizedPE: 18, terminalPE: 15, evEbitdaMultiple: 12, primaryValuation: 'pe',       usePEG: false, roceThreshold: 15, moatCap: 10, multibaggerCap: 90,  waccDefault: 10, marginBaseline: 10 },
};

function getSectorProfile(sector: string, industry?: string): SectorProfile {
  const inputs = [industry, sector].filter(Boolean).map(s => s!.toLowerCase().trim());
  for (const input of inputs) {
    if (INDUSTRY_TO_SECTOR[input]) return SECTOR_PROFILES[INDUSTRY_TO_SECTOR[input]];
    for (const [key, cat] of Object.entries(INDUSTRY_TO_SECTOR)) {
      if (input.includes(key) || key.includes(input)) return SECTOR_PROFILES[cat];
    }
  }
  const combined = inputs.join(' ');
  if (/steel|alumin|aluminum|copper|zinc|iron|mining|mineral|metal/.test(combined)) return SECTOR_PROFILES.metals;
  if (/oil|gas|petroleum|energy|refin|coal|power|renewable|solar/.test(combined)) return SECTOR_PROFILES.energy;
  if (/cement|infra|construction|road|port|airport|logistic|transport|shipping|engineer|capital good/.test(combined)) return SECTOR_PROFILES.infrastructure;
  if (/tech|software|it |information tech|saas|cloud|data|internet|semiconductor/.test(combined)) return SECTOR_PROFILES.technology;
  if (/bank|nbfc|financ|insurance|lending|microfinance|brokerage|asset manag/.test(combined)) return SECTOR_PROFILES.financials;
  if (/fmcg|fast.moving|consumer goods|staples|household|beverage|food|dairy/.test(combined)) return SECTOR_PROFILES.fmcg;
  if (/pharma|health|biotech|medic|hospital|diagnostics/.test(combined)) return SECTOR_PROFILES.pharma;
  if (/chemical|agrochemical|fertiliz|petrochemical|dye|adhesive/.test(combined)) return SECTOR_PROFILES.chemicals;
  if (/consumer|retail|apparel|fashion|durable|automobile|auto|paint|jewel/.test(combined)) return SECTOR_PROFILES.consumer;
  if (/real estate|realty|property|housing|reit/.test(combined)) return SECTOR_PROFILES.realestate;
  return SECTOR_PROFILES.default;
}

// ─── Dynamic sector multiple adjustment ──────────────────────────────────────

function applyDynamicMultipleAdjustment(profile: SectorProfile, sectorMedianPE: number): SectorProfile {
  if (sectorMedianPE <= 0) return profile;
  const dynamicFairPE = Math.round(sectorMedianPE * 0.9 * 10) / 10;
  return { ...profile, fairPE: dynamicFairPE, normalizedPE: profile.isCyclical ? profile.normalizedPE : dynamicFairPE };
}

// ─── Exchange helpers ─────────────────────────────────────────────────────────

function exchangeSuffix(ex: string): string {
  if (ex.toUpperCase() === 'NSE') return '.NS';
  if (ex.toUpperCase() === 'BSE') return '.BO';
  return '';
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function parseNum(s?: string | number): number {
  if (s == null) return 0;
  if (typeof s === 'number') return s;
  return parseFloat(s.replace(/[^0-9.\-]/g, '')) || 0;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function percentileRank(value: number, industryAvg: number, direction: 'higher_better' | 'lower_better' = 'higher_better'): number {
  if (industryAvg <= 0) return 50;
  const ratio = direction === 'higher_better' ? value / industryAvg : industryAvg / value;
  if (ratio >= 3.0) return 99;
  if (ratio >= 2.0) return 97;
  if (ratio >= 1.5) return 95;
  if (ratio >= 1.3) return 85;
  if (ratio >= 1.1) return 70;
  if (ratio >= 0.9) return 50;
  if (ratio >= 0.7) return 30;
  if (ratio >= 0.5) return 15;
  return 5;
}

// ─── Price fetchers ───────────────────────────────────────────────────────────

export async function fetchPriceHistory(ticker: string, exchange: string): Promise<PricePoint[]> {
  const symbol = encodeURIComponent(`${ticker.toUpperCase()}${exchangeSuffix(exchange)}`);
  const to = Math.floor(Date.now() / 1000);
  const from = to - 365 * 24 * 60 * 60;
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${from}&period2=${to}`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];
    const ts: number[] = result.timestamp ?? [];
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const pts: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      if (closes[i] != null) pts.push({ date: new Date(ts[i] * 1000).toISOString().slice(0, 10), close: closes[i] });
    }
    return pts;
  } catch { return []; }
}

export async function fetchCurrentPrice(ticker: string, exchange: string): Promise<{ price: number; currency: string } | null> {
  const symbol = encodeURIComponent(`${ticker.toUpperCase()}${exchangeSuffix(exchange)}`);
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const valid = closes.filter((c): c is number => c != null);
    return { price: valid[valid.length - 1] ?? 0, currency: result.meta?.currency ?? 'USD' };
  } catch { return null; }
}

// ─── Commodity cycle quantitative detection ───────────────────────────────────

export function detectCommodityCycle(
  currentPrice: number,
  avg10yrPrice: number,
  capacityUtilization: number,
  inventoryLevel: 'high' | 'medium' | 'low'
): CommodityCycle {
  if (avg10yrPrice <= 0) return 'mid';
  const ratio = currentPrice / avg10yrPrice;
  if (ratio > 1.2 && capacityUtilization > 85) return 'peak';
  if (ratio > 1.05 && capacityUtilization > 75) return 'mid';
  if (ratio > 0.85 && inventoryLevel === 'low') return 'recovery';
  if (ratio < 0.8) return 'bottom';
  return 'mid';
}

// ─── Pure scoring functions ───────────────────────────────────────────────────

function scoreROE(v: number) { return v >= 25 ? 10 : v >= 20 ? 9 : v >= 15 ? 8 : v >= 10 ? 6 : v >= 5 ? 4 : 2; }
function scoreROCE(v: number) { return v >= 25 ? 10 : v >= 20 ? 9 : v >= 18 ? 8 : v >= 12 ? 6 : v >= 7 ? 4 : 2; }

function scoreDebt(de: number, ic: number, ndEbitda: number): number {
  let s = 0;
  s += de <= 0.3 ? 4 : de <= 0.5 ? 3 : de <= 1 ? 2 : de <= 2 ? 1 : 0;
  s += ic >= 10 ? 3 : ic >= 5 ? 2 : ic >= 3 ? 1 : 0;
  s += ndEbitda <= 0 ? 3 : ndEbitda <= 1 ? 2 : ndEbitda <= 3 ? 1 : 0;
  return Math.min(10, s);
}

function scoreMarginRelative(margin: number, sectorMedianMargin: number): number {
  if (sectorMedianMargin <= 0) return 5;
  const ratio = margin / sectorMedianMargin;
  if (ratio > 1.3) return 10;
  if (ratio > 1.1) return 8;
  if (ratio > 0.9) return 6;
  if (ratio > 0.7) return 4;
  return 2;
}

function scoreMarginAbsolute(margin: number, baseline: number): number {
  return margin >= baseline * 1.5 ? 10 : margin >= baseline * 1.2 ? 8 : margin >= baseline ? 6 : margin >= baseline * 0.7 ? 4 : 2;
}

function scoreCashflow(ocfGtNI: boolean, fcfPos: boolean, fcfGrowing: boolean, fcfMarginGt5: boolean): number {
  let s = 0;
  if (ocfGtNI) s += 3;
  if (fcfPos) s += 3;
  if (fcfGrowing) s += 2;
  if (fcfMarginGt5) s += 2;
  return s;
}

function calcTrendAdjustment(currentVal: number, fiveYrAvgVal: number): number {
  if (fiveYrAvgVal <= 0) return 0;
  const trend = currentVal - fiveYrAvgVal;
  if (trend > 3) return 2;
  if (trend < -3) return -2;
  return 0;
}

export function calcFinancialHealth(
  roe: number, roce: number,
  de: number, ic: number, ndEbitda: number,
  margin: number, profile: SectorProfile,
  ocfGtNI: boolean, fcfPos: boolean, fcfGrowing: boolean, fcfMarginGt5: boolean,
  roce5yrAvg?: number, roe5yrAvg?: number, margin5yrAvg?: number, sectorMedianMargin?: number
): FinancialHealthScore {
  const roceS = scoreROCE(roce);
  const roeS = scoreROE(roe);
  const debtS = scoreDebt(de, ic, ndEbitda);
  const marginS = (profile.isCyclical && sectorMedianMargin && sectorMedianMargin > 0)
    ? scoreMarginRelative(margin, sectorMedianMargin)
    : scoreMarginAbsolute(margin, profile.marginBaseline);
  const cfS = scoreCashflow(ocfGtNI, fcfPos, fcfGrowing, fcfMarginGt5);

  const roceTrend = calcTrendAdjustment(roce, roce5yrAvg || roce);
  const roeTrend = calcTrendAdjustment(roe, roe5yrAvg || roe);
  const marginTrendAdj = calcTrendAdjustment(margin, margin5yrAvg || margin);
  const trend_adjustment = Math.max(-4, Math.min(4, roceTrend + roeTrend + marginTrendAdj));

  const composite = Math.round(
    Math.max(0, Math.min(10,
      roceS * 0.25 + roeS * 0.20 + debtS * 0.20 + marginS * 0.20 + cfS * 0.15 + trend_adjustment * 0.1
    ))
  );
  return { composite, roce_score: roceS, roe_score: roeS, debt_score: debtS, margin_score: marginS, cashflow_score: cfS, trend_adjustment };
}

export function calcGrahamScore(
  pe: number, pb: number, bvps: number, eps: number,
  de: number, ic: number, cr: number, consistency: number,
  epsGrowth10yr?: number, dividendYears?: number, marginStdDev?: number
): GrahamScore {
  const grahamNumber = bvps > 0 && eps > 0 ? Math.sqrt(22.5 * eps * bvps) : 0;
  const pePass = pe > 0 && pe < 15;
  const pbPass = pb > 0 && pb < 1.5;
  const dePass = de < 0.5;
  const icPass = ic > 5;
  const crPass = cr > 1.5;
  const esPass = consistency >= 8;
  const epsGrowthPass = epsGrowth10yr != null ? epsGrowth10yr > 3 : esPass;
  const dividendPass = dividendYears != null ? dividendYears >= 10 : false;
  const volatilityPass = marginStdDev != null ? marginStdDev < 6 : true;
  const gnPass = grahamNumber > 0;

  const passCount = [pePass, pbPass, dePass, icPass, crPass, esPass].filter(Boolean).length;
  const score = Math.round((passCount / 6) * 10);
  const label = passCount >= 5 ? 'Graham Approved' : passCount >= 3 ? 'Borderline' : 'Not Graham-Safe';
  return {
    score, label,
    pe_pass: pePass, pb_pass: pbPass, debt_equity_pass: dePass,
    interest_coverage_pass: icPass, current_ratio_pass: crPass, earnings_stability_pass: esPass,
    eps_growth_10yr_pass: epsGrowthPass, dividend_history_pass: dividendPass, low_volatility_pass: volatilityPass,
    graham_number: Math.round(grahamNumber), graham_number_pass: gnPass,
  };
}

export function calcPiotroski(data: {
  roa_positive: boolean; ocf_positive: boolean; roa_improving: boolean; accruals_low: boolean;
  leverage_declining: boolean; cr_improving: boolean; no_new_shares: boolean;
  gross_margin_improving: boolean; asset_turnover_improving: boolean;
}): PiotroskiScore {
  const checks = [data.roa_positive, data.ocf_positive, data.roa_improving, data.accruals_low, data.leverage_declining, data.cr_improving, data.no_new_shares, data.gross_margin_improving, data.asset_turnover_improving];
  const score = checks.filter(Boolean).length;
  const label = score >= 8 ? 'Strong (F-Score 8-9)' : score >= 5 ? 'Average (F-Score 5-7)' : 'Weak (F-Score 0-4)';
  return { score, label, roa_positive: data.roa_positive, ocf_positive: data.ocf_positive, roa_improving: data.roa_improving, accruals_low: data.accruals_low, leverage_declining: data.leverage_declining, current_ratio_improving: data.cr_improving, no_new_shares: data.no_new_shares, gross_margin_improving: data.gross_margin_improving, asset_turnover_improving: data.asset_turnover_improving };
}

export function calcAltman(x1: number, x2: number, x3: number, x4: number, x5: number): AltmanScore {
  const z = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5;
  const zone: 'safe' | 'grey' | 'distress' = z > 3 ? 'safe' : z >= 1.8 ? 'grey' : 'distress';
  const label = zone === 'safe' ? 'Safe Zone (Z > 3)' : zone === 'grey' ? 'Grey Zone (1.8–3)' : 'Distress Zone (< 1.8)';
  return { score: Math.round(z * 10) / 10, label, zone };
}

export function calcBeneishScore(data: {
  dsri: number; gmi: number; aqi: number; sgi: number;
  depi: number; sgai: number; lvgi: number; tata: number;
}): BeneishScore {
  const m = -4.84 + 0.92 * data.dsri + 0.528 * data.gmi + 0.404 * data.aqi + 0.892 * data.sgi
    + 0.115 * data.depi - 0.172 * data.sgai + 4.679 * data.tata - 0.327 * data.lvgi;
  const score = Math.round(m * 100) / 100;
  const manipulation_risk = m > -1.78;
  const label = manipulation_risk ? 'Manipulation Risk (M > -1.78)' : 'Low Manipulation Risk';
  return { score, manipulation_risk, label, dsri: data.dsri, gmi: data.gmi, aqi: data.aqi, sgi: data.sgi, depi: data.depi, sgai: data.sgai, lvgi: data.lvgi, tata: data.tata };
}

export function calcROICvsWACC(
  roic: number, wacc: number,
  prevNopat?: number, currNopat?: number, prevInvestedCapital?: number, currInvestedCapital?: number
): ROICvsWACC {
  const spread = roic - wacc;
  let incrementalRoic = 0;
  if (prevNopat != null && currNopat != null && prevInvestedCapital != null && currInvestedCapital != null) {
    const deltaIC = currInvestedCapital - prevInvestedCapital;
    if (deltaIC > 0) incrementalRoic = ((currNopat - prevNopat) / deltaIC) * 100;
  }
  const incrementalLabel = incrementalRoic > 15 ? 'Excellent Capital Allocation' : incrementalRoic > 8 ? 'Good Allocation' : incrementalRoic > 0 ? 'Average Allocation' : 'Poor Allocation';
  return {
    roic, wacc, spread: Math.round(spread * 10) / 10,
    creates_value: spread > 0,
    label: spread > 5 ? 'Strong Value Creation' : spread > 0 ? 'Moderate Value Creation' : spread > -3 ? 'Value Neutral' : 'Value Destruction',
    incremental_roic: Math.round(incrementalRoic * 10) / 10,
    incremental_roic_label: incrementalLabel,
  };
}

function calcDynamicWACC(sectorDefault: number, beta?: number): number {
  if (!beta || beta <= 0) return sectorDefault;
  const riskFreeRate = 4.2;
  const marketPremium = 5.0;
  const capm = riskFreeRate + beta * marketPremium;
  return Math.max(7, Math.min(14, Math.round(capm * 10) / 10));
}

function dynamicMOS(qualityScore: number, beta?: number, isCyclical?: boolean): number {
  let mos = qualityScore > 8 ? 0.20 : qualityScore >= 6 ? 0.30 : 0.40;
  if (beta && beta > 1.5) mos = Math.min(0.50, mos + 0.05);
  else if (beta && beta < 0.8) mos = Math.max(0.15, mos - 0.05);
  if (isCyclical) mos = Math.max(0.35, mos);
  return mos;
}

function scoreMoat(moat: MoatType, profile: SectorProfile): number {
  const count = Object.values(moat).filter(Boolean).length;
  return Math.min(profile.moatCap, Math.min(10, count * 2.5));
}

function verdictFromScoreAndPrice(
  score: number,
  currentPrice: number,
  fairValue: number,
  buyZoneLow: number,
  buyZoneHigh: number
): 'avoid' | 'watchlist' | 'good_buy' | 'strong_buy' | 'overvalued' {
  if (score < 50) return 'avoid';

  if (currentPrice > 0 && fairValue > 0 && buyZoneHigh > 0) {
    if (currentPrice <= buyZoneLow) return score >= 70 ? 'strong_buy' : 'good_buy';
    if (currentPrice <= buyZoneHigh) return score >= 70 ? 'good_buy' : 'watchlist';
    if (currentPrice <= fairValue) return 'watchlist';
    return score >= 70 ? 'watchlist' : 'overvalued';
  }

  if (score >= 80) return 'good_buy';
  if (score >= 70) return 'watchlist';
  if (score >= 60) return 'watchlist';
  return 'avoid';
}

// ─── Multi-stage DCF with normalized growth ───────────────────────────────────

function calcMultiStageDCF(
  fcfOrEps: number, stage1Growth: number, stage2Growth: number,
  terminalGrowth: number, discountRate: number
): number {
  if (fcfOrEps <= 0) return 0;
  let pv = 0;
  let cf = fcfOrEps;
  for (let n = 1; n <= 5; n++) {
    cf *= (1 + stage1Growth / 100);
    pv += cf / Math.pow(1 + discountRate / 100, n);
  }
  for (let n = 6; n <= 10; n++) {
    cf *= (1 + stage2Growth / 100);
    pv += cf / Math.pow(1 + discountRate / 100, n);
  }
  const terminalValue = (cf * (1 + terminalGrowth / 100)) / (discountRate / 100 - terminalGrowth / 100);
  pv += terminalValue / Math.pow(1 + discountRate / 100, 10);
  return Math.round(pv);
}

// ─── Valuation builder with historical PE blending ────────────────────────────

function buildValuationModel(
  eps: number, normalizedEps: number, ebitda: number, bvps: number,
  revenueGrowth: number, profile: SectorProfile, cycle: CommodityCycle,
  historicalMedianPE?: number, dynamicWacc?: number
): Omit<ValuationModel, 'methodology_note'> {
  const useEps = profile.isCyclical && normalizedEps > 0 ? normalizedEps : (eps > 0 ? eps : 0);

  const maxStage1 = profile.isCyclical ? 10 : 15;
  const stage1 = Math.min(revenueGrowth || 8, maxStage1);
  const stage2 = Math.max(stage1 * 0.6, 3);
  const terminalGrowth = 2.5;

  const effectiveWacc = dynamicWacc || profile.waccDefault;

  const earningsBased = useEps > 0 ? Math.round(useEps * profile.normalizedPE) : 0;
  const evEbitdaBased = ebitda > 0 ? Math.round(ebitda * profile.evEbitdaMultiple) : 0;
  const dcfVal = calcMultiStageDCF(useEps, stage1, stage2, terminalGrowth, effectiveWacc);
  const historicalPEFV = historicalMedianPE && historicalMedianPE > 0 && useEps > 0 ? Math.round(useEps * historicalMedianPE) : 0;
  const grahamNumber = bvps > 0 && eps > 0 ? Math.round(Math.sqrt(22.5 * eps * bvps)) : 0;

  let blended = 0;
  if (historicalPEFV > 0) {
    const models: number[] = [];
    if (earningsBased > 0) models.push(earningsBased * 0.4);
    if (historicalPEFV > 0) models.push(historicalPEFV * 0.3);
    if (dcfVal > 0) models.push(dcfVal * 0.3);
    blended = models.length > 0 ? Math.round(models.reduce((a, b) => a + b, 0)) : earningsBased || evEbitdaBased || dcfVal;
  } else {
    const models = [earningsBased, evEbitdaBased, dcfVal].filter(v => v > 0);
    const raw = models.length > 0 ? models.reduce((a, b) => a + b, 0) / models.length : 0;
    blended = Math.round(raw);
  }

  const cyclePct = cycle === 'peak' ? -0.17 : cycle === 'mid' ? -0.05 : 0;
  blended = Math.round(blended * (1 + cyclePct));

  return {
    earnings_based_fair_value: earningsBased,
    ev_ebitda_fair_value: evEbitdaBased,
    dcf_fair_value: dcfVal,
    historical_pe_fair_value: historicalPEFV,
    multistage_dcf: dcfVal,
    blended_fair_value: blended,
    fair_pe_used: profile.normalizedPE,
    ev_ebitda_multiple_used: profile.evEbitdaMultiple,
    eps_used: eps,
    normalized_eps_used: normalizedEps,
    ebitda_used: ebitda,
    growth_rate_used: stage1,
    terminal_pe_used: profile.terminalPE,
    cycle_adjustment_pct: cyclePct * 100,
    graham_number: grahamNumber,
  };
}

function buildEntryRange(fv: number, qualityScore: number, currency: string, beta?: number, isCyclical?: boolean): EntryRange {
  const mos = dynamicMOS(qualityScore, beta, isCyclical);
  return {
    fair_value: Math.round(fv),
    margin_of_safety_pct: Math.round(mos * 100),
    margin_of_safety_low: Math.round(fv * (1 - mos - 0.05)),
    margin_of_safety_high: Math.round(fv * (1 - mos)),
    entry_price_suggestion: Math.round(fv * (1 - mos)),
    current_price_context: '',
    currency,
  };
}

function calcMultibagger(
  revenueGrowth: number, roce: number, de: number,
  industryGrowth: number, insiderHolding: number, marginTrend: string, largeTAM: boolean,
  productInnovation: boolean, marketCapB: number, profile: SectorProfile
): MultibaggerScore {
  const revS = revenueGrowth >= 20 ? 10 : revenueGrowth >= 15 ? 8 : revenueGrowth >= 10 ? 6 : revenueGrowth >= 5 ? 4 : 2;
  const roceS = scoreROCE(roce);
  const debtS = de <= 0.3 ? 10 : de <= 0.5 ? 8 : de <= 1 ? 6 : de <= 2 ? 4 : 2;
  const indS = industryGrowth >= 15 ? 10 : industryGrowth >= 10 ? 8 : industryGrowth >= 7 ? 6 : 4;
  const insS = insiderHolding >= 60 ? 10 : insiderHolding >= 50 ? 8 : insiderHolding >= 40 ? 6 : 4;
  const marginS = marginTrend === 'expanding' ? 10 : marginTrend === 'stable' ? 6 : 2;
  const tamS = largeTAM ? 10 : productInnovation ? 7 : 5;
  const weighted = revS * 0.25 + roceS * 0.25 + tamS * 0.20 + insS * 0.15 + (debtS + indS + marginS) / 3 * 0.15;
  let score = Math.min(profile.multibaggerCap, Math.round(weighted * 10));

  const marketCapPenalty = marketCapB > 500 ? 0 : marketCapB > 50 ? 20 : marketCapB > 20 ? 10 : marketCapB > 10 ? 5 : 0;
  score = Math.max(0, score - marketCapPenalty);

  if (marketCapB > 500) score = Math.min(score, 30);
  else if (marketCapB > 100) score = Math.min(score, 45);

  const verdict = score >= 80 ? 'High Multibagger Potential' : score >= 65 ? 'Moderate Potential' : score >= 50 ? 'Low Potential' : score >= 30 ? 'Unlikely Multibagger' : 'Mega Cap — 10x Not Realistic';
  return {
    score,
    factors: { revenue_growth_score: revS, roce_score: roceS, debt_score: debtS, industry_growth_score: indS, insider_holding_score: insS, margin_expansion_score: marginS, market_size_score: tamS, market_cap_penalty: marketCapPenalty },
    verdict,
  };
}

function calcQualityBadge(roe: number, de: number, profitGrowth: number, hasFCF: boolean): QualityBadge {
  const roeP = roe > 15, deP = de < 0.5, profP = profitGrowth > 10, fcfP = hasFCF;
  const all = roeP && deP && profP && fcfP;
  return { is_elite: all, roe_pass: roeP, debt_pass: deP, profit_growth_pass: profP, fcf_pass: fcfP, label: all ? 'Buffett Quality' : (roeP && profP) ? 'Good Quality' : 'Average Quality' };
}

function calcLiquidity(avgDailyVolume: number, freeFloatPct: number, marketCapM: number): LiquidityAnalysis {
  const volThreshold = marketCapM > 1000 ? 1000000 : marketCapM > 100 ? 100000 : 10000;
  const lowVol = avgDailyVolume < volThreshold;
  const lowFloat = freeFloatPct < 15;
  const risk: 'low' | 'medium' | 'high' = (lowVol && lowFloat) ? 'high' : (lowVol || lowFloat) ? 'medium' : 'low';
  const score = risk === 'low' ? 9 : risk === 'medium' ? 5 : 2;
  const notes = risk === 'high' ? 'Low liquidity — caution on entry/exit' : risk === 'medium' ? 'Moderate liquidity' : 'Good liquidity';
  return { avg_daily_volume: avgDailyVolume, free_float_pct: freeFloatPct, liquidity_risk: risk, liquidity_score: score, notes };
}

function calcEarningsQuality(netIncome: number, ocf: number, totalAssets: number): EarningsQuality {
  const accrual_ratio = totalAssets > 0 ? (netIncome - ocf) / totalAssets : 0;
  const manipulation_risk = accrual_ratio > 0.1;
  const ocf_ni_ratio = netIncome !== 0 ? ocf / netIncome : 0;
  const label = manipulation_risk ? 'Earnings Quality Risk (Accrual Ratio > 0.1)' : accrual_ratio > 0.05 ? 'Moderate Quality' : 'High Earnings Quality';
  return { accrual_ratio: Math.round(accrual_ratio * 1000) / 1000, manipulation_risk, ocf_ni_ratio: Math.round(ocf_ni_ratio * 100) / 100, label };
}

function calcInsiderActivity(
  promoterHolding: number, promoterPledged: number, promoterTrend: string, insiderSelling: boolean,
  exchange?: string, ceoBuying?: boolean, institutionalOwnership?: number,
  institutionalTrend?: string, buybackActive?: boolean
): InsiderActivity {
  const isUSStock = exchange ? !['NSE', 'BSE'].includes(exchange.toUpperCase()) : false;

  if (isUSStock) {
    const ceoDirectorBuying = ceoBuying || false;
    const instTrend = (institutionalTrend || 'stable') as 'increasing' | 'stable' | 'decreasing';
    let signal: 'bullish' | 'neutral' | 'bearish';
    if (ceoDirectorBuying && instTrend !== 'decreasing' && !insiderSelling) signal = 'bullish';
    else if (insiderSelling && instTrend === 'decreasing') signal = 'bearish';
    else signal = 'neutral';
    const notes = [
      ceoDirectorBuying ? 'CEO/Director buying shares' : '',
      buybackActive ? 'Active share buyback program' : '',
      insiderSelling ? 'Insider selling detected' : '',
      institutionalOwnership ? `Institutional ownership: ${institutionalOwnership.toFixed(1)}% (${instTrend})` : '',
    ].filter(Boolean).join('; ') || 'No significant insider activity';
    return {
      promoter_buying: ceoDirectorBuying,
      insider_selling: insiderSelling,
      pledged_above_threshold: false,
      signal, notes,
      is_us_stock: true,
      ceo_director_buying: ceoDirectorBuying,
      institutional_ownership_pct: institutionalOwnership || 0,
      institutional_trend: instTrend,
      buyback_active: buybackActive || false,
    };
  }

  const pledgedAbove = promoterPledged > 20;
  const promoterBuying = promoterTrend === 'increasing';
  let signal: 'bullish' | 'neutral' | 'bearish';
  if (promoterBuying && !pledgedAbove && !insiderSelling) signal = 'bullish';
  else if (pledgedAbove || insiderSelling) signal = 'bearish';
  else signal = 'neutral';
  const notes = [
    promoterBuying ? `Promoter increasing stake (${promoterHolding}%)` : '',
    pledgedAbove ? `High pledging: ${promoterPledged}% — risk flag` : '',
    insiderSelling ? 'Insider selling detected' : '',
  ].filter(Boolean).join('; ') || `Promoter at ${promoterHolding}%, pledged ${promoterPledged}%`;
  return { promoter_buying: promoterBuying, insider_selling: insiderSelling, pledged_above_threshold: pledgedAbove, signal, notes, is_us_stock: false };
}

function calcMarginStability(stdDevPct: number): MarginProfile['margin_stability'] {
  if (stdDevPct < 3) return 'excellent';
  if (stdDevPct <= 6) return 'moderate';
  return 'unstable';
}

// ─── Deterministic overall score ──────────────────────────────────────────────

function calcOverallScore(
  businessScore: number,
  financialHealth: number,
  growthScore: number,
  valuationScore: number,
  riskScore: number,
  moatScore: number
): number {
  const moatNorm = moatScore * 10;
  const score = businessScore * 0.25 + financialHealth * 0.20 + growthScore * 0.20 + valuationScore * 0.20 + moatNorm * 0.10 + riskScore * 0.05;
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Main service ─────────────────────────────────────────────────────────────

export class QuantisService {
  private llm: LLMService;
  private sessionId: string;
  private serperKey: string;

  constructor(llm: LLMService, sessionId: string, serperKey: string) {
    this.llm = llm;
    this.sessionId = sessionId;
    this.serperKey = serperKey;
  }

  private async getContext(queries: string[]): Promise<string> {
    if (!this.serperKey) return '';
    const results = await Promise.all(queries.map(q => serperSearch(q, this.serperKey)));
    return truncate(results.map((r, i) => `[Search ${i + 1}: ${queries[i]}]\n${r}`).join('\n\n'), 7000);
  }

  async discoverStocks(criteria: string): Promise<DiscoveryStock[]> {
    const ctx = await this.getContext([
      `${criteria} stocks to invest India 2025`, `best ${criteria} companies screener fundamentals`,
    ]);
    const prompt = `You are a stock research analyst. Find 5-7 stocks matching: "${criteria}"
${ctx ? `\nWEB CONTEXT:\n${ctx}\n` : ''}
Return ONLY a JSON array:
[{"ticker":"TICKER","company_name":"Name","exchange":"NSE","sector":"Sector","thesis":"One sentence why this fits","quick_scores":{"business":7,"financials":8,"valuation":6},"verdict":"good_buy"}]
Verdict: avoid|watchlist|good_buy|strong_buy. Scores 0-10. Return ONLY valid JSON array.`;
    try {
      const raw = await this.llm.generateResponse(prompt);
      const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const s = clean.indexOf('['); const e = clean.lastIndexOf(']');
      if (s === -1 || e === -1) return [];
      return JSON.parse(clean.slice(s, e + 1)) as DiscoveryStock[];
    } catch { return []; }
  }

  async analyzeStock(ticker: string, exchange: string): Promise<QuantisAnalysis | null> {
    const ctx = await this.getContext([
      `${ticker} ${exchange} stock financials ROE ROCE EPS revenue profit 2024 2023 annual report normalized earnings 5yr average ROCE ROE`,
      `${ticker} stock valuation PE PEG EV/EBITDA P/B debt management moat competitive advantage peer comparison historical PE 5yr 10yr median promoter holding pledged`,
      `${ticker} stock FCF operating cash flow ROIC WACC promoter shareholding pledged shares management quality Piotroski Altman Beneish risks cycle market cap sector industry classification`,
    ]);
    const isCurrency = exchange === 'NSE' || exchange === 'BSE' ? 'INR' : 'USD';

    const prompt = `You are a senior fundamental analyst applying Buffett, Graham, Lynch, Fisher, Munger, Piotroski, Altman, and Beneish frameworks. Perform a deep institutional-grade analysis of ${ticker} listed on ${exchange}.

${ctx ? `RESEARCH DATA:\n${ctx}\n` : ''}

═══════════════════════════════════════════
SECTOR & INDUSTRY CLASSIFICATION — CRITICAL
═══════════════════════════════════════════
Provide BOTH sector AND specific industry (e.g., sector="Metals", industry="Steel Pipes").
Industry must be specific (e.g., "IT Services", "Steel", "Paints", "Specialty Chemicals", "Cement").

Industry type:
- Technology/Software/IT/SaaS/Internet → secular
- Banks/NBFC/Insurance → secular
- FMCG/Staples/Food/Dairy → secular
- Pharma/Healthcare/Biotech → secular
- Metals/Steel/Cement/Mining → cyclical
- Oil/Gas/Energy → cyclical
- Infrastructure/Logistics/Road → cyclical
- Consumer Discretionary/Auto → secular
- Real Estate → cyclical
- Chemicals/Specialty Chemicals → secular

═══════════════════════════════════════════
COMMODITY CYCLE (cyclical industries only)
═══════════════════════════════════════════
Provide commodity_price_vs_10yr_avg (ratio, e.g. 1.15 means 15% above avg),
capacity_utilization_pct (estimate, e.g. 82),
inventory_level: "high", "medium", or "low"
Cycle: "peak", "mid", "recovery", "bottom", or "not_applicable"

═══════════════════════════════════════════
TREND DATA — REQUIRED
═══════════════════════════════════════════
Provide these for trend scoring:
- roce_5yr_avg: ROCE average over last 5 years
- roe_5yr_avg: ROE average over last 5 years
- margin_5yr_avg: Operating margin average over last 5 years
- sector_median_margin: estimated sector median operating margin
- sector_median_pe: estimated sector median PE ratio
- margin_last_10yr_values: array of last 10yr operating margins (for std dev)
- eps_cagr_10yr: EPS CAGR over 10 years
- dividend_years: number of consecutive years paying dividend

═══════════════════════════════════════════
HISTORICAL VALUATION
═══════════════════════════════════════════
Compare current PE vs 5yr and 10yr median PE.
Compare current EV/EBITDA vs 5yr median.
pe_vs_history: cheap / fair / expensive

═══════════════════════════════════════════
ROIC CALCULATION — PROPER FORMULA
═══════════════════════════════════════════
NOPAT = EBIT × (1 - effective_tax_rate)
Invested Capital = Total Equity + Total Debt - Cash
ROIC = NOPAT / Invested Capital × 100
Provide: nopat, invested_capital, prev_nopat, prev_invested_capital (for incremental ROIC)

═══════════════════════════════════════════
BENEISH M-SCORE INPUTS
═══════════════════════════════════════════
Provide these 8 ratios (year-over-year comparison):
dsri = (Receivables_t / Sales_t) / (Receivables_t-1 / Sales_t-1)
gmi = ((Sales_t-1 - COGS_t-1) / Sales_t-1) / ((Sales_t - COGS_t) / Sales_t)
aqi = (1 - (CurrentAssets + PPE) / TotalAssets)_t / same_t-1
sgi = Sales_t / Sales_t-1
depi = (Depreciation_t-1 / (PPE_t-1 + Depreciation_t-1)) / (Depreciation_t / (PPE_t + Depreciation_t))
sgai = (SGA_t / Sales_t) / (SGA_t-1 / Sales_t-1)
lvgi = (LTDebt + CurrentLiabilities)_t / TotalAssets_t / same_t-1
tata = (WorkingCapital - Cash - DepreciationAmortization) / TotalAssets

═══════════════════════════════════════════
EARNINGS QUALITY
═══════════════════════════════════════════
Provide: net_income (annual), operating_cash_flow (annual), total_assets

═══════════════════════════════════════════
LIQUIDITY DATA
═══════════════════════════════════════════
avg_daily_volume_shares: average daily trading volume
free_float_pct: % of shares not held by promoters/insiders
market_cap_b_usd: market cap in billion USD equivalent

═══════════════════════════════════════════
WACC INPUTS (REQUIRED)
═══════════════════════════════════════════
beta: stock beta vs market (e.g., 1.2 for Apple). Used for CAPM: WACC = 4.2% + beta × 5%
For Indian stocks use beta vs Nifty50. For US stocks use beta vs S&P500.

═══════════════════════════════════════════
INSIDER & INSTITUTIONAL ACTIVITY
═══════════════════════════════════════════
Exchange type determines what to report:
- NSE/BSE (Indian stocks): promoter_buying (bool), pledged shares, promoter_trend
- US stocks (NASDAQ/NYSE): ceo_director_buying (bool), institutional_ownership_pct (%), institutional_trend (increasing/stable/decreasing), buyback_active (bool)
For US stocks, DO NOT use promoter language. Use institutional/insider language.
insider_selling: true if any significant insider selling in last 12 months

═══════════════════════════════════════════
VALUATION MODELS — ALL REQUIRED
═══════════════════════════════════════════
1. Earnings-based = normalized_EPS × sector_normalized_PE
2. EV/EBITDA = EBITDA × sector_multiple
3. Multi-stage DCF:
   - Secular: Stage 1 = min(5yr_revenue_CAGR, 15%), Stage 2 = 60% of stage1
   - Cyclical: Stage 1 = min(normalized_growth, 10%), Stage 2 = 60% of stage1
   - Terminal growth: 2.5%
   - Discount rate: sector WACC
4. Historical PE model = EPS × 10yr_median_PE
5. Blended = 0.4×earnings_model + 0.3×historical_PE_model + 0.3×DCF
6. Graham Number = sqrt(22.5 × EPS × BVPS)

Cyclical companies: ALWAYS use normalized EPS (7-10yr average), NOT peak EPS

═══════════════════════════════════════════
DYNAMIC MARGIN OF SAFETY
═══════════════════════════════════════════
quality_score > 8 → MOS = 20%
quality_score 6-8 → MOS = 30%
quality_score < 6 → MOS = 40%
buy_zone_low = FV × (1 - MOS - 5%)
buy_zone_high = FV × (1 - MOS)

═══════════════════════════════════════════
PEER COMPARISON WITH PERCENTILES
═══════════════════════════════════════════
Provide company vs industry average AND estimated percentile rank:
roe_percentile, roce_percentile, margin_percentile, growth_percentile, debt_percentile
(percentile = where company ranks vs sector peers, 0-100)

═══════════════════════════════════════════
SCORING WEIGHTS
═══════════════════════════════════════════
Business Quality 25% + Financial Strength 20% + Growth 20% + Valuation 20% + Risk 15%
business_score = (business_understanding + industry_analysis + competitive_advantage + management_quality) / 4 × 10
financial_score = financial_health.composite × 10
growth_score = (financial_growth + growth_triggers) / 2 × 10
valuation_score = (valuation + entry_price) / 2 × 10
risk_score = (10 - risk_analysis_raw) × 10

Return ONLY valid JSON (no markdown, no code fences). Start with { end with }:
{
  "ticker": "${ticker}",
  "company_name": "Full company name",
  "exchange": "${exchange}",
  "sector": "Actual sector",
  "industry": "Specific industry sub-classification",
  "industry_type": "secular",
  "lynch_type": "stalwart",
  "commodity_cycle": "not_applicable",
  "commodity_price_vs_10yr_avg": 1.0,
  "capacity_utilization_pct": 80,
  "inventory_level": "medium",
  "summary": "2-3 sentence investment summary.",
  "accrual_warning": false,
  "shares_dilution": false,
  "operating_margin_trend": "stable",
  "earnings_consistency": 7,
  "capital_allocation_score": 7,
  "roce_5yr_avg": 0,
  "roe_5yr_avg": 0,
  "margin_5yr_avg": 0,
  "sector_median_margin": 0,
  "sector_median_pe": 0,
  "margin_last_10yr_values": [],
  "eps_cagr_10yr": 0,
  "dividend_years": 0,
  "nopat": 0,
  "invested_capital": 0,
  "prev_nopat": 0,
  "prev_invested_capital": 0,
  "net_income": 0,
  "operating_cash_flow": 0,
  "total_assets": 0,
  "avg_daily_volume_shares": 0,
  "free_float_pct": 0,
  "market_cap_b_usd": 0,
  "beta": 1.0,
  "scorecard": {
    "business_understanding": {"name":"Business Understanding","score":8,"rationale":"Clear rationale","data_points":["Core business","Revenue model","Market"]},
    "industry_analysis": {"name":"Industry Analysis","score":7,"rationale":"Industry dynamics","data_points":["Size","Growth %","Entry barriers","Cyclical/secular"]},
    "financial_growth": {"name":"Financial Growth","score":7,"rationale":"Growth quality","data_points":["Revenue CAGR: X%","Profit CAGR: Y%","EPS CAGR: Z%"]},
    "profitability_ratios": {"name":"Profitability Ratios","score":7,"rationale":"Composite","data_points":["ROE: X%","ROCE: Y%","ROIC: W%","Net margin: Z%"]},
    "debt_analysis": {"name":"Debt Analysis","score":7,"rationale":"Debt burden","data_points":["D/E: X","Int coverage: Yx","Net Debt/EBITDA: Zx"]},
    "cash_flow": {"name":"Cash Flow","score":7,"rationale":"FCF quality","data_points":["OCF > NI: yes/no","FCF: positive/negative","FCF growing: yes/no","FCF margin: X%"]},
    "valuation": {"name":"Valuation","score":6,"rationale":"Vs intrinsic value","data_points":["P/E: Xx","EV/EBITDA: Xx","vs 5yr median PE: cheap/fair/expensive","Graham Number: Xx"]},
    "management_quality": {"name":"Management Quality","score":8,"rationale":"Track record","data_points":["Promoter: X%","Pledged: X%","ROIC trend","Dilution: yes/no"]},
    "competitive_advantage": {"name":"Competitive Advantage","score":8,"rationale":"Moat quality","data_points":["Primary moat","Market rank","Pricing power: yes/no"]},
    "growth_triggers": {"name":"Growth Triggers","score":7,"rationale":"Catalysts","data_points":["Catalyst 1","Catalyst 2","TAM expansion: yes/no","Product innovation: yes/no"]},
    "risk_analysis": {"name":"Risk Analysis","score":6,"rationale":"Quantified risks","data_points":["Commodity: X/10","Regulatory: X/10","Debt: X/10"]},
    "entry_price": {"name":"Entry Price","score":7,"rationale":"Fair value with dynamic MOS","data_points":["Earnings FV: X","Historical PE FV: X","DCF FV: X","Blended FV: X","MOS: X%"]}
  },
  "key_ratios": {
    "pe": "Xx", "pb": "Xx", "peg": "Xx",
    "roe": "X%", "roce": "X%", "roic": "X%",
    "debt_equity": "Xx", "interest_coverage": "Xx", "current_ratio": "Xx",
    "net_debt_ebitda": "Xx", "ev_ebitda": "Xx",
    "revenue_cagr": "X%", "profit_cagr": "X%", "eps_cagr": "X%",
    "fcf_yield": "X%", "promoter_holding": "X%", "operating_margin": "X%",
    "normalized_pe": "Xx"
  },
  "moat": {"brand":false,"distribution":false,"technology":false,"cost_advantage":false,"switching_costs":false,"network_effects":false,"patents":false},
  "moat_score": 5,
  "risks": ["Risk 1","Risk 2","Risk 3","Risk 4"],
  "risk_scores": {
    "commodity_risk": 3,"regulatory_risk": 3,"debt_risk": 2,"competition_risk": 4,
    "technology_disruption_risk": 2,"liquidity_risk": 1,
    "currency_risk": 2,"interest_rate_risk": 2,"geopolitical_risk": 2,"demand_cycle_risk": 3,
    "overall_risk_score": 3
  },
  "entry_range": {
    "fair_value": 0,"margin_of_safety_pct": 30,
    "margin_of_safety_low": 0,"margin_of_safety_high": 0,
    "entry_price_suggestion": 0,
    "current_price_context": "Context.",
    "currency": "${isCurrency}"
  },
  "valuation_model": {
    "earnings_based_fair_value": 0,"ev_ebitda_fair_value": 0,"dcf_fair_value": 0,
    "historical_pe_fair_value": 0,"multistage_dcf": 0,"blended_fair_value": 0,
    "fair_pe_used": 0,"ev_ebitda_multiple_used": 0,
    "eps_used": 0,"normalized_eps_used": 0,"ebitda_used": 0,
    "growth_rate_used": 0,"terminal_pe_used": 0,"cycle_adjustment_pct": 0,
    "graham_number": 0,
    "methodology_note": "Explain models used."
  },
  "multibagger": {
    "score": 55,
    "factors": {"revenue_growth_score":6,"roce_score":7,"debt_score":8,"industry_growth_score":6,"insider_holding_score":7,"margin_expansion_score":6,"market_size_score":7,"market_cap_penalty":0},
    "verdict": "Moderate Potential"
  },
  "quality_badge": {"is_elite":false,"roe_pass":false,"debt_pass":false,"profit_growth_pass":false,"fcf_pass":false,"label":"Average Quality"},
  "graham_score": {
    "score": 5,"label": "Borderline",
    "pe_pass":false,"pb_pass":false,"debt_equity_pass":true,"interest_coverage_pass":true,
    "current_ratio_pass":true,"earnings_stability_pass":false,
    "eps_growth_10yr_pass":false,"dividend_history_pass":false,"low_volatility_pass":true,
    "graham_number": 0,"graham_number_pass": false
  },
  "piotroski": {
    "score": 5,"label": "Average (F-Score 5-7)",
    "roa_positive":true,"ocf_positive":true,"roa_improving":true,"accruals_low":false,
    "leverage_declining":true,"current_ratio_improving":false,"no_new_shares":true,
    "gross_margin_improving":false,"asset_turnover_improving":false
  },
  "altman": {"score": 2.5,"label": "Grey Zone (1.8-3)","zone": "grey"},
  "beneish": {
    "score": -2.5,"manipulation_risk": false,"label": "Low Manipulation Risk",
    "dsri": 1.0,"gmi": 1.0,"aqi": 1.0,"sgi": 1.1,"depi": 1.0,"sgai": 1.0,"lvgi": 1.0,"tata": 0.01
  },
  "roic_vs_wacc": {"roic": 0,"wacc": 10,"spread": 0,"creates_value": false,"label": "Value Neutral","incremental_roic":0,"incremental_roic_label":"Average Allocation"},
  "historical_valuation": {
    "pe_current": 0,"pe_5yr_median": 0,"pe_10yr_median": 0,"pe_vs_history": "fair",
    "ev_ebitda_current": 0,"ev_ebitda_5yr_median": 0,
    "pb_current": 0,"pb_5yr_median": 0
  },
  "margin_profile": {
    "operating_margin_current": 0,"operating_margin_5yr_avg": 0,
    "margin_std_dev": 0,"margin_stability": "moderate","trend": "stable"
  },
  "management": {
    "promoter_holding_pct": 0,"promoter_pledged_pct": 0,
    "promoter_trend": "stable","capital_allocation_score": 6,
    "roic_trend": "stable","dividend_consistency": false,"buyback_history": false
  },
  "financial_health": {"composite":6,"roce_score":7,"roe_score":6,"debt_score":7,"margin_score":6,"cashflow_score":6,"trend_adjustment":0},
  "peer_comparison": {
    "roe_company":0,"roe_industry":0,"roe_percentile":50,
    "roce_company":0,"roce_industry":0,"roce_percentile":50,
    "margin_company":0,"margin_industry":0,"margin_percentile":50,
    "growth_company":0,"growth_industry":0,"growth_percentile":50,
    "debt_company":0,"debt_industry":0,"debt_percentile":50,
    "ebitda_margin_company":0,"ebitda_margin_industry":0,
    "cost_efficiency_company":0,"cost_efficiency_industry":0
  },
  "porter_forces": {"competition_intensity":5,"entry_barriers":6,"supplier_power":4,"buyer_power":4,"substitute_threat":3},
  "liquidity": {
    "avg_daily_volume": 0,"free_float_pct": 0,"liquidity_risk": "medium","liquidity_score": 5,"notes": ""
  },
  "earnings_quality": {
    "accrual_ratio": 0,"manipulation_risk": false,"ocf_ni_ratio": 1.0,"label": "High Earnings Quality"
  },
  "insider_activity": {
    "promoter_buying": false,"insider_selling": false,"pledged_above_threshold": false,"signal": "neutral","notes": "",
    "ceo_director_buying": false,"institutional_ownership_pct": 0,"institutional_trend": "stable","buyback_active": false
  }
}

CRITICAL RULES:
- All numeric fields must be real numbers (0 only if genuinely unknown).
- Industry must be specific (e.g., "Steel Pipes", NOT just "Metals").
- Piotroski: all 9 fields must be true/false booleans.
- Altman zone: "safe", "grey", or "distress" only.
- margin_stability: "excellent", "moderate", or "unstable".
- Cyclical companies: use normalized EPS, NOT peak EPS.
- PEG only for secular companies.
- Be conservative. Do NOT over-score.
- Graham score: for mega caps (market_cap_b_usd > 50), PE<15 and PB<1.5 criteria will be shown as not applicable. Still provide real graham_number.
- beta: REQUIRED for CAPM WACC calculation. Must be realistic (e.g., Apple ~1.2, utilities ~0.5, high-growth tech ~1.5).
- For US stocks: insider_activity must use ceo_director_buying + institutional_ownership_pct, NOT promoter fields.`;

    let raw: string;
    try { raw = await this.llm.generateResponse(prompt); } catch (err: any) {
      throw new Error(err?.message || 'LLM request failed. Check your API key.');
    }

    const tryParse = (text: string) => {
      const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const s = clean.indexOf('{'); const e = clean.lastIndexOf('}');
      if (s === -1 || e === -1) return null;
      try { return JSON.parse(clean.slice(s, e + 1)); } catch { return null; }
    };

    let parsed = tryParse(raw);
    if (!parsed) {
      try {
        const r2 = await this.llm.generateResponse(`The previous response was not valid JSON. Return ONLY the JSON object for ${ticker}, no text before or after. Start with { end with }.`);
        parsed = tryParse(r2);
      } catch (err: any) {
        throw new Error(err?.message || 'LLM retry failed. Check your API key.');
      }
    }
    if (!parsed) throw new Error(`Could not parse AI response for ${ticker}. The model may not know this stock. Try a different ticker.`);

    const validFactors = Object.values(parsed.scorecard || {}).filter((f: any) => f?.score > 0).length;
    if (validFactors < 4) throw new Error(`Analysis for ${ticker} was incomplete (${validFactors}/12 scorecard factors filled). The model may have limited data on this stock. Try a well-known ticker or check your API key.`);

    const industry = parsed.industry || '';
    const profile = getSectorProfile(parsed.sector || '', industry);
    const sectorMedianPE = parseNum(parsed.sector_median_pe);
    const adjustedProfile = applyDynamicMultipleAdjustment(profile, sectorMedianPE);

    const industryType: 'cyclical' | 'secular' = adjustedProfile.isCyclical ? 'cyclical' : 'secular';

    const commodityPriceRatio = parseNum(parsed.commodity_price_vs_10yr_avg) || 1.0;
    const capacityUtilization = parseNum(parsed.capacity_utilization_pct) || 80;
    const inventoryLevel: 'high' | 'medium' | 'low' = ['high', 'medium', 'low'].includes(parsed.inventory_level) ? parsed.inventory_level : 'medium';
    const cycle: CommodityCycle = industryType === 'cyclical'
      ? detectCommodityCycle(commodityPriceRatio * 100, 100, capacityUtilization, inventoryLevel)
      : 'not_applicable';

    const roeN = parseNum(parsed.key_ratios?.roe);
    const roceN = parseNum(parsed.key_ratios?.roce);
    const roicN = parseNum(parsed.key_ratios?.roic);
    const deN = parseNum(parsed.key_ratios?.debt_equity);
    const icN = parseNum(parsed.key_ratios?.interest_coverage);
    const ndN = parseNum(parsed.key_ratios?.net_debt_ebitda);
    const opM = parseNum(parsed.key_ratios?.operating_margin);
    const revCagr = parseNum(parsed.key_ratios?.revenue_cagr);
    const profCagr = parseNum(parsed.key_ratios?.profit_cagr);
    const promoter = parseNum(parsed.key_ratios?.promoter_holding);
    const peN = parseNum(parsed.key_ratios?.pe);
    const pbN = parseNum(parsed.key_ratios?.pb);
    const crN = parseNum(parsed.key_ratios?.current_ratio);

    const roce5yrAvg = parseNum(parsed.roce_5yr_avg);
    const roe5yrAvg = parseNum(parsed.roe_5yr_avg);
    const margin5yrAvg = parseNum(parsed.margin_5yr_avg);
    const sectorMedianMargin = parseNum(parsed.sector_median_margin);

    const dpArr = (key: string) => (parsed.scorecard?.[key]?.data_points || []) as string[];
    const cfDps = dpArr('cash_flow');
    const ocfGtNI = cfDps.some((d: string) => /ocf.*yes|operating.*cf.*yes|yes.*ocf/i.test(d));
    const fcfPos = cfDps.some((d: string) => /positive|fcf.*pos/i.test(d)) || parsed.quality_badge?.fcf_pass;
    const fcfGrowing = cfDps.some((d: string) => /fcf.*growing.*yes|growing.*yes/i.test(d));
    const fcfMarginGt5 = parseNum(cfDps.find((d: string) => /fcf margin/i.test(d))) > 5;

    const fh = calcFinancialHealth(
      roeN, roceN, deN, icN, ndN, opM, adjustedProfile,
      ocfGtNI, fcfPos, fcfGrowing, fcfMarginGt5,
      roce5yrAvg, roe5yrAvg, margin5yrAvg, sectorMedianMargin
    );

    if (parsed.scorecard?.profitability_ratios) parsed.scorecard.profitability_ratios.score = fh.composite;

    const epsN = parsed.valuation_model?.eps_used || 0;
    const normEpsN = parsed.valuation_model?.normalized_eps_used || (industryType === 'cyclical' ? epsN * 0.75 : epsN);
    const ebitdaN = parsed.valuation_model?.ebitda_used || 0;
    const bvpsN = pbN > 0 && peN > 0 ? (epsN / (roeN / 100 || 0.1)) : 0;
    const historicalMedianPE = parseNum(parsed.historical_valuation?.pe_10yr_median);

    const vmCalc = buildValuationModel(epsN, normEpsN, ebitdaN, bvpsN, revCagr, adjustedProfile, cycle, historicalMedianPE, dynamicWacc);
    const vmLLM = parsed.valuation_model || {};
    const blended = vmLLM.blended_fair_value > 0 ? vmLLM.blended_fair_value : vmCalc.blended_fair_value;

    const finalVM: ValuationModel = {
      earnings_based_fair_value: vmLLM.earnings_based_fair_value > 0 ? vmLLM.earnings_based_fair_value : vmCalc.earnings_based_fair_value,
      ev_ebitda_fair_value: vmLLM.ev_ebitda_fair_value > 0 ? vmLLM.ev_ebitda_fair_value : vmCalc.ev_ebitda_fair_value,
      dcf_fair_value: vmLLM.dcf_fair_value > 0 ? vmLLM.dcf_fair_value : vmCalc.dcf_fair_value,
      historical_pe_fair_value: vmLLM.historical_pe_fair_value > 0 ? vmLLM.historical_pe_fair_value : vmCalc.historical_pe_fair_value,
      multistage_dcf: vmCalc.multistage_dcf,
      blended_fair_value: blended,
      fair_pe_used: vmLLM.fair_pe_used || adjustedProfile.normalizedPE,
      ev_ebitda_multiple_used: vmLLM.ev_ebitda_multiple_used || adjustedProfile.evEbitdaMultiple,
      eps_used: epsN,
      normalized_eps_used: normEpsN,
      ebitda_used: ebitdaN,
      growth_rate_used: vmLLM.growth_rate_used || revCagr || 8,
      terminal_pe_used: vmLLM.terminal_pe_used || adjustedProfile.terminalPE,
      cycle_adjustment_pct: vmCalc.cycle_adjustment_pct,
      graham_number: vmLLM.graham_number > 0 ? vmLLM.graham_number : vmCalc.graham_number,
      methodology_note: vmLLM.methodology_note || `4-model blend: Earnings(${industryType === 'cyclical' ? 'normalized ' : ''}PE×${adjustedProfile.normalizedPE}), Historical PE (10yr median), EV/EBITDA(×${adjustedProfile.evEbitdaMultiple}), Multi-stage DCF(${Math.round(revCagr || 8)}%→${Math.round((revCagr || 8) * 0.6)}% growth, WACC ${dynamicWacc}%${betaN > 0 ? ` [4.2%+${betaN}×5%]` : ''}, terminal 2.5%).${cycle !== 'not_applicable' ? ` Cycle: ${cycle}.` : ''}${sectorMedianPE > 0 ? ` Dynamic sector PE: ${sectorMedianPE}×0.9=${adjustedProfile.normalizedPE}.` : ''}`,
    };

    const qualityScore = fh.composite;
    const er = blended > 0 ? buildEntryRange(blended, qualityScore, isCurrency, betaN || undefined, adjustedProfile.isCyclical) : (parsed.entry_range || {});
    if (parsed.entry_range?.current_price_context) er.current_price_context = parsed.entry_range.current_price_context;
    if (!er.currency) er.currency = isCurrency;

    const moat: MoatType = parsed.moat || { brand: false, distribution: false, technology: false, cost_advantage: false, switching_costs: false, network_effects: false, patents: false };
    const moatScore = Math.min(parsed.moat_score ?? scoreMoat(moat, adjustedProfile), adjustedProfile.moatCap);

    const marginLast10 = Array.isArray(parsed.margin_last_10yr_values) ? parsed.margin_last_10yr_values.map(parseNum) : [];
    const marginStdDevCalc = marginLast10.length >= 3 ? stdDev(marginLast10) : parseNum(parsed.margin_profile?.margin_std_dev);

    const bsGraham = calcGrahamScore(
      peN, pbN, bvpsN, epsN, deN, icN, crN,
      parsed.earnings_consistency || 5,
      parseNum(parsed.eps_cagr_10yr), parseNum(parsed.dividend_years), marginStdDevCalc
    );

    const pio: PiotroskiScore = parsed.piotroski ? calcPiotroski({
      roa_positive: !!parsed.piotroski.roa_positive, ocf_positive: !!parsed.piotroski.ocf_positive,
      roa_improving: !!parsed.piotroski.roa_improving, accruals_low: !!parsed.piotroski.accruals_low,
      leverage_declining: !!parsed.piotroski.leverage_declining, cr_improving: !!parsed.piotroski.current_ratio_improving,
      no_new_shares: !!parsed.piotroski.no_new_shares, gross_margin_improving: !!parsed.piotroski.gross_margin_improving,
      asset_turnover_improving: !!parsed.piotroski.asset_turnover_improving,
    }) : { score: 5, label: 'Average (F-Score 5-7)', roa_positive: true, ocf_positive: true, roa_improving: false, accruals_low: false, leverage_declining: true, current_ratio_improving: false, no_new_shares: true, gross_margin_improving: false, asset_turnover_improving: false };

    const altmanRaw = parsed.altman || {};
    const altman: AltmanScore = {
      score: altmanRaw.score || 2.0,
      label: altmanRaw.label || 'Grey Zone (1.8-3)',
      zone: altmanRaw.zone || 'grey',
    };

    const beneishRaw = parsed.beneish || {};
    const beneish: BeneishScore = beneishRaw.dsri != null
      ? calcBeneishScore({ dsri: beneishRaw.dsri, gmi: beneishRaw.gmi, aqi: beneishRaw.aqi, sgi: beneishRaw.sgi, depi: beneishRaw.depi, sgai: beneishRaw.sgai, lvgi: beneishRaw.lvgi, tata: beneishRaw.tata })
      : { score: -2.5, manipulation_risk: false, label: 'Low Manipulation Risk', dsri: 1.0, gmi: 1.0, aqi: 1.0, sgi: 1.0, depi: 1.0, sgai: 1.0, lvgi: 1.0, tata: 0.01 };

    const nopatN = parseNum(parsed.nopat);
    const investedCapN = parseNum(parsed.invested_capital);
    const prevNopatN = parseNum(parsed.prev_nopat);
    const prevInvCapN = parseNum(parsed.prev_invested_capital);
    const betaN = parseNum(parsed.beta);
    const roicProper = investedCapN > 0 ? (nopatN / investedCapN) * 100 : roicN || 0;
    const dynamicWacc = calcDynamicWACC(adjustedProfile.waccDefault, betaN || undefined);
    const roicVsWacc: ROICvsWACC = calcROICvsWACC(roicProper || roceN * 0.85, dynamicWacc, prevNopatN, nopatN, prevInvCapN, investedCapN);

    const histVal: HistoricalValuation = parsed.historical_valuation || {
      pe_current: peN, pe_5yr_median: 0, pe_10yr_median: 0, pe_vs_history: 'fair',
      ev_ebitda_current: parseNum(parsed.key_ratios?.ev_ebitda), ev_ebitda_5yr_median: 0,
      pb_current: pbN, pb_5yr_median: 0,
    };

    const marginStability = calcMarginStability(marginStdDevCalc);
    const marginProfile: MarginProfile = {
      operating_margin_current: opM,
      operating_margin_5yr_avg: margin5yrAvg || opM,
      margin_std_dev: Math.round(marginStdDevCalc * 10) / 10,
      margin_stability: marginStability,
      trend: parsed.operating_margin_trend || 'stable',
    };

    const mgmt: ManagementQuality = parsed.management || {
      promoter_holding_pct: promoter, promoter_pledged_pct: 0, promoter_trend: 'stable',
      capital_allocation_score: parsed.capital_allocation_score || 5,
      roic_trend: 'stable', dividend_consistency: false, buyback_history: false,
    };

    const peerRaw = parsed.peer_comparison || {};
    const peerComp: PeerComparison = {
      roe_company: peerRaw.roe_company || roeN,
      roe_industry: peerRaw.roe_industry || 0,
      roe_percentile: peerRaw.roe_percentile || percentileRank(roeN, peerRaw.roe_industry || roeN, 'higher_better'),
      roce_company: peerRaw.roce_company || roceN,
      roce_industry: peerRaw.roce_industry || 0,
      roce_percentile: peerRaw.roce_percentile || percentileRank(roceN, peerRaw.roce_industry || roceN, 'higher_better'),
      margin_company: peerRaw.margin_company || opM,
      margin_industry: peerRaw.margin_industry || 0,
      margin_percentile: peerRaw.margin_percentile || percentileRank(opM, peerRaw.margin_industry || opM, 'higher_better'),
      growth_company: peerRaw.growth_company || revCagr,
      growth_industry: peerRaw.growth_industry || 0,
      growth_percentile: peerRaw.growth_percentile || percentileRank(revCagr, peerRaw.growth_industry || revCagr, 'higher_better'),
      debt_company: peerRaw.debt_company || deN,
      debt_industry: peerRaw.debt_industry || 0,
      debt_percentile: peerRaw.debt_percentile || percentileRank(deN, peerRaw.debt_industry || deN, 'lower_better'),
      ebitda_margin_company: peerRaw.ebitda_margin_company || 0,
      ebitda_margin_industry: peerRaw.ebitda_margin_industry || 0,
      cost_efficiency_company: peerRaw.cost_efficiency_company || 0,
      cost_efficiency_industry: peerRaw.cost_efficiency_industry || 0,
    };

    const riskScores: RiskScores = {
      commodity_risk: parsed.risk_scores?.commodity_risk || 3,
      regulatory_risk: parsed.risk_scores?.regulatory_risk || 3,
      debt_risk: parsed.risk_scores?.debt_risk || 3,
      competition_risk: parsed.risk_scores?.competition_risk || 3,
      technology_disruption_risk: parsed.risk_scores?.technology_disruption_risk || 2,
      liquidity_risk: parsed.risk_scores?.liquidity_risk || 2,
      currency_risk: parsed.risk_scores?.currency_risk || 2,
      interest_rate_risk: parsed.risk_scores?.interest_rate_risk || 2,
      geopolitical_risk: parsed.risk_scores?.geopolitical_risk || 2,
      demand_cycle_risk: parsed.risk_scores?.demand_cycle_risk || 3,
      overall_risk_score: parsed.risk_scores?.overall_risk_score || 3,
    };

    const marginTrend: 'expanding' | 'stable' | 'contracting' = parsed.operating_margin_trend || 'stable';
    const largeTAM = dpArr('growth_triggers').some((d: string) => /tam.*yes|large.*market|expanding.*market/i.test(d));
    const productInnovation = dpArr('growth_triggers').some((d: string) => /innovation.*yes|product.*innov/i.test(d));
    const marketCapB = parseNum(parsed.market_cap_b_usd);
    const multibagger = calcMultibagger(revCagr, roceN, deN, 10, promoter, marginTrend, largeTAM, productInnovation, marketCapB, adjustedProfile);
    const qualityBadge = calcQualityBadge(roeN, deN, profCagr, fcfPos);

    const netIncomeN = parseNum(parsed.net_income);
    const ocfN = parseNum(parsed.operating_cash_flow);
    const totalAssetsN = parseNum(parsed.total_assets);
    const earningsQuality = calcEarningsQuality(netIncomeN, ocfN, totalAssetsN);

    const liquidityData = calcLiquidity(
      parseNum(parsed.avg_daily_volume_shares),
      parseNum(parsed.free_float_pct),
      marketCapB * 1000
    );

    const insiderActivity = calcInsiderActivity(
      mgmt.promoter_holding_pct, mgmt.promoter_pledged_pct, mgmt.promoter_trend,
      parsed.insider_activity?.insider_selling || false,
      exchange,
      parsed.insider_activity?.ceo_director_buying || false,
      parseNum(parsed.insider_activity?.institutional_ownership_pct),
      parsed.insider_activity?.institutional_trend || 'stable',
      parsed.insider_activity?.buyback_active || mgmt.buyback_history || false
    );

    const scorecardScores = parsed.scorecard || {};
    const busScore = ((scorecardScores.business_understanding?.score || 7) + (scorecardScores.industry_analysis?.score || 7) + (scorecardScores.competitive_advantage?.score || 7) + (scorecardScores.management_quality?.score || 7)) / 4 * 10;
    const growthScore = ((scorecardScores.financial_growth?.score || 7) + (scorecardScores.growth_triggers?.score || 7)) / 2 * 10;
    const valScore = ((scorecardScores.valuation?.score || 6) + (scorecardScores.entry_price?.score || 7)) / 2 * 10;
    const riskScoreCard = (10 - (scorecardScores.risk_analysis?.score || 4)) * 10;
    const overallScore = calcOverallScore(busScore, fh.composite * 10, growthScore, valScore, riskScoreCard, moatScore);

    const analysis: Omit<QuantisAnalysis, 'id' | 'session_id' | 'created_at'> = {
      ticker: parsed.ticker || ticker,
      company_name: parsed.company_name || ticker,
      exchange: parsed.exchange || exchange,
      sector: parsed.sector || '',
      industry_type: industryType,
      lynch_type: parsed.lynch_type || 'stalwart',
      commodity_cycle: cycle,
      verdict: verdictFromScoreAndPrice(overallScore, 0, er.fair_value || blended, er.margin_of_safety_low || 0, er.margin_of_safety_high || 0),
      overall_score: overallScore,
      scorecard: parsed.scorecard,
      key_ratios: parsed.key_ratios || {},
      moat, moat_score: moatScore,
      risks: parsed.risks || [],
      risk_scores: riskScores,
      entry_range: er,
      valuation_model: finalVM,
      multibagger,
      quality_badge: qualityBadge,
      graham_score: bsGraham,
      piotroski: pio,
      altman,
      beneish,
      roic_vs_wacc: roicVsWacc,
      historical_valuation: histVal,
      margin_profile: marginProfile,
      management: mgmt,
      financial_health: fh,
      peer_comparison: peerComp,
      porter_forces: parsed.porter_forces || { competition_intensity: 5, entry_barriers: 5, supplier_power: 5, buyer_power: 5, substitute_threat: 5 },
      liquidity: liquidityData,
      earnings_quality: earningsQuality,
      insider_activity: insiderActivity,
      earnings_consistency: parsed.earnings_consistency || 5,
      capital_allocation_score: mgmt.capital_allocation_score,
      accrual_warning: earningsQuality.manipulation_risk || parsed.accrual_warning || false,
      shares_dilution: parsed.shares_dilution || false,
      operating_margin_trend: marginTrend,
      market_cap_b_usd: marketCapB,
      wacc_used: dynamicWacc,
      beta_used: betaN || 0,
      summary: parsed.summary || '',
    };

    const { data } = await supabase
      .from('quantis_analyses')
      .insert({ session_id: this.sessionId, ticker: analysis.ticker, company_name: analysis.company_name, exchange: analysis.exchange, sector: analysis.sector, full_analysis: { ...analysis }, verdict: analysis.verdict, overall_score: analysis.overall_score })
      .select().maybeSingle();

    const saved = data as { id: string; session_id: string; created_at: string } | null;
    return { ...analysis, id: saved?.id ?? crypto.randomUUID(), session_id: this.sessionId, created_at: saved?.created_at ?? new Date().toISOString() };
  }

  private rowToAnalysis(row: any): QuantisAnalysis {
    const fa = row.full_analysis || {};
    const profile = getSectorProfile(row.sector || fa.sector || '', fa.industry || '');
    const industryType: 'cyclical' | 'secular' = fa.industry_type || (profile.isCyclical ? 'cyclical' : 'secular');
    const defaultRisk: RiskScores = { commodity_risk: 3, regulatory_risk: 3, debt_risk: 3, competition_risk: 3, technology_disruption_risk: 2, liquidity_risk: 2, currency_risk: 2, interest_rate_risk: 2, geopolitical_risk: 2, demand_cycle_risk: 3, overall_risk_score: 3 };
    return {
      id: row.id, session_id: row.session_id,
      ticker: row.ticker || fa.ticker || '', company_name: row.company_name || fa.company_name || '', exchange: row.exchange || fa.exchange || '',
      sector: row.sector || fa.sector || '', industry_type: industryType, lynch_type: fa.lynch_type || 'stalwart', commodity_cycle: fa.commodity_cycle || 'not_applicable',
      verdict: row.verdict || fa.verdict || 'watchlist', overall_score: row.overall_score || fa.overall_score || 50, created_at: row.created_at,
      scorecard: fa.scorecard || null, key_ratios: fa.key_ratios || {}, moat: fa.moat || { brand: false, distribution: false, technology: false, cost_advantage: false, switching_costs: false, network_effects: false, patents: false },
      moat_score: fa.moat_score || 0, risks: fa.risks || [], risk_scores: { ...defaultRisk, ...fa.risk_scores },
      entry_range: fa.entry_range || { fair_value: 0, margin_of_safety_pct: 30, margin_of_safety_low: 0, margin_of_safety_high: 0, entry_price_suggestion: 0, current_price_context: '', currency: 'INR' },
      valuation_model: fa.valuation_model || { earnings_based_fair_value: 0, ev_ebitda_fair_value: 0, dcf_fair_value: 0, historical_pe_fair_value: 0, multistage_dcf: 0, blended_fair_value: 0, fair_pe_used: 0, ev_ebitda_multiple_used: 0, eps_used: 0, normalized_eps_used: 0, ebitda_used: 0, growth_rate_used: 0, terminal_pe_used: 0, cycle_adjustment_pct: 0, graham_number: 0, methodology_note: '' },
      multibagger: fa.multibagger || { score: 0, factors: { revenue_growth_score: 0, roce_score: 0, debt_score: 0, industry_growth_score: 0, insider_holding_score: 0, margin_expansion_score: 0, market_size_score: 0, market_cap_penalty: 0 }, verdict: '' },
      quality_badge: fa.quality_badge || { is_elite: false, roe_pass: false, debt_pass: false, profit_growth_pass: false, fcf_pass: false, label: 'Average Quality' },
      graham_score: fa.graham_score || { score: 0, label: 'Not Assessed', pe_pass: false, pb_pass: false, debt_equity_pass: false, interest_coverage_pass: false, current_ratio_pass: false, earnings_stability_pass: false, eps_growth_10yr_pass: false, dividend_history_pass: false, low_volatility_pass: true, graham_number: 0, graham_number_pass: false },
      piotroski: fa.piotroski || { score: 0, label: 'Not Assessed', roa_positive: false, ocf_positive: false, roa_improving: false, accruals_low: false, leverage_declining: false, current_ratio_improving: false, no_new_shares: false, gross_margin_improving: false, asset_turnover_improving: false },
      altman: fa.altman || { score: 0, label: 'Not Assessed', zone: 'grey' },
      beneish: fa.beneish || { score: -2.5, manipulation_risk: false, label: 'Low Manipulation Risk', dsri: 1, gmi: 1, aqi: 1, sgi: 1, depi: 1, sgai: 1, lvgi: 1, tata: 0 },
      roic_vs_wacc: fa.roic_vs_wacc || { roic: 0, wacc: 10, spread: 0, creates_value: false, label: 'Value Neutral', incremental_roic: 0, incremental_roic_label: 'Average Allocation' },
      historical_valuation: fa.historical_valuation || { pe_current: 0, pe_5yr_median: 0, pe_10yr_median: 0, pe_vs_history: 'fair', ev_ebitda_current: 0, ev_ebitda_5yr_median: 0, pb_current: 0, pb_5yr_median: 0 },
      margin_profile: fa.margin_profile || { operating_margin_current: 0, operating_margin_5yr_avg: 0, margin_std_dev: 0, margin_stability: 'moderate', trend: 'stable' },
      management: fa.management || { promoter_holding_pct: 0, promoter_pledged_pct: 0, promoter_trend: 'stable', capital_allocation_score: 5, roic_trend: 'stable', dividend_consistency: false, buyback_history: false },
      financial_health: fa.financial_health || { composite: 5, roce_score: 5, roe_score: 5, debt_score: 5, margin_score: 5, cashflow_score: 5, trend_adjustment: 0 },
      peer_comparison: fa.peer_comparison || { roe_company: 0, roe_industry: 0, roe_percentile: 50, roce_company: 0, roce_industry: 0, roce_percentile: 50, margin_company: 0, margin_industry: 0, margin_percentile: 50, growth_company: 0, growth_industry: 0, growth_percentile: 50, debt_company: 0, debt_industry: 0, debt_percentile: 50, ebitda_margin_company: 0, ebitda_margin_industry: 0, cost_efficiency_company: 0, cost_efficiency_industry: 0 },
      porter_forces: fa.porter_forces || { competition_intensity: 5, entry_barriers: 5, supplier_power: 5, buyer_power: 5, substitute_threat: 5 },
      liquidity: fa.liquidity || { avg_daily_volume: 0, free_float_pct: 0, liquidity_risk: 'medium', liquidity_score: 5, notes: '' },
      earnings_quality: fa.earnings_quality || { accrual_ratio: 0, manipulation_risk: false, ocf_ni_ratio: 1, label: 'Not Assessed' },
      insider_activity: fa.insider_activity || { promoter_buying: false, insider_selling: false, pledged_above_threshold: false, signal: 'neutral', notes: '' },
      earnings_consistency: fa.earnings_consistency || 5, capital_allocation_score: fa.capital_allocation_score || 5,
      market_cap_b_usd: fa.market_cap_b_usd || 0, wacc_used: fa.wacc_used || 10, beta_used: fa.beta_used || 0,
      accrual_warning: fa.accrual_warning || false, shares_dilution: fa.shares_dilution || false,
      operating_margin_trend: fa.operating_margin_trend || 'stable', summary: fa.summary || '',
    };
  }

  async loadRecentAnalyses(): Promise<QuantisAnalysis[]> {
    const { data } = await supabase.from('quantis_analyses').select('*').eq('session_id', this.sessionId).order('created_at', { ascending: false }).limit(20);
    return data ? data.map((r: any) => this.rowToAnalysis(r)) : [];
  }

  async loadAnalysisById(id: string): Promise<QuantisAnalysis | null> {
    const { data } = await supabase.from('quantis_analyses').select('*').eq('id', id).eq('session_id', this.sessionId).maybeSingle();
    return data ? this.rowToAnalysis(data as any) : null;
  }

  async loadWatchlist(): Promise<QuantisWatchlistEntry[]> {
    const { data } = await supabase.from('quantis_watchlist').select('*').eq('session_id', this.sessionId).order('created_at', { ascending: false });
    return (data as QuantisWatchlistEntry[]) || [];
  }

  async addToWatchlist(analysis: QuantisAnalysis): Promise<void> {
    const { data: existing } = await supabase.from('quantis_watchlist').select('id').eq('session_id', this.sessionId).eq('ticker', analysis.ticker).maybeSingle();
    if (existing) {
      await supabase.from('quantis_watchlist').update({ verdict: analysis.verdict, last_analysis_id: analysis.id, company_name: analysis.company_name }).eq('id', (existing as any).id);
    } else {
      await supabase.from('quantis_watchlist').insert({ session_id: this.sessionId, ticker: analysis.ticker, company_name: analysis.company_name, exchange: analysis.exchange, verdict: analysis.verdict, last_analysis_id: analysis.id });
    }
  }

  async removeFromWatchlist(id: string): Promise<void> {
    await supabase.from('quantis_watchlist').delete().eq('id', id).eq('session_id', this.sessionId);
  }
}
