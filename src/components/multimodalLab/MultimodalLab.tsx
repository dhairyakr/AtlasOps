import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Image, Upload, Play, Loader2, PanelLeftClose, PanelLeftOpen, Wand2, Eye, FileText, Box, Smile, BarChart3, Package, AlertTriangle } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { MultimodalPipelineDiagram } from './MultimodalPipelineDiagram';
import { MultimodalConceptPanel } from './MultimodalConceptPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MultimodalLabProps {
  onBack: () => void;
}

type SidebarTab = 'pipeline' | 'concepts';
type TaskType = 'describe' | 'ocr' | 'objects' | 'emotions' | 'data' | 'extract';

const TASKS: { id: TaskType; label: string; icon: React.ElementType; prompt: string; color: string }[] = [
  { id: 'describe', label: 'Describe Scene', icon: Eye, prompt: 'Describe this image in detail, including the setting, subjects, atmosphere, and any notable visual elements.', color: 'from-sky-500 to-cyan-500' },
  { id: 'ocr', label: 'Extract Text (OCR)', icon: FileText, prompt: 'Read and transcribe all text visible in this image. Format the output to preserve the original layout as closely as possible.', color: 'from-teal-500 to-emerald-500' },
  { id: 'objects', label: 'Identify Objects', icon: Box, prompt: 'List all distinct objects visible in this image. For each object, describe its position, approximate size, and any notable characteristics.', color: 'from-amber-500 to-orange-500' },
  { id: 'emotions', label: 'Read Emotions', icon: Smile, prompt: 'Analyze the emotional content of this image. Describe the emotions expressed by any people or conveyed by the overall scene, lighting, and composition.', color: 'from-violet-500 to-purple-500' },
  { id: 'data', label: 'Analyze Data', icon: BarChart3, prompt: 'This image contains a chart, graph, or table. Extract and summarize all data shown, including axis labels, data points, trends, and key takeaways.', color: 'from-rose-500 to-pink-500' },
  { id: 'extract', label: 'Structured Extraction', icon: Package, prompt: 'Extract all structured information from this image and return it as a well-organized JSON object. Include all data points, labels, values, and metadata visible.', color: 'from-green-500 to-teal-500' },
];

interface AnalysisResult {
  mainResponse: string;
  reasoningChain: string;
  detectedObjects: string[];
  detectedText: string;
  sceneType: string;
}

