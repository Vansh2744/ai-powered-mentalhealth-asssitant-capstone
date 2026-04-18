import { useEffect, useState, useRef, useCallback } from "react";
import type { Exercise, ExerciseStep } from "../../types";

async function speak(text: string, lang = "en"): Promise<void> {
  try {
    const res = await fetch("http://localhost:8000/exercises/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    return new Promise((resolve) => {
      const audio    = new Audio(url);
      audio.onended  = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror  = () => { URL.revokeObjectURL(url); resolve(); };
      audio.play().catch(() => resolve());
    });
  } catch {
    return Promise.resolve();
  }
}

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  inhale:  { label: "Inhale",   color: "#0891b2", bg: "rgba(8,145,178,0.1)"  },
  exhale:  { label: "Exhale",   color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  hold:    { label: "Hold",     color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
  focus:   { label: "Focus",    color: "#059669", bg: "rgba(5,150,105,0.1)"  },
  sense:   { label: "Sense",    color: "#0d9488", bg: "rgba(13,148,136,0.1)" },
  tense:   { label: "Tense",    color: "#db2777", bg: "rgba(219,39,119,0.1)" },
  release: { label: "Release",  color: "#059669", bg: "rgba(5,150,105,0.1)"  },
  reflect: { label: "Reflect",  color: "#d97706", bg: "rgba(217,119,6,0.1)"  },
};

function ExerciseCard({
  exercise,
  onStart,
}: {
  exercise: Exercise;
  onStart:  (e: Exercise) => void;
}) {
  return (
    <button
      onClick={() => onStart(exercise)}
      className="group relative w-full text-left rounded-2xl p-5 transition-all
        duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
        bg-white/70 backdrop-blur-sm border border-white/80
        shadow-sm hover:shadow-md"
      style={{ "--ex-color": exercise.color } as React.CSSProperties}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all
        duration-300 group-hover:top-2 group-hover:bottom-2"
        style={{ background: exercise.color }} />

      <div className="pl-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{exercise.icon}</span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm tracking-wide"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {exercise.title}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">{exercise.subtitle}</p>
            </div>
          </div>
          <span className="text-[0.6rem] text-slate-400 shrink-0 mt-1 tracking-widest
            uppercase border border-slate-200 rounded-full px-2 py-0.5">
            {exercise.duration}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3 pl-0">
          {exercise.target.map((t) => (
            <span key={t} className="text-[0.58rem] px-2 py-0.5 rounded-full
              tracking-wider uppercase font-medium"
              style={{ background: `${exercise.color}18`, color: exercise.color }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Arrow */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300
        group-hover:translate-x-1 transition-transform duration-200">
        →
      </div>
    </button>
  );
}

// ── Breathing circle animation ────────────────────────────
function BreathCircle({
  phase, progress, color,
}: {
  phase: string; progress: number; color: string;
}) {
  const isExpand = ["inhale", "tense"].includes(phase);
  const isHold   = phase === "hold";
  const scale    = isHold ? 1.15 : isExpand
    ? 0.6 + progress * 0.55
    : 1.15 - progress * 0.55;

  return (
    <div className="relative flex items-center justify-center w-52 h-52 mx-auto">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 opacity-20"
        style={{ borderColor: color }} />
      {/* Progress ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="104" cy="104" r="100" fill="none"
          stroke={color} strokeWidth="2" opacity="0.15" />
        <circle cx="104" cy="104" r="100" fill="none"
          stroke={color} strokeWidth="3" opacity="0.7"
          strokeDasharray={`${2 * Math.PI * 100}`}
          strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      {/* Main circle */}
      <div className="rounded-full transition-transform duration-300 ease-in-out
        flex items-center justify-center"
        style={{
          width: "120px", height: "120px",
          background: `radial-gradient(circle, ${color}30, ${color}10)`,
          border: `2px solid ${color}40`,
          transform: `scale(${scale})`,
          boxShadow: `0 0 40px ${color}30`,
        }}>
        <div className="w-8 h-8 rounded-full"
          style={{ background: `${color}60` }} />
      </div>
    </div>
  );
}

// ── Active exercise player ────────────────────────────────
function ExercisePlayer({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose:  () => void;
}) {
  type Stage = "intro" | "running" | "outro" | "done";

  const [stage,       setStage]       = useState<Stage>("intro");
  const [stepIndex,   setStepIndex]   = useState(0);
  const [roundIndex,  setRoundIndex]  = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(0);
  const [paused,      setPaused]      = useState(false);
  const pausedRef  = useRef(false);
  const stopRef    = useRef(false);

  const currentStep: ExerciseStep = exercise.steps[stepIndex];
  const phaseConf = PHASE_CONFIG[currentStep?.phase] ?? PHASE_CONFIG["focus"];
  const totalSteps = exercise.steps.length * exercise.rounds;
  const doneSteps  = roundIndex * exercise.steps.length + stepIndex;

  // ── Sync pausedRef ────────────────────────────────────
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // ── Wait helper ───────────────────────────────────────
  const wait = useCallback((ms: number) =>
    new Promise<void>((resolve) => {
      const start = Date.now();
      const tick  = () => {
        if (stopRef.current) { resolve(); return; }
        if (pausedRef.current) { setTimeout(tick, 100); return; }
        const elapsed = Date.now() - start;
        if (elapsed >= ms) { resolve(); return; }
        setTimeout(tick, 50);
      };
      tick();
    }), []);

  // ── Countdown helper ──────────────────────────────────
  const countdown = useCallback((seconds: number, onTick: (p: number, t: number) => void) =>
    new Promise<void>((resolve) => {
      const total = seconds * 1000;
      const start = Date.now();
      const tick  = () => {
        if (stopRef.current) { resolve(); return; }
        if (pausedRef.current) { setTimeout(tick, 100); return; }
        const elapsed  = Date.now() - start;
        const p        = Math.min(elapsed / total, 1);
        const left     = Math.max(0, Math.ceil((total - elapsed) / 1000));
        onTick(p, left);
        if (p >= 1) { resolve(); return; }
        setTimeout(tick, 50);
      };
      tick();
    }), []);

  // ── Main exercise flow ────────────────────────────────
  useEffect(() => {
    stopRef.current    = false;
    pausedRef.current  = false;

    const run = async () => {
      // Intro
      setStage("intro");
      await speak(exercise.intro);
      await wait(500);
      if (stopRef.current) return;

      setStage("running");

      // Rounds × steps
      for (let r = 0; r < exercise.rounds; r++) {
        if (stopRef.current) return;
        setRoundIndex(r);
        for (let s = 0; s < exercise.steps.length; s++) {
          if (stopRef.current) return;
          const step = exercise.steps[s];
          setStepIndex(s);
          setProgress(0);
          setTimeLeft(step.duration);

          // Speak instruction
          await speak(step.instruction);
          if (stopRef.current) return;

          // Countdown
          await countdown(step.duration, (p, t) => {
            setProgress(p);
            setTimeLeft(t);
          });
        }
      }

      // Outro
      if (stopRef.current) return;
      setStage("outro");
      await speak(exercise.outro);
      await wait(500);
      if (!stopRef.current) setStage("done");
    };

    run();
    return () => { stopRef.current = true; };
  }, [exercise]);

  if (stage === "done") return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="text-6xl animate-bounce">{exercise.icon}</div>
      <div>
        <h2 className="text-2xl font-black text-slate-800 mb-2"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          Exercise Complete
        </h2>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">
          Well done. Take a moment to notice how you feel right now.
        </p>
      </div>
      <button onClick={onClose}
        className="px-8 py-3 rounded-full text-white font-bold text-sm tracking-wide
          transition-all hover:scale-105"
        style={{ background: exercise.color }}>
        Back to Exercises
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => { stopRef.current = true; onClose(); }}
          className="text-slate-400 hover:text-slate-600 transition-colors text-sm
            flex items-center gap-1.5">
          ← Back
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-400 tracking-widest uppercase">
            {stage === "intro" ? "Preparing..." : stage === "outro" ? "Finishing..." : `Round ${roundIndex + 1} of ${exercise.rounds}`}
          </p>
        </div>
        <button
          onClick={() => setPaused(p => !p)}
          className="text-xs px-3 py-1.5 rounded-full border border-slate-200
            text-slate-500 hover:border-slate-400 transition-all">
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* Title */}
      <div className="text-center">
        <span className="text-4xl">{exercise.icon}</span>
        <h2 className="text-xl font-black text-slate-800 mt-2"
          style={{ fontFamily: "'Syne', sans-serif" }}>
          {exercise.title}
        </h2>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(doneSteps / totalSteps) * 100}%`,
            background: exercise.color,
          }} />
      </div>

      {/* Breathing circle / animation */}
      {stage === "running" && (
        <BreathCircle
          phase={currentStep.phase}
          progress={progress}
          color={exercise.color}
        />
      )}

      {/* Phase label + instruction */}
      {stage === "running" && (
        <div className="text-center flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[0.25em] uppercase px-4 py-1.5
            rounded-full mx-auto"
            style={{
              color: phaseConf.color,
              background: phaseConf.bg,
            }}>
            {phaseConf.label}
          </span>
          <p className="text-slate-700 text-sm leading-relaxed max-w-xs mx-auto">
            {currentStep.instruction}
          </p>
          <p className="text-4xl font-black tabular-nums"
            style={{ color: exercise.color, fontFamily: "'Syne', sans-serif" }}>
            {timeLeft}s
          </p>
        </div>
      )}

      {/* Intro/outro text */}
      {(stage === "intro" || stage === "outro") && (
        <div className="text-center py-6">
          <div className="flex gap-1 justify-center mb-4">
            {[0,1,2].map((i) => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: exercise.color, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <p className="text-slate-500 text-sm italic max-w-xs mx-auto leading-relaxed">
            {stage === "intro"
              ? "Listen to the introduction..."
              : "Completing your session..."}
          </p>
        </div>
      )}

      {/* Paused overlay */}
      {paused && (
        <div className="text-center py-4">
          <p className="text-slate-400 text-xs tracking-widest uppercase animate-pulse">
            ⏸ Paused — tap Resume to continue
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Exercises Page ───────────────────────────────────
export default function Exercises() {
  const [exercises,        setExercises]        = useState<Exercise[]>([]);
  const [activeExercise,   setActiveExercise]   = useState<Exercise | null>(null);
  const [filter,           setFilter]           = useState("all");
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/exercises")
      .then((r) => r.json())
      .then((d) => { setExercises(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const allTags = ["all", ...Array.from(new Set(exercises.flatMap((e) => e.target)))];

  const filtered = filter === "all"
    ? exercises
    : exercises.filter((e) => e.target.includes(filter));

  return (
    <div className="min-h-screen w-full text-slate-800 flex flex-col items-center
      font-['JetBrains_Mono',monospace] relative overflow-x-hidden"
      style={{ background: "linear-gradient(145deg, #f0f9ff 0%, #faf5ff 50%, #f0fdf4 100%)" }}>

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full
          bg-cyan-200/40 blur-[80px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full
          bg-violet-200/30 blur-[80px]" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #0891b2 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />
      </div>

      <div className="relative w-full max-w-xl px-6 py-10">

        {activeExercise ? (
          /* ── Player ── */
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl
            border border-white/90">
            <ExercisePlayer
              exercise={activeExercise}
              onClose={() => setActiveExercise(null)}
            />
          </div>
        ) : (
          /* ── Exercise list ── */
          <>
            {/* Header */}
            <div className="mb-8">
              <p className="text-[0.6rem] tracking-[0.3em] text-cyan-600/70 uppercase mb-1
                flex items-center gap-2">
                <span className="inline-block w-4 h-px bg-cyan-400/60" />
                Mental Wellness
                <span className="inline-block w-4 h-px bg-cyan-400/60" />
              </p>
              <h1 className="text-3xl font-black tracking-wide text-slate-800"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                Exercises
              </h1>
              <p className="text-slate-500 text-xs mt-1.5">
                Voice-guided practices for your mind & body
              </p>
            </div>

            {/* Filter tags */}
            <div className="flex gap-2 flex-wrap mb-6">
              {allTags.map((tag) => (
                <button key={tag}
                  onClick={() => setFilter(tag)}
                  className={`text-[0.62rem] px-3 py-1.5 rounded-full tracking-wider
                    uppercase transition-all duration-200 border font-medium
                    ${filter === tag
                      ? "bg-cyan-600 text-white border-cyan-600 shadow-sm"
                      : "bg-white/60 text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="flex flex-col gap-3">
                {[0,1,2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white/50 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} onStart={setActiveExercise} />
                ))}
              </div>
            )}

            <p className="text-center text-[0.55rem] text-slate-300 tracking-[0.3em]
              uppercase mt-10">
              Voice guidance · Breathing · Grounding · Relaxation
            </p>
          </>
        )}
      </div>
    </div>
  );
}