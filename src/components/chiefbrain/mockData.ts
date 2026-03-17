import { Memory, Pattern, Goal, ChiefAction, InboxItem, Relationship } from './types';

export const mockMemories: Memory[] = [
  {
    id: '1', user_id: 'demo', title: 'Q3 Strategy Meeting Notes',
    content: 'Discussed market expansion into Southeast Asia. Key decision: prioritize Singapore before Malaysia. Budget approved: $2.4M. Timeline: 18 months.',
    summary: 'Q3 strategy: Singapore expansion, $2.4M budget, 18-month timeline',
    memory_type: 'meeting', source: 'Zoom Transcript', tags: ['strategy', 'expansion', 'Q3'],
    entities: ['Singapore', 'Malaysia', '$2.4M'], sentiment: 'positive',
    importance_score: 9, is_pinned: true, metadata: {}, created_at: '2026-03-10T10:00:00Z', ingested_at: '2026-03-10T10:05:00Z'
  },
  {
    id: '2', user_id: 'demo', title: 'Flight booking regret - Feb trip',
    content: 'Booked red-eye to London last minute. Paid 3x normal price. Arrived exhausted, missed first morning session. Note to self: book flights 3+ weeks ahead.',
    summary: 'Regret: last-minute red-eye booking, overpaid and underperformed',
    memory_type: 'note', source: 'Voice Memo', tags: ['travel', 'regret', 'flights'],
    entities: ['London', 'red-eye'], sentiment: 'negative',
    importance_score: 8, is_pinned: false, metadata: {}, created_at: '2026-02-18T22:00:00Z', ingested_at: '2026-02-18T22:10:00Z'
  },
  {
    id: '3', user_id: 'demo', title: 'Q1 Financial Review',
    content: 'Monthly burn: $18,200. Savings goal: $50K by end of Q3. Current: $31,400. On track but tight. Biggest unexpected: $4,200 software subscriptions.',
    summary: 'Q1 financials: $18.2K/mo burn, $31.4K saved of $50K goal',
    memory_type: 'transaction', source: 'Bank Statement Upload', tags: ['finance', 'savings', 'Q1'],
    entities: ['$50K', '$31,400', '$18,200'], sentiment: 'neutral',
    importance_score: 8, is_pinned: true, metadata: {}, created_at: '2026-03-01T09:00:00Z', ingested_at: '2026-03-01T09:15:00Z'
  },
  {
    id: '4', user_id: 'demo', title: 'Energy patterns - 2 months data',
    content: 'Peak focus: 8:30-11:30am. Post-lunch dip: 1:30-3pm. Creative work best Tue/Wed mornings. Avoid scheduling hard decisions on Mondays. Never book anything before 9am.',
    summary: 'Best focus 8:30-11:30am, avoid Mon decisions and pre-9am',
    memory_type: 'health', source: 'Manual Entry', tags: ['energy', 'schedule', 'productivity'],
    entities: ['8:30am', '11:30am', 'Tuesday', 'Wednesday'], sentiment: 'positive',
    importance_score: 9, is_pinned: true, metadata: {}, created_at: '2026-02-28T18:00:00Z', ingested_at: '2026-02-28T18:05:00Z'
  },
  {
    id: '5', user_id: 'demo', title: 'Email from Marcus Chen - Partnership',
    content: 'Marcus is proposing a joint venture for the APAC market. Timeline: 6 months. Revenue split: 60/40. He needs an answer by Friday. Previous interaction was positive.',
    summary: 'JV proposal from Marcus: APAC, 60/40 split, answer needed by Friday',
    memory_type: 'email', source: 'Gmail', tags: ['partnership', 'APAC', 'Marcus'],
    entities: ['Marcus Chen', 'APAC', '60/40'], sentiment: 'positive',
    importance_score: 9, is_pinned: false, metadata: {}, created_at: '2026-03-14T11:30:00Z', ingested_at: '2026-03-14T11:31:00Z'
  },
  {
    id: '6', user_id: 'demo', title: 'Voice memo: Tokyo conference idea',
    content: 'Had an idea on the flight: position at Tokyo FinTech Summit in September. Would need to submit abstract by June. Could combine with team offsite.',
    summary: 'Idea: speak at Tokyo FinTech Summit Sep, abstract due June',
    memory_type: 'voice_memo', source: 'iPhone Voice Memo', tags: ['conference', 'speaking', 'Tokyo'],
    entities: ['Tokyo', 'September', 'June'], sentiment: 'positive',
    importance_score: 6, is_pinned: false, metadata: {}, created_at: '2026-03-12T16:45:00Z', ingested_at: '2026-03-12T17:00:00Z'
  },
];

