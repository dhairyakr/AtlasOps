import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: { signOut: async () => ({}) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => async () => ({ data: null, error: null }) }),
        update: () => ({ eq: () => ({ select: () => async () => ({ data: null, error: null }) }) }),
        delete: () => ({ eq: () => async () => ({ data: null, error: null }) }),
      }),
    } as any;
