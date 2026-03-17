import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, Globe, Send,
  Plane, Briefcase, ShoppingCart, Newspaper, MapPin, Sparkles,
  AlertCircle, PanelLeftOpen, PanelLeftClose
} from 'lucide-react';
import { runAgent, AgentStep, AgentTask } from '../../services/agentService';
import { AgentStepFeed } from './AgentStepFeed';
import { AgentResultCard } from './AgentResultCard';
import { AgentTaskHistory } from './AgentTaskHistory';
import { SettingsPanel } from '../SettingsPanel';
import { useApiSettings } from '../../contexts/ApiSettingsContext';

interface WebAgentProps {
  onBack: () => void;
}

const EXAMPLE_GOALS = [
  { icon: Plane, label: 'Cheap flights CHN to BLR next weekend under ₹8k', color: 'text-sky-400' },
  { icon: Briefcase, label: 'Remote frontend developer jobs paying $80k+', color: 'text-emerald-400' },
  { icon: ShoppingCart, label: 'Best noise-cancelling headphones under ₹5000', color: 'text-amber-400' },
  { icon: Newspaper, label: 'Latest AI news and breakthroughs this week', color: 'text-cyan-400' },
  { icon: MapPin, label: 'Top-rated restaurants in Bangalore Indiranagar', color: 'text-rose-400' },
  { icon: Sparkles, label: 'Best free AI tools for productivity in 2025', color: 'text-violet-400' },
];

export const WebAgent: React.FC<WebAgentProps> = ({ onBack }) => {
  const { groqKey, serperKey } = useApiSettings();

  const [goal, setGoal] = useState('');
  const [currentSteps, setCurrentSteps] = useState<AgentStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSteps]);

  const keysConfigured = groqKey.trim().length > 0 && serperKey.trim().length > 0;

  const handleRun = async () => {
    if (!goal.trim() || isRunning) return;
    if (!keysConfigured) {
      setShowKeys(true);
      setError('Please configure your Groq and Serper API keys first.');
      return;
    }

    setError(null);
    setIsRunning(true);
    setCurrentSteps([]);
    setActiveTask(null);

    try {
      const task = await runAgent(
        goal.trim(),
        groqKey.trim(),
        serperKey.trim(),
        (steps) => setCurrentSteps([...steps])
      );

      setActiveTask(task);
      setTasks(prev => [...prev, task]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent run failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRun();
    }
  };

  const handleSelectTask = (task: AgentTask) => {
    setActiveTask(task);
    setCurrentSteps(task.steps);
    setGoal(task.goal);
    setShowSidebar(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTask?.id === id) {
      setActiveTask(null);
      setCurrentSteps([]);
    }
  };

  const handleExampleClick = (label: string) => {
    setGoal(label);
    textareaRef.current?.focus();
  };

  const isIdle = !isRunning && currentSteps.length === 0 && !activeTask;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(6,182,212,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.05)_0%,transparent_60%)] pointer-events-none" />

      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Web Research Agent</h1>
              <p className="text-xs text-white/35 leading-none mt-0.5">Real search · AI synthesis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SettingsPanel />

          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all border border-white/10"
          >
            {showSidebar ? <PanelLeftClose className="w-3 h-3" /> : <PanelLeftOpen className="w-3 h-3" />}
            History
            {tasks.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 text-xs flex items-center justify-center font-bold">
                {tasks.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {showSidebar && (
          <div className="w-72 shrink-0 border-r border-white/8 flex flex-col bg-black/40 backdrop-blur-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Research History</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <AgentTaskHistory
                tasks={tasks}
                activeTaskId={activeTask?.id ?? null}
                onSelectTask={handleSelectTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-6">

              {isIdle && (
                <div className="space-y-8 animate-fade-in">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">What do you want to research?</h2>
                    <p className="text-white/45 text-sm max-w-sm mx-auto">
                      Describe your goal and the agent will search the web, analyze results, and give you actionable findings.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Try these examples</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXAMPLE_GOALS.map((eg, idx) => {
                        const Icon = eg.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleExampleClick(eg.label)}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/8 hover:bg-white/8 hover:border-white/15 transition-all text-left group"
                          >
                            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${eg.color} group-hover:scale-110 transition-transform`} />
                            <span className="text-sm text-white/65 group-hover:text-white/85 transition-colors leading-snug">{eg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/3 border border-white/8 space-y-2">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">How it works</p>
                    <div className="space-y-1.5 text-xs text-white/45">
                      <p><span className="text-sky-400 font-medium">1. Plan</span> — AI breaks your goal into targeted search queries</p>
                      <p><span className="text-emerald-400 font-medium">2. Search</span> — Real Google results fetched via Serper API</p>
                      <p><span className="text-cyan-400 font-medium">3. Synthesize</span> — Groq LLM reads and structures the findings</p>
                      <p><span className="text-amber-400 font-medium">4. Act</span> — You get direct links to take the next step yourself</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {currentSteps.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/8" />
                    <p className="text-xs text-white/30 font-medium shrink-0">Agent Steps</p>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                  <AgentStepFeed steps={currentSteps} />
                  <div ref={stepsEndRef} />
                </div>
              )}

              {activeTask?.result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-white/8" />
                    <p className="text-xs text-white/30 font-medium shrink-0">Results</p>
                    <div className="h-px flex-1 bg-white/8" />
                  </div>
                  <AgentResultCard result={activeTask.result} goal={activeTask.goal} />
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 border-t border-white/8 bg-black/60 backdrop-blur-sm px-4 sm:px-6 py-4">
            <div className="max-w-2xl mx-auto">
              <div className={`flex items-end gap-3 p-3 rounded-2xl border transition-all duration-200
                ${isRunning
                  ? 'bg-white/4 border-white/15'
                  : 'bg-white/5 border-white/12 focus-within:border-cyan-500/40 focus-within:bg-white/7'
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isRunning}
                  rows={1}
                  placeholder={isRunning ? 'Agent is working...' : 'Describe your research goal... (Enter to run)'}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 focus:outline-none resize-none max-h-32 leading-relaxed disabled:opacity-50"
                  style={{ minHeight: '24px' }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = 'auto';
                    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
                  }}
                />
                <button
                  onClick={handleRun}
                  disabled={!goal.trim() || isRunning}
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
                    ${goal.trim() && !isRunning
                      ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white hover:opacity-90 hover:scale-105 shadow-lg shadow-cyan-500/25'
                      : 'bg-white/8 text-white/25 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/20 mt-2 text-center">
                No browser is opened — searches run via API · Results link directly to source sites
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
