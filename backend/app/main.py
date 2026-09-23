"""FastAPI WebSocket proxy between the browser and the Vertex AI Live session."""
from __future__ import annotations

import asyncio
import base64
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google.genai import types

from .config import settings
from .models import INPUT_MIME_TYPE, ClientMessage
from .vertex_client import build_live_config, get_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("avatar")

app = FastAPI(title="AI Avatar Live Proxy")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": settings.live_model}


async def _pump_client_to_vertex(ws: WebSocket, session) -> None:
    """Read JSON messages from the browser and forward audio into Vertex."""
    while True:
        raw = await ws.receive_text()
        try:
            msg = ClientMessage.model_validate_json(raw)
        except ValueError:
            logger.warning("Ignoring malformed client message")
            continue

        if msg.type == "audio" and msg.data:
            pcm = base64.b64decode(msg.data)
            await session.send_realtime_input(
                audio=types.Blob(data=pcm, mime_type=INPUT_MIME_TYPE),
            )
        elif msg.type == "end_turn":
            # Signal end of the user's audio stream for this turn.
            await session.send_realtime_input(audio_stream_end=True)
        elif msg.type == "stop":
            raise WebSocketDisconnect()


async def _pump_vertex_to_client(ws: WebSocket, session) -> None:
    """Stream Vertex responses (audio + transcripts + events) to the browser."""
    async for response in session.receive():
        data = getattr(response, "data", None)
        if data:
            await ws.send_json(
                {"type": "audio", "data": base64.b64encode(data).decode("ascii")}
            )

        server_content = getattr(response, "server_content", None)
        if not server_content:
            continue

        if server_content.input_transcription:
            await ws.send_json({
                "type": "input_transcript",
                "text": server_content.input_transcription.text or "",
                "final": bool(server_content.input_transcription.finished),
            })
        if server_content.output_transcription:
            await ws.send_json({
                "type": "output_transcript",
                "text": server_content.output_transcription.text or "",
                "final": bool(server_content.output_transcription.finished),
            })
        if server_content.interrupted:
            await ws.send_json({"type": "interrupted"})
        if server_content.turn_complete:
            await ws.send_json({"type": "turn_complete"})


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    client = get_client()
    config = build_live_config()

    try:
        async with client.aio.live.connect(
            model=settings.live_model, config=config
        ) as session:
            await ws.send_json({"type": "ready"})
            tasks = [
                asyncio.create_task(_pump_client_to_vertex(ws, session)),
                asyncio.create_task(_pump_vertex_to_client(ws, session)),
            ]
            done, pending = await asyncio.wait(
                tasks, return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()
            for task in done:
                exc = task.exception()
                if exc and not isinstance(exc, WebSocketDisconnect):
                    raise exc
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as exc:  # noqa: BLE001 - surface any error to the client
        logger.exception("Live session error")
        try:
            await ws.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass
