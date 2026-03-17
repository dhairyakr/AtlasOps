/*
  # Create user_settings table

  ## Purpose
  Store per-user API keys and provider preferences so returning users
  don't need to re-enter their credentials. Keys are encrypted at rest
  by Supabase and protected by Row Level Security.

  ## New Tables
  - `user_settings`
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key → auth.users.id, unique)
    - `gemini_key` (text) — Gemini API key
    - `groq_key` (text) — Groq API key
    - `serper_key` (text) — Serper search API key
    - `preferred_provider` (text) — 'gemini' or 'groq'
    - `updated_at` (timestamptz) — auto-updated timestamp

  ## Security
  - RLS enabled on `user_settings`
  - SELECT policy: authenticated user can only read their own row
  - INSERT policy: authenticated user can only insert their own row
  - UPDATE policy: authenticated user can only update their own row
  - DELETE policy: authenticated user can only delete their own row

  ## Notes
  - `user_id` has a UNIQUE constraint so each user has exactly one settings row
  - `ON DELETE CASCADE` from auth.users ensures cleanup when a user is deleted
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_key text DEFAULT '',
  groq_key text DEFAULT '',
  serper_key text DEFAULT '',
  preferred_provider text DEFAULT 'gemini',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
