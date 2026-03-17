import { supabase } from './supabaseClient';
import { LLMService } from './llmService';
import type {
  TermSheetAnalysis,
  AnalysisHistoryRecord,
  PersonaView,
  UploadedFile,
  NegotiationTactic,
  BenchmarkComparison,
} from '../types/termSheet';

const SESSION_KEY = 'term_sheet_session_id';

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function buildPrompt(persona: PersonaView): string {
  const personaSection = {
    founder: `You are analyzing this term sheet from the FOUNDER's perspective. Prioritize:
- Founder dilution, control retention, veto rights
- Anti-dilution clauses that protect or harm founders
- Liquidation preferences that reduce founder upside
- Board control and removal rights
- Vesting acceleration provisions
- Founder-friendly vs investor-friendly language`,

    investor: `You are analyzing this term sheet from the INVESTOR's perspective. Prioritize:
- Downside protection mechanisms (liquidation preferences, anti-dilution)
- Pro-rata rights and follow-on investment options
- Information rights and reporting obligations
- Protective provisions and veto rights
- Exit mechanics and drag-along rights
- Return multiples and preferred stack`,

    legal: `You are analyzing this term sheet from a LEGAL perspective. Prioritize:
- Vague, ambiguous, or unenforceable clauses
- Missing standard provisions that create legal risk
- Jurisdiction and governing law issues
- Enforceability of non-compete and IP assignment clauses
- Regulatory compliance considerations
- Material omissions or contradictory provisions`,
  }[persona];

  return `You are an expert legal analyst for startups and venture capital. ${personaSection}

The user provides a term sheet document. Perform a comprehensive analysis and return ONLY a valid JSON object with exactly this structure (no markdown fences, no extra text):

{
  "extracted_terms": {
    "valuation_premoney": "...",
    "valuation_postmoney": "...",
    "funding_amount": "...",
    "equity_percentage": "...",
    "security_type": "...",
    "liquidation_preference": "...",
    "liquidation_multiple": "...",
    "participation_rights": "...",
    "anti_dilution": "...",
    "anti_dilution_type": "...",
    "board_composition": "...",
    "investor_board_seats": "...",
    "voting_rights": "...",
    "protective_provisions": "...",
    "vesting_schedule": "...",
    "vesting_cliff": "...",
    "acceleration": "...",
    "esop_pool": "...",
    "pro_rata_rights": "...",
    "tag_along_rights": "...",
    "drag_along_rights": "...",
    "information_rights": "...",
    "pay_to_play": "...",
    "redemption_rights": "...",
    "conversion_mechanics": "...",
    "break_up_fee": "...",
    "exclusivity_period": "...",
    "closing_conditions": "..."
  },
  "plain_summary": "A 3-4 sentence plain English summary of the overall deal structure and key terms.",
  "red_flags": [
    {
      "clause": "Clause name",
      "issue": "Clear description of why this is problematic",
      "severity": "high|medium|low",
      "negotiation_tactic": "Specific counter-proposal or negotiation language to use"
    }
  ],
  "friendliness_score": 75,
  "missing_sections": ["List of standard clauses not present in this term sheet"],
  "suggestions": ["Specific actionable suggestions for improving the term sheet"],
  "negotiation_tactics": [
    {
      "topic": "Topic name",
      "current_position": "What the term sheet currently says",
      "suggested_ask": "What to negotiate for",
      "rationale": "Why this matters and how to frame the ask",
      "priority": "critical|high|medium|low"
    }
  ],
  "benchmark_comparison": {
    "items": [
      {
        "label": "Liquidation Preference",
        "ycSafe": "1x non-participating",
        "seriesA": "1x non-participating",
        "seriesB": "1-1.5x non-participating",
        "current": "What this term sheet has",
        "status": "good|warning|danger|neutral"
      }
    ],
    "overall_verdict": "Overall assessment compared to market standards"
  },
  "persona_insights": {
    "founder": "Key insight specifically for founders",
    "investor": "Key insight specifically for investors",
    "legal": "Key legal consideration"
  }
}

Rules:
- friendliness_score: 0 = extremely investor-friendly, 100 = extremely founder-friendly
- severity high = requires immediate negotiation, medium = should negotiate, low = minor concern
- Include benchmark items for: Liquidation Preference, Anti-Dilution, Board Control, Vesting, ESOP Pool, Pro-Rata Rights
- If a term is not present in the document, use "Not specified" as the value
- Return ONLY valid JSON, nothing else`;
}

