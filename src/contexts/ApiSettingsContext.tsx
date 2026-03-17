import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

export type LLMProvider = 'gemini' | 'groq';

interface ApiSettings {
  provider: LLMProvider;
  geminiKey: string;
  groqKey: string;
  serperKey: string;
}

interface ApiSettingsContextValue extends ApiSettings {
  activeKey: string;
  isConfigured: boolean;
  isSaved: boolean;
  setProvider: (provider: LLMProvider) => void;
  setGeminiKey: (key: string) => void;
  setGroqKey: (key: string) => void;
  setSerperKey: (key: string) => void;
  updateSettings: (partial: Partial<ApiSettings>) => void;
  resetConfig: () => void;
  loadFromSupabase: (userId: string) => Promise<{ found: boolean }>;
  setCurrentUserId: (id: string | null) => void;
}

const STORAGE_KEY = 'app_api_settings';

function loadSettings(): ApiSettings {
  const envGeminiKey = import.meta.env.VITE_GEMINI_KEY || '';
  const envGroqKey = import.meta.env.VITE_GROQ_KEY || '';
  const envSerperKey = import.meta.env.VITE_SERPER_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        provider: parsed.provider || 'gemini',
        geminiKey: parsed.geminiKey || envGeminiKey,
        groqKey: parsed.groqKey || envGroqKey,
        serperKey: parsed.serperKey || envSerperKey,
      };
    }
  } catch {
  }
  return {
    provider: 'gemini',
    geminiKey: envGeminiKey,
    groqKey: envGroqKey,
    serperKey: envSerperKey,
  };
}

function saveLocalSettings(settings: ApiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const ApiSettingsContext = createContext<ApiSettingsContextValue | null>(null);

export const ApiSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ApiSettings>(loadSettings);
  const [isSaved, setIsSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    saveLocalSettings(settings);
  }, [settings]);

  const syncToSupabase = useCallback(async (userId: string, newSettings: ApiSettings) => {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        gemini_key: newSettings.geminiKey,
        groq_key: newSettings.groqKey,
        serper_key: newSettings.serperKey,
        preferred_provider: newSettings.provider,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (!error) {
      setIsSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setIsSaved(false), 3000);
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<ApiSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial };
      if (currentUserIdRef.current) {
        syncToSupabase(currentUserIdRef.current, next);
      }
      return next;
    });
  }, [syncToSupabase]);

  const setCurrentUserId = useCallback((id: string | null) => {
    currentUserIdRef.current = id;
  }, []);

  const loadFromSupabase = useCallback(async (userId: string): Promise<{ found: boolean }> => {
    currentUserIdRef.current = userId;
    const { data, error } = await supabase
      .from('user_settings')
      .select('gemini_key, groq_key, serper_key, preferred_provider')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return { found: false };

    const loaded: Partial<ApiSettings> = {};
    if (data.gemini_key) loaded.geminiKey = data.gemini_key;
    if (data.groq_key) loaded.groqKey = data.groq_key;
    if (data.serper_key) loaded.serperKey = data.serper_key;
    if (data.preferred_provider) loaded.provider = data.preferred_provider as LLMProvider;

    const hasKeys = !!(data.gemini_key || data.groq_key);
    if (hasKeys) {
      setSettings(prev => {
        const next = { ...prev, ...loaded };
        saveLocalSettings(next);
        return next;
      });
    }

    return { found: hasKeys };
  }, []);

  const setProvider = useCallback((provider: LLMProvider) => updateSettings({ provider }), [updateSettings]);
  const setGeminiKey = useCallback((geminiKey: string) => updateSettings({ geminiKey }), [updateSettings]);
  const setGroqKey = useCallback((groqKey: string) => updateSettings({ groqKey }), [updateSettings]);
  const setSerperKey = useCallback((serperKey: string) => updateSettings({ serperKey }), [updateSettings]);

  const resetConfig = useCallback(() => {
    currentUserIdRef.current = null;
    updateSettings({ geminiKey: '', groqKey: '' });
  }, [updateSettings]);

  const activeKey = settings.provider === 'gemini' ? settings.geminiKey : settings.groqKey;
  const isConfigured = activeKey.trim().length > 0;

  return (
    <ApiSettingsContext.Provider value={{
      ...settings,
      activeKey,
      isConfigured,
      isSaved,
      setProvider,
      setGeminiKey,
      setGroqKey,
      setSerperKey,
      updateSettings,
      resetConfig,
      loadFromSupabase,
      setCurrentUserId,
    }}>
      {children}
    </ApiSettingsContext.Provider>
  );
};

export function useApiSettings() {
  const ctx = useContext(ApiSettingsContext);
  if (!ctx) throw new Error('useApiSettings must be used inside ApiSettingsProvider');
  return ctx;
}
