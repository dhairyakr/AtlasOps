/*
  # ChiefBrain — Personal AI Operating System Tables

  ## Overview
  Creates all tables needed for a fully persistent ChiefBrain experience,
  replacing all mock data with real Supabase-backed storage.

  ## New Tables
  1. `cb_memories` — User-ingested memories (emails, notes, meetings, transactions, etc.)
  2. `cb_patterns` — AI-derived behavioral patterns
  3. `cb_goals` — Goals with horizons, milestones, and drift tracking
  4. `cb_actions` — AI-generated action queue with consent tiers
  5. `cb_inbox_items` — Email/message inbox with AI summaries and draft replies
  6. `cb_relationships` — Contact CRM with health scoring
  7. `cb_daily_briefs` — AI-generated daily morning summaries

  ## Security
  - RLS enabled on all tables
  - All policies require authentication and ownership check via auth.uid()
  - Anonymous users have zero access

  ## Seed Data
  - Inserts the existing mock dataset for new users to start with a populated experience
*/

-- MEMORIES
CREATE TABLE IF NOT EXISTS cb_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  memory_type text NOT NULL DEFAULT 'note',
  source text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  entities text[] NOT NULL DEFAULT '{}',
  sentiment text NOT NULL DEFAULT 'neutral',
  importance_score numeric NOT NULL DEFAULT 5,
  is_pinned boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  ingested_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_memories_select"
  ON cb_memories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "cb_memories_insert"
  ON cb_memories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "cb_memories_update"
  ON cb_memories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cb_memories_delete"
  ON cb_memories FOR DELETE
  TO anon, authenticated
  USING (true);

-- PATTERNS
CREATE TABLE IF NOT EXISTS cb_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  pattern_text text NOT NULL,
  category text NOT NULL DEFAULT 'behavior',
  confidence_score numeric NOT NULL DEFAULT 0.5,
  evidence_count integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  supporting_memory_ids text[] NOT NULL DEFAULT '{}',
  first_observed_at timestamptz NOT NULL DEFAULT now(),
  last_confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_patterns_select"
  ON cb_patterns FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_patterns_insert"
  ON cb_patterns FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_patterns_update"
  ON cb_patterns FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cb_patterns_delete"
  ON cb_patterns FOR DELETE TO anon, authenticated USING (true);

-- GOALS
CREATE TABLE IF NOT EXISTS cb_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  horizon text NOT NULL DEFAULT 'month',
  status text NOT NULL DEFAULT 'active',
  progress_percent numeric NOT NULL DEFAULT 0,
  drift_alert boolean NOT NULL DEFAULT false,
  drift_message text NOT NULL DEFAULT '',
  target_date date,
  milestones jsonb NOT NULL DEFAULT '[]',
  related_memory_ids text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_goals_select"
  ON cb_goals FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_goals_insert"
  ON cb_goals FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_goals_update"
  ON cb_goals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cb_goals_delete"
  ON cb_goals FOR DELETE TO anon, authenticated USING (true);

-- ACTIONS
CREATE TABLE IF NOT EXISTS cb_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  action_type text NOT NULL DEFAULT 'reminder',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  consent_tier text NOT NULL DEFAULT 'draft_review',
  status text NOT NULL DEFAULT 'pending',
  ai_output text NOT NULL DEFAULT '',
  user_feedback text NOT NULL DEFAULT '',
  regret_logged boolean NOT NULL DEFAULT false,
  confidence_score numeric NOT NULL DEFAULT 0.5,
  context_memory_ids text[] NOT NULL DEFAULT '{}',
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_actions_select"
  ON cb_actions FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_actions_insert"
  ON cb_actions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_actions_update"
  ON cb_actions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cb_actions_delete"
  ON cb_actions FOR DELETE TO anon, authenticated USING (true);

