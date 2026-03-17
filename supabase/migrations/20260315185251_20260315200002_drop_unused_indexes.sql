/*
  # Drop Unused Indexes

  ## Summary
  Removes indexes that have never been used according to pg_stat_user_indexes.
  These indexes consume storage and slow down write operations without providing
  any query performance benefit.

  ## Dropped Indexes

  ### term_sheet_analyses
  - `idx_term_sheet_analyses_created_at` — unused, session_id index is sufficient
  - `idx_term_sheet_analyses_comparison_pair` — unused, comparison queries not common

  ### prompt_lab_sessions
  - `idx_prompt_lab_created_at` — unused, session_id index handles all queries

  ### agent_lab_runs
  - `idx_agent_lab_session_id` — unused (replaced by RLS-aware queries)
  - `idx_agent_lab_created_at` — unused

  ### finetuning_lab_runs
  - `idx_finetuning_lab_created_at` — unused

  ### embeddings_lab_searches
  - `idx_embeddings_searches_created_at` — unused
*/

DROP INDEX IF EXISTS public.idx_term_sheet_analyses_created_at;
DROP INDEX IF EXISTS public.idx_term_sheet_analyses_comparison_pair;
DROP INDEX IF EXISTS public.idx_prompt_lab_created_at;
DROP INDEX IF EXISTS public.idx_agent_lab_session_id;
DROP INDEX IF EXISTS public.idx_agent_lab_created_at;
DROP INDEX IF EXISTS public.idx_finetuning_lab_created_at;
DROP INDEX IF EXISTS public.idx_embeddings_searches_created_at;
