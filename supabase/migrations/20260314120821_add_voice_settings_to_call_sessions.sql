/*
  # Add voice settings columns to call_sessions

  ## Summary
  Adds three missing columns to the call_sessions table that are required by the
  twiml and initiate-call edge functions. Without these columns, queries fail at
  runtime and the call is immediately terminated with an error message.

  ## New Columns
  - `voice_id` (TEXT, DEFAULT 'Joanna-Neural') — Amazon Polly voice ID for TTS
  - `speech_rate` (INTEGER, DEFAULT 100) — Speech rate as percentage (100 = normal)
  - `pitch` (INTEGER, DEFAULT 100) — Pitch as percentage (100 = normal)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'voice_id'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN voice_id TEXT DEFAULT 'Joanna-Neural';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'speech_rate'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN speech_rate INTEGER DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'pitch'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN pitch INTEGER DEFAULT 100;
  END IF;
END $$;
