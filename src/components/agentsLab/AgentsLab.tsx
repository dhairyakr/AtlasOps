import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Bot, Play, Loader2, Wrench, Brain, Terminal, CheckCircle, PanelLeftClose, PanelLeftOpen, Minus, Plus, Wifi, Settings, Square, History, Database, X, ExternalLink, Download, Zap, Cpu } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { SettingsPanel } from '../SettingsPanel';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLabSessionId, mergeAnonymousSessionToUser } from '../../utils/sessionUtils';
import { serperSearch, wikipediaSearch, calculatorEval, weatherLookup, dictionaryLookup } from '../../services/webSearchService';
import { AgentPipelineDiagram } from './AgentPipelineDiagram';
import { AgentConceptPanel } from './AgentConceptPanel';
import { supabase } from '../../services/supabaseClient';

interface AgentsLabProps {
  onBack: () => void;
}

type SidebarTab = 'pipeline' | 'concepts' | 'history' | 'memory';

interface TraceStep {
  thought: string;
  tool: string;
  toolInput: string;
  observation: string;
  isLive?: boolean;
  latencyMs?: number;
}

interface MemoryFact {
  fact: string;
  source: string;
  step: number;
}

interface AgentRun {
  id: string;
  goal: string;
  tools_used: string[];
  trace: TraceStep[];
  final_answer: string;
  step_count: number;
  memory_state: MemoryFact[];
  created_at: string;
}

const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', desc: 'Search the internet for current info', color: 'from-sky-500 to-cyan-500', live: false },
  { id: 'calculator', name: 'Calculator', desc: 'Real API — no key needed', color: 'from-amber-500 to-orange-500', live: true },
  { id: 'weather', name: 'Weather', desc: 'Real API — no key needed', color: 'from-blue-400 to-cyan-400', live: true },
  { id: 'dictionary', name: 'Dictionary', desc: 'Real API — no key needed', color: 'from-teal-500 to-emerald-500', live: true },
  { id: 'wikipedia', name: 'Wikipedia', desc: 'Real API — no key needed', color: 'from-rose-500 to-pink-500', live: true },
  { id: 'document_reader', name: 'Document Reader', desc: 'Extract and analyze documents', color: 'from-slate-500 to-slate-400', live: false },
  { id: 'fact_checker', name: 'Fact Checker', desc: 'Verify claims against knowledge', color: 'from-rose-400 to-red-500', live: false },
  { id: 'code_runner', name: 'Code Runner', desc: 'Execute and test code snippets', color: 'from-violet-500 to-blue-500', live: false },
];

