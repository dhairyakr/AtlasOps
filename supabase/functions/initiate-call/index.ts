import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      to_number,
      from_number,
      agent_task,
      system_prompt,
      call_id,
      groq_api_key,
      serper_api_key,
      twilio_account_sid,
      twilio_auth_token,
      web_search_enabled,
    } = body;

    if (!to_number || !from_number || !call_id || !twilio_account_sid || !twilio_auth_token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_number, from_number, call_id, twilio_account_sid, twilio_auth_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!groq_api_key) {
      return new Response(
        JSON.stringify({ error: "Missing Groq API key — required for AI conversation" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const edgeFunctionBaseUrl = `${supabaseUrl}/functions/v1`;
    const twimlUrl = `${edgeFunctionBaseUrl}/twiml/${call_id}`;
    const statusCallbackUrl = `${edgeFunctionBaseUrl}/call-events/${call_id}`;

    const twilioCallUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Calls.json`;
    const callParams = new URLSearchParams({
      To: to_number,
      From: from_number,
      Url: twimlUrl,
      StatusCallback: statusCallbackUrl,
      StatusCallbackMethod: "POST",
    });

    const twilioResp = await fetch(twilioCallUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${twilio_account_sid}:${twilio_auth_token}`),
      },
      body: callParams.toString(),
    });

    if (!twilioResp.ok) {
      const errData = await twilioResp.json().catch(() => ({}));
      const errMsg = errData.message || errData.detail || `Twilio HTTP ${twilioResp.status}`;
      return new Response(
        JSON.stringify({ error: `Twilio error: ${errMsg}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioData = await twilioResp.json();
    const callSid = twilioData.sid;

    const { error: dbError } = await supabase.from("call_sessions").upsert({
      session_id: call_id,
      call_sid: callSid,
      status: "ringing",
      to_number,
      from_number,
      agent_task: agent_task || "",
      system_prompt: system_prompt || "",
      groq_key: groq_api_key || "",
      serper_key: serper_api_key || "",
      twilio_sid: twilio_account_sid,
      twilio_token: twilio_auth_token,
      web_search_enabled: web_search_enabled !== false,
      conversation: [],
      transcript: [],
      tool_uses: [],
      started_at: new Date().toISOString(),
    }, { onConflict: "session_id" });

    if (dbError) {
      console.error("DB upsert error:", dbError);
      return new Response(
        JSON.stringify({ error: `Failed to create session in database: ${dbError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ call_sid: callSid, session_id: call_id, status: "ringing" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("initiate-call error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
