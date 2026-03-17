import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOOLS_SCHEMA = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web for up-to-date information, facts, news, prices, etc.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query to look up" },
        },
        required: ["query"],
      },
    },
  },
];

const GOODBYE_TRIGGERS = ["goodbye", "bye", "hang up", "end call", "disconnect", "stop", "that's all", "no thank you", "no thanks"];

const THINKING_PHRASES = [
  "One moment while I look that up.",
  "Let me find that for you.",
  "Good question, give me just a second.",
  "Let me check on that.",
  "Sure, one moment.",
  "Hmm, let me search for that.",
  "Give me a second, I'll find it.",
];

function buildSay(text: string): string {
  return `<Say voice="Polly.Joanna">${text}</Say>`;
}

function randomThinkingPhrase(): string {
  return THINKING_PHRASES[Math.floor(Math.random() * THINKING_PHRASES.length)];
}

async function toolSearchWeb(query: string, serperKey: string): Promise<string> {
  if (!serperKey) return "Web search unavailable — no Serper key configured.";
  try {
    const resp = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    const data = await resp.json();
    const results: Array<{ title?: string; snippet?: string }> = data.organic ?? [];
    if (!results.length) return "No results found.";
    return results
      .slice(0, 3)
      .map((r) => `${r.title ?? ""}: ${r.snippet ?? ""}`)
      .join(" | ");
  } catch (e) {
    return `Search error: ${String(e)}`;
  }
}

function isGoodbyeMessage(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return GOODBYE_TRIGGERS.some((t) => normalized.includes(t));
}

async function getAiResponse(
  conversation: Array<{ role: string; content: string }>,
  systemPrompt: string,
  groqKey: string,
  serperKey: string,
  toolUsesAcc: Array<Record<string, unknown>>,
  webSearchEnabled: boolean,
  userMessage?: string
): Promise<{ reply: string; usedTool: boolean }> {
  const systemWithStyle = systemPrompt + `

CRITICAL: Keep responses brief and natural for voice conversations. Use conversational language, not formal speech. Keep sentences short. Sound human-like by using natural pauses and varied sentence structure. NEVER over-explain. Be concise.`;

  const messages = [{ role: "system", content: systemWithStyle }, ...conversation];

  const userSaysGoodbye = userMessage && isGoodbyeMessage(userMessage);
  const shouldTryWebSearch = webSearchEnabled && !userSaysGoodbye;

  const fastModel = "llama-3.1-8b-instant";
  const powerModel = "llama-3.3-70b-versatile";

  const requestBody: Record<string, unknown> = {
    model: fastModel,
    messages,
    temperature: 0.5,
    max_tokens: 120,
  };

  if (shouldTryWebSearch) {
    requestBody.tools = TOOLS_SCHEMA;
    requestBody.tool_choice = "auto";
  }

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await resp.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  if (choice?.finish_reason === "tool_calls" && message?.tool_calls?.length) {
    const toolResults: Array<{ role: string; tool_call_id: string; content: string }> = [];

    for (const tc of message.tool_calls) {
      const fnName: string = tc.function.name;
      const fnArgs = JSON.parse(tc.function.arguments);
      const toolStart = Date.now();
      let result = "Unknown tool";

      if (fnName === "search_web") {
        result = await toolSearchWeb(fnArgs.query, serperKey);
      }

      toolUsesAcc.push({
        tool: fnName,
        input: fnArgs.query ?? fnArgs.task ?? "",
        result,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - toolStart,
      });

      toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
    }

    const resp2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: powerModel,
        messages: [...messages, message, ...toolResults],
        temperature: 0.5,
        max_tokens: 120,
      }),
    });
    const data2 = await resp2.json();
    return {
      reply: data2.choices?.[0]?.message?.content ?? "I wasn't able to get that information.",
      usedTool: true,
    };
  }

  return {
    reply: message?.content ?? "Could you say that again?",
    usedTool: false,
  };
}

