import { supabase } from '../services/supabaseClient';

const SESSION_KEY_PREFIX = 'lab_session_id_';

export function getLabSessionId(labKey: string, userId?: string | null): string {
  if (userId) return userId;
  const storageKey = `${SESSION_KEY_PREFIX}${labKey}`;
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem(storageKey, newId);
  return newId;
}

export async function mergeAnonymousSessionToUser(
  labKey: string,
  tableName: string,
  sessionColumn: string,
  userId: string
): Promise<void> {
  const storageKey = `${SESSION_KEY_PREFIX}${labKey}`;
  const anonymousId = localStorage.getItem(storageKey);
  if (!anonymousId || anonymousId === userId) return;

  try {
    await supabase
      .from(tableName)
      .update({ [sessionColumn]: userId })
      .eq(sessionColumn, anonymousId);
    localStorage.removeItem(storageKey);
  } catch {
  }
}
