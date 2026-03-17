# InsightVoice Backend Server

Autonomous AI voice agent backend: Twilio + Groq + Deepgram + ElevenLabs + Serper

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Install & start ngrok (for local MacBook dev)
```bash
brew install ngrok   # or download from ngrok.com
ngrok http 8000      # leaves this running in a terminal tab
# Copy the https://xxxxx.ngrok.io URL
```

### 3. Start the backend server
```bash
SERVER_BASE_URL=https://YOUR_NGROK_URL.ngrok.io uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Configure the frontend
- Open the InsightVoice module in the app
- Go to **Settings** tab
- Paste your ngrok URL into **Backend URL** (e.g. `https://abc123.ngrok.io`)
- Fill in all API keys

### 5. Make a call
- Go to **Dial** tab
- Enter a phone number in E.164 format (e.g. `+12025551234`)
- Describe the task (e.g. "Confirm the appointment for John")
- Click **Initiate Call**

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| POST | `/initiate-call` | Start an outbound call |
| POST | `/end-call` | End an active call |
| GET | `/call-status/{call_id}` | Poll live call status + transcript |
| WS | `/media-stream/{session_id}` | Twilio Media Stream WebSocket |
| GET/POST | `/twiml/{session_id}` | TwiML endpoint called by Twilio |
| POST | `/call-events/{session_id}` | Twilio status callback |

## How it works

1. Frontend POSTs to `/initiate-call` with credentials + task
2. Server creates a Twilio outbound call pointing to `/twiml/{id}`
3. When answered, Twilio opens a WebSocket to `/media-stream/{id}`
4. Audio flows bidirectionally:
   - Caller audio → Deepgram STT → text → Groq LLM → text
   - Groq may call tools (Serper search, browser automation) mid-reply
   - Groq text reply → ElevenLabs TTS → audio → Twilio → caller
5. Frontend polls `/call-status/{id}` every 1.5s to show live transcript
6. On call end, AI generates a summary and stores everything in Supabase

## Environment Variables

- `SERVER_BASE_URL` — Your publicly accessible URL (required, set via ngrok or deployment)

All other credentials (Twilio, Groq, Deepgram, ElevenLabs, Serper) are passed per-request
from the frontend, so no `.env` file is needed.

## Deploying to cloud (optional, for 24/7 operation)

Deploy to Render (free tier):
1. Push `backend/` to GitHub
2. Create a new Web Service on render.com
3. Set `SERVER_BASE_URL` to your Render service URL
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
