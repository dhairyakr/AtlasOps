/*
  # Drop Unused Indexes

  ## Summary
  Remove indexes that have not been used. Unused indexes consume storage space
  and add overhead to write operations (INSERT, UPDATE, DELETE) without providing
  any query performance benefit.

  ## Indexes Dropped
  - rag_chunks: idx_rag_chunks_document, idx_rag_chunks_session, idx_rag_chunks_keywords
  - rag_documents: idx_rag_documents_session, idx_rag_documents_session_type
  - rag_queries: idx_rag_queries_session
  - rag_sessions: idx_rag_sessions_session_id
  - agent_tasks: idx_agent_tasks_session
  - voice_calls: idx_voice_calls_status, idx_voice_calls_created_at
  - voice_call_transcripts: idx_voice_call_transcripts_call_id
  - call_sessions: idx_call_sessions_status, idx_call_sessions_created_at
  - atlas_queries: atlas_queries_session_idx
  - atlas_signals: atlas_signals_region_idx
  - axon_captures: axon_captures_session_idx
  - axon_connections: axon_connections_source_idx
  - axon_queries: axon_queries_session_idx
  - chiefbrain_memories: idx_chiefbrain_memories_user_id, idx_chiefbrain_memories_type, idx_chiefbrain_memories_created
  - chiefbrain_patterns: idx_chiefbrain_patterns_user_id
  - chiefbrain_goals: idx_chiefbrain_goals_user_id
  - chiefbrain_actions: idx_chiefbrain_actions_user_id, idx_chiefbrain_actions_status
  - chiefbrain_inbox_items: idx_chiefbrain_inbox_user_id, idx_chiefbrain_inbox_priority
  - chiefbrain_relationships: idx_chiefbrain_relationships_user_id
  - cb_memories: cb_memories_user_id_idx, cb_memories_created_at_idx
  - cb_patterns: cb_patterns_user_id_idx
  - cb_goals: cb_goals_user_id_idx
  - cb_actions: cb_actions_user_id_idx
  - cb_inbox_items: cb_inbox_items_user_id_idx
  - cb_relationships: cb_relationships_user_id_idx
*/

DROP INDEX IF EXISTS public.idx_rag_chunks_document;
DROP INDEX IF EXISTS public.idx_rag_documents_session;
DROP INDEX IF EXISTS public.idx_rag_chunks_session;
DROP INDEX IF EXISTS public.idx_rag_queries_session;
DROP INDEX IF EXISTS public.idx_rag_chunks_keywords;
DROP INDEX IF EXISTS public.idx_rag_documents_session_type;
DROP INDEX IF EXISTS public.idx_rag_sessions_session_id;
DROP INDEX IF EXISTS public.idx_agent_tasks_session;
DROP INDEX IF EXISTS public.idx_voice_calls_status;
DROP INDEX IF EXISTS public.idx_voice_calls_created_at;
DROP INDEX IF EXISTS public.idx_voice_call_transcripts_call_id;
DROP INDEX IF EXISTS public.idx_call_sessions_status;
DROP INDEX IF EXISTS public.idx_call_sessions_created_at;
DROP INDEX IF EXISTS public.atlas_queries_session_idx;
DROP INDEX IF EXISTS public.atlas_signals_region_idx;
DROP INDEX IF EXISTS public.axon_captures_session_idx;
DROP INDEX IF EXISTS public.axon_connections_source_idx;
DROP INDEX IF EXISTS public.axon_queries_session_idx;
DROP INDEX IF EXISTS public.idx_chiefbrain_memories_user_id;
DROP INDEX IF EXISTS public.idx_chiefbrain_memories_type;
DROP INDEX IF EXISTS public.idx_chiefbrain_memories_created;
DROP INDEX IF EXISTS public.idx_chiefbrain_patterns_user_id;
DROP INDEX IF EXISTS public.idx_chiefbrain_goals_user_id;
DROP INDEX IF EXISTS public.idx_chiefbrain_actions_user_id;
DROP INDEX IF EXISTS public.idx_chiefbrain_actions_status;
DROP INDEX IF EXISTS public.idx_chiefbrain_inbox_user_id;
DROP INDEX IF EXISTS public.idx_chiefbrain_inbox_priority;
DROP INDEX IF EXISTS public.idx_chiefbrain_relationships_user_id;
DROP INDEX IF EXISTS public.cb_memories_user_id_idx;
DROP INDEX IF EXISTS public.cb_memories_created_at_idx;
DROP INDEX IF EXISTS public.cb_patterns_user_id_idx;
DROP INDEX IF EXISTS public.cb_goals_user_id_idx;
DROP INDEX IF EXISTS public.cb_actions_user_id_idx;
DROP INDEX IF EXISTS public.cb_inbox_items_user_id_idx;
DROP INDEX IF EXISTS public.cb_relationships_user_id_idx;