export const AgentsLab: React.FC<AgentsLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey, serperKey } = useApiSettings();
  const { user } = useAuth();
  const abortRef = useRef(false);
  const [sessionId] = useState(() => getLabSessionId('agents_lab', user?.id));

  const [goal, setGoal] = useState('');
  const [maxSteps, setMaxSteps] = useState(4);
  const [enabledTools, setEnabledTools] = useState<string[]>(['web_search', 'calculator', 'weather', 'dictionary', 'wikipedia']);
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [memory, setMemory] = useState<MemoryFact[]>([]);
  const [finalAnswer, setFinalAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<AgentRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [inspecting, setInspecting] = useState<TraceStep | null>(null);

  useEffect(() => {
    if (user?.id) mergeAnonymousSessionToUser('agents_lab', 'agent_lab_runs', 'session_id', user.id);
  }, [user?.id]);

  const usingGroq = provider === 'groq';
  const webSearchEnabled = enabledTools.includes('web_search');

  const toggleTool = (id: string) =>
    setEnabledTools(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase.from('agent_lab_runs').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(15);
    if (data) setHistory(data as AgentRun[]);
    setHistoryLoading(false);
  }, [sessionId]);

  const executeRealTool = useCallback(async (tool: string, input: string): Promise<{ observation: string; isLive: boolean }> => {
    const toolNorm = tool.toLowerCase().replace(/[\s_]/g, '');
    if (toolNorm === 'websearch' || toolNorm === 'web_search') {
      if (serperKey.trim()) return { observation: await serperSearch(input, serperKey.trim()), isLive: true };
    }
    if (toolNorm === 'wikipedia') return { observation: await wikipediaSearch(input), isLive: true };
    if (toolNorm === 'calculator') return { observation: await calculatorEval(input), isLive: true };
    if (toolNorm === 'weather') return { observation: await weatherLookup(input), isLive: true };
    if (toolNorm === 'dictionary') return { observation: await dictionaryLookup(input), isLive: true };
    return { observation: '', isLive: false };
  }, [serperKey]);

  const run = useCallback(async () => {
    if (!goal.trim() || enabledTools.length === 0) return;
    setRunning(true);
    abortRef.current = false;
    setError(null);
    setTrace([]);
    setMemory([]);
    setFinalAnswer('');
    setPipelineStep(0);

    const llm = new LLMService(provider, geminiKey, groqKey);
    const toolList = AVAILABLE_TOOLS.filter(t => enabledTools.includes(t.id)).map(t => `- ${t.name}: ${t.desc}`).join('\n');
    const newTrace: TraceStep[] = [];
    const newMemory: MemoryFact[] = [];

    try {
      for (let step = 0; step < maxSteps; step++) {
        if (abortRef.current) break;
        setPipelineStep(step < 2 ? 1 : step < 4 ? 2 : 3);

        const historyText = newTrace.map((s, i) =>
          `Step ${i + 1}:\nThought: ${s.thought}\nAction: ${s.tool}[${s.toolInput}]\nObservation: ${s.observation}`
        ).join('\n\n');

        const memoryText = newMemory.length > 0
          ? `\nACCUMULATED MEMORY:\n${newMemory.map(m => `- ${m.fact} (from ${m.source})`).join('\n')}\n`
          : '';

        const prompt = `You are an AI agent solving a task using the ReAct framework. You have access to these tools:
${toolList}

TASK: ${goal}
${memoryText}
${historyText ? `PREVIOUS STEPS:\n${historyText}\n\n` : ''}Now respond with ONLY a JSON object in this exact format (no other text):
{
  "thought": "your reasoning about what to do next",
  "tool": "tool name from the list above, or FINISH if done",
  "tool_input": "input to the tool, or empty string if FINISH",
  "observation": "leave empty string for real tools. For simulated tools, write a realistic 2-3 sentence result.",
  "key_fact": "a single important fact learned in this step, or empty string",
  "is_final": false
}

If you have enough information to answer the task, set "tool" to "FINISH" and "is_final" to true.`;

        const stepStart = Date.now();
        const raw = await llm.generateResponse(prompt);
        const stepLatency = Date.now() - stepStart;
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          try {
            const match = cleaned.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
          } catch {
            parsed = null;
          }
        }

        if (!parsed) break;

        const toolName: string = parsed.tool ?? '';
        const toolInput: string = parsed.tool_input ?? '';

        const { observation: realObs, isLive } = await executeRealTool(toolName, toolInput);

        let observation: string;
        if (isLive) {
          observation = realObs;
        } else if (parsed.observation && parsed.observation.trim()) {
          observation = parsed.observation;
        } else {
          const simPrompt = `You are simulating a tool result for an AI agent demo.\nTool: ${toolName}\nInput: ${toolInput}\nWrite a realistic, concise result (2-4 sentences). Return only the result text.`;
          observation = await llm.generateResponse(simPrompt);
        }

        const traceStep: TraceStep = {
          thought: String(parsed.thought ?? ''),
          tool: toolName,
          toolInput: String(toolInput),
          observation: String(observation ?? ''),
          isLive,
          latencyMs: stepLatency,
        };
        newTrace.push(traceStep);
        setTrace([...newTrace]);

        if (parsed.key_fact && parsed.key_fact.trim()) {
          const memFact: MemoryFact = { fact: parsed.key_fact.trim(), source: toolName, step: step + 1 };
          newMemory.push(memFact);
          setMemory([...newMemory]);
        }

        setPipelineStep(4);
        if (parsed.is_final || parsed.tool === 'FINISH') break;
        await new Promise(r => setTimeout(r, 300));
      }

      if (!abortRef.current) {
        setPipelineStep(5);
        const summaryPrompt = `Based on this agent reasoning trace, write a clear, direct final answer to the original task.\n\nTASK: ${goal}\n\nTRACE:\n${newTrace.map((s, i) => `Step ${i + 1} - ${s.tool}: ${s.observation}`).join('\n')}\n\nWrite a concise, helpful final answer (2-4 sentences):`;
        const answer = await llm.generateResponse(summaryPrompt);
        setFinalAnswer(answer);

        await supabase.from('agent_lab_runs').insert({
          session_id: sessionId,
          goal,
          tools_used: [...new Set(newTrace.map(s => s.tool).filter(t => t !== 'FINISH'))],
          trace: newTrace,
          final_answer: answer,
          step_count: newTrace.length,
          memory_state: newMemory,
          agent_mode: 'single',
        });
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err instanceof Error ? err.message : 'Agent run failed');
        setPipelineStep(-1);
      }
    } finally {
      setRunning(false);
    }
  }, [provider, geminiKey, groqKey, goal, maxSteps, enabledTools, executeRealTool, sessionId]);

  const abort = () => {
    abortRef.current = true;
    setRunning(false);
    setFinalAnswer('Run aborted by user.');
  };

  const loadHistoryRun = (run: AgentRun) => {
    setGoal(run.goal);
    setTrace(run.trace || []);
    setMemory(run.memory_state || []);
    setFinalAnswer(run.final_answer);
    setSidebarTab('pipeline');
  };

  const exportTrace = () => {
    const md = `# Agent Run\n\n**Goal:** ${goal}\n\n## Steps\n\n${trace.map((s, i) => `### Step ${i + 1}\n**Thought:** ${s.thought}\n**Tool:** \`${s.tool}(${s.toolInput})\`\n**Observation:** ${s.observation}`).join('\n\n')}\n\n## Final Answer\n\n${finalAnswer}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `agent-trace-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col chat-galaxy-bg text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[10, 20, 35, 50, 65, 80, 90].map((left, i) => (
          <div key={i} className="thought-particle" style={{ left: `${left}%`, animationDelay: `${i * 3}s` }} />
        ))}
      </div>

      {/* Tool inspector modal */}
      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setInspecting(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/15 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Tool Call Inspector</h3>
              <button onClick={() => setInspecting(null)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Thought', value: inspecting.thought, color: 'text-sky-300', mono: false },
                { label: 'Tool', value: inspecting.tool, color: 'text-amber-300', mono: true },
                { label: 'Input', value: inspecting.toolInput, color: 'text-white/70', mono: true },
                { label: 'Observation', value: inspecting.observation, color: 'text-teal-300', mono: false },
              ].filter(f => f.value).map(field => (
                <div key={field.label} className="rounded-xl bg-white/4 border border-white/8 p-3">
                  <p className="text-xs text-white/30 mb-1">{field.label}</p>
                  <p className={`text-xs leading-relaxed ${field.color} ${field.mono ? 'font-mono' : ''}`}>{field.value}</p>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-1">
                {inspecting.isLive && <span className="flex items-center gap-1 text-xs text-emerald-400"><Wifi className="w-3 h-3" />Live result</span>}
                {inspecting.latencyMs && <span className="text-xs text-white/30">{(inspecting.latencyMs / 1000).toFixed(1)}s</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="relative z-10 chat-navbar-glass flex items-center gap-4 px-6 py-4">
        <button onClick={onBack} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-none">AI Agents Lab</h1>
            <p className="text-xs text-white/50 mt-0.5">ReAct loops, tool use & multi-step reasoning</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${provider === 'gemini' ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
          {provider === 'gemini' ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
          {provider === 'gemini' ? 'Gemini' : 'Groq'}
        </div>
        {trace.length > 0 && finalAnswer && (
          <button onClick={exportTrace} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-all">
            <Download className="w-3.5 h-3.5" />Export
          </button>
        )}
        <SettingsPanel />
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Left: config */}
          <div className="border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0 space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Agent Goal</label>
                <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
                  placeholder="Describe what you want the agent to accomplish..."
                  className="w-full rounded-xl bg-white/4 border border-white/10 text-white/85 text-xs p-3 resize-none focus:outline-none focus:border-sky-500/40 focus:bg-white/6 transition-all placeholder:text-white/20 leading-relaxed" />
              </div>

              <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">API Keys</span>
                  <span className="ml-auto text-xs text-white/30">managed in Settings</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{usingGroq ? 'Groq (llama-3.3-70b)' : 'Gemini (2.5 Flash)'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${(usingGroq ? groqKey : geminiKey) ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      {(usingGroq ? groqKey : geminiKey) ? 'active' : 'not set'}
                    </span>
                  </div>
                  {webSearchEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Serper (Web Search)</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${serperKey ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-white/30'}`}>
                        {serperKey ? 'live search' : 'simulated'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Max Steps</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMaxSteps(s => Math.max(1, s - 1))} className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold text-white w-4 text-center">{maxSteps}</span>
                    <button onClick={() => setMaxSteps(s => Math.min(8, s + 1))} className="w-6 h-6 rounded-lg bg-white/8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/12 transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300" style={{ width: `${(maxSteps / 8) * 100}%` }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Available Tools</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_TOOLS.map(tool => {
                    const enabled = enabledTools.includes(tool.id);
                    const isRealApi = tool.live || (tool.id === 'web_search' && serperKey.trim());
                    return (
                      <button key={tool.id} onClick={() => toggleTool(tool.id)}
                        className={`rounded-xl p-3 text-left border transition-all duration-200 ${enabled ? `bg-gradient-to-br ${tool.color} bg-opacity-10 border-white/25` : 'bg-white/3 border-white/8 hover:border-white/15'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <Wrench className={`w-3.5 h-3.5 ${enabled ? 'text-white' : 'text-white/30'}`} />
                          {enabled && isRealApi && (
                            <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
                              <Wifi className="w-2.5 h-2.5" />Live
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-semibold ${enabled ? 'text-white' : 'text-white/50'}`}>{tool.name}</p>
                        <p className={`text-xs mt-0.5 ${enabled ? 'text-white/60' : 'text-white/20'}`}>{tool.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={run} disabled={running || !goal.trim() || enabledTools.length === 0}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {running ? 'Agent Running...' : 'Run Agent'}
                </button>
                {running && (
                  <button onClick={abort} className="px-3 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all">
                    <Square className="w-4 h-4" />
                  </button>
                )}
                <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 ${usingGroq ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' : 'bg-sky-500/10 border-sky-500/25 text-sky-300'}`}>
                  {usingGroq ? 'Groq' : 'Gemini'}
                </div>
              </div>
            </div>
          </div>

          {/* Right: trace */}
          <div className="flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-white">Agent Thought Trace</h2>
                  <p className="text-xs text-white/40 mt-0.5">Click any step to inspect full tool call details</p>
                </div>
                <span className={`mt-0.5 px-2 py-0.5 rounded-full border text-xs font-semibold flex-shrink-0 ${usingGroq ? 'bg-amber-500/10 border-amber-500/25 text-amber-300' : 'bg-sky-500/10 border-sky-500/25 text-sky-300'}`}>
                  {usingGroq ? 'llama-3.3-70b' : 'gemini-2.5-flash'}
                </span>
              </div>

              {error && <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4 mb-4"><p className="text-xs text-red-300">{error}</p></div>}

              {trace.length === 0 && !running && !finalAnswer && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <Bot className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Define a goal and run the agent</p>
                </div>
              )}

              <div className="space-y-3">
                {trace.map((step, i) => (
                  <button key={i} onClick={() => setInspecting(step)}
                    className="w-full text-left rounded-xl bg-white/3 border border-white/8 overflow-hidden hover:border-sky-500/25 transition-all group">
                    <div className="px-3 py-2 border-b border-white/6 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      <span className="text-xs font-semibold text-white/60">Step {i + 1}</span>
                      <span className="text-xs text-amber-400 font-mono">{step.tool}</span>
                      {step.isLive && (
                        <span className="ml-auto flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          <Wifi className="w-2.5 h-2.5" />Live
                        </span>
                      )}
                      {!step.isLive && <ExternalLink className="ml-auto w-3 h-3 text-white/20 opacity-0 group-hover:opacity-100 transition-all" />}
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Brain className="w-3.5 h-3.5 text-sky-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-white/65 leading-relaxed line-clamp-2">{step.thought}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Terminal className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${step.isLive ? 'text-emerald-400' : 'text-teal-400'}`} />
                        <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{step.observation}</p>
                      </div>
                    </div>
                  </button>
                ))}

                {running && (
                  <div className="rounded-xl bg-sky-500/8 border border-sky-500/20 p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin flex-shrink-0" />
                    <p className="text-xs text-white/60">Agent is reasoning... (step {trace.length + 1}/{maxSteps})</p>
                  </div>
                )}

                {finalAnswer && (
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/25 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <p className="text-xs font-semibold text-emerald-400">Final Answer</p>
                      <span className="text-xs text-white/30 ml-auto">{trace.length} steps</span>
                    </div>
                    <p className="text-xs text-white/75 leading-relaxed">{finalAnswer}</p>
                  </div>
                )}

                {memory.length > 0 && (
                  <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-3.5 h-3.5 text-violet-400" />
                      <p className="text-xs font-semibold text-white/50">Accumulated Memory ({memory.length} facts)</p>
                    </div>
                    <div className="space-y-1.5">
                      {memory.map((m, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-xs text-violet-400 font-mono flex-shrink-0">#{m.step}</span>
                          <p className="text-xs text-white/55 leading-relaxed">{m.fact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 border-l border-white/10 flex-shrink-0 flex flex-col overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(60px)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/[0.04] via-transparent to-cyan-500/[0.02] pointer-events-none" />
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 relative">
              <div className="flex gap-1 mb-5 rounded-xl glass-premium border border-white/10 p-1">
                {(['pipeline', 'concepts', 'history', 'memory'] as SidebarTab[]).map(tab => (
                  <button key={tab} onClick={() => { setSidebarTab(tab); if (tab === 'history') loadHistory(); }}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 font-medium capitalize ${sidebarTab === tab ? 'bg-gradient-to-r from-sky-500/30 to-cyan-500/30 text-white border border-sky-500/30' : 'text-white/40 hover:text-white/60'}`}>
                    {tab === 'history' ? <History className="w-3 h-3 mx-auto" /> : tab === 'memory' ? <Database className="w-3 h-3 mx-auto" /> : tab}
                  </button>
                ))}
              </div>

              {sidebarTab === 'pipeline' && (
                <div className="space-y-6">
                  <AgentPipelineDiagram activeStep={pipelineStep} />
                  <div className="rounded-xl glass-premium border border-sky-500/20 p-4">
                    <p className="text-xs font-semibold text-white/60 mb-2">About AI Agents</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                      AI agents extend LLMs with tools. The ReAct loop lets the model iteratively reason and act until a goal is achieved. Click any step card to inspect the full tool call details.
                    </p>
                  </div>
                </div>
              )}

              {sidebarTab === 'concepts' && <AgentConceptPanel />}

              {sidebarTab === 'memory' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Agent Memory</p>
                  {memory.length === 0 && <p className="text-xs text-white/25 text-center py-4">No facts accumulated yet. Run an agent to build memory.</p>}
                  {memory.map((m, i) => (
                    <div key={i} className="rounded-xl bg-white/3 border border-white/8 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-violet-400">Step {m.step}</span>
                        <span className="text-xs text-white/25">via {m.source}</span>
                      </div>
                      <p className="text-xs text-white/65 leading-relaxed">{m.fact}</p>
                    </div>
                  ))}
                </div>
              )}

              {sidebarTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Run History</p>
                  {historyLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-sky-400 animate-spin" /></div>}
                  {!historyLoading && history.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-4">No runs yet. Complete a run to save history.</p>
                  )}
                  {history.map(run => (
                    <button key={run.id} onClick={() => loadHistoryRun(run)}
                      className="w-full text-left rounded-xl bg-white/3 border border-white/8 hover:border-sky-500/30 p-3 transition-all">
                      <p className="text-xs text-white/70 truncate mb-1.5">{run.goal}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">{new Date(run.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-white/25">{run.step_count} steps</span>
                      </div>
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
