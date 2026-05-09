import { useState } from "react";
import CameraFeed from "../components/CameraFeed";
import VoiceRecorder from "../components/VoiceRecorder";
import CrisisAlert from "../components/CrisisAlert";
import type { CombinedResult, TherapistResult } from "../types";
import "../index.css";
import { ResponseCard } from "../components/ResponseCard";
import { useCurrentUser } from "./context/userContext";
import { backendUrl } from "@/utils/backendUrl";

interface CrisisData {
  tier: number;
  keyword: string;
  helplines: { name: string; number: string; available: string }[];
}

export default function Therapy() {
  const [therapist, setTherapist] = useState<TherapistResult | null>(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("");
  const [cameraConnected, setCameraConnected] = useState(false);
  const [crisis, setCrisis] = useState<CrisisData | null>(null);
  const [endingSession, setEndingSession] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const userId = useCurrentUser().user?.id;

  const handleResult = (r: CombinedResult) => {
    setTherapist(r.therapist);
    setTranscript(r.transcript ?? "");
    setLanguage(r.language ?? "");

    if (r.crisis && r.crisis.tier <= 3) {
      setCrisis(r.crisis);
    }
  };

  const handleEndSession = async () => {
    if (!userId || endingSession) return;
    setEndingSession(true);
    try {
      await fetch(`${backendUrl}/session/end/${userId}`, { method: "POST" });
      setSessionEnded(true);
      setTimeout(() => setSessionEnded(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setEndingSession(false);
    }
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
      {crisis && (
        <CrisisAlert crisis={crisis} onDismiss={() => setCrisis(null)} />
      )}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-cyan-300/30 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-violet-300/25 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-teal-200/20 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #0891b2 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <header className="relative w-full max-w-xl px-6 pt-10 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[0.6rem] tracking-[0.3em] text-cyan-600/70 uppercase mb-1 flex items-center gap-2">
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
            Therapist
          </h1>
        </div>

        <div className="flex flex-col items-end gap-2 mt-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[0.6rem]
            tracking-widest uppercase transition-all duration-700
            ${
              cameraConnected
                ? "border-emerald-300 bg-emerald-50 text-emerald-600 shadow-sm"
                : "border-slate-200 bg-white/60 text-slate-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${cameraConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-300"}`}
            />
            {cameraConnected ? "Live" : "Connecting"}
          </div>
          {cameraConnected && userId && (
            <button
              onClick={handleEndSession}
              disabled={endingSession}
              className="px-3 py-1.5 rounded-full text-[0.6rem] tracking-widest uppercase transition-all"
              style={{
                background: sessionEnded
                  ? "rgba(5,150,105,0.15)"
                  : "rgba(109,40,217,0.1)",
                border: `1px solid ${sessionEnded ? "#059669" : "#6d28d9"}`,
                color: sessionEnded ? "#059669" : "#6d28d9",
              }}
            >
              {endingSession
                ? "Saving…"
                : sessionEnded
                  ? "✓ Saved"
                  : "End Session"}
            </button>
          )}
        </div>
      </header>
      <div className="w-full max-w-xl px-6 mb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      </div>
      <main className="relative w-full max-w-xl flex flex-col gap-5 px-6 pb-16">
        <div className="relative">
          <div
            className={`absolute -inset-[1px] rounded-2xl transition-all duration-700
            ${
              cameraConnected
                ? "bg-gradient-to-br from-cyan-400/40 via-transparent to-violet-400/30"
                : "bg-gradient-to-br from-slate-200/60 to-transparent"
            }`}
          />
          <div className="relative rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-xl shadow-cyan-100/50">
            <CameraFeed onConnected={setCameraConnected} />
            {!cameraConnected && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border border-cyan-300 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-violet-300 animate-pulse" />
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

        {cameraConnected ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-[0.6rem] text-slate-400 tracking-[0.2em] uppercase">
              Tap to begin speaking
            </p>
            <VoiceRecorder
              onResult={handleResult}
              onLoading={setLoading}
              userId={userId}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 py-4 border border-dashed border-slate-200 rounded-2xl bg-white/40">
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

        <div
          className={`transition-all duration-500 ${therapist || loading ? "opacity-100 translate-y-0" : "opacity-70 translate-y-1"}`}
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