export const mockPatterns: Pattern[] = [
  {
    id: '1', user_id: 'demo',
    pattern_text: 'You consistently regret last-minute travel bookings — every instance led to overspending or underperformance.',
    category: 'regret', confidence_score: 0.94, evidence_count: 7, is_active: true,
    supporting_memory_ids: ['2'], first_observed_at: '2025-08-01T00:00:00Z', last_confirmed_at: '2026-02-18T22:00:00Z', created_at: '2025-08-01T00:00:00Z'
  },
  {
    id: '2', user_id: 'demo',
    pattern_text: 'Your best strategic thinking happens between 9-11am on Tuesday and Wednesday mornings.',
    category: 'energy', confidence_score: 0.87, evidence_count: 12, is_active: true,
    supporting_memory_ids: ['4'], first_observed_at: '2025-10-01T00:00:00Z', last_confirmed_at: '2026-02-28T18:00:00Z', created_at: '2025-10-01T00:00:00Z'
  },
  {
    id: '3', user_id: 'demo',
    pattern_text: 'You accept too many commitments in Q1 and then regret it by Q2 — happens 3 years running.',
    category: 'decision', confidence_score: 0.81, evidence_count: 9, is_active: true,
    supporting_memory_ids: [], first_observed_at: '2025-04-01T00:00:00Z', last_confirmed_at: '2026-01-15T00:00:00Z', created_at: '2025-04-01T00:00:00Z'
  },
  {
    id: '4', user_id: 'demo',
    pattern_text: 'Partnership deals you close on the first meeting have a 78% success rate vs 31% when you delay.',
    category: 'decision', confidence_score: 0.78, evidence_count: 18, is_active: true,
    supporting_memory_ids: ['5'], first_observed_at: '2024-06-01T00:00:00Z', last_confirmed_at: '2026-03-05T00:00:00Z', created_at: '2024-06-01T00:00:00Z'
  },
  {
    id: '5', user_id: 'demo',
    pattern_text: 'You respond best to direct, data-driven communication and disengage from vague or emotional arguments.',
    category: 'communication', confidence_score: 0.89, evidence_count: 23, is_active: true,
    supporting_memory_ids: [], first_observed_at: '2025-01-01T00:00:00Z', last_confirmed_at: '2026-03-10T00:00:00Z', created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '6', user_id: 'demo',
    pattern_text: 'Subscriptions and SaaS tools consistently exceed budget — you underestimate accumulation by ~40%.',
    category: 'financial', confidence_score: 0.72, evidence_count: 5, is_active: true,
    supporting_memory_ids: ['3'], first_observed_at: '2025-07-01T00:00:00Z', last_confirmed_at: '2026-03-01T00:00:00Z', created_at: '2025-07-01T00:00:00Z'
  },
];

