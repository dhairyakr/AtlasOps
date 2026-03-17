import { LLMService } from './llmService';
import { Memory, Pattern, Goal, ChiefAction, InboxItem, MemoryType } from '../components/chiefbrain/types';

export interface MemoryClassification {
  memory_type: MemoryType;
  summary: string;
  tags: string[];
  entities: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  importance_score: number;
  title: string;
}

export interface DailyBrief {
  greeting: string;
  brief: string;
  focus: string;
}

export class ChiefBrainAI {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async classifyMemory(content: string, existingTitle?: string): Promise<MemoryClassification> {
    const prompt = `You are an intelligent personal assistant AI. Analyze the following text and extract structured information.

Text to analyze:
"""
${content}
"""

Return a JSON object with exactly these fields (no markdown, pure JSON):
{
  "memory_type": one of: email|voice_memo|document|screenshot|transaction|thought|meeting|travel|health|note,
  "title": "concise title (max 8 words)",
  "summary": "one sentence summary",
  "tags": ["tag1", "tag2", "tag3"] (2-5 relevant tags),
  "entities": ["entity1", "entity2"] (people, places, amounts, dates mentioned),
  "sentiment": one of: positive|negative|neutral|mixed,
  "importance_score": number 1-10
}`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (existingTitle && existingTitle.trim()) {
        parsed.title = existingTitle;
      }
      return parsed as MemoryClassification;
    } catch {
      return {
        memory_type: 'note',
        title: existingTitle || content.slice(0, 40),
        summary: content.slice(0, 100),
        tags: [],
        entities: [],
        sentiment: 'neutral',
        importance_score: 5,
      };
    }
  }

  async generateDailyBrief(params: {
    memories: Memory[];
    goals: Goal[];
    actions: ChiefAction[];
    inboxItems: InboxItem[];
    patterns: Pattern[];
  }): Promise<DailyBrief> {
    const urgentInbox = params.inboxItems.filter(i => !i.is_handled && (i.priority === 'urgent' || i.priority === 'high'));
    const driftingGoals = params.goals.filter(g => g.drift_alert && g.status === 'active');
    const pendingActions = params.actions.filter(a => a.status === 'pending');
    const topPattern = params.patterns.sort((a, b) => b.confidence_score - a.confidence_score)[0];

    const prompt = `You are ChiefBrain, a highly intelligent personal AI operating system and chief of staff.

Context about the user today:
- ${urgentInbox.length} urgent/high priority emails need attention${urgentInbox.length > 0 ? ': ' + urgentInbox.map(i => i.sender_name + ' (' + i.subject + ')').join(', ') : ''}
- ${driftingGoals.length} goals are drifting off track${driftingGoals.length > 0 ? ': ' + driftingGoals.map(g => g.title).join(', ') : ''}
- ${pendingActions.length} AI-generated actions are queued for review
- Top behavioral pattern: ${topPattern ? topPattern.pattern_text : 'Still learning...'}
- Recent memory: ${params.memories[0] ? params.memories[0].title : 'None yet'}

Generate a morning brief with exactly this JSON structure (no markdown, pure JSON):
{
  "greeting": "a time-aware greeting (2-5 words, e.g. 'Good morning.' or 'Rise and lead.')",
  "brief": "2-3 natural sentences covering what matters most today. Be specific, direct, and insightful. Reference actual names and situations.",
  "focus": "one sharp sentence about the single most important thing to focus on today"
}`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned) as DailyBrief;
    } catch {
      return {
        greeting: 'Good morning.',
        brief: `You have ${urgentInbox.length} priority messages waiting and ${pendingActions.length} actions queued. ${driftingGoals.length > 0 ? `Watch out for goal drift on: ${driftingGoals[0].title}.` : 'Goals are on track.'}`,
        focus: urgentInbox.length > 0 ? `Start with ${urgentInbox[0].sender_name}'s message — it's time-sensitive.` : 'Review your queued actions and make decisions.',
      };
    }
  }

  async generateInboxDraft(item: InboxItem, relationships: { name: string; communication_style: string; notes: string }[]): Promise<string> {
    const rel = relationships.find(r => r.name === item.sender_name);
    const relContext = rel ? `Communication style for ${rel.name}: ${rel.communication_style}. Notes: ${rel.notes}` : item.relationship_context;

    const prompt = `You are a sharp, professional executive assistant drafting an email reply.

From: ${item.sender_name} <${item.sender_email}>
Subject: ${item.subject}
Message:
"""
${item.original_body}
"""

Relationship context: ${relContext}
Priority: ${item.priority}
Sentiment: ${item.sentiment}

Write a reply that:
- Matches the relationship context and communication style
- Is appropriately brief for the priority level
- Addresses the specific action required: ${item.action_type || 'general reply'}
- Ends without a name (the user will sign themselves)
- Sounds natural and professional, not templated

Return only the email body text, nothing else.`;

    try {
      return await this.llm.generateResponse(prompt);
    } catch {
      return item.ai_draft_reply || '';
    }
  }

  async extractPatterns(memories: Memory[], existingPatterns: Pattern[]): Promise<Omit<Pattern, 'id' | 'user_id' | 'created_at'>[]> {
    if (memories.length < 3) return [];

    const existingTexts = existingPatterns.map(p => p.pattern_text).join('\n');
    const memoryTexts = memories.slice(0, 15).map(m => `[${m.memory_type}] ${m.title}: ${m.summary}`).join('\n');

    const prompt = `You are an expert behavioral analyst AI. Study these memories and identify patterns.

Recent memories:
${memoryTexts}

Existing known patterns (do NOT duplicate these):
${existingTexts || 'None yet'}

Identify 1-3 NEW behavioral patterns not already captured. Each pattern should be:
- Specific and evidence-based
- Written in second person ("You tend to...")
- Actionable and insightful

Return JSON array (no markdown):
[
  {
    "pattern_text": "...",
    "category": one of: behavior|preference|regret|energy|communication|financial|relationship|decision,
    "confidence_score": 0.0-1.0,
    "evidence_count": number,
    "supporting_memory_ids": [],
    "first_observed_at": "ISO date",
    "last_confirmed_at": "ISO date"
  }
]

If no new patterns are evident, return empty array: []`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateGoalMilestones(goal: { title: string; description: string; horizon: string }): Promise<{ text: string; done: boolean }[]> {
    const prompt = `You are a strategic planning AI. Generate milestones for this goal.

Goal: ${goal.title}
Description: ${goal.description}
Horizon: ${goal.horizon}

Generate 3-5 specific, actionable milestones in logical sequence.
Return JSON array (no markdown):
[{"text": "milestone description", "done": false}]`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async getGoalAdvice(goal: Goal, patterns: Pattern[], memories: Memory[]): Promise<string> {
    const relevantMemories = memories.filter(m => goal.related_memory_ids.includes(m.id)).slice(0, 3);
    const relevantPatterns = patterns.filter(p => p.is_active).slice(0, 3);

    const prompt = `You are a strategic advisor AI. Provide concrete advice for this goal.

Goal: ${goal.title}
Description: ${goal.description}
Progress: ${goal.progress_percent}%
Horizon: ${goal.horizon}
Drift alert: ${goal.drift_alert ? goal.drift_message : 'None'}

Relevant memories:
${relevantMemories.map(m => `- ${m.title}: ${m.summary}`).join('\n') || 'None'}

Known behavioral patterns:
${relevantPatterns.map(p => `- ${p.pattern_text}`).join('\n') || 'None'}

Give 3 specific, actionable bullet points to accelerate progress. Be direct and concrete.
Format as plain text bullet points starting with •`;

    try {
      return await this.llm.generateResponse(prompt);
    } catch {
      return '• Review your current blockers and address the most critical one first.\n• Schedule dedicated time this week specifically for this goal.\n• Define the next single concrete action you can take today.';
    }
  }

  async generateActionFromMemory(memory: Memory, patterns: Pattern[]): Promise<Omit<ChiefAction, 'id' | 'user_id' | 'created_at'> | null> {
    const relevantPatterns = patterns.filter(p => p.is_active).slice(0, 3);

    const prompt = `You are an intelligent executive assistant AI. Based on this newly ingested memory, determine if an action should be generated.

Memory:
Title: ${memory.title}
Type: ${memory.memory_type}
Content: ${memory.content}
Sentiment: ${memory.sentiment}
Importance: ${memory.importance_score}/10

User's behavioral patterns:
${relevantPatterns.map(p => `- ${p.pattern_text}`).join('\n') || 'None'}

Should an action be generated? If yes, return this JSON (no markdown):
{
  "action_type": one of: email_reply|schedule|cancel_meeting|financial_flag|travel_booking|document_draft|reminder|research|follow_up,
  "title": "brief action title",
  "description": "why this action matters",
  "consent_tier": one of: autonomous|auto_draft|draft_review|always_confirm,
  "status": "pending",
  "ai_output": "the actual output/draft for this action",
  "user_feedback": "",
  "regret_logged": false,
  "confidence_score": 0.0-1.0,
  "context_memory_ids": ["${memory.id}"],
  "scheduled_for": null,
  "completed_at": null
}

If no action is needed, return: null`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      if (cleaned === 'null' || cleaned === '') return null;
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }

  async getRelationshipBrief(rel: { name: string; notes: string; communication_style: string; relationship_type: string }, recentContext: string): Promise<string> {
    const prompt = `You are a relationship intelligence AI. Generate a communication brief.

Contact: ${rel.name}
Type: ${rel.relationship_type}
Communication style: ${rel.communication_style}
Notes: ${rel.notes}
Recent context: ${recentContext || 'No recent interactions'}

Write a concise 2-3 sentence brief on how to best approach the next interaction with this person. Be specific and practical.`;

    try {
      return await this.llm.generateResponse(prompt);
    } catch {
      return `Approach ${rel.name} with ${rel.communication_style || 'their preferred communication style'} in mind. Review recent context before reaching out.`;
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      return await this.llm.generateResponse(prompt);
    } catch {
      return '';
    }
  }

  async validatePattern(pattern: Pattern, memories: Memory[]): Promise<{ updated_confidence: number; validation_note: string }> {
    const recentMemories = memories.slice(0, 10).map(m => `[${m.memory_type}] ${m.title}: ${m.summary}`).join('\n');

    const prompt = `Validate this behavioral pattern against recent memories.

Pattern: ${pattern.pattern_text}
Current confidence: ${Math.round(pattern.confidence_score * 100)}%
Evidence count: ${pattern.evidence_count}

Recent memories:
${recentMemories}

Assess if recent evidence supports, contradicts, or is neutral to this pattern.
Return JSON (no markdown):
{
  "updated_confidence": 0.0-1.0,
  "validation_note": "one sentence assessment"
}`;

    try {
      const raw = await this.llm.generateResponse(prompt);
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { updated_confidence: pattern.confidence_score, validation_note: 'Validation could not be completed.' };
    }
  }
}
