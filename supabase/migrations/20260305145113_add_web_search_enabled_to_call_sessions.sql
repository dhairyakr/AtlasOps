/*
  # Add web_search_enabled to call_sessions

  ## Summary
  Adds a boolean column to `call_sessions` to record whether web search tools
  were enabled for each call. This lets the twiml edge function skip tool calls
  entirely when Fast Mode is selected by the user.

  ## Changes
  ### Modified Tables
  - `call_sessions`
    - `web_search_enabled` (boolean, DEFAULT true) — when false, the AI responds
      directly without any tool round-trips, producing faster replies

  ## Notes
  - Defaults to true for backward compatibility with existing rows
  - No destructive operations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'web_search_enabled'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN web_search_enabled boolean DEFAULT true;
  END IF;
END $$;
