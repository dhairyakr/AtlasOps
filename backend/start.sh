#!/usr/bin/env bash
# InsightVoice Backend Startup Script
# =====================================
# Run this from the backend/ directory on your MacBook.
#
# Prerequisites:
#   1. pip install -r requirements.txt
#   2. Install ngrok: https://ngrok.com/download  (brew install ngrok)
#   3. Run ngrok: ngrok http 8000
#   4. Copy the ngrok HTTPS URL and set it as SERVER_BASE_URL below (or pass as env var)
#
# Usage:
#   SERVER_BASE_URL=https://abc123.ngrok.io ./start.sh
#
# Or set it inline:
#   export SERVER_BASE_URL=https://your-ngrok-url.ngrok.io
#   uvicorn server:app --host 0.0.0.0 --port 8000 --reload

set -e

if [ -z "$SERVER_BASE_URL" ]; then
  echo "ERROR: SERVER_BASE_URL is not set."
  echo "  Start ngrok first: ngrok http 8000"
  echo "  Then run: SERVER_BASE_URL=https://YOUR_NGROK_URL.ngrok.io ./start.sh"
  exit 1
fi

echo "Starting InsightVoice backend on port 8000..."
echo "Public URL: $SERVER_BASE_URL"
echo ""
echo "Make sure to set this URL in the InsightVoice UI under Settings > Backend URL"
echo ""

uvicorn server:app --host 0.0.0.0 --port 8000 --reload
