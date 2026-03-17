import { useRef, useState } from "react";
import type { CombinedResult } from "../types";

interface Props {
  onResult:  (r: CombinedResult) => void;
  onLoading: (v: boolean) => void;
}

type State = "idle" | "recording" | "analyzing";

export default function VoiceRecorder({ onResult, onLoading }: Props) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setError("");
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setState("analyzing");
        onLoading(true);
        await send(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.start();
      mediaRef.current = recorder;
      setState("recording");
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stop = () => mediaRef.current?.stop();

  const send = async (blob: Blob) => {
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res  = await fetch("http://localhost:8000/analyze", { method: "POST", body: form });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      onResult(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Failed.");
    } finally {
      setState("idle");
      onLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={state === "idle" ? start : stop}
        disabled={state === "analyzing"}
        className={`
          relative w-20 h-20 rounded-full font-head font-bold text-2xl
          transition-all duration-200 flex items-center justify-center
          ${state === "idle"
            ? "bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-[0_0_30px_rgba(0,212,255,0.4)] hover:scale-105"
            : state === "recording"
            ? "bg-gradient-to-br from-red-500 to-red-700 text-white shadow-[0_0_30px_rgba(255,68,68,0.5)]"
            : "bg-surface2 text-slate-600 cursor-not-allowed"
          }
        `}
      >
        {state === "idle"      && "🎙️"}
        {state === "recording" && (
          <>
            <span className="absolute w-full h-full rounded-full bg-red-500
              animate-ping opacity-30" />
            <span>⏹</span>
          </>
        )}
        {state === "analyzing" && (
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </button>

      <p className="text-xs text-slate-500">
        {state === "idle"      && "Tap to speak"}
        {state === "recording" && "Tap to stop"}
        {state === "analyzing" && "Analyzing..."}
      </p>

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}