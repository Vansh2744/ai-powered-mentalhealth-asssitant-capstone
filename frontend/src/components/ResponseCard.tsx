import { useEffect, useRef, useState } from "react";
import type { TherapistResult } from "../types";

export function ResponseCard({
  therapist,
  loading,
  transcript,
  language, 
}: {
  therapist: TherapistResult | null;
  loading: boolean;
  transcript: string;
  language: string; // ← add
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!therapist?.audio_b64) return;
    const bytes = Uint8Array.from(atob(therapist.audio_b64), (c) =>
      c.charCodeAt(0),
    );
    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onplay = () => {
      setPlaying(true);
      forceUpdate((n) => n + 1);
    };
    audio.onended = () => {
      setPlaying(false);
      forceUpdate((n) => n + 1);
    };
    audio.onpause = () => {
      setPlaying(false);
      forceUpdate((n) => n + 1);
    };
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      URL.revokeObjectURL(url);
    };
  }, [therapist]);

  if (loading)
    return (
      <div className="bg-surface border border-white/5 rounded-2xl p-6 flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-slate-400 text-sm">Aria is thinking...</span>
      </div>
    );

  if (!therapist)
    return (
      <div
        className="bg-surface border border-white/5 rounded-2xl p-6
      text-center text-slate-600 text-sm"
      >
        Speak to hear Aria respond
      </div>
    );

  return (
    <div
      className="bg-surface border border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-4
      shadow-[0_0_40px_rgba(0,212,255,0.06)]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full transition-colors
            ${playing ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`}
          />
          <span className="font-head font-bold text-xs tracking-widest text-cyan-400">
            ARIA
          </span>
          {/* Language badge — only shown when non-English */}
          {language &&
            language !== "en" && ( // ← add
              <span
                className="text-[0.6rem] px-2 py-0.5 rounded-full
              bg-purple-500/20 text-purple-400 border border-purple-500/30 tracking-wider"
              >
                {language.toUpperCase()}
              </span>
            )}
        </div>
        <button
          onClick={() => {
            if (!audioRef.current) return;
            if (playing) {
              audioRef.current.pause();
            } else {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }}
          className="text-xs text-slate-500 hover:text-cyan-400 transition-colors
            border border-white/10 hover:border-cyan-500/50 px-3 py-1 rounded-full"
        >
          {playing ? "⏸ Pause" : "▶ Replay"}
        </button>
      </div>

      {playing && (
        <div className="flex items-end gap-0.5 h-5">
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400/70 rounded-full"
              style={{
                height: `${8 + Math.abs(Math.sin(i * 0.9)) * 12}px`,
                animation: `bounce ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.03}s`,
              }}
            />
          ))}
        </div>
      )}

      <p className="text-slate-200 text-sm leading-relaxed">{therapist.text}</p>

      {transcript && (
        <div className="border-t border-white/5 pt-3">
          <p className="text-[0.65rem] text-slate-600 tracking-widest uppercase mb-1">
            You said
          </p>
          <p className="text-slate-500 text-xs italic">"{transcript}"</p>
        </div>
      )}
    </div>
  );
}