function extractJsonRobust(raw: string): TermSheetAnalysis | null {
  const strategies = [
    () => {
      const fenceMatch = raw.match(/```json\s*([\s\S]*?)\s*```/);
      return fenceMatch ? fenceMatch[1] : null;
    },
    () => {
      const fenceMatch = raw.match(/```\s*([\s\S]*?)\s*```/);
      return fenceMatch ? fenceMatch[1] : null;
    },
    () => {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return raw.slice(start, end + 1);
      }
      return null;
    },
    () => raw.trim(),
  ];

  for (const strategy of strategies) {
    const candidate = strategy();
    if (!candidate) continue;
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') {
        return normalizeAnalysis(parsed);
      }
    } catch {
      continue;
    }
  }
  return null;
}

function normalizeAnalysis(raw: Record<string, unknown>): TermSheetAnalysis {
  const redFlags = Array.isArray(raw.red_flags)
    ? (raw.red_flags as Array<Record<string, unknown>>).map(f => ({
        clause: String(f.clause || 'Unknown'),
        issue: String(f.issue || ''),
        severity: (['high', 'medium', 'low'].includes(String(f.severity)) ? f.severity : 'medium') as 'high' | 'medium' | 'low',
        negotiation_tactic: f.negotiation_tactic ? String(f.negotiation_tactic) : undefined,
      }))
    : [];

  const negotiationTactics: NegotiationTactic[] = Array.isArray(raw.negotiation_tactics)
    ? (raw.negotiation_tactics as Array<Record<string, unknown>>).map(t => ({
        topic: String(t.topic || ''),
        current_position: String(t.current_position || ''),
        suggested_ask: String(t.suggested_ask || ''),
        rationale: String(t.rationale || ''),
        priority: (['critical', 'high', 'medium', 'low'].includes(String(t.priority)) ? t.priority : 'medium') as NegotiationTactic['priority'],
      }))
    : [];

  const rawBenchmark = (raw.benchmark_comparison || {}) as Record<string, unknown>;
  const benchmarkComparison: BenchmarkComparison = {
    items: Array.isArray(rawBenchmark.items)
      ? (rawBenchmark.items as Array<Record<string, unknown>>).map(item => ({
          label: String(item.label || ''),
          ycSafe: String(item.ycSafe || item.yc_safe || 'N/A'),
          seriesA: String(item.seriesA || item.series_a || 'N/A'),
          seriesB: String(item.seriesB || item.series_b || 'N/A'),
          current: String(item.current || 'Not specified'),
          status: (['good', 'warning', 'danger', 'neutral'].includes(String(item.status)) ? item.status : 'neutral') as 'good' | 'warning' | 'danger' | 'neutral',
        }))
      : [],
    overall_verdict: String(rawBenchmark.overall_verdict || ''),
  };

  const rawInsights = (raw.persona_insights || {}) as Record<string, unknown>;

  return {
    extracted_terms: (raw.extracted_terms && typeof raw.extracted_terms === 'object')
      ? (raw.extracted_terms as Record<string, string>)
      : {},
    plain_summary: String(raw.plain_summary || ''),
    red_flags: redFlags,
    friendliness_score: Math.max(0, Math.min(100, Number(raw.friendliness_score) || 50)),
    missing_sections: Array.isArray(raw.missing_sections)
      ? (raw.missing_sections as string[]).map(String)
      : [],
    suggestions: Array.isArray(raw.suggestions)
      ? (raw.suggestions as string[]).map(String)
      : [],
    negotiation_tactics: negotiationTactics,
    benchmark_comparison: benchmarkComparison,
    persona_insights: {
      founder: rawInsights.founder ? String(rawInsights.founder) : undefined,
      investor: rawInsights.investor ? String(rawInsights.investor) : undefined,
      legal: rawInsights.legal ? String(rawInsights.legal) : undefined,
    },
  };
}