async function generateSummary(
  transcript: Array<{ speaker: string; text: string }>,
  groqKey: string
): Promise<string> {
  if (!transcript.length || !groqKey) return "";
  const transcriptText = transcript
    .map((t) => `${t.speaker === "agent" ? "Agent" : "Caller"}: ${t.text}`)
    .join("\n");
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Summarize this phone call transcript in 2-3 sentences. Mention the outcome, key points, and any actions taken.",
          },
          { role: "user", content: transcriptText },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? "Summary unavailable.";
  } catch {
    return "Summary unavailable.";
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const lastPart = parts[parts.length - 1];
    const secondLast = parts.length >= 2 ? parts[parts.length - 2] : null;

    const isTurn = lastPart === "turn";
    const isGoodbye = lastPart === "goodbye";

    const sessionId = isTurn || isGoodbye
      ? secondLast!
      : lastPart;

    const edgeFunctionBaseUrl = `${supabaseUrl}/functions/v1`;
    const turnUrl = `${edgeFunctionBaseUrl}/twiml/${sessionId}/turn`;

    // ── /turn  ───────────────────────────────────────────────────────────────
    // Handles speech input AND generates the AI reply in a single request.
    // No more redirect to /process — the full pipeline runs here.
    if (isTurn) {
      const formData = await req.formData();
      const speechResult = (formData.get("SpeechResult") as string | null) ?? "";

      if (speechResult.trim().length <= 1) {
        const { data: session } = await supabase
          .from("call_sessions")
          .select("no_speech_count")
          .eq("session_id", sessionId)
          .maybeSingle();

        const noSpeechCount = (session?.no_speech_count ?? 0) + 1;

        EdgeRuntime.waitUntil(
          supabase
            .from("call_sessions")
            .update({ no_speech_count: noSpeechCount })
            .eq("session_id", sessionId)
        );

        if (noSpeechCount >= 3) {
          const goodbyeUrl = `${edgeFunctionBaseUrl}/twiml/${sessionId}/goodbye`;
          const goodbyeMsg = "I haven't been able to hear you. Feel free to call again. Goodbye!";
          const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(goodbyeMsg)}
  <Redirect method="POST">${goodbyeUrl}</Redirect>
</Response>`;
          return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
        }

        const prompts = [
          "I'm here, go ahead and speak.",
          "Please go ahead.",
          "I'm listening, take your time.",
        ];
        const prompt = prompts[Math.min(noSpeechCount - 1, prompts.length - 1)];
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${turnUrl}" method="POST" speechTimeout="3" language="en-US">
    ${buildSay(prompt)}
  </Gather>
  <Redirect method="POST">${turnUrl}</Redirect>
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
      }

      const { data: session } = await supabase
        .from("call_sessions")
        .select("pending_speech, transcript, conversation, tool_uses, system_prompt, groq_key, serper_key, web_search_enabled")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (!session) {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Session not found. Goodbye.</Say><Hangup /></Response>`,
          { status: 200, headers: { "Content-Type": "text/xml" } }
        );
      }

      const transcript: Array<{ speaker: string; text: string; timestamp: string }> =
        session.transcript ?? [];
      const conversation: Array<{ role: string; content: string }> =
        session.conversation ?? [];
      const toolUsesAcc: Array<Record<string, unknown>> = session.tool_uses ?? [];

      transcript.push({ speaker: "user", text: speechResult, timestamp: new Date().toISOString() });
      conversation.push({ role: "user", content: speechResult });

      const { reply: aiReply } = await getAiResponse(
        conversation,
        session.system_prompt ?? "",
        session.groq_key ?? "",
        session.serper_key ?? "",
        toolUsesAcc,
        session.web_search_enabled !== false,
        speechResult
      );

      transcript.push({ speaker: "agent", text: aiReply, timestamp: new Date().toISOString() });
      conversation.push({ role: "assistant", content: aiReply });

      const isGoodbyeIntent =
        isGoodbyeMessage(speechResult) ||
        aiReply.toLowerCase().startsWith("goodbye") ||
        aiReply.toLowerCase().startsWith("bye");

      await supabase
        .from("call_sessions")
        .update({ transcript, conversation, tool_uses: toolUsesAcc, pending_speech: null, no_speech_count: 0 })
        .eq("session_id", sessionId);

      if (isGoodbyeIntent) {
        EdgeRuntime.waitUntil(
          (async () => {
            const summary = await generateSummary(transcript, session.groq_key ?? "");
            await supabase
              .from("call_sessions")
              .update({ status: "completed", ended_at: new Date().toISOString(), summary })
              .eq("session_id", sessionId);
          })()
        );

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(aiReply)}
  <Hangup />
</Response>`;
        return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
      }

      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(aiReply)}
  <Gather input="speech" action="${turnUrl}" method="POST" speechTimeout="3" language="en-US">
  </Gather>
  <Redirect method="POST">${turnUrl}</Redirect>
</Response>`;
      return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
    }

    // ── /goodbye  ────────────────────────────────────────────────────────────
    if (isGoodbye) {
      const { data: session } = await supabase
        .from("call_sessions")
        .select("transcript, groq_key")
        .eq("session_id", sessionId)
        .maybeSingle();

      if (session) {
        EdgeRuntime.waitUntil(
          (async () => {
            const summary = await generateSummary(session.transcript ?? [], session.groq_key ?? "");
            await supabase
              .from("call_sessions")
              .update({ status: "completed", ended_at: new Date().toISOString(), summary })
              .eq("session_id", sessionId);
          })()
        );
      }

      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">Goodbye. Have a great day!</Say><Hangup /></Response>`,
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ── Initial greeting  ────────────────────────────────────────────────────
    const { data: session } = await supabase
      .from("call_sessions")
      .select("agent_task, system_prompt, groq_key")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (!session) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Call session not found. Goodbye.</Say><Hangup /></Response>`,
        { status: 200, headers: { "Content-Type": "text/xml" } }
      );
    }

    const taskContext = (session.agent_task ?? "").trim();
    const greeting = taskContext
      ? `Hello, this call may be recorded. I'm an AI assistant calling to help with ${taskContext}. Is now a good time?`
      : "Hello, this call may be recorded. I'm an AI assistant. How can I help you today?";

    const transcript = [{ speaker: "agent", text: greeting, timestamp: new Date().toISOString() }];
    const conversation = [{ role: "assistant", content: greeting }];

    const baseSystemPrompt = (session.system_prompt ?? "").trimEnd();
    const updatedSystemPrompt = baseSystemPrompt
      + "\n\nIMPORTANT: The opening greeting has already been spoken. "
      + "Do NOT repeat it. Do NOT re-introduce yourself. "
      + "Do NOT say 'this call may be recorded' again. "
      + "Continue the conversation naturally from this point forward.";

    EdgeRuntime.waitUntil(
      supabase
        .from("call_sessions")
        .update({
          status: "in-progress",
          answered_at: new Date().toISOString(),
          transcript,
          conversation,
          tool_uses: [],
          no_speech_count: 0,
          pending_speech: null,
          system_prompt: updatedSystemPrompt,
        })
        .eq("session_id", sessionId)
    );

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${buildSay(greeting)}
  <Gather input="speech" action="${turnUrl}" method="POST" speechTimeout="3" language="en-US">
  </Gather>
  <Redirect method="POST">${turnUrl}</Redirect>
</Response>`;

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    console.error("twiml error:", err);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Goodbye.</Say><Hangup /></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
});
