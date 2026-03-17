import { useEffect, useRef, useState } from "react";
import type { TherapistResult } from "../types";

interface Props {
  therapist: TherapistResult | null;
  isLoading: boolean;
}

export default function TherapistResponse({ therapist, isLoading }: Props) {
  const audioRef     = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Auto-play whenever new therapist response arrives
  useEffect(() => {
    if (!therapist?.audio_b64) return;

    // Revoke old URL
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    // Decode base64 MP3 → blob URL
    const bytes  = Uint8Array.from(atob(therapist.audio_b64), (c) => c.charCodeAt(0));
    const blob   = new Blob([bytes], { type: "audio/mpeg" });
    const url    = URL.createObjectURL(blob);
    setAudioUrl(url);

    // Auto-play
    const audio  = new Audio(url);
    audioRef.current = audio;
    audio.onplay  = () => setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onpause = () => setPlaying(false);
    audio.play().catch(() => {});

    return () => { audio.pause(); URL.revokeObjectURL(url); };
  }, [therapist]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  if (isLoading) return (
    <div className="bg-surface border border-white/5 rounded-2xl p-5">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="flex gap-1">
          {[0,1,2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <span className="text-sm font-mono">Aria is thinking...</span>
      </div>
    </div>
  );

  if (!therapist) return (
    <div className="bg-surface border border-white/5 rounded-2xl p-5 flex items-center
      justify-center min-h-[100px] text-slate-500 text-sm font-mono">
      Aria will respond here after you speak
    </div>
  );

  return (
    <div className="bg-surface border border-cyan-500/20 rounded-2xl p-5
      shadow-[0_0_30px_rgba(0,212,255,0.05)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${playing
            ? "bg-cyan-400 animate-pulse" : "bg-slate-600"}`} />
          <span className="font-head font-bold text-sm tracking-widest text-cyan-400">
            ARIA · THERAPIST
          </span>
        </div>

        {/* Play/Pause button */}
        {audioUrl && (
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface2
              border border-white/10 hover:border-cyan-500 text-slate-300
              hover:text-cyan-400 transition-all text-xs font-mono"
          >
            {playing ? "⏸ Pause" : "▶ Replay"}
          </button>
        )}
      </div>

      {/* Waveform animation while playing */}
      {playing && (
        <div className="flex items-end gap-0.5 h-6 mb-3">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-cyan-400 rounded-full opacity-80"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 14}px`,
                animation: `bounce ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Response text */}
      <p className="text-slate-200 text-sm leading-relaxed font-mono">
        {therapist.text}
      </p>

      {/* Audio player */}
      {audioUrl && (
        <div className="mt-4">
          <audio
            controls
            src={audioUrl}
            className="w-full h-8"
            style={{ colorScheme: "dark" }}
          />
        </div>
      )}
    </div>
  );
}