export const mockGoals: Goal[] = [
  {
    id: '1', user_id: 'demo', title: 'Build $50K emergency fund',
    description: 'Establish 3-month runway as a financial safety net',
    horizon: 'quarter', status: 'active', progress_percent: 63,
    drift_alert: false, drift_message: '',
    target_date: '2026-09-30', milestones: [
      { text: 'Reach $20K', done: true },
      { text: 'Reach $35K', done: false },
      { text: 'Reach $50K', done: false },
    ], related_memory_ids: ['3'], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: '2', user_id: 'demo', title: 'Close APAC partnership deal',
    description: 'Establish first revenue-generating partnership in Southeast Asia',
    horizon: 'quarter', status: 'active', progress_percent: 45,
    drift_alert: false, drift_message: '',
    target_date: '2026-06-30', milestones: [
      { text: 'Identify top 3 partners', done: true },
      { text: 'Initial meetings', done: true },
      { text: 'Term sheet exchange', done: false },
      { text: 'Close deal', done: false },
    ], related_memory_ids: ['1', '5'], created_at: '2026-01-15T00:00:00Z', updated_at: '2026-03-14T00:00:00Z'
  },
  {
    id: '3', user_id: 'demo', title: 'Speak at 2 major conferences',
    description: 'Build thought leadership presence internationally',
    horizon: 'year', status: 'active', progress_percent: 20,
    drift_alert: true, drift_message: 'Tokyo abstract deadline (June) is 83 days away — no draft started yet.',
    target_date: '2026-12-31', milestones: [
      { text: 'Submit Tokyo FinTech abstract', done: false },
      { text: 'Second conference submission', done: false },
    ], related_memory_ids: ['6'], created_at: '2026-01-01T00:00:00Z', updated_at: '2026-03-12T00:00:00Z'
  },
  {
    id: '4', user_id: 'demo', title: 'Protect 4 deep work mornings per week',
    description: 'Guard peak productivity hours against meeting creep',
    horizon: 'week', status: 'active', progress_percent: 75,
    drift_alert: false, drift_message: '',
    target_date: null, milestones: [], related_memory_ids: ['4'],
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-14T00:00:00Z'
  },
];

export const mockActions: ChiefAction[] = [
  {
    id: '1', user_id: 'demo', action_type: 'email_reply',
    title: 'Reply to Marcus Chen — JV Proposal',
    description: 'Draft response expressing interest, requesting term sheet, proposing call Thursday 10am.',
    consent_tier: 'draft_review', status: 'pending',
    ai_output: `Hi Marcus,\n\nThank you for the detailed proposal — the APAC timing aligns well with where we're headed strategically.\n\nThe 60/40 structure works for me in principle. Before we go further, I'd like to see a term sheet and discuss a few specifics around IP ownership and exit provisions.\n\nAre you available for a 30-minute call Thursday at 10am Singapore time? I can have my counsel loop in if helpful.\n\nLooking forward to it.\n\nBest,`,
    user_feedback: '', regret_logged: false, confidence_score: 0.91,
    context_memory_ids: ['5'], scheduled_for: null, completed_at: null, created_at: '2026-03-14T12:00:00Z'
  },
  {
    id: '2', user_id: 'demo', action_type: 'travel_booking',
    title: 'Tokyo FinTech Summit — Book flights early',
    description: 'Based on your regret pattern with last-minute bookings, flagging to book Tokyo flights now (Sep conference). Saves ~$1,800 on average.',
    consent_tier: 'always_confirm', status: 'pending',
    ai_output: 'Recommended: SQ flight SIN→NRT, depart Sep 14 (Sun), return Sep 19 (Fri). Morning flight, no red-eye. Book now at $2,100 vs estimated $3,900 last-minute.',
    user_feedback: '', regret_logged: false, confidence_score: 0.88,
    context_memory_ids: ['2', '6'], scheduled_for: null, completed_at: null, created_at: '2026-03-12T18:00:00Z'
  },
  {
    id: '3', user_id: 'demo', action_type: 'financial_flag',
    title: 'Q1 SaaS subscription audit needed',
    description: 'Detected $4,200 in software subscriptions this quarter — 38% above your pattern. Based on your financial patterns, likely 3-4 unused tools.',
    consent_tier: 'draft_review', status: 'pending',
    ai_output: 'Flagged subscriptions over $200/mo without recent access: Figma Teams ($360/mo), Notion Enterprise ($180/mo), Loom Pro ($240/mo). Potential savings: ~$780/mo.',
    user_feedback: '', regret_logged: false, confidence_score: 0.76,
    context_memory_ids: ['3'], scheduled_for: null, completed_at: null, created_at: '2026-03-08T09:00:00Z'
  },
  {
    id: '4', user_id: 'demo', action_type: 'reminder',
    title: 'Tokyo conference abstract — 83 days to deadline',
    description: 'Goal drift detected: no progress on Tokyo FinTech abstract, deadline is June 6.',
    consent_tier: 'autonomous', status: 'completed',
    ai_output: 'Reminder created + draft outline for abstract generated and saved to your drafts.',
    user_feedback: 'Good catch', regret_logged: false, confidence_score: 0.95,
    context_memory_ids: ['6'], scheduled_for: null, completed_at: '2026-03-13T08:00:00Z', created_at: '2026-03-12T19:00:00Z'
  },
];

