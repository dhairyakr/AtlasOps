import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Zap, Play, Loader2, Plus, X, Hash, Clock, PanelLeftClose, PanelLeftOpen, History, Download, Copy, Check, ChevronDown, BookOpen, Star, GripVertical, Cpu } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLabSessionId, mergeAnonymousSessionToUser } from '../../utils/sessionUtils';
import { PromptPipelineDiagram } from './PromptPipelineDiagram';
import { PromptConceptPanel } from './PromptConceptPanel';
import { supabase } from '../../services/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PromptLabProps {
  onBack: () => void;
}

type SidebarTab = 'pipeline' | 'concepts' | 'history';

interface FewShotExample {
  id: string;
  input: string;
  output: string;
}

interface RunRecord {
  id: string;
  session_id: string;
  template_name: string;
  system_prompt: string;
  user_message: string;
  few_shot_examples: FewShotExample[];
  response_text: string;
  token_estimate: number;
  latency_ms: number;
  quality_score: number;
  created_at: string;
}

const TEMPLATES = [
  {
    category: 'Analysis',
    items: [
      { name: 'Summarization', system: 'You are an expert summarizer. Distill the key points from any text into a concise, structured summary with bullet points. Maintain all critical information while cutting unnecessary detail.', user: 'Summarize the following text:\n\n[paste your text here]', shots: [] },
      { name: 'Classification', system: 'You are a classification expert. Analyze the input and classify it into the most appropriate category. Explain your reasoning clearly with a confidence score (0-100%).', user: 'Classify the following:\n\n[your input here]\n\nProvide: category, confidence, and reasoning.', shots: [{ id: '1', input: 'I am so frustrated with this product!', output: 'Category: Negative Sentiment (Customer Complaint)\nConfidence: 92%\nReasoning: Strong emotional language ("frustrated") combined with a product reference indicates negative customer sentiment.' }] },
      { name: 'Information Extraction', system: 'You are a precise information extraction system. Extract structured data from unstructured text. Always return valid JSON with the requested fields. Use null for missing values.', user: 'Extract the following fields from this text: name, date, location, amount.\n\nText: [your text here]', shots: [] },
      { name: 'Comparison', system: 'You are an objective analyst. Compare two or more items across defined criteria. Present your comparison as a structured table followed by a balanced summary. Avoid bias.', user: 'Compare the following:\n\nItem 1: [first item]\nItem 2: [second item]\n\nCriteria: [list your criteria]', shots: [] },
    ]
  },
  {
    category: 'Generation',
    items: [
      { name: 'Code Generation', system: 'You are a senior software engineer. Write clean, production-quality code with proper error handling and comments. Follow best practices for the language specified. If the language is not specified, use Python.', user: 'Write a function that:\n\n[describe what the code should do]', shots: [{ id: '1', input: 'Function to validate an email address', output: 'def is_valid_email(email: str) -> bool:\n    """Validate email format using regex."""\n    import re\n    pattern = r\'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$\'\n    return bool(re.match(pattern, email))' }] },
      { name: 'Brainstorming', system: 'You are a creative ideation facilitator. Generate diverse, novel ideas that span obvious to highly creative. Push boundaries while staying practical. Present ideas as a numbered list with brief explanations.', user: 'Generate 10 creative ideas for:\n\n[your topic or problem]', shots: [] },
      { name: 'Rewriting', system: 'You are an expert editor and writer. Rewrite the provided text to match the specified tone, style, and audience while preserving the core meaning. Explain the key changes you made.', user: 'Rewrite the following in a [formal/casual/technical] tone for a [audience] audience:\n\n[your text here]', shots: [] },
      { name: 'Decision Framework', system: 'You are a strategic decision analyst. Help evaluate options by identifying pros, cons, risks, and opportunities. Use structured frameworks (e.g., weighted criteria, SWOT). End with a clear recommendation.', user: 'Help me decide between:\n\nOption A: [describe first option]\nOption B: [describe second option]\n\nContext: [your situation]', shots: [] },
    ]
  },
  {
    category: 'Reasoning',
    items: [
      { name: 'Chain-of-Thought Math', system: 'You are a math tutor. Solve problems step-by-step, showing all work clearly. Label each step, explain your reasoning, and verify your answer. Use simple language.', user: 'Solve this step by step:\n\n[your math problem]', shots: [{ id: '1', input: 'A train travels 120km at 60km/h. How long does it take?', output: 'Step 1: Identify the formula\nTime = Distance / Speed\n\nStep 2: Plug in values\nTime = 120km / 60km/h\n\nStep 3: Calculate\nTime = 2 hours\n\nVerification: 60km/h × 2h = 120km ✓' }] },
      { name: 'Socratic Dialog', system: 'You are a Socratic teacher. Instead of giving direct answers, guide the user to discover insights through carefully chosen questions. Ask one focused question at a time. Acknowledge good reasoning before probing deeper.', user: 'Help me think through:\n\n[your topic or question]', shots: [] },
      { name: 'Step-by-Step Instructions', system: 'You are a technical writer specializing in clear procedural documentation. Break complex processes into numbered steps. Each step should be atomic, actionable, and include warnings where relevant. Assume no prior knowledge.', user: 'Write step-by-step instructions for:\n\n[your process]', shots: [] },
      { name: 'Debate Both Sides', system: 'You are a debate coach and critical thinking expert. Present compelling arguments for both sides of an issue with equal rigor. Use evidence-based reasoning. After presenting both sides, provide a balanced synthesis.', user: 'Present both sides of this argument:\n\n[your topic or claim]', shots: [] },
    ]
  },
  {
    category: 'Specialized',
    items: [
      { name: 'Role: Expert Scientist', system: 'You are Dr. Alex Chen, a leading interdisciplinary scientist with expertise across physics, biology, and computer science. You communicate complex topics with precision while making them accessible. You love thought experiments and draw analogies from nature.', user: '[Ask a scientific question or describe a phenomenon you want explained]', shots: [] },
      { name: 'Structured Output', system: 'You are a data formatting assistant. Always respond with valid, parseable JSON matching the schema provided. Never include text outside the JSON block. Ensure all required fields are present.', user: 'Return JSON with these fields: title, summary, key_points (array), sentiment, confidence_score.\n\nSource text:\n[your text here]', shots: [] },
      { name: 'Evaluation & Critique', system: 'You are a rigorous evaluator. Assess the provided work against best practices and quality criteria. Be specific and constructive. Use a scoring rubric (1-10 per dimension) and provide prioritized improvement suggestions.', user: 'Evaluate the following:\n\n[your work here]\n\nDimensions to assess: [list your criteria]', shots: [] },
      { name: 'Translation & Localization', system: 'You are a professional translator and localization expert. Translate content accurately while adapting cultural references, idioms, and tone for the target audience. Note any translation challenges or ambiguities.', user: 'Translate and localize the following to [target language/region]:\n\n[your text here]', shots: [] },
    ]
  },
];