export const MultimodalLab: React.FC<MultimodalLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [imageName, setImageName] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('describe');
  const [customPrompt, setCustomPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported (JPG, PNG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      setImageData(base64);
      setImageMime(file.type);
      setImageName(file.name);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const runAnalysis = useCallback(async () => {
    if (!imageData) return;
    setRunning(true);
    setError(null);
    setResult(null);
    setPipelineStep(0);

    try {
      const gemini = new LLMService(provider, geminiKey, groqKey);
      const selectedTask = TASKS.find(t => t.id === taskType)!;
      const finalPrompt = customPrompt.trim() || selectedTask.prompt;

      setPipelineStep(1);
      await new Promise(r => setTimeout(r, 200));
      setPipelineStep(2);

      const mainResponse = await gemini.generateResponse(finalPrompt, { data: imageData, mimeType: imageMime });
      setPipelineStep(3);

      const reasoningPrompt = `You just analyzed an image and produced a response. Now explain your visual reasoning chain:
What specific parts or regions of the image did you focus on?
What visual cues (colors, shapes, patterns, text, people, objects) informed your response?
How did you interpret ambiguous elements?

Keep it to 3-4 bullet points of visual reasoning. Start directly with "• "`;
      const reasoningChain = await gemini.generateResponse(reasoningPrompt, { data: imageData, mimeType: imageMime });

      setPipelineStep(4);

      const metaPrompt = `Analyze this image and return ONLY this JSON (no other text):
{
  "detectedObjects": ["object1", "object2", "object3"],
  "detectedText": "any visible text, or empty string if none",
  "sceneType": "one of: indoor | outdoor | document | chart | screenshot | product | portrait | artwork | other"
}`;
      let detectedObjects: string[] = [];
      let detectedText = '';
      let sceneType = 'other';
      try {
        const metaRaw = await gemini.generateResponse(metaPrompt, { data: imageData, mimeType: imageMime });
        const cleaned = metaRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const meta = JSON.parse(cleaned);
        detectedObjects = Array.isArray(meta.detectedObjects) ? meta.detectedObjects : [];
        detectedText = meta.detectedText ?? '';
        sceneType = meta.sceneType ?? 'other';
      } catch { }

      setPipelineStep(5);
      setResult({ mainResponse, reasoningChain, detectedObjects, detectedText, sceneType });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setPipelineStep(-1);
    } finally {
      setRunning(false);
    }
  }, [provider, geminiKey, groqKey, imageData, imageMime, taskType, customPrompt]);

  return (
    <div className="min-h-screen flex flex-col chat-galaxy-bg text-white overflow-hidden relative">
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
          <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-cosmic-glow animate-glow avatar-orb">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-none">Multi-Modal AI Lab</h1>
            <p className="text-xs text-white/50 mt-0.5">Vision transformers, CLIP & image-language models</p>
          </div>
        </div>
        <div className="flex-1" />
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          <div className="border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0 space-y-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${dragging ? 'border-sky-400/60 bg-sky-500/10 scale-[1.01]' : 'border-white/12 bg-white/2 hover:border-sky-400/40 hover:bg-sky-500/5'}`}
                style={{ minHeight: '180px' }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                {imageData ? (
                  <div className="relative">
                    <img
                      src={`data:${imageMime};base64,${imageData}`}
                      alt="Uploaded"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                      <p className="text-xs text-white/80 truncate max-w-[200px]">{imageName}</p>
                    </div>
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white/60">
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${dragging ? 'bg-sky-500/20' : 'bg-white/5'}`}>
                      <Upload className={`w-6 h-6 transition-colors duration-200 ${dragging ? 'text-sky-400' : 'text-white/25'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-white/60">{dragging ? 'Drop image here' : 'Drop or click to upload image'}</p>
                      <p className="text-xs text-white/25 mt-1">JPG · PNG · WebP</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Analysis Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TASKS.map(task => {
                    const Icon = task.icon;
                    const active = taskType === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setTaskType(task.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-200 ${active ? `bg-gradient-to-r ${task.color} bg-opacity-15 border-white/25` : 'bg-white/3 border-white/8 hover:border-white/15'}`}
                      >
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? 'text-white' : 'text-white/40'}`} />
                        <span className={`text-xs font-medium ${active ? 'text-white' : 'text-white/50'}`}>{task.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Custom Prompt (Optional)</label>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  rows={3}
                  placeholder="Override the task prompt with a custom question about the image..."
                  className="w-full rounded-xl bg-white/4 border border-white/10 text-white/85 text-xs p-3 resize-none focus:outline-none focus:border-sky-500/40 transition-all placeholder:text-white/20 leading-relaxed"
                />
              </div>

              <button
                onClick={runAnalysis}
                disabled={running || !imageData}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {running ? 'Analyzing...' : 'Analyze Image'}
              </button>
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0">
              <div className="mb-4">
                <h2 className="text-base font-bold text-white">Analysis Results</h2>
                <p className="text-xs text-white/40 mt-0.5">Visual understanding and chain of reasoning</p>
              </div>

              {provider !== 'gemini' && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/90 leading-relaxed">
                    Image analysis requires Gemini. Switch to the Gemini provider in Settings and add a Gemini API key to use this lab.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300 leading-relaxed">{error}</p>
                </div>
              )}

              {running && !result && (
                <div className="rounded-xl bg-white/4 border border-white/10 p-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
                  <p className="text-sm text-white/50">Analyzing image...</p>
                </div>
              )}

              {!result && !running && !error && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <Image className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Upload an image and run analysis</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">
                      {TASKS.find(t => t.id === taskType)?.label ?? 'Response'}
                    </p>
                    <div className="prose prose-invert prose-xs max-w-none text-white/80 text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.mainResponse}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="rounded-xl bg-sky-500/5 border border-sky-500/15 p-4">
                    <p className="text-xs font-semibold text-sky-400/80 uppercase tracking-widest mb-3">Chain of Visual Reasoning</p>
                    <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">{result.reasoningChain}</p>
                  </div>

                  <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Detected Elements</p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-white/30 mb-1.5">Scene Type</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-sky-500/15 border border-sky-500/25 text-sky-300 capitalize">{result.sceneType}</span>
                      </div>
                      {result.detectedObjects.length > 0 && (
                        <div>
                          <p className="text-xs text-white/30 mb-1.5">Objects</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.detectedObjects.map((obj, i) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/6 border border-white/10 text-white/55">{obj}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.detectedText && (
                        <div>
                          <p className="text-xs text-white/30 mb-1.5">Text Found</p>
                          <p className="text-xs text-white/60 bg-white/4 rounded-lg px-3 py-2 font-mono">{result.detectedText}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {sidebarOpen && (
          <aside className="w-72 border-l border-white/10 flex-shrink-0 flex flex-col overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(60px)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/[0.04] via-transparent to-blue-500/[0.02] pointer-events-none" />
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 relative">
              <div className="flex gap-1 mb-5 rounded-xl glass-premium border border-white/10 p-1">
                {(['pipeline', 'concepts'] as SidebarTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSidebarTab(tab)}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 font-medium capitalize ${sidebarTab === tab ? 'bg-gradient-to-r from-sky-500/30 to-blue-500/30 text-white border border-sky-500/30' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {sidebarTab === 'pipeline' ? (
                <div className="space-y-6">
                  <MultimodalPipelineDiagram activeStep={pipelineStep} />
                  <div className="rounded-xl glass-premium border border-sky-500/20 p-4">
                    <p className="text-xs font-semibold text-white/60 mb-2">About Multimodal AI</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Multimodal models like Gemini process both images and text in a unified architecture. Images are encoded as patch embeddings and attended to by the language decoder, enabling genuine visual understanding.
                    </p>
                  </div>
                </div>
              ) : (
                <MultimodalConceptPanel />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
