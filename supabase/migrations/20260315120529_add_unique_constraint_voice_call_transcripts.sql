/*
  # Add unique constraint on voice_call_transcripts

  ## Summary
  Prevents duplicate transcript turns from being inserted for the same call.

  ## Changes
  - Adds a UNIQUE constraint on (call_id, turn_number) in voice_call_transcripts
  - Removes any existing duplicate rows (keeping the first occurrence) before adding the constraint

  ## Notes
  - Safe to run: uses IF NOT EXISTS pattern via DO block
  - Duplicate rows are deduplicated before the constraint is applied
*/

DO $$
BEGIN
  -- Remove duplicate rows keeping only the one with the lowest ctid
  DELETE FROM voice_call_transcripts a
  USING voice_call_transcripts b
  WHERE a.call_id = b.call_id
    AND a.turn_number = b.turn_number
    AND a.ctid > b.ctid;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'voice_call_transcripts'
      AND constraint_name = 'voice_call_transcripts_call_id_turn_number_key'
  ) THEN
    ALTER TABLE voice_call_transcripts ADD CONSTRAINT voice_call_transcripts_call_id_turn_number_key UNIQUE (call_id, turn_number);
  END IF;
END $$;