export const mockInboxItems: InboxItem[] = [
  {
    id: '1', user_id: 'demo',
    sender_name: 'Marcus Chen', sender_email: 'marcus@nexuspartners.sg',
    subject: 'APAC Joint Venture — Ready to move forward?',
    original_body: 'Hey, following up on our conversation from last week. I\'ve had the legal team look at the structure and they\'re comfortable. We\'re ready to move into formal terms if you are. Timeline is tight — need to present to our board by end of month. Can we talk this week?',
    ai_summary: 'Marcus wants to formalize JV terms. Board deadline end of month. Needs call this week.',
    ai_draft_reply: `Hi Marcus,\n\nGood timing — I've been reviewing the structure and have a few points I'd like to work through before we go formal.\n\nThursday at 10am your time works for me. I'll have a brief term sheet framework ready so we can move quickly.\n\nConfirming Thursday — I'll send a calendar invite now.\n\nBest,`,
    priority: 'urgent', sentiment: 'urgent', action_required: true, action_type: 'schedule_call',
    is_handled: false, relationship_context: 'Strategic partner prospect, 3 prior positive interactions. Decision-maker.',
    tags: ['partnership', 'urgent', 'APAC'], received_at: '2026-03-14T09:15:00Z',
    processed_at: '2026-03-14T09:16:00Z', created_at: '2026-03-14T09:16:00Z'
  },
  {
    id: '2', user_id: 'demo',
    sender_name: 'Sarah Kim', sender_email: 'sarah.kim@teamaxon.io',
    subject: 'Q2 roadmap review — your input needed',
    original_body: 'Hi, the engineering team has finalized the Q2 roadmap and we need your sign-off before Thursday\'s all-hands. I\'ve attached the deck. Main decision: prioritize mobile app (faster to market) vs API-first (higher enterprise value). Your call.',
    ai_summary: 'Q2 roadmap needs approval by Thursday. Mobile-first vs API-first decision required.',
    ai_draft_reply: `Hi Sarah,\n\nLooking at this now. Based on where our enterprise pipeline is, I'm leaning API-first — we have 3 deals that hinge on integration capability.\n\nLet's do API-first with a lightweight mobile wrapper by Q3 as a follow-on. I'll add comments to the deck and send back before EOD today.\n\nThanks for the heads-up on the deadline.`,
    priority: 'high', sentiment: 'neutral', action_required: true, action_type: 'decision_required',
    is_handled: false, relationship_context: 'Direct report, product lead. Highly reliable. Prefers structured decisions.',
    tags: ['roadmap', 'decision', 'Q2'], received_at: '2026-03-14T07:45:00Z',
    processed_at: '2026-03-14T07:46:00Z', created_at: '2026-03-14T07:46:00Z'
  },
  {
    id: '3', user_id: 'demo',
    sender_name: 'David Lim', sender_email: 'dlim@luxurytravel.co',
    subject: 'Executive Travel Package — Last Minute Deals',
    original_body: 'Special last-minute deals for executive travel this month. Up to 40% off select routes. Book now while availability lasts.',
    ai_summary: 'Promotional email — last-minute travel deals. Low priority.',
    ai_draft_reply: '',
    priority: 'skip', sentiment: 'neutral', action_required: false, action_type: '',
    is_handled: true, relationship_context: 'Vendor. No relationship value.',
    tags: ['promotional', 'travel'], received_at: '2026-03-14T06:00:00Z',
    processed_at: '2026-03-14T06:01:00Z', created_at: '2026-03-14T06:01:00Z'
  },
  {
    id: '4', user_id: 'demo',
    sender_name: 'James Okafor', sender_email: 'james@okafor-vc.com',
    subject: 'Intro: Portfolio company looking for strategic advisor',
    original_body: 'Hi, I wanted to introduce you to Priya Nair, CEO of DataStack (Series A, $12M raised). They\'re expanding to SEA and could use someone with your market experience as an advisor. Equity-based, 2-4 hours/month. Happy to set up a call if interested.',
    ai_summary: 'VC intro to DataStack CEO — potential advisory role, SEA expansion, equity-based.',
    ai_draft_reply: `Hi James,\n\nThanks for the intro — DataStack looks interesting, especially given the SEA angle.\n\nI'm selective about advisory commitments but happy to have an exploratory call with Priya. Can you send over a one-pager and suggest two times next week?\n\nAppreciate you thinking of me.`,
    priority: 'medium', sentiment: 'positive', action_required: true, action_type: 'explore_opportunity',
    is_handled: false, relationship_context: 'Trusted VC contact. His intros have converted twice before.',
    tags: ['advisory', 'intro', 'SEA'], received_at: '2026-03-13T16:20:00Z',
    processed_at: '2026-03-13T16:21:00Z', created_at: '2026-03-13T16:21:00Z'
  },
];

