import { serperSearch, weatherLookup, calculatorEval, wikipediaSearch } from './webSearchService';

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface AgentStep {
  id: string;
  type: 'think' | 'search' | 'weather' | 'calculate' | 'wikipedia' | 'synthesize' | 'action';
  label: string;
  detail?: string;
  status: AgentStepStatus;
  result?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface AgentResult {
  summary: string;
  items?: AgentResultItem[];
  links?: { label: string; url: string }[];
  actions?: AgentAction[];
  raw?: string;
}

export interface AgentResultItem {
  rank: number;
  title: string;
  description: string;
  link?: string;
  metadata?: Record<string, string>;
}

export interface AgentAction {
  label: string;
  url: string;
  description: string;
}

export interface AgentTask {
  id: string;
  goal: string;
  steps: AgentStep[];
  result?: AgentResult;
  status: 'idle' | 'running' | 'done' | 'error';
  createdAt: number;
  completedAt?: number;
  error?: string;
}

interface ToolCall {
  tool: 'search' | 'weather' | 'calculate' | 'wikipedia';
  input: string;
  reasoning: string;
}

interface PlanResponse {
  interpretation: string;
  plan: ToolCall[];
  synthesis_instructions: string;
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function buildPlan(goal: string, groqApiKey: string): Promise<PlanResponse> {
  const systemPrompt = `You are a research planning agent. Given a user goal, output a JSON plan with:
- "interpretation": one sentence explaining what the user wants
- "plan": array of tool calls to gather information (max 5 steps)
  Each item: { "tool": "search"|"weather"|"calculate"|"wikipedia", "input": "...", "reasoning": "why this step" }
- "synthesis_instructions": how to structure the final answer

Tools available:
- search: Google web search for real-time info (flights, jobs, news, prices, products)
- weather: get current weather for a city
- calculate: evaluate a math expression
- wikipedia: get a Wikipedia summary for a topic

Rules:
- Use search for most real-world queries (flights, jobs, events, prices, comparisons)
- Use 2-4 search queries with different angles for better coverage
- Keep tool inputs specific and searchable
- Output ONLY valid JSON, no markdown fences`;

  const raw = await callGroq(groqApiKey, systemPrompt, `Goal: ${goal}`);

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as PlanResponse;
  } catch {
    return {
      interpretation: goal,
      plan: [{ tool: 'search', input: goal, reasoning: 'Direct search for the goal' }],
      synthesis_instructions: 'Summarize the search results clearly',
    };
  }
}

async function runTool(
  tool: ToolCall['tool'],
  input: string,
  serperKey: string
): Promise<string> {
  switch (tool) {
    case 'search':
      return serperSearch(input, serperKey);
    case 'weather':
      return weatherLookup(input);
    case 'calculate':
      return calculatorEval(input);
    case 'wikipedia':
      return wikipediaSearch(input);
    default:
      return `Unknown tool: ${tool}`;
  }
}

async function synthesize(
  goal: string,
  plan: PlanResponse,
  toolResults: { tool: string; input: string; result: string }[],
  groqApiKey: string
): Promise<AgentResult> {
  const resultsText = toolResults
    .map((r, i) => `Step ${i + 1} [${r.tool}("${r.input}")]:\n${r.result}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a research synthesis agent. Given search results and a user goal, produce a structured JSON response.

Output format:
{
  "summary": "2-3 sentence overview of findings",
  "items": [
    {
      "rank": 1,
      "title": "...",
      "description": "...",
      "link": "https://...",
      "metadata": { "key": "value" }
    }
  ],
  "links": [
    { "label": "...", "url": "https://..." }
  ],
  "actions": [
    { "label": "...", "url": "https://...", "description": "what to do here" }
  ]
}

Rules:
- items: top 3-6 specific results (flights, jobs, products, etc.) extracted from search data. Include actual URLs when available.
- links: 2-4 useful reference links from the search results
- actions: 1-3 direct action links (e.g., "Search on MakeMyTrip", "Apply on LinkedIn"). Use real domains.
- metadata for items: include relevant details like price, date, location, salary, etc.
- Be specific — extract actual numbers, prices, names from the search data
- Output ONLY valid JSON`;

  const userMessage = `Goal: ${goal}

Research plan interpretation: ${plan.interpretation}

Synthesis instructions: ${plan.synthesis_instructions}

Search results:
${resultsText}`;

  const raw = await callGroq(groqApiKey, systemPrompt, userMessage);

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary || 'Research complete.',
      items: parsed.items || [],
      links: parsed.links || [],
      actions: parsed.actions || [],
    };
  } catch {
    return {
      summary: 'Research complete. See raw results below.',
      raw: raw,
    };
  }
}

