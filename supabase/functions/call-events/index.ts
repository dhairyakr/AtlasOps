import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    const sessionId = parts[parts.length - 1];

    const formData = await req.formData();
    const callStatus = formData.get("CallStatus")?.toString() ?? "";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const updates: Record<string, unknown> = { status: callStatus };

    if (callStatus === "in-progress") {
      updates.answered_at = new Date().toISOString();
    }

    if (["completed", "failed", "busy", "no-answer", "canceled"].includes(callStatus)) {
      updates.ended_at = new Date().toISOString();
    }

    await supabase
      .from("call_sessions")
      .update(updates)
      .eq("session_id", sessionId);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("call-events error:", err);
    return new Response("OK", { status: 200 });
  }
});
