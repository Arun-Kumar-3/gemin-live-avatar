import { useCallback, useRef, useState } from "react";
import { AudioCapture, AudioPlayer, base64ToInt16 } from "../lib/audio";
import type { ClientMessage, ServerMessage } from "../lib/protocol";

export type Status = "idle" | "connecting" | "live" | "error";

export interface TranscriptLine {
  role: "user" | "avatar";
  text: string;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? "/ws";

function wsAbsoluteUrl(path: string): string {
  if (path.startsWith("ws://") || path.startsWith("wss://")) return path;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}${path}`;
}

export function useLiveSession() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const send = (msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const appendTranscript = (role: TranscriptLine["role"], text: string, final: boolean) => {
    if (!text) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      // Merge streaming fragments into the current line for the same role.
      if (last && last.role === role && !final && !last.text.endsWith("\n")) {
        return [...prev.slice(0, -1), { role, text: last.text + text }];
      }
      if (last && last.role === role) {
        return [...prev.slice(0, -1), { role, text: last.text + text }];
      }
      return [...prev, { role, text }];
    });
  };

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case "ready":
        setStatus("live");
        break;
      case "audio":
        playerRef.current?.enqueue(base64ToInt16(msg.data));
        break;
      case "input_transcript":
        appendTranscript("user", msg.text, msg.final);
        break;
      case "output_transcript":
        appendTranscript("avatar", msg.text, msg.final);
        break;
      case "interrupted":
        playerRef.current?.reset();
        break;
      case "turn_complete":
        break;
      case "error":
        setError(msg.message);
        setStatus("error");
        break;
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setStatus("connecting");

    const player = new AudioPlayer();
    await player.resume();
    playerRef.current = player;

    const ws = new WebSocket(wsAbsoluteUrl(WS_URL));
    wsRef.current = ws;

    ws.onmessage = (ev) => handleServerMessage(JSON.parse(ev.data) as ServerMessage);
    ws.onerror = () => {
      setError("WebSocket error");
      setStatus("error");
    };
    ws.onclose = () => {
      captureRef.current?.stop();
      captureRef.current = null;
      setStatus((s) => (s === "error" ? s : "idle"));
    };

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.addEventListener("error", () => reject(new Error("connect failed")), { once: true });
    });

    const capture = new AudioCapture((b64) => send({ type: "audio", data: b64 }));
    await capture.start();
    captureRef.current = capture;
  }, [handleServerMessage]);

  const disconnect = useCallback(() => {
    send({ type: "stop" });
    captureRef.current?.stop();
    captureRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    playerRef.current?.reset();
    setStatus("idle");
  }, []);

  const getAmplitude = useCallback(() => playerRef.current?.amplitude() ?? 0, []);

  return { status, error, transcript, connect, disconnect, getAmplitude };
}
