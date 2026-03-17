"""
InsightVoice Backend Server
===========================
Autonomous AI voice agent server using:
- Twilio for outbound calling + audio streaming (Media Streams)
- Deepgram for real-time speech-to-text (STT)
- Groq (Llama 3.3 70B) for fast AI reasoning + tool calling
- ElevenLabs for natural text-to-speech (TTS)
- Serper for live web search during calls
- Browser-Use for browser automation during calls

Setup:
  pip install -r requirements.txt
  Run with: uvicorn server:app --host 0.0.0.0 --port 8000 --reload
  Expose publicly: ngrok http 8000
"""

import asyncio
import base64
import json
import os
import time
import audioop
from typing import Optional

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from twilio.rest import Client as TwilioClient
from twilio.twiml.voice_response import VoiceResponse, Connect, Stream

app = FastAPI(title="InsightVoice Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

call_sessions: dict[str, dict] = {}


class InitiateCallRequest(BaseModel):
    to_number: str
    from_number: str
    agent_task: str
    system_prompt: str
    call_id: str
    groq_api_key: str
    serper_api_key: str
    elevenlabs_api_key: str
    deepgram_api_key: str
    twilio_account_sid: str
    twilio_auth_token: str


class EndCallRequest(BaseModel):
    call_sid: str


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

async def tool_search_web(query: str, serper_key: str) -> str:
    if not serper_key:
        return "Web search unavailable — no Serper key configured."
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": serper_key, "Content-Type": "application/json"},
                json={"q": query, "num": 3},
            )
            data = resp.json()
            results = data.get("organic", [])
            if not results:
                return "No results found."
            snippets = [f"{r.get('title', '')}: {r.get('snippet', '')}" for r in results[:3]]
            return " | ".join(snippets)
    except Exception as e:
        return f"Search error: {str(e)}"


async def tool_browser_action(task: str) -> str:
    try:
        from browser_use import Agent as BrowserAgent
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model="gpt-4o", temperature=0)
        agent = BrowserAgent(task=task, llm=llm)
        result = await agent.run(max_steps=5)
        return str(result)[:500]
    except ImportError:
        return "Browser automation not available — install: pip install browser-use"
    except Exception as e:
        return f"Browser error: {str(e)}"


TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web in real-time for up-to-date information, facts, status updates, prices, news, etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query to look up"}
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browser_action",
            "description": "Perform a task in a real web browser: navigate to a URL, extract data, fill forms, check status pages.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {"type": "string", "description": "Plain-English description of what to do in the browser"}
                },
                "required": ["task"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Groq LLM call with tool handling
# ---------------------------------------------------------------------------

async def get_ai_response(
    conversation: list[dict],
    system_prompt: str,
    groq_key: str,
    serper_key: str,
    session_id: str,
) -> str:
    messages = [{"role": "system", "content": system_prompt}] + conversation

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "tools": TOOLS_SCHEMA,
                "tool_choice": "auto",
                "temperature": 0.65,
                "max_tokens": 300,
            },
        )
        data = resp.json()

    choice = data["choices"][0]
    message = choice["message"]

    if choice["finish_reason"] == "tool_calls" and message.get("tool_calls"):
        tool_results = []
        for tc in message["tool_calls"]:
            fn_name = tc["function"]["name"]
            fn_args = json.loads(tc["function"]["arguments"])
            tool_start = time.time()

            if fn_name == "search_web":
                result = await tool_search_web(fn_args["query"], serper_key)
            elif fn_name == "browser_action":
                result = await tool_browser_action(fn_args["task"])
            else:
                result = "Unknown tool"

            duration_ms = int((time.time() - tool_start) * 1000)

            if session_id in call_sessions:
                call_sessions[session_id]["tool_uses"].append({
                    "tool": fn_name,
                    "input": fn_args.get("query") or fn_args.get("task", ""),
                    "result": result,
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "duration_ms": duration_ms,
                })

            tool_results.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": result,
            })

        messages_with_tools = messages + [message] + tool_results
        async with httpx.AsyncClient(timeout=30) as client:
            resp2 = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages_with_tools,
                    "temperature": 0.65,
                    "max_tokens": 300,
                },
            )
            data2 = resp2.json()
        return data2["choices"][0]["message"]["content"]

    return message.get("content", "I'm sorry, I didn't quite catch that.")


# ---------------------------------------------------------------------------
# ElevenLabs TTS
# ---------------------------------------------------------------------------

async def synthesize_speech(text: str, elevenlabs_key: str) -> Optional[bytes]:
    if not elevenlabs_key or not text.strip():
        return None
    voice_id = "EXAVITQu4vr4xnSDxMaL"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
                headers={"xi-api-key": elevenlabs_key, "Content-Type": "application/json"},
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2",
                    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
                    "output_format": "ulaw_8000",
                },
            )
            if resp.status_code == 200:
                return resp.content
            return None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Deepgram STT  (via REST for each audio chunk buffer)
