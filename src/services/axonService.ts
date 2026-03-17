import { LLMService } from './llmService';
import { supabase } from './supabaseClient';

export interface AxonCapture {
  id: string;
  session_id: string;
  raw_text: string;
  summary_tag: string;
  capture_type: 'Thought' | 'Observation' | 'Idea' | 'Reflection' | 'Voice';
  is_voice: boolean;
  tags: string[];
  created_at: string;
}

export interface AxonConnection {
  id: string;
  session_id: string;
  source_id: string;
  target_id: string;
  relationship: string;
  strength: number;
  created_at: string;
}

export interface AxonCluster {
  id: string;
  session_id: string;
  label: string;
  capture_ids: string[];
  color: string;
  created_at: string;
}

export interface AxonSynthesis {
  id: string;
  session_id: string;
  synthesis_type: 'daily_brief' | 'pattern_report' | 'gap_analysis';
  content: string;
  capture_count: number;
  created_at: string;
}

export interface AxonSearchResult {
  captures: AxonCapture[];
  synthesis: string;
}

export interface TaggingResult {
  summary_tag: string;
  tags: string[];
}

export class AxonService {
  private llm: LLMService;
  private sessionId: string;

  constructor(llm: LLMService, sessionId: string) {
    this.llm = llm;
    this.sessionId = sessionId;
  }

  async saveCapture(
    text: string,
    captureType: AxonCapture['capture_type'],
    isVoice: boolean
  ): Promise<AxonCapture | null> {
    let summaryTag = '';
    let tags: string[] = [];

    try {
      const taggingPrompt = `Analyze this personal thought/note and provide:
1. A very short summary tag (3-6 words max, no punctuation)
2. 3-5 semantic tags as single words or short phrases

Text: "${text}"

Respond in this exact JSON format:
{"summary_tag": "short summary here", "tags": ["tag1", "tag2", "tag3"]}

Only return the JSON, nothing else.`;

      const raw = await this.llm.generateResponse(taggingPrompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: TaggingResult = JSON.parse(jsonMatch[0]);
        summaryTag = parsed.summary_tag || '';
        tags = parsed.tags || [];
      }
    } catch {
      summaryTag = text.slice(0, 40) + (text.length > 40 ? '...' : '');
      tags = [];
    }

    const { data, error } = await supabase
      .from('axon_captures')
      .insert({
        session_id: this.sessionId,
        raw_text: text,
        summary_tag: summaryTag,
        capture_type: captureType,
        is_voice: isVoice,
        tags,
      })
      .select()
      .maybeSingle();

    if (error || !data) return null;
    return data as AxonCapture;
  }

  async loadCaptures(): Promise<AxonCapture[]> {
    const { data } = await supabase
      .from('axon_captures')
      .select('*')
      .eq('session_id', this.sessionId)
      .order('created_at', { ascending: false });

    return (data as AxonCapture[]) || [];
  }

  async deleteCapture(id: string): Promise<void> {
    await supabase
      .from('axon_captures')
      .delete()
      .eq('id', id)
      .eq('session_id', this.sessionId);

    await supabase
      .from('axon_connections')
      .delete()
      .eq('session_id', this.sessionId)
      .or(`source_id.eq.${id},target_id.eq.${id}`);
  }