export async function runAgent(
  goal: string,
  groqApiKey: string,
  serperApiKey: string,
  onStepUpdate: (steps: AgentStep[]) => void
): Promise<AgentTask> {
  const taskId = `task_${Date.now()}`;
  const steps: AgentStep[] = [];

  const updateSteps = () => onStepUpdate([...steps]);

  const addStep = (step: Omit<AgentStep, 'id'>): AgentStep => {
    const s: AgentStep = { ...step, id: `step_${Date.now()}_${Math.random()}` };
    steps.push(s);
    updateSteps();
    return s;
  };

  const updateStep = (id: string, updates: Partial<AgentStep>) => {
    const idx = steps.findIndex(s => s.id === id);
    if (idx !== -1) {
      steps[idx] = { ...steps[idx], ...updates };
      updateSteps();
    }
  };

  const thinkStep = addStep({
    type: 'think',
    label: 'Analyzing your goal',
    detail: 'Breaking down the request into a research plan...',
    status: 'running',
    startedAt: Date.now(),
  });

  let plan: PlanResponse;
  try {
    plan = await buildPlan(goal, groqApiKey);
    updateStep(thinkStep.id, {
      status: 'done',
      result: plan.interpretation,
      detail: `Plan: ${plan.plan.length} research steps`,
      completedAt: Date.now(),
    });
  } catch (err) {
    updateStep(thinkStep.id, { status: 'error', result: String(err) });
    return {
      id: taskId,
      goal,
      steps,
      status: 'error',
      error: String(err),
      createdAt: Date.now(),
    };
  }

  const toolResults: { tool: string; input: string; result: string }[] = [];

  for (const toolCall of plan.plan) {
    const toolLabels: Record<string, string> = {
      search: 'Searching the web',
      weather: 'Checking weather',
      calculate: 'Calculating',
      wikipedia: 'Looking up Wikipedia',
    };

    const stepType = toolCall.tool === 'search' ? 'search'
      : toolCall.tool === 'weather' ? 'weather'
      : toolCall.tool === 'calculate' ? 'calculate'
      : 'wikipedia';

    const runStep = addStep({
      type: stepType,
      label: `${toolLabels[toolCall.tool]}: "${toolCall.input}"`,
      detail: toolCall.reasoning,
      status: 'running',
      startedAt: Date.now(),
    });

    try {
      const result = await runTool(toolCall.tool, toolCall.input, serperApiKey);
      toolResults.push({ tool: toolCall.tool, input: toolCall.input, result });

      const preview = result.length > 120 ? result.slice(0, 120) + '...' : result;
      updateStep(runStep.id, {
        status: 'done',
        result: preview,
        completedAt: Date.now(),
      });
    } catch (err) {
      updateStep(runStep.id, { status: 'error', result: String(err) });
    }
  }

  const synthStep = addStep({
    type: 'synthesize',
    label: 'Synthesizing research into structured results',
    detail: 'Analyzing all gathered data...',
    status: 'running',
    startedAt: Date.now(),
  });

  let result: AgentResult;
  try {
    result = await synthesize(goal, plan, toolResults, groqApiKey);
    updateStep(synthStep.id, {
      status: 'done',
      result: result.summary,
      completedAt: Date.now(),
    });
  } catch (err) {
    updateStep(synthStep.id, { status: 'error', result: String(err) });
    result = {
      summary: 'Research complete but synthesis failed.',
      raw: toolResults.map(r => r.result).join('\n\n'),
    };
  }

  return {
    id: taskId,
    goal,
    steps,
    result,
    status: 'done',
    createdAt: Date.now(),
    completedAt: Date.now(),
  };
}
