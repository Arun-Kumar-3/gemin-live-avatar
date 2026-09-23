import type { TranscriptLine } from "../hooks/useLiveSession";
import { useEffect, useRef } from "react";

export function TranscriptPanel({ lines }: { lines: TranscriptLine[] }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [lines]);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {lines.length === 0 && (
        <p className="text-sm text-slate-500">Transcript will appear here…</p>
      )}
      {lines.map((line, i) => (
        <div
          key={i}
          className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
            line.role === "user"
              ? "self-end bg-blue-600 text-white"
              : "self-start bg-slate-700 text-slate-100"
          }`}
        >
          <span className="mb-0.5 block text-[10px] uppercase tracking-wide opacity-60">
            {line.role === "user" ? "You" : "Ava"}
          </span>
          {line.text}
        </div>
      ))}
      <div ref={end} />
    </div>
  );
}
