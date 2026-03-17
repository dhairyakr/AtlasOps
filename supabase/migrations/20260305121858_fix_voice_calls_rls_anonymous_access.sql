/*
  # Fix Voice Calls RLS for Anonymous Access

  ## Problem
  The voice_calls table has RLS policies that require authenticated users (auth.uid() = user_id).
  This app does not use Supabase Auth, so auth.uid() returns null, causing all inserts to fail
  with an RLS violation — resulting in "Failed to create call record in database".

  ## Changes

  ### voice_calls
  - Add INSERT policy for anonymous use (user_id IS NULL)
  - Add SELECT policy for anonymous use (user_id IS NULL)
  - Add UPDATE policy for anonymous use (user_id IS NULL)
  - Add DELETE policy for anonymous use (user_id IS NULL)

  ### voice_call_transcripts
  - Add INSERT policy for anonymous calls (linked call has user_id IS NULL)
  - Add SELECT policy for anonymous calls

  ### voice_call_tool_uses
  - Add INSERT policy for anonymous calls (linked call has user_id IS NULL)
  - Add SELECT policy for anonymous calls

  ## Notes
  - Existing authenticated-user policies are left untouched
  - Anonymous policies only apply to rows where user_id IS NULL
*/

CREATE POLICY "Anonymous users can insert calls without user_id"
  ON voice_calls
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can view calls without user_id"
  ON voice_calls
  FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Anonymous users can update calls without user_id"
  ON voice_calls
  FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can delete calls without user_id"
  ON voice_calls
  FOR DELETE
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Anonymous users can insert transcripts for anonymous calls"
  ON voice_call_transcripts
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
        AND voice_calls.user_id IS NULL
    )
  );

CREATE POLICY "Anonymous users can view transcripts for anonymous calls"
  ON voice_call_transcripts
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
        AND voice_calls.user_id IS NULL
    )
  );

CREATE POLICY "Anonymous users can insert tool uses for anonymous calls"
  ON voice_call_tool_uses
  FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
        AND voice_calls.user_id IS NULL
    )
  );

CREATE POLICY "Anonymous users can view tool uses for anonymous calls"
  ON voice_call_tool_uses
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
        AND voice_calls.user_id IS NULL
    )
  );