export async function analyzeTermSheet(
  llmService: LLMService,
  input: { text?: string; file?: UploadedFile },
  persona: PersonaView,
  onProgress: (stage: string, percent: number) => void
): Promise<TermSheetAnalysis> {
  onProgress('Building analysis prompt...', 15);
  const systemPrompt = buildPrompt(persona);

  let userMessage: string;
  let imageData: { data: string; mimeType: string } | undefined;

  if (input.file) {
    if (input.file.base64Content && input.file.mimeType) {
      imageData = { data: input.file.base64Content, mimeType: input.file.mimeType };
      userMessage = `${systemPrompt}\n\nPlease analyze the term sheet in this image.`;
    } else {
      userMessage = `${systemPrompt}\n\nHere is the term sheet content extracted from "${input.file.name}":\n\n${input.file.content}`;
    }
  } else {
    userMessage = `${systemPrompt}\n\nHere is the term sheet content:\n\n${input.text || ''}`;
  }

  onProgress('Sending to AI for analysis...', 35);

  let rawResponse: string;
  try {
    rawResponse = await llmService.generateResponse(userMessage, imageData);
  } catch (err) {
    onProgress('Retrying analysis...', 50);
    await new Promise(r => setTimeout(r, 2000));
    rawResponse = await llmService.generateResponse(userMessage, imageData);
  }

  onProgress('Parsing AI response...', 75);

  let analysis = extractJsonRobust(rawResponse);

  if (!analysis) {
    onProgress('Requesting clean JSON format...', 80);
    const retryPrompt = `${userMessage}\n\nIMPORTANT: Your previous response could not be parsed as JSON. Return ONLY a valid JSON object with no markdown, no code fences, no explanation. Start your response with { and end with }`;
    const retryResponse = await llmService.generateResponse(retryPrompt);
    analysis = extractJsonRobust(retryResponse);
  }

  if (!analysis) {
    throw new Error('Could not parse AI response as valid JSON after multiple attempts. Please try again.');
  }

  onProgress('Analysis complete!', 100);
  return analysis;
}

export async function saveAnalysis(
  analysis: TermSheetAnalysis,
  meta: {
    fileName: string;
    fileType: string;
    fileSize: number;
    persona: PersonaView;
    provider: string;
    isComparison?: boolean;
    comparisonPairId?: string;
  }
): Promise<string | null> {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('term_sheet_analyses')
    .insert({
      session_id: sessionId,
      file_name: meta.fileName,
      file_type: meta.fileType,
      file_size: meta.fileSize,
      persona_view: meta.persona,
      provider: meta.provider,
      friendliness_score: analysis.friendliness_score,
      plain_summary: analysis.plain_summary,
      extracted_terms: analysis.extracted_terms,
      red_flags: analysis.red_flags,
      missing_sections: analysis.missing_sections,
      suggestions: analysis.suggestions,
      negotiation_tactics: analysis.negotiation_tactics,
      benchmark_comparison: analysis.benchmark_comparison,
      full_analysis: analysis,
      is_comparison: meta.isComparison || false,
      comparison_pair_id: meta.comparisonPairId || null,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to save analysis:', error);
    return null;
  }

  return data?.id ?? null;
}

export async function loadHistory(): Promise<AnalysisHistoryRecord[]> {
  const sessionId = getSessionId();

  const { data, error } = await supabase
    .from('term_sheet_analyses')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to load history:', error);
    return [];
  }

  return (data || []) as AnalysisHistoryRecord[];
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('term_sheet_analyses')
    .delete()
    .eq('id', id);

  return !error;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
