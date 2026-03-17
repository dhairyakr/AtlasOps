import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { call_sid } = await req.json();

    if (!call_sid) {
      return new Response(
        JSON.stringify({ error: "Missing call_sid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: session } = await supabase
      .from("call_sessions")
      .select("session_id, twilio_sid, twilio_token")
      .eq("call_sid", call_sid)
      .maybeSingle();

    if (session?.twilio_sid && session?.twilio_token) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${session.twilio_sid}/Calls/${call_sid}.json`;
      await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + btoa(`${session.twilio_sid}:${session.twilio_token}`),
        },
        body: new URLSearchParams({ Status: "completed" }).toString(),
      });

      await supabase
        .from("call_sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("call_sid", call_sid);
    }

    return new Response(
      JSON.stringify({ status: "ok" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("end-call error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