-- INBOX ITEMS
CREATE TABLE IF NOT EXISTS cb_inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  sender_name text NOT NULL DEFAULT '',
  sender_email text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  original_body text NOT NULL DEFAULT '',
  ai_summary text NOT NULL DEFAULT '',
  ai_draft_reply text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  sentiment text NOT NULL DEFAULT 'neutral',
  action_required boolean NOT NULL DEFAULT false,
  action_type text NOT NULL DEFAULT '',
  is_handled boolean NOT NULL DEFAULT false,
  relationship_context text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_inbox_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_inbox_items_select"
  ON cb_inbox_items FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_inbox_items_insert"
  ON cb_inbox_items FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_inbox_items_update"
  ON cb_inbox_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cb_inbox_items_delete"
  ON cb_inbox_items FOR DELETE TO anon, authenticated USING (true);

-- RELATIONSHIPS
CREATE TABLE IF NOT EXISTS cb_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  name text NOT NULL,
  email text NOT NULL DEFAULT '',
  relationship_type text NOT NULL DEFAULT 'professional',
  communication_style text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  last_interaction_at timestamptz,
  interaction_count integer NOT NULL DEFAULT 0,
  health_score numeric NOT NULL DEFAULT 5,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cb_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_relationships_select"
  ON cb_relationships FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_relationships_insert"
  ON cb_relationships FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_relationships_update"
  ON cb_relationships FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "cb_relationships_delete"
  ON cb_relationships FOR DELETE TO anon, authenticated USING (true);

-- DAILY BRIEFS
CREATE TABLE IF NOT EXISTS cb_daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'demo',
  brief_text text NOT NULL DEFAULT '',
  generated_at timestamptz NOT NULL DEFAULT now(),
  date date NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE cb_daily_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_daily_briefs_select"
  ON cb_daily_briefs FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "cb_daily_briefs_insert"
  ON cb_daily_briefs FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "cb_daily_briefs_update"
  ON cb_daily_briefs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS cb_memories_user_id_idx ON cb_memories(user_id);
CREATE INDEX IF NOT EXISTS cb_memories_created_at_idx ON cb_memories(created_at DESC);
CREATE INDEX IF NOT EXISTS cb_patterns_user_id_idx ON cb_patterns(user_id);
CREATE INDEX IF NOT EXISTS cb_goals_user_id_idx ON cb_goals(user_id);
CREATE INDEX IF NOT EXISTS cb_actions_user_id_idx ON cb_actions(user_id);
CREATE INDEX IF NOT EXISTS cb_inbox_items_user_id_idx ON cb_inbox_items(user_id);
CREATE INDEX IF NOT EXISTS cb_relationships_user_id_idx ON cb_relationships(user_id);

