import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface Exercise {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  duration: string;
}
interface PlanData {
  plan: string | null;
  exercises: Exercise[];
  message?: string;
}

interface Props {
  userId: string;
  onStartExercise?: (ex: Exercise) => void;
}

export default function CopingPlan({ userId, onStartExercise }: Props) {
  const [data, setData]     = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/coping-plan/${userId}`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="min-h-screen text-white font-['JetBrains_Mono',monospace] px-4 py-8 max-w-3xl mx-auto"
      style={{ background:"linear-gradient(145deg,#050b12 0%,#0a0f1a 50%,#050b12 100%)" }}>

      {/* Header */}
      <div className="mb-8">
        <p className="text-[0.6rem] tracking-[0.3em] text-emerald-400/60 uppercase mb-1 flex items-center gap-2">
          <span className="w-4 h-px bg-emerald-400/40 inline-block" />
          Personalized for You
        </p>
        <h1 className="text-3xl font-black tracking-[0.15em] uppercase"
          style={{ background:"linear-gradient(135deg,#059669,#0e7490)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Coping Plan
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: `${i*0.15}s` }} />
          ))}
        </div>
      ) : !data?.plan ? (
        <div className="flex flex-col items-center justify-center gap-5 py-12">
          {/* Lock card */}
          <div className="rounded-3xl p-8 flex flex-col items-center gap-4 text-center max-w-sm"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
              style={{ background:"rgba(5,150,105,0.15)", border:"1px solid rgba(5,150,105,0.3)" }}>
              🌱
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              {data?.message ?? "Complete at least 2 sessions to unlock your personalized coping plan."}
            </p>
            <div className="flex gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-1.5 rounded-full"
                  style={{ background: i <= (data ? 1 : 0) ? "#059669" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
            <p className="text-white/30 text-[0.6rem] tracking-widest uppercase">
              Sessions completed: 1 / 2 minimum
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Plan card */}
          <div className="rounded-2xl p-6"
            style={{ background:"rgba(5,150,105,0.08)", border:"1px solid rgba(5,150,105,0.25)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🧭</span>
              <p className="text-emerald-300 text-[0.65rem] tracking-widest uppercase font-bold">
                Your Personalized Plan
              </p>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{data.plan}</p>
          </div>

          {/* Recommended exercises */}
          {data.exercises.length > 0 && (
            <div>
              <p className="text-white/30 text-[0.6rem] tracking-widest uppercase mb-3">
                Recommended Exercises
              </p>
              <div className="flex flex-col gap-3">
                {data.exercises.map(ex => (
                  <div key={ex.id} className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background:"rgba(255,255,255,0.03)",
                             border:`1px solid ${ex.color}25` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background:`${ex.color}20` }}>
                        {ex.icon}
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">{ex.title}</p>
                        <p className="text-white/40 text-[0.65rem]">{ex.subtitle} · {ex.duration}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onStartExercise?.(ex)}
                      className="px-3 py-1.5 rounded-full text-[0.65rem] tracking-widest uppercase font-bold transition-all"
                      style={{ background:`${ex.color}25`, border:`1px solid ${ex.color}50`, color: ex.color }}>
                      Start
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tip */}
          <div className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-lg mt-0.5">💡</span>
            <p className="text-white/40 text-xs leading-relaxed">
              This plan updates automatically as you complete more sessions.
              The more you check in, the more personalized your recommendations become.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}