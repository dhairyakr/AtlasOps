import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Memory, Pattern, Goal, ChiefAction, InboxItem, Relationship } from './types';

const USER_ID = 'demo';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export function useChiefBrain() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [actions, setActions] = useState<ChiefAction[]>([]);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    toastTimer.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      delete toastTimer.current[id];
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (toastTimer.current[id]) {
      clearTimeout(toastTimer.current[id]);
      delete toastTimer.current[id];
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, patRes, goalRes, actRes, inbRes, relRes] = await Promise.all([
        supabase.from('cb_memories').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false }),
        supabase.from('cb_patterns').select('*').eq('user_id', USER_ID).order('confidence_score', { ascending: false }),
        supabase.from('cb_goals').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false }),
        supabase.from('cb_actions').select('*').eq('user_id', USER_ID).order('created_at', { ascending: false }),
        supabase.from('cb_inbox_items').select('*').eq('user_id', USER_ID).order('received_at', { ascending: false }),
        supabase.from('cb_relationships').select('*').eq('user_id', USER_ID).order('health_score', { ascending: false }),
      ]);

      if (memRes.data) setMemories(memRes.data as Memory[]);
      if (patRes.data) setPatterns(patRes.data as Pattern[]);
      if (goalRes.data) setGoals(goalRes.data as Goal[]);
      if (actRes.data) setActions(actRes.data as ChiefAction[]);
      if (inbRes.data) setInboxItems(inbRes.data as InboxItem[]);
      if (relRes.data) setRelationships(relRes.data as Relationship[]);
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
    return () => {
      Object.values(toastTimer.current).forEach(clearTimeout);
    };
  }, [fetchAll]);

  // MEMORY OPERATIONS
  const addMemory = useCallback(async (mem: Omit<Memory, 'id' | 'user_id'>) => {
    const insertData = { ...mem, user_id: USER_ID };
    const { data, error } = await supabase.from('cb_memories').insert(insertData).select().single();
    if (error) { addToast('Failed to save memory', 'error'); return null; }
    setMemories(prev => [data as Memory, ...prev]);
    addToast('Memory ingested', 'success');
    return data as Memory;
  }, [addToast]);

  const updateMemory = useCallback(async (id: string, updates: Partial<Memory>) => {
    const { data, error } = await supabase.from('cb_memories').update(updates).eq('id', id).select().single();
    if (error) { addToast('Failed to update memory', 'error'); return; }
    setMemories(prev => prev.map(m => m.id === id ? data as Memory : m));
    addToast('Memory updated', 'success');
  }, [addToast]);

  const deleteMemory = useCallback(async (id: string) => {
    const { error } = await supabase.from('cb_memories').delete().eq('id', id);
    if (error) { addToast('Failed to delete memory', 'error'); return; }
    setMemories(prev => prev.filter(m => m.id !== id));
    addToast('Memory deleted', 'info');
  }, [addToast]);

  const togglePinMemory = useCallback(async (id: string, is_pinned: boolean) => {
    const { data, error } = await supabase.from('cb_memories').update({ is_pinned }).eq('id', id).select().single();
    if (error) { addToast('Failed to update pin', 'error'); return; }
    setMemories(prev => prev.map(m => m.id === id ? data as Memory : m));
    addToast(is_pinned ? 'Memory pinned' : 'Memory unpinned', 'info');
  }, [addToast]);

  // PATTERN OPERATIONS
  const addPattern = useCallback(async (pat: Omit<Pattern, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('cb_patterns').insert({ ...pat, user_id: USER_ID }).select().single();
    if (error) { addToast('Failed to save pattern', 'error'); return; }
    setPatterns(prev => [data as Pattern, ...prev]);
    addToast('New pattern discovered', 'success');
  }, [addToast]);

  const updatePattern = useCallback(async (id: string, updates: Partial<Pattern>) => {
    const { data, error } = await supabase.from('cb_patterns').update(updates).eq('id', id).select().single();
    if (error) { addToast('Failed to update pattern', 'error'); return; }
    setPatterns(prev => prev.map(p => p.id === id ? data as Pattern : p));
  }, [addToast]);

  const dismissPattern = useCallback(async (id: string) => {
    const { error } = await supabase.from('cb_patterns').update({ is_active: false }).eq('id', id);
    if (error) { addToast('Failed to dismiss pattern', 'error'); return; }
    setPatterns(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
    addToast('Pattern dismissed', 'info');
  }, [addToast]);

  // GOAL OPERATIONS
  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'user_id'>) => {
    const { data, error } = await supabase.from('cb_goals').insert({ ...goal, user_id: USER_ID }).select().single();
    if (error) { addToast('Failed to save goal', 'error'); return null; }
    setGoals(prev => [data as Goal, ...prev]);
    addToast('Goal created', 'success');
    return data as Goal;
  }, [addToast]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('cb_goals').update(updateData).eq('id', id).select().single();
    if (error) { addToast('Failed to update goal', 'error'); return; }
    setGoals(prev => prev.map(g => g.id === id ? data as Goal : g));
  }, [addToast]);

  const deleteGoal = useCallback(async (id: string) => {
    const { error } = await supabase.from('cb_goals').delete().eq('id', id);
    if (error) { addToast('Failed to delete goal', 'error'); return; }
    setGoals(prev => prev.filter(g => g.id !== id));
    addToast('Goal removed', 'info');
  }, [addToast]);

  // ACTION OPERATIONS
  const addAction = useCallback(async (action: Omit<ChiefAction, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('cb_actions').insert({ ...action, user_id: USER_ID }).select().single();
    if (error) { addToast('Failed to save action', 'error'); return null; }
    setActions(prev => [data as ChiefAction, ...prev]);
    addToast('Action queued', 'success');
    return data as ChiefAction;
  }, [addToast]);

  const approveAction = useCallback(async (id: string) => {
    const updates = { status: 'completed', completed_at: new Date().toISOString() };
    const { data, error } = await supabase.from('cb_actions').update(updates).eq('id', id).select().single();
    if (error) { addToast('Failed to approve action', 'error'); return; }
    setActions(prev => prev.map(a => a.id === id ? data as ChiefAction : a));
    addToast('Action approved & executed', 'success');
  }, [addToast]);

  const rejectAction = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('cb_actions').update({ status: 'rejected' }).eq('id', id).select().single();
    if (error) { addToast('Failed to reject action', 'error'); return; }
    setActions(prev => prev.map(a => a.id === id ? data as ChiefAction : a));
    addToast('Action rejected', 'info');
  }, [addToast]);

  const regretAction = useCallback(async (id: string) => {
    const updates = { regret_logged: true, status: 'regretted' };
    const { data, error } = await supabase.from('cb_actions').update(updates).eq('id', id).select().single();
    if (error) { addToast('Failed to log regret', 'error'); return; }
    setActions(prev => prev.map(a => a.id === id ? data as ChiefAction : a));
    addToast('Regret logged — AI will learn from this', 'info');
  }, [addToast]);

  // INBOX OPERATIONS
  const addInboxItem = useCallback(async (item: Omit<InboxItem, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('cb_inbox_items').insert({ ...item, user_id: USER_ID }).select().single();
    if (error) { addToast('Failed to save inbox item', 'error'); return null; }
    setInboxItems(prev => [data as InboxItem, ...prev]);
    return data as InboxItem;
  }, [addToast]);

  const markHandled = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('cb_inbox_items').update({ is_handled: true }).eq('id', id).select().single();
    if (error) { addToast('Failed to mark handled', 'error'); return; }
    setInboxItems(prev => prev.map(i => i.id === id ? data as InboxItem : i));
    addToast('Marked as handled', 'success');
  }, [addToast]);

  const updateInboxDraft = useCallback(async (id: string, draft: string) => {
    const { data, error } = await supabase.from('cb_inbox_items').update({ ai_draft_reply: draft }).eq('id', id).select().single();
    if (error) { addToast('Failed to update draft', 'error'); return; }
    setInboxItems(prev => prev.map(i => i.id === id ? data as InboxItem : i));
  }, [addToast]);

  const deleteInboxItem = useCallback(async (id: string) => {
    const { error } = await supabase.from('cb_inbox_items').delete().eq('id', id);
    if (error) { addToast('Failed to delete item', 'error'); return; }
    setInboxItems(prev => prev.filter(i => i.id !== id));
    addToast('Item deleted', 'info');
  }, [addToast]);

  // RELATIONSHIP OPERATIONS
  const addRelationship = useCallback(async (rel: Omit<Relationship, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('cb_relationships').insert({ ...rel, user_id: USER_ID }).select().single();
    if (error) { addToast('Failed to save relationship', 'error'); return null; }
    setRelationships(prev => [data as Relationship, ...prev]);
    addToast('Contact added', 'success');
    return data as Relationship;
  }, [addToast]);

  const updateRelationship = useCallback(async (id: string, updates: Partial<Relationship>) => {
    const updateData = { ...updates, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('cb_relationships').update(updateData).eq('id', id).select().single();
    if (error) { addToast('Failed to update contact', 'error'); return; }
    setRelationships(prev => prev.map(r => r.id === id ? data as Relationship : r));
    addToast('Contact updated', 'success');
  }, [addToast]);

  const deleteRelationship = useCallback(async (id: string) => {
    const { error } = await supabase.from('cb_relationships').delete().eq('id', id);
    if (error) { addToast('Failed to delete contact', 'error'); return; }
    setRelationships(prev => prev.filter(r => r.id !== id));
    addToast('Contact removed', 'info');
  }, [addToast]);

  return {
    memories, patterns, goals, actions, inboxItems, relationships,
    loading, toasts, addToast, removeToast, fetchAll,
    addMemory, updateMemory, deleteMemory, togglePinMemory,
    addPattern, updatePattern, dismissPattern,
    addGoal, updateGoal, deleteGoal,
    addAction, approveAction, rejectAction, regretAction,
    addInboxItem, markHandled, updateInboxDraft, deleteInboxItem,
    addRelationship, updateRelationship, deleteRelationship,
  };
}
