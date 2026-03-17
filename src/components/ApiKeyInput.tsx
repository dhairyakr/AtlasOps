import React, { useState, useEffect, useRef } from 'react';
import { Key, Eye, EyeOff, ExternalLink, Zap, Cpu, Loader, CheckCircle, User } from 'lucide-react';
import { LLMService } from '../services/llmService';
import { LLMProvider, useApiSettings } from '../contexts/ApiSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { GrainGradientBackground } from './GrainGradientBackground';

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const { provider, geminiKey, groqKey, setProvider, setGeminiKey, setGroqKey, loadFromSupabase, setCurrentUserId } = useApiSettings();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  const [localGeminiKey, setLocalGeminiKey] = useState(geminiKey);
  const [localGroqKey, setLocalGroqKey] = useState(groqKey);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(provider);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const didAutoLoginRef = useRef(false);

  useEffect(() => {
    if (user) {
      if (didAutoLoginRef.current) return;
      didAutoLoginRef.current = true;
      setCurrentUserId(user.id);
      setIsLoadingKeys(true);
      loadFromSupabase(user.id).then(({ found }) => {
        setIsLoadingKeys(false);
        if (found) {
          onApiKeySet();
        }
      });
    } else {
      didAutoLoginRef.current = false;
      setCurrentUserId(null);
    }
  }, [user]);

  useEffect(() => {
    setLocalGeminiKey(geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    setLocalGroqKey(groqKey);
  }, [groqKey]);

  const handleProviderSelect = (p: LLMProvider) => {
    setSelectedProvider(p);
    setError('');
  };

  const handleGoogleSignIn = async () => {
    setGoogleSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      setGoogleSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const geminiTrimmed = localGeminiKey.trim();
    const groqTrimmed = localGroqKey.trim();

    if (selectedProvider === 'gemini') {
      if (!geminiTrimmed) {
        setError('Please enter your Gemini API key');
        setIsSubmitting(false);
        return;
      }
      if (!LLMService.validateGeminiKey(geminiTrimmed)) {
        setError('Invalid Gemini API key format. Keys should start with "AIza"');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!groqTrimmed) {
        setError('Please enter your Groq API key');
        setIsSubmitting(false);
        return;
      }
      if (!LLMService.validateGroqKey(groqTrimmed)) {
        setError('Invalid Groq API key format. Keys should start with "gsk_"');
        setIsSubmitting(false);
        return;
      }
    }

    if (geminiTrimmed && LLMService.validateGeminiKey(geminiTrimmed)) setGeminiKey(geminiTrimmed);
    if (groqTrimmed && LLMService.validateGroqKey(groqTrimmed)) setGroqKey(groqTrimmed);
    setProvider(selectedProvider);

    setIsSubmitting(false);
    onApiKeySet();
  };

  const currentKey = selectedProvider === 'gemini' ? localGeminiKey : localGroqKey;
  const setCurrentKey = selectedProvider === 'gemini' ? setLocalGeminiKey : setLocalGroqKey;

  if (authLoading || isLoadingKeys) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <GrainGradientBackground />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader className="w-8 h-8 text-white/60 animate-spin" />
          <p className="text-white/40 text-sm">
            {isLoadingKeys ? 'Loading your saved settings...' : 'Checking session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      <GrainGradientBackground className="animate-gradient-flow" />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,black_100%)] opacity-50"></div>
        <div className="particles absolute inset-0">
          <span className="bg-cyan-300/30"></span>
          <span className="bg-pink-300/30"></span>
          <span className="bg-blue-300/30"></span>
          <span className="bg-cyan-300/30"></span>
          <span className="bg-pink-300/30"></span>
          <span className="bg-blue-300/30"></span>
        </div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-black/40">
          <div className="relative bg-transparent rounded-[32px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/8 to-pink-500/10 pointer-events-none animate-pulse-slow"></div>

            <div className="relative pt-10 pb-4 px-6 flex flex-col items-center justify-center">
              <div className="w-16 h-16 flex items-center justify-center relative animate-pulse-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/50 to-blue-500/50 rounded-full blur-2xl opacity-80 animate-glow"></div>
                <Key className="w-9 h-9 text-white relative z-10" />
              </div>
            </div>

            <div className="relative z-10 p-6 sm:p-8">
              <h1 className="text-3xl font-extrabold text-white mb-1 text-center drop-shadow-md">
                Welcome to AI Studio
              </h1>
              <p className="text-white/60 text-center text-sm mb-6 drop-shadow-sm">
                Choose your AI provider to get started
              </p>

              {/* Google Sign-In */}
              <div className="mb-6">
                {user ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/15 bg-white/6">
                    <div className="flex items-center gap-3">
                      {user.user_metadata?.avatar_url ? (
                        <img
                          src={user.user_metadata.avatar_url}
                          alt="avatar"
                          className="w-7 h-7 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                          <User className="w-4 h-4 text-white/70" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white leading-none">
                          {user.user_metadata?.full_name || user.email}
                        </p>
                        <p className="text-xs text-white/45 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <button
                        onClick={signOut}
                        className="text-xs text-white/40 hover:text-white/70 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleSigningIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-2xl border border-white/15 bg-white/6 hover:bg-white/10 hover:border-white/25 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {googleSigningIn ? (
                      <Loader className="w-4 h-4 text-white/70 animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="text-sm font-semibold text-white/80">
                      {googleSigningIn ? 'Redirecting...' : 'Continue with Google'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-xs text-white/30 font-medium">or enter API key</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {/* Provider Selection */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">
                  AI Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleProviderSelect('gemini')}
                    className={`relative rounded-2xl p-4 border transition-all duration-300 text-left group ${
                      selectedProvider === 'gemini'
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/4 border-white/10 hover:border-white/25 hover:bg-white/6'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all ${
                      selectedProvider === 'gemini' ? 'bg-white/15' : 'bg-white/10'
                    }`}>
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-bold text-white">Gemini</p>
                    <p className="text-xs text-white/45 mt-0.5">Google AI</p>
                    {selectedProvider === 'gemini' && localGeminiKey && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400"></div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderSelect('groq')}
                    className={`relative rounded-2xl p-4 border transition-all duration-300 text-left group ${
                      selectedProvider === 'groq'
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/4 border-white/10 hover:border-white/25 hover:bg-white/6'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-all ${
                      selectedProvider === 'groq' ? 'bg-white/15' : 'bg-white/10'
                    }`}>
                      <Cpu className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-bold text-white">Groq</p>
                    <p className="text-xs text-white/45 mt-0.5">Llama 3.3 70B</p>
                    {selectedProvider === 'groq' && localGroqKey && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400"></div>
                    )}
                  </button>
                </div>
              </div>

              {/* API Key Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/80 mb-3 drop-shadow-sm">
                  {selectedProvider === 'gemini' ? 'Gemini API Key' : 'Groq API Key'}
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={currentKey}
                    onChange={(e) => setCurrentKey(e.target.value)}
                    placeholder={selectedProvider === 'gemini' ? 'AIza...' : 'gsk_...'}
                    className="w-full px-5 py-4 bg-transparent border border-white/15 text-white rounded-2xl focus:outline-none transition-all placeholder-white/35 hover:border-white/30 focus:border-cyan-400/50 focus:shadow-[0_0_15px_rgba(6,182,212,0.25)] disabled:opacity-50 font-mono text-sm"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/90 transition hover:scale-110"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-400/20 rounded-xl text-red-100 text-sm font-medium">
                    {error}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="w-full text-white py-4 px-6 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/15 bg-white/10 hover:bg-white/15 hover:border-white/30 hover:scale-[1.02]"
              >
                {isSubmitting ? 'Connecting...' : `Continue with ${selectedProvider === 'gemini' ? 'Gemini' : 'Groq'}`}
              </button>

              {user ? (
                <div className="mt-5 p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                  <p className="text-xs text-emerald-200/70 font-medium">
                    <strong className="text-emerald-300/90">Signed in:</strong> Your API keys will be saved to your account and loaded automatically next time.
                  </p>
                </div>
              ) : (
                <div className="mt-5 p-4 rounded-xl border border-white/8 bg-transparent">
                  <p className="text-xs text-white/55 font-medium">
                    <strong className="text-white/80">Privacy First:</strong> Your API keys are stored only in your browser's local storage and never sent to any server.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-4 text-center">
                {selectedProvider === 'gemini' ? (
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-white/55 hover:text-white/85 transition-all font-semibold gap-1"
                  >
                    Get Gemini API key <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-white/55 hover:text-white/85 transition-all font-semibold gap-1"
                  >
                    Get Groq API key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-flow {
          animation: gradient-flow 15s ease infinite;
          background-size: 200% 200%;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        @keyframes glow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-glow { animation: glow 3s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .particles span {
          position: absolute;
          pointer-events: none;
          animation: particles-animate 35s linear infinite;
          border-radius: 50%;
          opacity: 0.12;
          filter: blur(1px);
        }
        .particles span:nth-child(1) { width: 1.5px; height: 1.5px; top: 15%; left: 25%; animation-duration: 38s; }
        .particles span:nth-child(2) { width: 1px; height: 1px; top: 35%; left: 45%; animation-duration: 45s; }
        .particles span:nth-child(3) { width: 2px; height: 2px; top: 55%; left: 65%; animation-duration: 40s; }
        .particles span:nth-child(4) { width: 0.5px; height: 0.5px; top: 75%; left: 85%; animation-duration: 52s; }
        .particles span:nth-child(5) { width: 1.5px; height: 1.5px; top: 90%; left: 15%; animation-duration: 42s; }
        .particles span:nth-child(6) { width: 1px; height: 1px; top: 25%; left: 35%; animation-duration: 48s; }
        @keyframes particles-animate {
          0% { transform: translate(0, 0); opacity: 0.12; }
          100% { transform: translate(40vw, 40vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
