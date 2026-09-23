"""WebSocket message protocol shared with the frontend.

Client -> Server:
  {"type": "audio", "data": "<base64 PCM16 @16kHz>"}
  {"type": "end_turn"}        # optional manual turn boundary
  {"type": "stop"}            # tear down the session

Server -> Client:
  {"type": "ready"}
  {"type": "audio", "data": "<base64 PCM16 @24kHz>"}
  {"type": "input_transcript", "text": "...", "final": bool}
  {"type": "output_transcript", "text": "...", "final": bool}
  {"type": "turn_complete"}
  {"type": "interrupted"}
  {"type": "error", "message": "..."}
"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

# Audio format contract.
INPUT_SAMPLE_RATE = 16000   # what we send to Vertex
OUTPUT_SAMPLE_RATE = 24000  # what Vertex returns
INPUT_MIME_TYPE = f"audio/pcm;rate={INPUT_SAMPLE_RATE}"


class ClientMessage(BaseModel):
    type: Literal["audio", "end_turn", "stop"]
    data: Optional[str] = None  # base64, present for type == "audio"
