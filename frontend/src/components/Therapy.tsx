import { useEffect, useState } from "react";
import CameraFeed from "../components/CameraFeed";
import VoiceRecorder from "../components/VoiceRecorder";
import type { CombinedResult, TherapistResult } from "../types";
import "../index.css";
import { ResponseCard } from "../components/ResponseCard";

export default function Therapy() {
  const [therapist, setTherapist] = useState<TherapistResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [cameraConnected, setCameraConnected] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/camera/start", { method: "POST" });

    const handleUnload = () =>
      navigator.sendBeacon("http://localhost:8000/camera/stop");

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        navigator.sendBeacon("http://localhost:8000/camera/stop");
      } else {
        fetch("http://localhost:8000/camera/start", { method: "POST" });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      navigator.sendBeacon("http://localhost:8000/camera/stop");
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleResult = (r: CombinedResult) => {
    setTherapist(r.therapist);
    setTranscript(r.transcript ?? "");
    setLanguage(r.language ?? "");
  };

  return (
    <div
      className="min-h-screen text-slate-800 flex flex-col items-center
      font-['JetBrains_Mono',monospace] relative overflow-x-hidden w-full"
      style={{
        background:
          "linear-gradient(145deg, #f0f9ff 0%, #faf5ff 50%, #f0fdf4 100%)",
      }}
    >
      {/* ── Ambient blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full
          bg-cyan-300/30 blur-[100px]"
        />
        <div
          className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full
          bg-violet-300/25 blur-[100px]"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-[350px] h-[350px] rounded-full bg-teal-200/20 blur-[80px]"
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0891b2 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* ── Header ── */}
      <header
        className="relative w-full max-w-xl px-6 pt-10 pb-2 flex items-start
        justify-between"
      >
        <div>
          <p
            className="text-[0.6rem] tracking-[0.3em] text-cyan-600/70 uppercase mb-1
            flex items-center gap-2"
          >
            <span className="inline-block w-4 h-px bg-cyan-400/60" />
            AI Therapy Session
            <span className="inline-block w-4 h-px bg-cyan-400/60" />
          </p>
          <h1
            className="text-4xl font-black tracking-[0.2em] uppercase"
            style={{
              fontFamily: "'Syne', sans-serif",
              background: "linear-gradient(135deg, #0e7490 0%, #6d28d9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Aria
          </h1>
        </div>

        {/* Live pill */}
        <div
          className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full
          border text-[0.6rem] tracking-widest uppercase transition-all duration-700
          ${
            cameraConnected
              ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-sm"
              : "border-slate-200 bg-white/60 text-slate-400"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full
            ${cameraConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}
          />
          {cameraConnected ? "Live" : "Connecting"}
        </div>
      </header>

      {/* ── Divider ── */}
      <div className="w-full max-w-xl px-6 mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      </div>

      {/* ── Main ── */}
      <main className="relative w-full max-w-xl flex flex-col gap-5 px-6 pb-16">
        {/* Camera card */}
        <div className="relative">
          <div
            className={`absolute -inset-[1px] rounded-2xl transition-all duration-700
            ${
              cameraConnected
                ? "bg-gradient-to-br from-cyan-400/40 via-transparent to-violet-400/30"
                : "bg-gradient-to-br from-slate-200/60 to-transparent"
            }`}
          />
          <div
            className="relative rounded-2xl overflow-hidden bg-white/70
            backdrop-blur-sm shadow-xl shadow-cyan-100/50"
          >
            <CameraFeed onConnected={setCameraConnected} />

            {/* Connecting overlay */}
            {!cameraConnected && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center
                gap-4 bg-white/80 backdrop-blur-sm"
              >
                <div className="relative w-16 h-16">
                  <div
                    className="absolute inset-0 rounded-full border border-cyan-300
                    animate-ping"
                  />
                  <div
                    className="absolute inset-2 rounded-full border border-violet-300
                    animate-pulse"
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">
                    📷
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-[0.65rem] text-slate-400 tracking-[0.2em] uppercase">
                    Initialising camera
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recorder or waiting */}
        {cameraConnected ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[0.6rem] text-slate-400 tracking-[0.2em] uppercase">
              Tap to begin speaking
            </p>
            <VoiceRecorder onResult={handleResult} onLoading={setLoading} />
          </div>
        ) : (
          <div
            className="flex items-center justify-center gap-3 py-4
            border border-dashed border-slate-200 rounded-2xl bg-white/40"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-slate-400 text-[0.65rem] tracking-[0.2em] uppercase">
              Microphone unlocks after camera connects
            </span>
          </div>
        )}

        {/* Response card */}
        <div
          className={`transition-all duration-500
          ${therapist || loading ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"}`}
        >
          <ResponseCard
            therapist={therapist}
            loading={loading}
            transcript={transcript}
            language={language}
          />
        </div>
      </main>
    </div>
  );
}
