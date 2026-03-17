import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STATUS_MAP: Record<string, string> = {
  connecting: "ringing",
  ringing: "ringing",
  "in-progress": "in-progress",
  in_progress: "in-progress",
  completed: "completed",
  failed: "failed",
  busy: "busy",
  "no-answer": "no-answer",
  canceled: "no-answer",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const callId = parts[parts.length - 1];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session, error } = await supabase
      .from("call_sessions")
      .select("session_id, call_sid, status, transcript, tool_uses, summary, answered_at, ended_at")
      .eq("session_id", callId)
      .maybeSingle();

    if (error || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let duration = 0;
    if (session.answered_at && session.ended_at) {
      duration = Math.round(
        (new Date(session.ended_at).getTime() - new Date(session.answered_at).getTime()) / 1000
      );
    } else if (session.answered_at) {
      duration = Math.round((Date.now() - new Date(session.answered_at).getTime()) / 1000);
    }

    return new Response(
      JSON.stringify({
        call_id: callId,
        call_sid: session.call_sid,
        status: STATUS_MAP[session.status] ?? "ringing",
        transcript: session.transcript ?? [],
        tool_uses: session.tool_uses ?? [],
        duration,
        summary: session.summary ?? "",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("call-status error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
