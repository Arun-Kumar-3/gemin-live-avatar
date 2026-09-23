# Real-Time AI Avatar (Gemini Live on Vertex AI)

End-to-end real-time interactive AI avatar. A React + Three.js frontend captures
microphone audio, streams it over a WebSocket to a FastAPI proxy, which relays it
to the **Gemini Multimodal Live API on Vertex AI**. The model's streamed audio
drives an open-source 3D avatar (procedural placeholder or a rigged GLB) with
amplitude-based lip-sync, alongside live input/output transcripts.

```
Browser (mic 16kHz PCM)  ──WS──▶  FastAPI proxy  ──▶  Vertex AI Live session
   ▲  avatar + audio 24kHz  ◀──WS──   (bidirectional)  ◀──  (AUDIO + transcripts)
```

No paid avatar-streaming APIs — rendering is 100% Three.js / React Three Fiber.

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in VERTEX_PROJECT_ID, etc.
# place your service-account key at backend/credentials.json
uvicorn app.main:app --reload --port 8000
```

Env vars (`backend/.env`): `GOOGLE_APPLICATION_CREDENTIALS`, `VERTEX_PROJECT_ID`,
`VERTEX_LOCATION`, `LIVE_MODEL`, `VOICE_NAME`, `ALLOWED_ORIGINS`.

> **Note:** credentials are placeholders — no live Vertex call is made until you
> supply a real service account and project. Confirm `LIVE_MODEL` matches a Live
> model available in your Vertex region.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env          # optional; defaults proxy /ws to :8000
npm run dev                   # http://localhost:5173
```

Click **Start conversation**, grant microphone access, and speak. The Vite dev
server proxies `/ws` to the backend on port 8000.

## Using a real avatar model

See `frontend/public/models/README.md`. The default is a procedural head so the
pipeline works with no assets; swap in a GLB rigged with ARKit/Oculus visemes to
use `GltfAvatar`.

## WebSocket protocol

Defined in `backend/app/models.py` and mirrored in `frontend/src/lib/protocol.ts`.
Client sends base64 PCM16 @16kHz `audio` frames; server streams back `audio`
(PCM16 @24kHz), `input_transcript`, `output_transcript`, `turn_complete`,
`interrupted`, and `error` messages.

## Security note

The `/ws` endpoint is currently **unauthenticated** — anyone who can reach the
backend can open a Live session against your Vertex project (a cost/abuse risk).
Add authentication (e.g. a signed token checked on WebSocket connect) and tighten
`ALLOWED_ORIGINS` before exposing this beyond localhost.
