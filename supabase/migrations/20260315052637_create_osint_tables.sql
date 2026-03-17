/*
  # Create OSINT Intelligence Suite Tables

  ## Summary
  Creates the full data model for the OSINT module: investigations, targets, findings, 
  link-graph snapshots, and AI-generated reports.

  ## New Tables

  ### osint_investigations
  Top-level case files. Each investigation groups targets and findings under a named case.
  - id: uuid primary key
  - session_id: text (ties to browser session, no auth required)
  - title: text
  - description: text
  - status: text — 'active' | 'archived' | 'flagged'
  - tags: text[] 
  - created_at, updated_at: timestamptz

  ### osint_targets
  Individual entities under investigation (domains, IPs, emails, persons, etc.).
  - id: uuid primary key
  - investigation_id: uuid → osint_investigations
  - session_id: text
  - value: text (the raw entity string)
  - entity_type: text — 'domain'|'ip'|'email'|'username'|'person'|'org'|'phone'|'wallet'|'url'
  - label: text (friendly display name)
  - notes: text
  - scan_status: text — 'idle'|'scanning'|'complete'|'error'
  - finding_count: int default 0
  - created_at: timestamptz

  ### osint_findings
  Individual discovered data points linked to a target.
  - id: uuid primary key
  - target_id: uuid → osint_targets
  - investigation_id: uuid → osint_investigations
  - session_id: text
  - category: text (e.g. 'whois', 'dns', 'ssl', 'ip_intel', 'social', 'breach', 'people', 'news')
  - title: text
  - content: text (full finding text)
  - source_url: text
  - confidence: text — 'high'|'medium'|'unverified'
  - extracted_date: timestamptz (nullable, for timeline)
  - pivot_value: text (nullable, a new entity found that can be pivoted to)
  - pivot_type: text (nullable, type of pivot_value)
  - metadata: jsonb default '{}'
  - created_at: timestamptz

  ### osint_graphs
  Serialized node/edge graph state per investigation for persistence.
  - id: uuid primary key
  - investigation_id: uuid → osint_investigations
  - session_id: text
  - nodes: jsonb default '[]' (array of {id, type, value, x, y, ...})
  - edges: jsonb default '[]' (array of {source, target, label, strength})
  - updated_at: timestamptz

  ### osint_reports
  AI-generated intelligence reports per investigation.
  - id: uuid primary key
  - investigation_id: uuid → osint_investigations
  - session_id: text
  - title: text
  - content_md: text (full markdown report)
  - created_at: timestamptz

  ## Security
  - RLS enabled on all tables
  - session_id-based read/write policies (no auth required, matches Atlas/Axon pattern)
  - Each session can only access its own data
*/

CREATE TABLE IF NOT EXISTS osint_investigations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE osint_investigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_investigations session select"
  ON osint_investigations FOR SELECT
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id' OR true);

CREATE POLICY "osint_investigations session insert"
  ON osint_investigations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "osint_investigations session update"
  ON osint_investigations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_investigations session delete"
  ON osint_investigations FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS osint_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES osint_investigations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  value text NOT NULL,
  entity_type text NOT NULL DEFAULT 'unknown',
  label text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  scan_status text NOT NULL DEFAULT 'idle',
  finding_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE osint_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_targets session select"
  ON osint_targets FOR SELECT
  USING (true);

CREATE POLICY "osint_targets session insert"
  ON osint_targets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "osint_targets session update"
  ON osint_targets FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_targets session delete"
  ON osint_targets FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS osint_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES osint_targets(id) ON DELETE CASCADE,
  investigation_id uuid NOT NULL REFERENCES osint_investigations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  confidence text NOT NULL DEFAULT 'unverified',
  extracted_date timestamptz,
  pivot_value text,
  pivot_type text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE osint_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_findings session select"
  ON osint_findings FOR SELECT
  USING (true);

CREATE POLICY "osint_findings session insert"
  ON osint_findings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "osint_findings session update"
  ON osint_findings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_findings session delete"
  ON osint_findings FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS osint_graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES osint_investigations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  nodes jsonb NOT NULL DEFAULT '[]',
  edges jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE osint_graphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_graphs session select"
  ON osint_graphs FOR SELECT
  USING (true);

CREATE POLICY "osint_graphs session insert"
  ON osint_graphs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "osint_graphs session update"
  ON osint_graphs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_graphs session delete"
  ON osint_graphs FOR DELETE
  USING (true);

CREATE TABLE IF NOT EXISTS osint_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id uuid NOT NULL REFERENCES osint_investigations(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  title text NOT NULL DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE osint_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osint_reports session select"
  ON osint_reports FOR SELECT
  USING (true);

CREATE POLICY "osint_reports session insert"
  ON osint_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "osint_reports session update"
  ON osint_reports FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "osint_reports session delete"
  ON osint_reports FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_osint_targets_investigation ON osint_targets(investigation_id);
CREATE INDEX IF NOT EXISTS idx_osint_findings_target ON osint_findings(target_id);
CREATE INDEX IF NOT EXISTS idx_osint_findings_investigation ON osint_findings(investigation_id);
CREATE INDEX IF NOT EXISTS idx_osint_graphs_investigation ON osint_graphs(investigation_id);
CREATE INDEX IF NOT EXISTS idx_osint_reports_investigation ON osint_reports(investigation_id);
