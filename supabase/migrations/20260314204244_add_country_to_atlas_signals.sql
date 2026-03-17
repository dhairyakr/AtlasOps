/*
  # Add country column to atlas_signals

  ## Changes
  - Adds a `country` text column to `atlas_signals` with default value `'india'`
  - This enables per-country signal filtering on the frontend
  - Existing rows will default to 'india' to preserve backwards compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'atlas_signals' AND column_name = 'country'
  ) THEN
    ALTER TABLE atlas_signals ADD COLUMN country text NOT NULL DEFAULT 'india';
  END IF;
END $$;