  async discoverConnections(captureId: string, allCaptures: AxonCapture[]): Promise<AxonConnection[]> {
    const targetCapture = allCaptures.find(c => c.id === captureId);
    if (!targetCapture) return [];

    const otherCaptures = allCaptures.filter(c => c.id !== captureId).slice(0, 20);
    if (otherCaptures.length === 0) return [];

    const captureList = otherCaptures
      .map((c, i) => `[${i}] id="${c.id}" text="${c.raw_text.slice(0, 100)}"`)
      .join('\n');

    const prompt = `You are analyzing a personal knowledge base. Find semantic connections between this note and the others.

TARGET NOTE: "${targetCapture.raw_text}"

OTHER NOTES:
${captureList}

Return a JSON array of connections. Only include notes with genuine semantic connections (shared concepts, contrasting ideas, related observations, cause-effect relationships). Strength is 0-1.

Format: [{"target_id": "uuid-here", "relationship": "brief description of connection", "strength": 0.8}]

Return [] if no meaningful connections exist. Return only JSON.`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const connections: Array<{ target_id: string; relationship: string; strength: number }> = JSON.parse(jsonMatch[0]);

      const toInsert = connections
        .filter(c => c.target_id && c.relationship && c.strength > 0.3)
        .map(c => ({
          session_id: this.sessionId,
          source_id: captureId,
          target_id: c.target_id,
          relationship: c.relationship,
          strength: Math.min(1, Math.max(0, c.strength)),
        }));

      if (toInsert.length === 0) return [];

      const { data } = await supabase
        .from('axon_connections')
        .insert(toInsert)
        .select();

      return (data as AxonConnection[]) || [];
    } catch {
      return [];
    }
  }

  async loadConnections(): Promise<AxonConnection[]> {
    const { data } = await supabase
      .from('axon_connections')
      .select('*')
      .eq('session_id', this.sessionId);

    return (data as AxonConnection[]) || [];
  }

  async generateDailySynthesis(captures: AxonCapture[]): Promise<AxonSynthesis | null> {
    if (captures.length === 0) return null;

    const captureText = captures
      .slice(0, 50)
      .map(c => `- [${c.capture_type}] ${c.raw_text}`)
      .join('\n');

    const prompt = `You are a personal knowledge synthesizer. Analyze these ${captures.length} personal notes and generate a thoughtful daily synthesis report.

NOTES:
${captureText}

Generate a synthesis with these sections:
1. **Situation Summary** - What themes and ideas dominate today's thinking (2-3 sentences)
2. **Key Patterns** - 3-5 recurring patterns or themes you notice across notes
3. **Unresolved Questions** - 2-3 questions implied or left open in these notes
4. **Emerging Insights** - 1-2 novel connections or insights across the notes
5. **Challenge for Reflection** - One belief or assumption worth re-examining based on these notes

Write in second person ("You seem to be exploring...") in a thoughtful, non-judgmental tone. Be specific to the actual content.`;

    try {
      const content = await this.llm.generateResponse(prompt);

      const { data } = await supabase
        .from('axon_syntheses')
        .insert({
          session_id: this.sessionId,
          synthesis_type: 'daily_brief',
          content,
          capture_count: captures.length,
        })
        .select()
        .maybeSingle();

      return (data as AxonSynthesis) || null;
    } catch {
      return null;
    }
  }

  async loadLatestSynthesis(): Promise<AxonSynthesis | null> {
    const { data } = await supabase
      .from('axon_syntheses')
      .select('*')
      .eq('session_id', this.sessionId)
      .eq('synthesis_type', 'daily_brief')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data as AxonSynthesis) || null;
  }

  async semanticSearch(query: string, captures: AxonCapture[]): Promise<AxonSearchResult> {
    if (captures.length === 0) {
      return { captures: [], synthesis: 'No notes found to search.' };
    }

    const captureList = captures
      .map(c => `id="${c.id}" [${c.capture_type}] ${c.raw_text.slice(0, 150)}`)
      .join('\n');

    const prompt = `You are searching a personal knowledge base. Find notes semantically relevant to the query.

QUERY: "${query}"

NOTES:
${captureList}

Return a JSON object with:
1. "relevant_ids": array of note IDs that are semantically relevant (ordered by relevance, max 8)
2. "synthesis": a 2-3 sentence paragraph synthesizing what the relevant notes collectively say about the query topic

Return only JSON: {"relevant_ids": ["id1", "id2"], "synthesis": "synthesis text here"}`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { captures: [], synthesis: 'Search could not be completed.' };

      const result: { relevant_ids: string[]; synthesis: string } = JSON.parse(jsonMatch[0]);

      const relevantCaptures = (result.relevant_ids || [])
        .map(id => captures.find(c => c.id === id))
        .filter((c): c is AxonCapture => !!c);

      await supabase.from('axon_queries').insert({
        session_id: this.sessionId,
        query_text: query,
        result_ids: relevantCaptures.map(c => c.id),
        synthesis: result.synthesis || '',
      });

      return {
        captures: relevantCaptures,
        synthesis: result.synthesis || '',
      };
    } catch {
      return { captures: [], synthesis: 'Search encountered an error.' };
    }
  }

  async buildClusters(captures: AxonCapture[]): Promise<AxonCluster[]> {
    if (captures.length < 3) return [];

    const captureList = captures
      .slice(0, 40)
      .map(c => `id="${c.id}" tags=${c.tags.join(',')} text="${c.raw_text.slice(0, 80)}"`)
      .join('\n');

    const clusterColors = ['#d97706', '#0891b2', '#059669', '#dc2626', '#7c3aed', '#db2777'];

    const prompt = `Analyze these personal notes and group them into 3-5 thematic clusters.

NOTES:
${captureList}

Return a JSON array of clusters:
[{"label": "cluster theme name", "capture_ids": ["id1", "id2", "id3"]}]

Each note should appear in at most one cluster. Only include notes that clearly belong together. Return only JSON.`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const rawClusters: Array<{ label: string; capture_ids: string[] }> = JSON.parse(jsonMatch[0]);

      await supabase
        .from('axon_clusters')
        .delete()
        .eq('session_id', this.sessionId);

      const toInsert = rawClusters.map((c, i) => ({
        session_id: this.sessionId,
        label: c.label,
        capture_ids: c.capture_ids || [],
        color: clusterColors[i % clusterColors.length],
      }));

      const { data } = await supabase
        .from('axon_clusters')
        .insert(toInsert)
        .select();

      return (data as AxonCluster[]) || [];
    } catch {
      return [];
    }
  }

  async loadClusters(): Promise<AxonCluster[]> {
    const { data } = await supabase
      .from('axon_clusters')
      .select('*')
      .eq('session_id', this.sessionId);

    return (data as AxonCluster[]) || [];
  }
}