function computeQuality(text: string): number {
  let score = 50;
  if (text.length > 200) score += 10;
  if (text.length > 500) score += 10;
  if (/\n/.test(text)) score += 5;
  if (/\d/.test(text)) score += 5;
  if (/```/.test(text)) score += 10;
  if (/\*\*/.test(text)) score += 5;
  if (text.split(/[.!?]/).length > 3) score += 5;
  return Math.min(score, 100);
}

export const PromptLab: React.FC<PromptLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const { user } = useAuth();
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [fewShots, setFewShots] = useState<FewShotExample[]>([]);
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState('');
  const [latency, setLatency] = useState(0);
  const [tokenEst, setTokenEst] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sessionId] = useState(() => getLabSessionId('prompt_lab', user?.id));

  useEffect(() => {
    if (user?.id) mergeAnonymousSessionToUser('prompt_lab', 'prompt_lab_sessions', 'session_id', user.id);
  }, [user?.id]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase.from('prompt_lab_sessions').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(20);
    if (data) setHistory(data as RunRecord[]);
    setHistoryLoading(false);
  }, [sessionId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const applyTemplate = (tmpl: typeof TEMPLATES[0]['items'][0]) => {
    setSystemPrompt(tmpl.system);
    setUserMessage(tmpl.user);
    setFewShots(tmpl.shots);
    setSelectedTemplate(tmpl.name);
    setTemplateOpen(false);
    setResponse('');
  };

  const addFewShot = () => {
    if (!newInput.trim() || !newOutput.trim()) return;
    setFewShots(prev => [...prev, { id: crypto.randomUUID(), input: newInput.trim(), output: newOutput.trim() }]);
    setNewInput('');
    setNewOutput('');
  };

  const removeFewShot = (id: string) => setFewShots(prev => prev.filter(e => e.id !== id));

  const run = useCallback(async () => {
    if (!userMessage.trim()) return;
    setRunning(true);
    setError(null);
    setResponse('');
    setPipelineStep(0);

    try {
      const llm = new LLMService(provider, geminiKey, groqKey);
      setPipelineStep(1);

      let fullPrompt = '';
      if (systemPrompt.trim()) fullPrompt += `System Instructions:\n${systemPrompt.trim()}\n\n`;
      if (fewShots.length > 0) {
        fullPrompt += 'Examples:\n';
        fewShots.forEach((ex, i) => {
          fullPrompt += `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n\n`;
        });
      }
      fullPrompt += `User: ${userMessage}`;

      setPipelineStep(2);
      const start = Date.now();
      const result = await llm.generateResponse(fullPrompt);
      const elapsed = Date.now() - start;

      const tokens = Math.round((fullPrompt.length + result.length) / 4);
      const quality = computeQuality(result);

      setResponse(result);
      setLatency(elapsed);
      setTokenEst(tokens);
      setQualityScore(quality);
      setPipelineStep(3);

      await supabase.from('prompt_lab_sessions').insert({
        session_id: sessionId,
        template_name: selectedTemplate,
        system_prompt: systemPrompt,
        user_message: userMessage,
        few_shot_examples: fewShots,
        response_text: result,
        token_estimate: tokens,
        latency_ms: elapsed,
        quality_score: quality,
      });
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
      setPipelineStep(-1);
    } finally {
      setRunning(false);
    }
  }, [provider, geminiKey, groqKey, systemPrompt, userMessage, fewShots, selectedTemplate, sessionId, loadHistory]);

  const exportConfig = () => {
    const config = { systemPrompt, userMessage, fewShotExamples: fewShots, templateName: selectedTemplate };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistoryRun = (run: RunRecord) => {
    setSystemPrompt(run.system_prompt);
    setUserMessage(run.user_message);
    setFewShots(run.few_shot_examples || []);
    setResponse(run.response_text);
    setLatency(run.latency_ms);
    setTokenEst(run.token_estimate);
    setQualityScore(run.quality_score);
    setSelectedTemplate(run.template_name);
    setSidebarTab('pipeline');
  };

  const systemTokens = Math.round(systemPrompt.length / 4);
  const userTokens = Math.round(userMessage.length / 4);
  const shotTokens = fewShots.reduce((s, e) => s + Math.round((e.input.length + e.output.length) / 4), 0);
  const totalInputTokens = systemTokens + userTokens + shotTokens;

  return (
    <div className="h-full flex flex-col chat-galaxy-bg text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[10, 20, 35, 50, 65, 80, 90].map((left, i) => (
          <div key={i} className="thought-particle" style={{ left: `${left}%`, animationDelay: `${i * 3}s` }} />
        ))}
      </div>

      <header className="relative z-10 chat-navbar-glass flex items-center gap-4 px-6 py-4">
        <button onClick={onBack} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-cosmic-glow animate-glow avatar-orb">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-none">Prompt Engineering</h1>
            <p className="text-xs text-white/50 mt-0.5">Few-shot, chain-of-thought & template library</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${provider === 'gemini' ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
          {provider === 'gemini' ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
          {provider === 'gemini' ? 'Gemini' : 'Groq'}
        </div>
        <button onClick={exportConfig} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-xs transition-all">
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all backdrop-blur-sm">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Left: prompt builder */}
          <div className="border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0 space-y-5">

              {/* Template selector */}
              <div className="relative">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Template Library</label>
                <button onClick={() => setTemplateOpen(o => !o)}
                  className="w-full flex items-center justify-between rounded-xl bg-white/4 border border-white/10 hover:border-violet-500/30 px-3 py-2.5 text-xs transition-all">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-violet-400" />
                    <span className={selectedTemplate ? 'text-white/80' : 'text-white/30'}>{selectedTemplate || 'Choose a template...'}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${templateOpen ? 'rotate-180' : ''}`} />
                </button>

                {templateOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
                    <div className="max-h-72 overflow-y-auto">
                      {TEMPLATES.map(cat => (
                        <div key={cat.category}>
                          <div className="px-3 py-1.5 bg-white/5 border-b border-white/8">
                            <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{cat.category}</span>
                          </div>
                          {cat.items.map(tmpl => (
                            <button key={tmpl.name} onClick={() => applyTemplate(tmpl)}
                              className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-all border-b border-white/5 flex items-center justify-between group ${selectedTemplate === tmpl.name ? 'bg-violet-500/10' : ''}`}>
                              <span className="text-xs text-white/70 group-hover:text-white">{tmpl.name}</span>
                              {tmpl.shots.length > 0 && <span className="text-xs text-violet-400 opacity-60">{tmpl.shots.length} shot{tmpl.shots.length > 1 ? 's' : ''}</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* System prompt with token meter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">System Prompt</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${systemTokens > 500 ? 'text-rose-400' : systemTokens > 200 ? 'text-amber-400' : 'text-white/30'}`}>~{systemTokens} tokens</span>
                  </div>
                </div>
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4}
                  placeholder="Define the AI's role, tone, and instructions..."
                  className="w-full rounded-xl bg-white/4 border border-white/10 text-white/85 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-white/20 leading-relaxed" />
                <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${systemTokens > 500 ? 'bg-rose-500' : systemTokens > 200 ? 'bg-amber-500' : 'bg-violet-500'}`}
                    style={{ width: `${Math.min((systemTokens / 600) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Few-shot examples */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Few-Shot Examples</label>
                  <span className="text-xs text-white/25">{fewShots.length} example{fewShots.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="space-y-2 mb-3">
                  {fewShots.map((ex, i) => (
                    <div key={ex.id} className="rounded-xl bg-white/3 border border-white/8 p-3 group">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-semibold text-white/40">Example {i + 1}</span>
                        <button onClick={() => removeFewShot(ex.id)} className="text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="rounded-lg bg-white/4 border border-white/8 p-2">
                          <span className="text-xs text-white/30 block mb-1">Input</span>
                          <p className="text-xs text-white/70 leading-relaxed">{ex.input}</p>
                        </div>
                        <div className="rounded-lg bg-violet-500/8 border border-violet-500/15 p-2">
                          <span className="text-xs text-white/30 block mb-1">Output</span>
                          <p className="text-xs text-white/70 leading-relaxed">{ex.output}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                  <p className="text-xs font-semibold text-white/30">Add Example</p>
                  <textarea value={newInput} onChange={e => setNewInput(e.target.value)} rows={2} placeholder="Input..."
                    className="w-full rounded-lg bg-white/4 border border-white/10 text-white/75 text-xs p-2 resize-none focus:outline-none focus:border-violet-500/30 transition-all placeholder:text-white/15" />
                  <textarea value={newOutput} onChange={e => setNewOutput(e.target.value)} rows={2} placeholder="Expected output..."
                    className="w-full rounded-lg bg-violet-500/5 border border-violet-500/15 text-white/75 text-xs p-2 resize-none focus:outline-none focus:border-violet-500/30 transition-all placeholder:text-white/15" />
                  <button onClick={addFewShot} disabled={!newInput.trim() || !newOutput.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-500/30 disabled:opacity-40 transition-all">
                    <Plus className="w-3 h-3" /> Add Example
                  </button>
                </div>
              </div>

              {/* User message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">User Message</label>
                  <span className="text-xs font-mono text-white/30">~{userTokens} tokens</span>
                </div>
                <textarea value={userMessage} onChange={e => setUserMessage(e.target.value)} rows={4}
                  placeholder="Enter the user message or question..."
                  className="w-full rounded-xl bg-white/4 border border-white/10 text-white/85 text-xs p-3 resize-none focus:outline-none focus:border-violet-500/40 transition-all placeholder:text-white/20 leading-relaxed" />
              </div>

              {/* Token summary */}
              <div className="rounded-xl bg-white/3 border border-white/8 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Total Input Tokens</span>
                  <span className={`text-xs font-mono font-bold ${totalInputTokens > 2000 ? 'text-rose-400' : 'text-white/60'}`}>~{totalInputTokens}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${totalInputTokens > 2000 ? 'bg-rose-500' : 'bg-violet-500'}`}
                    style={{ width: `${Math.min((totalInputTokens / 3000) * 100, 100)}%` }} />
                </div>
              </div>

              <button onClick={run} disabled={running || !userMessage.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg">
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? 'Generating...' : 'Run Prompt'}
              </button>
            </div>
          </div>

          {/* Right: output */}
          <div className="flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Output</h2>
                  <p className="text-xs text-white/40 mt-0.5">LLM response with metrics</p>
                </div>
                {response && (
                  <button onClick={copyResponse} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-xs transition-all">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>

              {error && <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4 mb-4"><p className="text-xs text-red-300">{error}</p></div>}

              {running && (
                <div className="rounded-xl bg-white/4 border border-white/10 p-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-sm text-white/50">Generating response...</p>
                </div>
              )}

              {!response && !running && !error && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <Zap className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Configure a prompt and click Run</p>
                </div>
              )}

              {response && !running && (
                <div className="space-y-4">
                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Tokens', value: `~${tokenEst}`, icon: Hash, color: 'text-violet-300' },
                      { label: 'Latency', value: `${(latency / 1000).toFixed(1)}s`, icon: Clock, color: 'text-sky-300' },
                      { label: 'Quality', value: `${qualityScore}/100`, icon: Star, color: 'text-amber-300' },
                    ].map(m => (
                      <div key={m.label} className="rounded-xl bg-white/3 border border-white/8 p-3 flex items-center gap-2">
                        <m.icon className={`w-3.5 h-3.5 ${m.color} flex-shrink-0`} />
                        <div>
                          <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
                          <div className="text-xs text-white/30">{m.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quality bar */}
                  <div className="rounded-xl bg-white/3 border border-white/8 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/40">Response Quality</span>
                      <span className="text-xs font-mono text-white/60">{qualityScore}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${qualityScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : qualityScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-gradient-to-r from-rose-500 to-red-500'}`}
                        style={{ width: `${qualityScore}%` }} />
                    </div>
                  </div>

                  {/* Response */}
                  <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                    <div className="prose prose-invert prose-xs max-w-none text-white/80 text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 border-l border-white/10 flex-shrink-0 flex flex-col overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(60px)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.04] via-transparent to-blue-500/[0.02] pointer-events-none" />
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 relative">
              <div className="flex gap-1 mb-5 rounded-xl glass-premium border border-white/10 p-1">
                {(['pipeline', 'concepts', 'history'] as SidebarTab[]).map(tab => (
                  <button key={tab} onClick={() => { setSidebarTab(tab); if (tab === 'history') loadHistory(); }}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 font-medium capitalize ${sidebarTab === tab ? 'bg-gradient-to-r from-violet-500/30 to-blue-500/30 text-white border border-violet-500/30' : 'text-white/40 hover:text-white/60'}`}>
                    {tab === 'history' ? <History className="w-3 h-3 mx-auto" /> : tab}
                  </button>
                ))}
              </div>

              {sidebarTab === 'pipeline' && (
                <div className="space-y-6">
                  <PromptPipelineDiagram activeStep={pipelineStep} />
                  <div className="rounded-xl glass-premium border border-violet-500/20 p-4">
                    <p className="text-xs font-semibold text-white/60 mb-2">About Prompt Engineering</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Prompt engineering shapes LLM behavior without changing model weights. Few-shot examples, system instructions, and structured templates can dramatically improve output quality.
                    </p>
                  </div>
                </div>
              )}

              {sidebarTab === 'concepts' && <PromptConceptPanel />}

              {sidebarTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Run History</p>
                  {historyLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-violet-400 animate-spin" /></div>}
                  {!historyLoading && history.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-4">No runs yet. Run a prompt to save history.</p>
                  )}
                  {history.map(run => (
                    <button key={run.id} onClick={() => loadHistoryRun(run)}
                      className="w-full text-left rounded-xl bg-white/3 border border-white/8 hover:border-violet-500/30 p-3 transition-all">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/50 truncate flex-1">{run.template_name || 'Custom'}</span>
                        <span className={`text-xs font-mono ml-2 flex-shrink-0 ${run.quality_score >= 80 ? 'text-emerald-400' : run.quality_score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{run.quality_score}%</span>
                      </div>
                      <p className="text-xs text-white/35 truncate">{run.user_message}</p>
                      <span className="text-xs text-white/20 mt-1 block">{new Date(run.created_at).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
