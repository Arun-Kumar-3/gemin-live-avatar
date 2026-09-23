// WebSocket message protocol — mirror of backend/app/models.py.

export const INPUT_SAMPLE_RATE = 16000; // sent to backend
export const OUTPUT_SAMPLE_RATE = 24000; // received from backend

export type ClientMessage =
  | { type: "audio"; data: string } // base64 PCM16 @16kHz
  | { type: "end_turn" }
  | { type: "stop" };

export type ServerMessage =
  | { type: "ready" }
  | { type: "audio"; data: string } // base64 PCM16 @24kHz
  | { type: "input_transcript"; text: string; final: boolean }
  | { type: "output_transcript"; text: string; final: boolean }
  | { type: "turn_complete" }
  | { type: "interrupted" }
  | { type: "error"; message: string };
