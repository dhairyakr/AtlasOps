/*
  # Fix RLS Auth Initialization Plan Issues

  ## Summary
  Replace `auth.uid()` with `(select auth.uid())` in RLS policies that re-evaluate
  the auth function per row. This improves query performance at scale by evaluating
  auth.uid() once per query instead of once per row.

  ## Tables Modified
  - `voice_calls` - 4 policies (view, insert, update, delete)
  - `voice_call_transcripts` - 2 policies (view, insert)
  - `voice_call_tool_uses` - 2 policies (view, insert)
  - `chiefbrain_profiles` - 4 policies
  - `chiefbrain_memories` - 4 policies
  - `chiefbrain_patterns` - 4 policies
  - `chiefbrain_goals` - 4 policies
  - `chiefbrain_actions` - 4 policies
  - `chiefbrain_inbox_items` - 4 policies
  - `chiefbrain_relationships` - 4 policies
*/

-- voice_calls policies
DROP POLICY IF EXISTS "Users can view own calls" ON public.voice_calls;
DROP POLICY IF EXISTS "Users can insert own calls" ON public.voice_calls;
DROP POLICY IF EXISTS "Users can update own calls" ON public.voice_calls;
DROP POLICY IF EXISTS "Users can delete own calls" ON public.voice_calls;

CREATE POLICY "Users can view own calls"
  ON public.voice_calls FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own calls"
  ON public.voice_calls FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own calls"
  ON public.voice_calls FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own calls"
  ON public.voice_calls FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- voice_call_transcripts policies
DROP POLICY IF EXISTS "Users can view transcripts of own calls" ON public.voice_call_transcripts;
DROP POLICY IF EXISTS "Users can insert transcripts for own calls" ON public.voice_call_transcripts;

CREATE POLICY "Users can view transcripts of own calls"
  ON public.voice_call_transcripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
        AND voice_calls.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert transcripts for own calls"
  ON public.voice_call_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.voice_calls
      WHERE voice_calls.id = voice_call_transcripts.call_id
        AND voice_calls.user_id = (SELECT auth.uid())
    )
  );

-- voice_call_tool_uses policies
DROP POLICY IF EXISTS "Users can view tool uses of own calls" ON public.voice_call_tool_uses;
DROP POLICY IF EXISTS "Users can insert tool uses for own calls" ON public.voice_call_tool_uses;

CREATE POLICY "Users can view tool uses of own calls"
  ON public.voice_call_tool_uses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
        AND voice_calls.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can insert tool uses for own calls"
  ON public.voice_call_tool_uses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.voice_calls
      WHERE voice_calls.id = voice_call_tool_uses.call_id
        AND voice_calls.user_id = (SELECT auth.uid())
    )
  );

-- chiefbrain_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.chiefbrain_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.chiefbrain_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.chiefbrain_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.chiefbrain_profiles;

CREATE POLICY "Users can view own profile"
  ON public.chiefbrain_profiles FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.chiefbrain_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.chiefbrain_profiles FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
  ON public.chiefbrain_profiles FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_memories policies
DROP POLICY IF EXISTS "Users can view own memories" ON public.chiefbrain_memories;
DROP POLICY IF EXISTS "Users can insert own memories" ON public.chiefbrain_memories;
DROP POLICY IF EXISTS "Users can update own memories" ON public.chiefbrain_memories;
DROP POLICY IF EXISTS "Users can delete own memories" ON public.chiefbrain_memories;

CREATE POLICY "Users can view own memories"
  ON public.chiefbrain_memories FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own memories"
  ON public.chiefbrain_memories FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own memories"
  ON public.chiefbrain_memories FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own memories"
  ON public.chiefbrain_memories FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_patterns policies
DROP POLICY IF EXISTS "Users can view own patterns" ON public.chiefbrain_patterns;
DROP POLICY IF EXISTS "Users can insert own patterns" ON public.chiefbrain_patterns;
DROP POLICY IF EXISTS "Users can update own patterns" ON public.chiefbrain_patterns;
DROP POLICY IF EXISTS "Users can delete own patterns" ON public.chiefbrain_patterns;

CREATE POLICY "Users can view own patterns"
  ON public.chiefbrain_patterns FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own patterns"
  ON public.chiefbrain_patterns FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own patterns"
  ON public.chiefbrain_patterns FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own patterns"
  ON public.chiefbrain_patterns FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_goals policies
DROP POLICY IF EXISTS "Users can view own goals" ON public.chiefbrain_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.chiefbrain_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.chiefbrain_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.chiefbrain_goals;

CREATE POLICY "Users can view own goals"
  ON public.chiefbrain_goals FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own goals"
  ON public.chiefbrain_goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own goals"
  ON public.chiefbrain_goals FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own goals"
  ON public.chiefbrain_goals FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_actions policies
DROP POLICY IF EXISTS "Users can view own actions" ON public.chiefbrain_actions;
DROP POLICY IF EXISTS "Users can insert own actions" ON public.chiefbrain_actions;
DROP POLICY IF EXISTS "Users can update own actions" ON public.chiefbrain_actions;
DROP POLICY IF EXISTS "Users can delete own actions" ON public.chiefbrain_actions;

CREATE POLICY "Users can view own actions"
  ON public.chiefbrain_actions FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own actions"
  ON public.chiefbrain_actions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own actions"
  ON public.chiefbrain_actions FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own actions"
  ON public.chiefbrain_actions FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_inbox_items policies
DROP POLICY IF EXISTS "Users can view own inbox items" ON public.chiefbrain_inbox_items;
DROP POLICY IF EXISTS "Users can insert own inbox items" ON public.chiefbrain_inbox_items;
DROP POLICY IF EXISTS "Users can update own inbox items" ON public.chiefbrain_inbox_items;
DROP POLICY IF EXISTS "Users can delete own inbox items" ON public.chiefbrain_inbox_items;

CREATE POLICY "Users can view own inbox items"
  ON public.chiefbrain_inbox_items FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own inbox items"
  ON public.chiefbrain_inbox_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own inbox items"
  ON public.chiefbrain_inbox_items FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own inbox items"
  ON public.chiefbrain_inbox_items FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- chiefbrain_relationships policies
DROP POLICY IF EXISTS "Users can view own relationships" ON public.chiefbrain_relationships;
DROP POLICY IF EXISTS "Users can insert own relationships" ON public.chiefbrain_relationships;
DROP POLICY IF EXISTS "Users can update own relationships" ON public.chiefbrain_relationships;
DROP POLICY IF EXISTS "Users can delete own relationships" ON public.chiefbrain_relationships;

CREATE POLICY "Users can view own relationships"
  ON public.chiefbrain_relationships FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own relationships"
  ON public.chiefbrain_relationships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own relationships"
  ON public.chiefbrain_relationships FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own relationships"
  ON public.chiefbrain_relationships FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
