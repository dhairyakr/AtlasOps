/*
  # Add voice agent state columns to call_sessions

  1. Changes
    - `pending_speech` (text) - temporarily stores the caller's speech between the /turn and /process steps
    - `no_speech_count` (int) - tracks consecutive turns with no speech so the agent can give up gracefully

  2. Notes
    - Both columns are nullable; pending_speech is cleared after /process consumes it
    - no_speech_count resets to 0 on every successful speech turn
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'pending_speech'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN pending_speech text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'no_speech_count'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN no_speech_count integer DEFAULT 0;
  END IF;
END $$;
