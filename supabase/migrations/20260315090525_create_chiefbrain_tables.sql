/*
  # ChiefBrain - Personal AI Chief of Staff Tables

  ## Overview
  This migration creates the complete schema for ChiefBrain, a personal AI operating system
  that builds a living memory graph and acts as an autonomous executive assistant.

  ## New Tables

  ### 1. `chiefbrain_profiles`
  - The master identity profile for the user's digital twin
  - Stores personality model, communication style, value hierarchy
  - Updated continuously as the system learns

  ### 2. `chiefbrain_memories`
  - The core memory substrate - every ingested piece of information
  - Types: email, voice_memo, document, screenshot, transaction, thought, meeting, travel
  - Each memory is tagged, classified, and cross-referenced

  ### 3. `chiefbrain_patterns`
  - Derived behavioral patterns extracted from memories
  - Examples: "regrets last-minute bookings", "best focus time is 9-11am"
  - Has a confidence score that increases with more evidence

  ### 4. `chiefbrain_goals`
  - User's goals at multiple time horizons (today, week, quarter, year, life)
  - Tracks progress, drift alerts, and related memories

  ### 5. `chiefbrain_actions`
  - Actions taken or queued by the AI chief of staff
  - Consent tier: autonomous, auto_draft, draft_review, always_confirm
  - Tracks outcome and user feedback for the regret engine

  ### 6. `chiefbrain_inbox_items`
  - Emails/messages the AI has processed
  - Contains AI-drafted reply in user's voice
  - Sentiment, priority, and relationship context

  ### 7. `chiefbrain_relationships`
  - Key people in the user's life
  - Communication style per person, relationship health, history

  ## Security
  - RLS enabled on all tables
  - All policies require authentication
  - Users can only access their own data
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text DEFAULT '',
  tagline text DEFAULT '',
  personality_traits jsonb DEFAULT '[]',
  communication_style jsonb DEFAULT '{}',
  value_hierarchy jsonb DEFAULT '[]',
  energy_patterns jsonb DEFAULT '{}',
  decision_tendencies jsonb DEFAULT '[]',
  onboarding_complete boolean DEFAULT false,
  memory_count integer DEFAULT 0,
  pattern_count integer DEFAULT 0,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON chiefbrain_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON chiefbrain_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON chiefbrain_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON chiefbrain_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- MEMORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  summary text DEFAULT '',
  memory_type text NOT NULL DEFAULT 'thought'
    CHECK (memory_type IN ('email','voice_memo','document','screenshot','transaction','thought','meeting','travel','health','note')),
  source text DEFAULT '',
  tags jsonb DEFAULT '[]',
  entities jsonb DEFAULT '[]',
  sentiment text DEFAULT 'neutral'
    CHECK (sentiment IN ('positive','negative','neutral','mixed')),
  importance_score integer DEFAULT 5 CHECK (importance_score BETWEEN 1 AND 10),
  is_pinned boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  ingested_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories"
  ON chiefbrain_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories"
  ON chiefbrain_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories"
  ON chiefbrain_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories"
  ON chiefbrain_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_memories_user_id ON chiefbrain_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_chiefbrain_memories_type ON chiefbrain_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_chiefbrain_memories_created ON chiefbrain_memories(created_at DESC);

-- ============================================================
-- PATTERNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pattern_text text NOT NULL,
  category text NOT NULL DEFAULT 'behavior'
    CHECK (category IN ('behavior','preference','regret','energy','communication','financial','relationship','decision')),
  confidence_score numeric(3,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  evidence_count integer DEFAULT 1,
  is_active boolean DEFAULT true,
  supporting_memory_ids jsonb DEFAULT '[]',
  first_observed_at timestamptz DEFAULT now(),
  last_confirmed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns"
  ON chiefbrain_patterns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns"
  ON chiefbrain_patterns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns"
  ON chiefbrain_patterns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns"
  ON chiefbrain_patterns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_patterns_user_id ON chiefbrain_patterns(user_id);

-- ============================================================
-- GOALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  horizon text NOT NULL DEFAULT 'quarter'
    CHECK (horizon IN ('today','week','month','quarter','year','life')),
  status text DEFAULT 'active'
    CHECK (status IN ('active','paused','completed','abandoned')),
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  drift_alert boolean DEFAULT false,
  drift_message text DEFAULT '',
  target_date date,
  milestones jsonb DEFAULT '[]',
  related_memory_ids jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON chiefbrain_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON chiefbrain_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON chiefbrain_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON chiefbrain_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_goals_user_id ON chiefbrain_goals(user_id);

-- ============================================================
-- ACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL DEFAULT 'draft'
    CHECK (action_type IN ('email_reply','schedule','cancel_meeting','financial_flag','travel_booking','document_draft','reminder','research','follow_up')),
  title text NOT NULL,
  description text DEFAULT '',
  consent_tier text DEFAULT 'draft_review'
    CHECK (consent_tier IN ('autonomous','auto_draft','draft_review','always_confirm')),
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed','rejected','regretted')),
  ai_output text DEFAULT '',
  user_feedback text DEFAULT '',
  regret_logged boolean DEFAULT false,
  confidence_score numeric(3,2) DEFAULT 0.8,
  context_memory_ids jsonb DEFAULT '[]',
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions"
  ON chiefbrain_actions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON chiefbrain_actions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own actions"
  ON chiefbrain_actions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own actions"
  ON chiefbrain_actions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_actions_user_id ON chiefbrain_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_chiefbrain_actions_status ON chiefbrain_actions(status);

-- ============================================================
-- INBOX ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_name text DEFAULT '',
  sender_email text DEFAULT '',
  subject text NOT NULL DEFAULT '',
  original_body text DEFAULT '',
  ai_summary text DEFAULT '',
  ai_draft_reply text DEFAULT '',
  priority text DEFAULT 'medium'
    CHECK (priority IN ('urgent','high','medium','low','skip')),
  sentiment text DEFAULT 'neutral'
    CHECK (sentiment IN ('positive','negative','neutral','tense','urgent')),
  action_required boolean DEFAULT false,
  action_type text DEFAULT '',
  is_handled boolean DEFAULT false,
  relationship_context text DEFAULT '',
  tags jsonb DEFAULT '[]',
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inbox items"
  ON chiefbrain_inbox_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbox items"
  ON chiefbrain_inbox_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox items"
  ON chiefbrain_inbox_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inbox items"
  ON chiefbrain_inbox_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_inbox_user_id ON chiefbrain_inbox_items(user_id);
CREATE INDEX IF NOT EXISTS idx_chiefbrain_inbox_priority ON chiefbrain_inbox_items(priority);

-- ============================================================
-- RELATIONSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS chiefbrain_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text DEFAULT '',
  relationship_type text DEFAULT 'professional'
    CHECK (relationship_type IN ('professional','personal','family','mentor','client','vendor','friend')),
  communication_style text DEFAULT '',
  notes text DEFAULT '',
  last_interaction_at timestamptz,
  interaction_count integer DEFAULT 0,
  health_score integer DEFAULT 7 CHECK (health_score BETWEEN 1 AND 10),
  tags jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE chiefbrain_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships"
  ON chiefbrain_relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships"
  ON chiefbrain_relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships"
  ON chiefbrain_relationships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own relationships"
  ON chiefbrain_relationships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chiefbrain_relationships_user_id ON chiefbrain_relationships(user_id);
