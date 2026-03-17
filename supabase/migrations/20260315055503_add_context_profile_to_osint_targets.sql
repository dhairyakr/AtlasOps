/*
  # Add Context Profile to OSINT Targets

  ## Summary
  Adds a structured intelligence profile to OSINT targets so analysts can brief
  the system on what they already know before scanning. This allows the scan engine,
  search queries, dork generator, and report to use pre-existing knowledge.

  ## Changes

  ### Modified Tables
  - `osint_targets`
    - Added `context_profile` (JSONB) — Stores structured prior intel about the target:
      - `aliases`: known alternate names / usernames / handles
      - `known_emails`: associated email addresses
      - `known_usernames`: known platform usernames
      - `known_phones`: known phone numbers
      - `known_domains`: associated domains or websites
      - `employer_org`: employer or affiliated organization
      - `locations`: known physical locations / cities / countries
      - `occupation`: role, title, or profession
      - `associates`: known associates / relationships
      - `context_tags`: quick-tag chips for associations
      - `intel_brief`: free-form raw intelligence text block
      - `date_of_birth_approx`: approximate DOB or age range (for persons)
      - `nationality`: nationality or citizenship

  ## Notes
  1. Uses JSONB to allow flexible per-entity-type schemas without schema migrations per field
  2. Defaults to empty object `{}` so existing rows are unaffected
  3. No RLS changes needed — inherits existing osint_targets policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'osint_targets' AND column_name = 'context_profile'
  ) THEN
    ALTER TABLE osint_targets ADD COLUMN context_profile JSONB DEFAULT '{}';
  END IF;
END $$;
