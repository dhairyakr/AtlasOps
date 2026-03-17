/*
  # Remove Deepgram and ElevenLabs API key columns from call_sessions

  ## Summary
  The voice agent has been redesigned to use Twilio's built-in speech recognition
  (<Gather input="speech">) and text-to-speech (<Say>) instead of Deepgram and ElevenLabs.
  This migration removes the now-unused deepgram_key and elevenlabs_key columns.

  ## Changes
  - Removed `deepgram_key` column from `call_sessions`
  - Removed `elevenlabs_key` column from `call_sessions`

  ## Notes
  - Only groq_key and serper_key are needed for AI conversation and optional web search
  - No data loss risk — these columns stored API keys that are no longer used
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'deepgram_key'
  ) THEN
    ALTER TABLE call_sessions DROP COLUMN deepgram_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'call_sessions' AND column_name = 'elevenlabs_key'
  ) THEN
    ALTER TABLE call_sessions DROP COLUMN elevenlabs_key;
  END IF;
END $$;