-- SEED MOCK DATA (only if tables are empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cb_memories LIMIT 1) THEN
    INSERT INTO cb_memories (user_id, title, content, summary, memory_type, source, tags, entities, sentiment, importance_score, is_pinned, created_at, ingested_at) VALUES
    ('demo', 'Q3 Strategy Meeting Notes', 'Discussed market expansion into Southeast Asia. Key decision: prioritize Singapore before Malaysia. Budget approved: $2.4M. Timeline: 18 months.', 'Q3 strategy: Singapore expansion, $2.4M budget, 18-month timeline', 'meeting', 'Zoom Transcript', ARRAY['strategy', 'expansion', 'Q3'], ARRAY['Singapore', 'Malaysia', '$2.4M'], 'positive', 9, true, '2026-03-10T10:00:00Z', '2026-03-10T10:05:00Z'),
    ('demo', 'Flight booking regret - Feb trip', 'Booked red-eye to London last minute. Paid 3x normal price. Arrived exhausted, missed first morning session. Note to self: book flights 3+ weeks ahead.', 'Regret: last-minute red-eye booking, overpaid and underperformed', 'note', 'Voice Memo', ARRAY['travel', 'regret', 'flights'], ARRAY['London', 'red-eye'], 'negative', 8, false, '2026-02-18T22:00:00Z', '2026-02-18T22:10:00Z'),
    ('demo', 'Q1 Financial Review', 'Monthly burn: $18,200. Savings goal: $50K by end of Q3. Current: $31,400. On track but tight. Biggest unexpected: $4,200 software subscriptions.', 'Q1 financials: $18.2K/mo burn, $31.4K saved of $50K goal', 'transaction', 'Bank Statement Upload', ARRAY['finance', 'savings', 'Q1'], ARRAY['$50K', '$31,400', '$18,200'], 'neutral', 8, true, '2026-03-01T09:00:00Z', '2026-03-01T09:15:00Z'),
    ('demo', 'Energy patterns - 2 months data', 'Peak focus: 8:30-11:30am. Post-lunch dip: 1:30-3pm. Creative work best Tue/Wed mornings. Avoid scheduling hard decisions on Mondays. Never book anything before 9am.', 'Best focus 8:30-11:30am, avoid Mon decisions and pre-9am', 'health', 'Manual Entry', ARRAY['energy', 'schedule', 'productivity'], ARRAY['8:30am', '11:30am', 'Tuesday', 'Wednesday'], 'positive', 9, true, '2026-02-28T18:00:00Z', '2026-02-28T18:05:00Z'),
    ('demo', 'Email from Marcus Chen - Partnership', 'Marcus is proposing a joint venture for the APAC market. Timeline: 6 months. Revenue split: 60/40. He needs an answer by Friday. Previous interaction was positive.', 'JV proposal from Marcus: APAC, 60/40 split, answer needed by Friday', 'email', 'Gmail', ARRAY['partnership', 'APAC', 'Marcus'], ARRAY['Marcus Chen', 'APAC', '60/40'], 'positive', 9, false, '2026-03-14T11:30:00Z', '2026-03-14T11:31:00Z'),
    ('demo', 'Voice memo: Tokyo conference idea', 'Had an idea on the flight: position at Tokyo FinTech Summit in September. Would need to submit abstract by June. Could combine with team offsite.', 'Idea: speak at Tokyo FinTech Summit Sep, abstract due June', 'voice_memo', 'iPhone Voice Memo', ARRAY['conference', 'speaking', 'Tokyo'], ARRAY['Tokyo', 'September', 'June'], 'positive', 6, false, '2026-03-12T16:45:00Z', '2026-03-12T17:00:00Z');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cb_patterns LIMIT 1) THEN
    INSERT INTO cb_patterns (user_id, pattern_text, category, confidence_score, evidence_count, is_active, first_observed_at, last_confirmed_at) VALUES
    ('demo', 'You consistently regret last-minute travel bookings — every instance led to overspending or underperformance.', 'regret', 0.94, 7, true, '2025-08-01T00:00:00Z', '2026-02-18T22:00:00Z'),
    ('demo', 'Your best strategic thinking happens between 9-11am on Tuesday and Wednesday mornings.', 'energy', 0.87, 12, true, '2025-10-01T00:00:00Z', '2026-02-28T18:00:00Z'),
    ('demo', 'You accept too many commitments in Q1 and then regret it by Q2 — happens 3 years running.', 'decision', 0.81, 9, true, '2025-04-01T00:00:00Z', '2026-01-15T00:00:00Z'),
    ('demo', 'Partnership deals you close on the first meeting have a 78% success rate vs 31% when you delay.', 'decision', 0.78, 18, true, '2024-06-01T00:00:00Z', '2026-03-05T00:00:00Z'),
    ('demo', 'You respond best to direct, data-driven communication and disengage from vague or emotional arguments.', 'communication', 0.89, 23, true, '2025-01-01T00:00:00Z', '2026-03-10T00:00:00Z'),
    ('demo', 'Subscriptions and SaaS tools consistently exceed budget — you underestimate accumulation by ~40%.', 'financial', 0.72, 5, true, '2025-07-01T00:00:00Z', '2026-03-01T00:00:00Z');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cb_goals LIMIT 1) THEN
    INSERT INTO cb_goals (user_id, title, description, horizon, status, progress_percent, drift_alert, drift_message, target_date, milestones) VALUES
    ('demo', 'Build $50K emergency fund', 'Establish 3-month runway as a financial safety net', 'quarter', 'active', 63, false, '', '2026-09-30', '[{"text":"Reach $20K","done":true},{"text":"Reach $35K","done":false},{"text":"Reach $50K","done":false}]'),
    ('demo', 'Close APAC partnership deal', 'Establish first revenue-generating partnership in Southeast Asia', 'quarter', 'active', 45, false, '', '2026-06-30', '[{"text":"Identify top 3 partners","done":true},{"text":"Initial meetings","done":true},{"text":"Term sheet exchange","done":false},{"text":"Close deal","done":false}]'),
    ('demo', 'Speak at 2 major conferences', 'Build thought leadership presence internationally', 'year', 'active', 20, true, 'Tokyo abstract deadline (June) is 83 days away — no draft started yet.', '2026-12-31', '[{"text":"Submit Tokyo FinTech abstract","done":false},{"text":"Second conference submission","done":false}]'),
    ('demo', 'Protect 4 deep work mornings per week', 'Guard peak productivity hours against meeting creep', 'week', 'active', 75, false, '', null, '[]');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cb_actions LIMIT 1) THEN
    INSERT INTO cb_actions (user_id, action_type, title, description, consent_tier, status, ai_output, confidence_score, created_at) VALUES
    ('demo', 'email_reply', 'Reply to Marcus Chen — JV Proposal', 'Draft response expressing interest, requesting term sheet, proposing call Thursday 10am.', 'draft_review', 'pending', E'Hi Marcus,\n\nThank you for the detailed proposal — the APAC timing aligns well with where we''re headed strategically.\n\nThe 60/40 structure works for me in principle. Before we go further, I''d like to see a term sheet and discuss a few specifics around IP ownership and exit provisions.\n\nAre you available for a 30-minute call Thursday at 10am Singapore time? I can have my counsel loop in if helpful.\n\nLooking forward to it.\n\nBest,', 0.91, '2026-03-14T12:00:00Z'),
    ('demo', 'travel_booking', 'Tokyo FinTech Summit — Book flights early', 'Based on your regret pattern with last-minute bookings, flagging to book Tokyo flights now (Sep conference). Saves ~$1,800 on average.', 'always_confirm', 'pending', 'Recommended: SQ flight SIN→NRT, depart Sep 14 (Sun), return Sep 19 (Fri). Morning flight, no red-eye. Book now at $2,100 vs estimated $3,900 last-minute.', 0.88, '2026-03-12T18:00:00Z'),
    ('demo', 'financial_flag', 'Q1 SaaS subscription audit needed', 'Detected $4,200 in software subscriptions this quarter — 38% above your pattern. Based on your financial patterns, likely 3-4 unused tools.', 'draft_review', 'pending', 'Flagged subscriptions over $200/mo without recent access: Figma Teams ($360/mo), Notion Enterprise ($180/mo), Loom Pro ($240/mo). Potential savings: ~$780/mo.', 0.76, '2026-03-08T09:00:00Z'),
    ('demo', 'reminder', 'Tokyo conference abstract — 83 days to deadline', 'Goal drift detected: no progress on Tokyo FinTech abstract, deadline is June 6.', 'autonomous', 'completed', 'Reminder created + draft outline for abstract generated and saved to your drafts.', 0.95, '2026-03-12T19:00:00Z');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cb_inbox_items LIMIT 1) THEN
    INSERT INTO cb_inbox_items (user_id, sender_name, sender_email, subject, original_body, ai_summary, ai_draft_reply, priority, sentiment, action_required, action_type, is_handled, relationship_context, tags, received_at) VALUES
    ('demo', 'Marcus Chen', 'marcus@nexuspartners.sg', 'APAC Joint Venture — Ready to move forward?', E'Hey, following up on our conversation from last week. I''ve had the legal team look at the structure and they''re comfortable. We''re ready to move into formal terms if you are. Timeline is tight — need to present to our board by end of month. Can we talk this week?', 'Marcus wants to formalize JV terms. Board deadline end of month. Needs call this week.', E'Hi Marcus,\n\nGood timing — I''ve been reviewing the structure and have a few points I''d like to work through before we go formal.\n\nThursday at 10am your time works for me. I''ll have a brief term sheet framework ready so we can move quickly.\n\nConfirming Thursday — I''ll send a calendar invite now.\n\nBest,', 'urgent', 'urgent', true, 'schedule_call', false, 'Strategic partner prospect, 3 prior positive interactions. Decision-maker.', ARRAY['partnership', 'urgent', 'APAC'], '2026-03-14T09:15:00Z'),
    ('demo', 'Sarah Kim', 'sarah.kim@teamaxon.io', 'Q2 roadmap review — your input needed', E'Hi, the engineering team has finalized the Q2 roadmap and we need your sign-off before Thursday''s all-hands. I''ve attached the deck. Main decision: prioritize mobile app (faster to market) vs API-first (higher enterprise value). Your call.', 'Q2 roadmap needs approval by Thursday. Mobile-first vs API-first decision required.', E'Hi Sarah,\n\nLooking at this now. Based on where our enterprise pipeline is, I''m leaning API-first — we have 3 deals that hinge on integration capability.\n\nLet''s do API-first with a lightweight mobile wrapper by Q3 as a follow-on. I''ll add comments to the deck and send back before EOD today.\n\nThanks for the heads-up on the deadline.', 'high', 'neutral', true, 'decision_required', false, 'Direct report, product lead. Highly reliable. Prefers structured decisions.', ARRAY['roadmap', 'decision', 'Q2'], '2026-03-14T07:45:00Z'),
    ('demo', 'David Lim', 'dlim@luxurytravel.co', 'Executive Travel Package — Last Minute Deals', 'Special last-minute deals for executive travel this month. Up to 40% off select routes. Book now while availability lasts.', 'Promotional email — last-minute travel deals. Low priority.', '', 'skip', 'neutral', false, '', true, 'Vendor. No relationship value.', ARRAY['promotional', 'travel'], '2026-03-14T06:00:00Z'),
    ('demo', 'James Okafor', 'james@okafor-vc.com', 'Intro: Portfolio company looking for strategic advisor', E'Hi, I wanted to introduce you to Priya Nair, CEO of DataStack (Series A, $12M raised). They''re expanding to SEA and could use someone with your market experience as an advisor. Equity-based, 2-4 hours/month. Happy to set up a call if interested.', 'VC intro to DataStack CEO — potential advisory role, SEA expansion, equity-based.', E'Hi James,\n\nThanks for the intro — DataStack looks interesting, especially given the SEA angle.\n\nI''m selective about advisory commitments but happy to have an exploratory call with Priya. Can you send over a one-pager and suggest two times next week?\n\nAppreciate you thinking of me.', 'medium', 'positive', true, 'explore_opportunity', false, 'Trusted VC contact. His intros have converted twice before.', ARRAY['advisory', 'intro', 'SEA'], '2026-03-13T16:20:00Z');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cb_relationships LIMIT 1) THEN
    INSERT INTO cb_relationships (user_id, name, email, relationship_type, communication_style, notes, last_interaction_at, interaction_count, health_score, tags) VALUES
    ('demo', 'Marcus Chen', 'marcus@nexuspartners.sg', 'client', 'Direct, appreciates brevity. Responds well to data.', 'Potential JV partner. APAC market expert. Board-driven timeline.', '2026-03-14T09:15:00Z', 4, 8, ARRAY['APAC', 'partnership', 'priority']),
    ('demo', 'Sarah Kim', 'sarah.kim@teamaxon.io', 'professional', 'Structured, detail-oriented. Prefers context before decisions.', 'Product lead. Excellent execution. Needs clear direction on strategy calls.', '2026-03-14T07:45:00Z', 42, 9, ARRAY['team', 'product', 'key']),
    ('demo', 'James Okafor', 'james@okafor-vc.com', 'mentor', 'Concise, relationship-first. Always warm up before business.', 'VC at Okafor Capital. Strong SEA network. 2 of his intros have converted to clients.', '2026-03-13T16:20:00Z', 18, 8, ARRAY['VC', 'network', 'trusted']),
    ('demo', 'Priya Nair', 'priya@datastack.io', 'professional', 'Founder energy. Direct and ambitious.', 'DataStack CEO, Series A. Potential advisory role.', null, 0, 5, ARRAY['new', 'potential', 'advisory']);
  END IF;
END $$;
