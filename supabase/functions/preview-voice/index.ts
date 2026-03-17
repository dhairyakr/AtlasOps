import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VALID_VOICES = [
  "Joanna-Neural", "Ruth-Neural", "Kendra-Neural", "Ivy-Neural",
  "Matthew-Neural", "Justin-Neural", "Geraint-Neural",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { voiceId, speechRate = 100, pitch = 100, text } = body;

    if (!voiceId || !VALID_VOICES.includes(voiceId)) {
      return new Response(JSON.stringify({ error: "Invalid or missing voiceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sampleText = text || "Hello! This is a preview of my voice. How can I help you today?";

    const ratePercent = Math.round(Math.max(50, Math.min(150, speechRate)));
    const pitchPercent = Math.round(Math.max(50, Math.min(150, pitch)));
    const rate = ratePercent === 100 ? "1.0x" : `${(ratePercent / 100).toFixed(2)}x`;
    const pitchSemitones = Math.round((pitchPercent - 100) * 0.3);
    const pitchStr = pitchSemitones === 0 ? "+0st" : `${pitchSemitones > 0 ? "+" : ""}${pitchSemitones}st`;

    const normalizedVoice = voiceId.includes("Neural") ? voiceId : `${voiceId}-Neural`;

    const ssml = `<speak>
  <amazon:voice name="Polly.${normalizedVoice}" engine="neural">
    <prosody rate="${rate}" pitch="${pitchStr}">
      ${sampleText}
    </prosody>
  </amazon:voice>
</speak>`;

    const twilioAccountSid = body.twilioAccountSid;
    const twilioAuthToken = body.twilioAuthToken;

    if (!twilioAccountSid || !twilioAuthToken) {
      return new Response(JSON.stringify({ error: "Twilio credentials required for voice preview" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ttsUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twimlDoc = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${ssml}</Say></Response>`;

    return new Response(
      JSON.stringify({ ssml, twiml: twimlDoc, message: "preview_ready" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("preview-voice error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
