import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SILENCE_THRESHOLD = 20;
const MIN_AUDIO_BYTES = 3200;
const RMS_SILENCE_LEVEL = 180;

const TOOLS_SCHEMA = [
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the web in real-time for up-to-date information, facts, status updates, prices, news, etc.",
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

function computeRms(buffer: Uint8Array): number {
  if (buffer.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const sample = buffer[i] - 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

async function getAiResponse(
  conversation: Array<{ role: string; content: string }>,
  systemPrompt: string,
  groqKey: string,
  serperKey: string,
  toolUsesAcc: Array<Record<string, unknown>>
): Promise<string> {
  const messages = [{ role: "system", content: systemPrompt }, ...conversation];

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      tools: TOOLS_SCHEMA,
      tool_choice: "auto",
      temperature: 0.65,
      max_tokens: 300,
    }),
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

      const durationMs = Date.now() - toolStart;
      toolUsesAcc.push({
        tool: fnName,
        input: fnArgs.query ?? fnArgs.task ?? "",
        result,
        timestamp: new Date().toISOString(),
        duration_ms: durationMs,
      });

      toolResults.push({ role: "tool", tool_call_id: tc.id, content: result });
    }

    const resp2 = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [...messages, message, ...toolResults],
        temperature: 0.65,
        max_tokens: 300,
      }),
    });
    const data2 = await resp2.json();
    return data2.choices?.[0]?.message?.content ?? "I'm sorry, I didn't quite catch that.";
  }

  return message?.content ?? "I'm sorry, I didn't quite catch that.";
}

async function synthesizeSpeech(text: string, elevenlabsKey: string): Promise<Uint8Array | null> {
  if (!elevenlabsKey || !text.trim()) return null;
  const voiceId = "EXAVITQu4vr4xnSDxMaL";
  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": elevenlabsKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        output_format: "ulaw_8000",
      }),
    });
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

async function transcribeAudio(audioBytes: Uint8Array, deepgramKey: string): Promise<string> {
  if (!deepgramKey || audioBytes.length === 0) return "";
  try {
    const resp = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: { Authorization: `Token ${deepgramKey}`, "Content-Type": "audio/mulaw" },
        body: audioBytes,
      }
    );
    const result = await resp.json();
    const alt = result?.results?.channels?.[0]?.alternatives?.[0];
    return (alt?.transcript ?? "").trim();
  } catch {
    return "";
  }
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
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Summarize this phone call transcript in 2-3 sentences. Mention the outcome, key points, and any actions taken.",
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
  const upgrade = req.headers.get("upgrade") ?? "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const sessionId = parts[parts.length - 1];

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session, error: sessionErr } = await supabase
    .from("call_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (sessionErr || !session) {
    return new Response("Session not found", { status: 404 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = async () => {
    await supabase
      .from("call_sessions")
      .update({ status: "in-progress", answered_at: new Date().toISOString() })
      .eq("session_id", sessionId);

    const greeting = `Hello, this call may be recorded. I'm an AI assistant. ${session.agent_task || "How can I help you today?"}`;
    const greetingAudio = await synthesizeSpeech(greeting, session.elevenlabs_key);

    const transcript: Array<{ speaker: string; text: string; timestamp: string }> = [
      { speaker: "agent", text: greeting, timestamp: new Date().toISOString() },
    ];
    const conversation: Array<{ role: string; content: string }> = [
      { role: "assistant", content: greeting },
    ];
    const toolUsesAcc: Array<Record<string, unknown>> = [];

    let streamSid: string | null = null;
    let audioBuffer = new Uint8Array(0);
    let silenceCounter = 0;
    let isProcessing = false;

    const pendingGreeting = greetingAudio;

    socket.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const msgEvent = msg.event;

        if (msgEvent === "start") {
          streamSid = msg.start?.streamSid ?? null;
          if (pendingGreeting && streamSid) {
            socket.send(
              JSON.stringify({
                event: "media",
                streamSid,
                media: { payload: uint8ArrayToBase64(pendingGreeting) },
              })
            );
          }
        } else if (msgEvent === "media") {
          const chunk = base64ToUint8Array(msg.media.payload);
          const merged = new Uint8Array(audioBuffer.length + chunk.length);
          merged.set(audioBuffer);
          merged.set(chunk, audioBuffer.length);
          audioBuffer = merged;

          const rms = computeRms(chunk);
          if (rms < RMS_SILENCE_LEVEL) {
            silenceCounter++;
          } else {
            silenceCounter = 0;
          }

          if (
            silenceCounter >= SILENCE_THRESHOLD &&
            audioBuffer.length >= MIN_AUDIO_BYTES &&
            !isProcessing
          ) {
            isProcessing = true;
            const bufferCopy = audioBuffer;
            audioBuffer = new Uint8Array(0);
            silenceCounter = 0;

            const userText = await transcribeAudio(bufferCopy, session.deepgram_key);

            if (userText && userText.length > 2) {
              transcript.push({ speaker: "user", text: userText, timestamp: new Date().toISOString() });
              conversation.push({ role: "user", content: userText });

              await supabase
                .from("call_sessions")
                .update({ transcript, conversation })
                .eq("session_id", sessionId);

              const aiReply = await getAiResponse(
                conversation,
                session.system_prompt,
                session.groq_key,
                session.serper_key,
                toolUsesAcc
              );

              transcript.push({ speaker: "agent", text: aiReply, timestamp: new Date().toISOString() });
              conversation.push({ role: "assistant", content: aiReply });

              await supabase
                .from("call_sessions")
                .update({ transcript, conversation, tool_uses: toolUsesAcc })
                .eq("session_id", sessionId);

              const replyAudio = await synthesizeSpeech(aiReply, session.elevenlabs_key);
              if (replyAudio && streamSid) {
                socket.send(
                  JSON.stringify({
                    event: "media",
                    streamSid,
                    media: { payload: uint8ArrayToBase64(replyAudio) },
                  })
                );
              }

              const goodbyeTriggers = ["goodbye", "bye", "hang up", "end call", "disconnect", "stop"];
              if (goodbyeTriggers.some((t) => userText.toLowerCase().includes(t))) {
                await new Promise((r) => setTimeout(r, 2000));
                if (streamSid) socket.send(JSON.stringify({ event: "stop", streamSid }));
                socket.close();
              }
            }

            isProcessing = false;
          }
        } else if (msgEvent === "stop") {
          socket.close();
        }
      } catch (e) {
        console.error(`[${sessionId}] message error:`, e);
      }
    };

    socket.onclose = async () => {
      const summary = await generateSummary(transcript, session.groq_key);
      await supabase
        .from("call_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          transcript,
          conversation,
          tool_uses: toolUsesAcc,
          summary,
        })
        .eq("session_id", sessionId);
    };

    socket.onerror = async (e) => {
      console.error(`[${sessionId}] WebSocket error:`, e);
      await supabase
        .from("call_sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("session_id", sessionId);
    };
  };

  return response;
});
