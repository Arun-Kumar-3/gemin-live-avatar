import { Mic, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import { AvatarCanvas } from "./components/AvatarCanvas";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { useLiveSession } from "./hooks/useLiveSession";

export default function App() {
  const { status, error, transcript, connect, disconnect, getAmplitude } =
    useLiveSession();

  const live = status === "live";
  const connecting = status === "connecting";

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">AI Avatar — Ava</h1>
          <p className="text-xs text-slate-400">
            Powered by Gemini Multimodal Live on Vertex AI
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      <main className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[1.4fr_1fr]">
        <section className="relative bg-slate-900">
          <AvatarCanvas getAmplitude={getAmplitude} />
          <div className="absolute inset-x-0 bottom-0 flex justify-center pb-8">
            {live || connecting ? (
              <button
                onClick={disconnect}
                className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-red-500"
              >
                <PhoneOff size={18} /> End conversation
              </button>
            ) : (
              <button
                onClick={() => connect().catch(() => {})}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-medium text-white shadow-lg hover:bg-blue-500"
              >
                <Mic size={18} /> Start conversation
              </button>
            )}
          </div>
        </section>

        <aside className="border-l border-slate-800 bg-slate-950/40">
          {error && (
            <div className="flex items-center gap-2 border-b border-red-900 bg-red-950/50 px-4 py-2 text-sm text-red-300">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <TranscriptPanel lines={transcript} />
        </aside>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: "Idle", cls: "bg-slate-700 text-slate-200" },
    connecting: { label: "Connecting", cls: "bg-amber-600 text-white" },
    live: { label: "Live", cls: "bg-green-600 text-white" },
    error: { label: "Error", cls: "bg-red-600 text-white" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}
    >
      {status === "connecting" && <Loader2 size={12} className="animate-spin" />}
      {s.label}
    </span>
  );
}
