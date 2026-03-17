export type PersonaView = 'founder' | 'investor' | 'legal';
export type ActiveTab = 'summary' | 'terms' | 'redFlags' | 'suggestions' | 'negotiate' | 'compare' | 'fullText';
export type SeverityLevel = 'low' | 'medium' | 'high';

export interface RedFlag {
  clause: string;
  issue: string;
  severity: SeverityLevel;
  negotiation_tactic?: string;
}

export interface BenchmarkItem {
  label: string;
  ycSafe: string;
  seriesA: string;
  seriesB: string;
  current: string;
  status: 'good' | 'warning' | 'danger' | 'neutral';
}

export interface BenchmarkComparison {
  items: BenchmarkItem[];
  overall_verdict: string;
}

export interface NegotiationTactic {
  topic: string;
  current_position: string;
  suggested_ask: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface TermSheetAnalysis {
  extracted_terms: Record<string, string>;
  plain_summary: string;
  red_flags: RedFlag[];
  friendliness_score: number;
  missing_sections: string[];
  suggestions: string[];
  negotiation_tactics: NegotiationTactic[];
  benchmark_comparison: BenchmarkComparison;
  persona_insights?: {
    founder?: string;
    investor?: string;
    legal?: string;
  };
}

export interface UploadedFile {
  name: string;
  content: string;
  size: number;
  type: string;
  metadata?: {
    pageCount?: number;
    sheetCount?: number;
    slideCount?: number;
    wordCount?: number;
    quality?: 'high' | 'medium' | 'low';
    confidence?: number;
    ocrUsed?: boolean;
    ocrPages?: number;
  };
  base64Content?: string;
  mimeType?: string;
}

export interface AnalysisHistoryRecord {
  id: string;
  session_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  persona_view: PersonaView;
  provider: string;
  friendliness_score: number;
  plain_summary: string;
  extracted_terms: Record<string, string>;
  red_flags: RedFlag[];
  missing_sections: string[];
  suggestions: string[];
  negotiation_tactics: NegotiationTactic[];
  benchmark_comparison: BenchmarkComparison;
  full_analysis: TermSheetAnalysis;
  is_comparison: boolean;
  comparison_pair_id: string | null;
  created_at: string;
}

export type AnalysisStage =
  | 'idle'
  | 'parsing'
  | 'sending'
  | 'analyzing'
  | 'saving'
  | 'done'
  | 'error';

export interface AnalysisProgress {
  stage: AnalysisStage;
  message: string;
  percent: number;
}