# ---------------------------------------------------------------------------

async def transcribe_audio(audio_bytes: bytes, deepgram_key: str) -> str:
    if not deepgram_key or not audio_bytes:
        return ""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.deepgram.com/v1/listen?model=nova-2&language=en&smart_format=true&punctuate=true",
                headers={"Authorization": f"Token {deepgram_key}", "Content-Type": "audio/mulaw"},
                content=audio_bytes,
            )
            result = resp.json()
            channels = result.get("results", {}).get("channels", [{}])
            alt = channels[0].get("alternatives", [{}])[0]
            return alt.get("transcript", "").strip()
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "active_calls": len(call_sessions)}


@app.post("/initiate-call")
async def initiate_call(req: InitiateCallRequest):
    session_id = req.call_id

    call_sessions[session_id] = {
        "call_id": req.call_id,
        "call_sid": None,
        "status": "connecting",
        "to_number": req.to_number,
        "agent_task": req.agent_task,
        "system_prompt": req.system_prompt,
        "groq_key": req.groq_api_key,
        "serper_key": req.serper_api_key,
        "elevenlabs_key": req.elevenlabs_api_key,
        "deepgram_key": req.deepgram_api_key,
        "conversation": [],
        "transcript": [],
        "tool_uses": [],
        "started_at": time.time(),
        "answered_at": None,
        "ended_at": None,
        "twilio_sid": req.twilio_account_sid,
        "twilio_token": req.twilio_auth_token,
        "from_number": req.from_number,
    }

    base_url = os.environ.get("SERVER_BASE_URL", "")
    if not base_url:
        raise HTTPException(status_code=500, detail="SERVER_BASE_URL environment variable not set. Set it to your ngrok/public URL.")

    twilio_client = TwilioClient(req.twilio_account_sid, req.twilio_auth_token)

    call = twilio_client.calls.create(
        to=req.to_number,
        from_=req.from_number,
        url=f"{base_url}/twiml/{session_id}",
        status_callback=f"{base_url}/call-events/{session_id}",
        status_callback_method="POST",
    )

    call_sessions[session_id]["call_sid"] = call.sid
    call_sessions[session_id]["status"] = "ringing"

    return {"call_sid": call.sid, "session_id": session_id, "status": "ringing"}


@app.get("/twiml/{session_id}", response_class=PlainTextResponse)
@app.post("/twiml/{session_id}", response_class=PlainTextResponse)
async def generate_twiml(session_id: str):
    base_url = os.environ.get("SERVER_BASE_URL", "")
    ws_url = base_url.replace("https://", "wss://").replace("http://", "ws://")

    response = VoiceResponse()
    connect = Connect()
    stream = Stream(url=f"{ws_url}/media-stream/{session_id}")
    stream.parameter(name="session_id", value=session_id)
    connect.append(stream)
    response.append(connect)

    return str(response)


@app.post("/call-events/{session_id}")
async def call_events(session_id: str, request: Request):
    form = await request.form()
    call_status = form.get("CallStatus", "")

    if session_id in call_sessions:
        session = call_sessions[session_id]
        session["status"] = call_status

        if call_status == "in-progress" and not session.get("answered_at"):
            session["answered_at"] = time.time()

        if call_status in ("completed", "failed", "busy", "no-answer", "canceled"):
            session["ended_at"] = time.time()

    return PlainTextResponse("OK")


@app.post("/end-call")
async def end_call(req: EndCallRequest):
    for sid, session in call_sessions.items():
        if session.get("call_sid") == req.call_sid:
            try:
                twilio_client = TwilioClient(session["twilio_sid"], session["twilio_token"])
                twilio_client.calls(req.call_sid).update(status="completed")
            except Exception:
                pass
            session["status"] = "completed"
            session["ended_at"] = time.time()
            break
    return {"status": "ok"}


