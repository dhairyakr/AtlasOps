export type MemoryType = 'email' | 'voice_memo' | 'document' | 'screenshot' | 'transaction' | 'thought' | 'meeting' | 'travel' | 'health' | 'note';
export type PatternCategory = 'behavior' | 'preference' | 'regret' | 'energy' | 'communication' | 'financial' | 'relationship' | 'decision';
export type GoalHorizon = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'life';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type ActionType = 'email_reply' | 'schedule' | 'cancel_meeting' | 'financial_flag' | 'travel_booking' | 'document_draft' | 'reminder' | 'research' | 'follow_up';
export type ConsentTier = 'autonomous' | 'auto_draft' | 'draft_review' | 'always_confirm';
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'regretted';
export type InboxPriority = 'urgent' | 'high' | 'medium' | 'low' | 'skip';
export type RelationshipType = 'professional' | 'personal' | 'family' | 'mentor' | 'client' | 'vendor' | 'friend';

export interface ChiefBrainProfile {
  id: string;
  user_id: string;
  display_name: string;
  tagline: string;
  personality_traits: string[];
  communication_style: Record<string, string>;
  value_hierarchy: string[];
  energy_patterns: Record<string, string>;
  decision_tendencies: string[];
  onboarding_complete: boolean;
  memory_count: number;
  pattern_count: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary: string;
  memory_type: MemoryType;
  source: string;
  tags: string[];
  entities: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  importance_score: number;
  is_pinned: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  ingested_at: string;
}

export interface Pattern {
  id: string;
  user_id: string;
  pattern_text: string;
  category: PatternCategory;
  confidence_score: number;
  evidence_count: number;
  is_active: boolean;
  supporting_memory_ids: string[];
  first_observed_at: string;
  last_confirmed_at: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  horizon: GoalHorizon;
  status: GoalStatus;
  progress_percent: number;
  drift_alert: boolean;
  drift_message: string;
  target_date: string | null;
  milestones: { text: string; done: boolean }[];
  related_memory_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ChiefAction {
  id: string;
  user_id: string;
  action_type: ActionType;
  title: string;
  description: string;
  consent_tier: ConsentTier;
  status: ActionStatus;
  ai_output: string;
  user_feedback: string;
  regret_logged: boolean;
  confidence_score: number;
  context_memory_ids: string[];
  scheduled_for: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface InboxItem {
  id: string;
  user_id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  original_body: string;
  ai_summary: string;
  ai_draft_reply: string;
  priority: InboxPriority;
  sentiment: 'positive' | 'negative' | 'neutral' | 'tense' | 'urgent';
  action_required: boolean;
  action_type: string;
  is_handled: boolean;
  relationship_context: string;
  tags: string[];
  received_at: string;
  processed_at: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  user_id: string;
  name: string;
  email: string;
  relationship_type: RelationshipType;
  communication_style: string;
  notes: string;
  last_interaction_at: string | null;
  interaction_count: number;
  health_score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ChiefBrainView = 'dashboard' | 'memory' | 'inbox' | 'goals' | 'patterns' | 'relationships' | 'actions';