export const mockRelationships: Relationship[] = [
  {
    id: '1', user_id: 'demo', name: 'Marcus Chen', email: 'marcus@nexuspartners.sg',
    relationship_type: 'client', communication_style: 'Direct, appreciates brevity. Responds well to data.',
    notes: 'Potential JV partner. APAC market expert. Board-driven timeline.',
    last_interaction_at: '2026-03-14T09:15:00Z', interaction_count: 4, health_score: 8,
    tags: ['APAC', 'partnership', 'priority'], created_at: '2026-02-01T00:00:00Z', updated_at: '2026-03-14T00:00:00Z'
  },
  {
    id: '2', user_id: 'demo', name: 'Sarah Kim', email: 'sarah.kim@teamaxon.io',
    relationship_type: 'professional', communication_style: 'Structured, detail-oriented. Prefers context before decisions.',
    notes: 'Product lead. Excellent execution. Needs clear direction on strategy calls.',
    last_interaction_at: '2026-03-14T07:45:00Z', interaction_count: 42, health_score: 9,
    tags: ['team', 'product', 'key'], created_at: '2025-03-01T00:00:00Z', updated_at: '2026-03-14T00:00:00Z'
  },
  {
    id: '3', user_id: 'demo', name: 'James Okafor', email: 'james@okafor-vc.com',
    relationship_type: 'mentor', communication_style: 'Concise, relationship-first. Always warm up before business.',
    notes: 'VC at Okafor Capital. Strong SEA network. 2 of his intros have converted to clients.',
    last_interaction_at: '2026-03-13T16:20:00Z', interaction_count: 18, health_score: 8,
    tags: ['VC', 'network', 'trusted'], created_at: '2024-09-01T00:00:00Z', updated_at: '2026-03-13T00:00:00Z'
  },
  {
    id: '4', user_id: 'demo', name: 'Priya Nair', email: 'priya@datastack.io',
    relationship_type: 'professional', communication_style: 'Founder energy. Direct and ambitious.',
    notes: 'DataStack CEO, Series A. Potential advisory role.',
    last_interaction_at: null, interaction_count: 0, health_score: 5,
    tags: ['new', 'potential', 'advisory'], created_at: '2026-03-13T00:00:00Z', updated_at: '2026-03-13T00:00:00Z'
  },
];