@app.get("/call-status/{call_id}")
async def call_status(call_id: str):
    session = call_sessions.get(call_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    duration = 0
    if session.get("answered_at") and session.get("ended_at"):
        duration = int(session["ended_at"] - session["answered_at"])
    elif session.get("answered_at"):
        duration = int(time.time() - session["answered_at"])

    status_map = {
        "connecting": "ringing",
        "ringing": "ringing",
        "in-progress": "in-progress",
        "in_progress": "in-progress",
        "completed": "completed",
        "failed": "failed",
        "busy": "busy",
        "no-answer": "no-answer",
        "canceled": "no-answer",
    }

    return {
        "call_id": call_id,
        "call_sid": session.get("call_sid"),
        "status": status_map.get(session.get("status", "ringing"), "ringing"),
        "transcript": session.get("transcript", []),
        "tool_uses": session.get("tool_uses", []),
        "duration": duration,
        "summary": session.get("summary", ""),
    }


# ---------------------------------------------------------------------------
# WebSocket: Twilio Media Stream handler (core AI loop)
# ---------------------------------------------------------------------------

@app.websocket("/media-stream/{session_id}")
async def media_stream(websocket: WebSocket, session_id: str):
    await websocket.accept()

    session = call_sessions.get(session_id)
    if not session:
        await websocket.close()
        return

    stream_sid = None
    audio_buffer = bytearray()
    silence_counter = 0
    SILENCE_THRESHOLD = 20
    MIN_AUDIO_BYTES = 3200

    session["status"] = "in-progress"
    session["answered_at"] = session.get("answered_at") or time.time()

    agent_task = session.get("agent_task") or ""
    if agent_task.strip():
        greeting = f"Hello, this call may be recorded. I'm an AI assistant calling to help with {agent_task}. Is now a good time?"
    else:
        greeting = "Hello, this call may be recorded. I'm an AI assistant. How can I help you today?"

    greeting_audio = await synthesize_speech(greeting, session["elevenlabs_key"])

    session["transcript"].append({
        "speaker": "agent",
        "text": greeting,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    })
    session["conversation"].append({"role": "assistant", "content": greeting})

    session["system_prompt"] = (
        session["system_prompt"].rstrip()
        + "\n\nIMPORTANT: The opening greeting has already been spoken. "
        "Do NOT repeat it. Do NOT re-introduce yourself. "
        "Do NOT say 'this call may be recorded' again. "
        "Continue the conversation naturally from this point forward."
    )

    try:
        async for raw_msg in websocket.iter_text():
            msg = json.loads(raw_msg)
            event = msg.get("event")

            if event == "start":
                stream_sid = msg["start"]["streamSid"]
                if greeting_audio and stream_sid:
                    encoded = base64.b64encode(greeting_audio).decode("utf-8")
                    await websocket.send_json({
                        "event": "media",
                        "streamSid": stream_sid,
                        "media": {"payload": encoded},
                    })

            elif event == "media":
                payload = msg["media"]["payload"]
                chunk = base64.b64decode(payload)
                audio_buffer.extend(chunk)

                rms = audioop.rms(chunk, 1) if len(chunk) >= 2 else 0
                is_silent = rms < 180

                if is_silent:
                    silence_counter += 1
                else:
                    silence_counter = 0

                if silence_counter >= SILENCE_THRESHOLD and len(audio_buffer) >= MIN_AUDIO_BYTES:
                    buffer_copy = bytes(audio_buffer)
                    audio_buffer.clear()
                    silence_counter = 0

                    user_text = await transcribe_audio(buffer_copy, session["deepgram_key"])

                    if user_text and len(user_text) > 2:
                        session["transcript"].append({
                            "speaker": "user",
                            "text": user_text,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        })
                        session["conversation"].append({"role": "user", "content": user_text})

                        ai_reply = await get_ai_response(
                            session["conversation"],
                            session["system_prompt"],
                            session["groq_key"],
                            session["serper_key"],
                            session_id,
                        )

                        session["transcript"].append({
                            "speaker": "agent",
                            "text": ai_reply,
                            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        })
                        session["conversation"].append({"role": "assistant", "content": ai_reply})

                        reply_audio = await synthesize_speech(ai_reply, session["elevenlabs_key"])
                        if reply_audio and stream_sid:
                            encoded = base64.b64encode(reply_audio).decode("utf-8")
                            await websocket.send_json({
                                "event": "media",
                                "streamSid": stream_sid,
                                "media": {"payload": encoded},
                            })

                        goodbye_triggers = ["goodbye", "bye", "hang up", "end call", "disconnect", "stop"]
                        if any(t in user_text.lower() for t in goodbye_triggers):
                            await asyncio.sleep(2)
                            if stream_sid:
                                await websocket.send_json({"event": "stop", "streamSid": stream_sid})
                            break

            elif event == "stop":
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[{session_id}] WebSocket error: {e}")
    finally:
        session["status"] = "completed"
        session["ended_at"] = session.get("ended_at") or time.time()
        await _generate_summary(session_id)


async def _generate_summary(session_id: str):
    session = call_sessions.get(session_id)
    if not session or not session.get("transcript"):
        return
    if not session.get("groq_key"):
        return

    transcript_text = "\n".join(
        f"{'Agent' if t['speaker'] == 'agent' else 'Caller'}: {t['text']}"
        for t in session["transcript"]
    )

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {session['groq_key']}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "Summarize this phone call transcript in 2-3 sentences. Mention the outcome, key points, and any actions taken."},
                        {"role": "user", "content": transcript_text},
                    ],
                    "max_tokens": 150,
                    "temperature": 0.3,
                },
            )
            data = resp.json()
            session["summary"] = data["choices"][0]["message"]["content"]
    except Exception:
        session["summary"] = "Summary unavailable."
