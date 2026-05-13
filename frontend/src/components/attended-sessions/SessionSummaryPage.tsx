import { backendUrl } from "@/utils/backendUrl";
import { useEffect, useState } from "react";

const EMOTION_COLOR: Record<string, string> = {
  happy: "#22c55e",
  sad: "#3b82f6",
  angry: "#ef4444",
  fear: "#a855f7",
  fearful: "#a855f7",
  neutral: "#9ca3af",
  surprise: "#f59e0b",
  disgust: "#84cc16",
  calm: "#06b6d4",
};

interface Summary {
  id: string;
  dominant_emotions: Record<string, number>;
  topics_discussed: string[];
  coping_strategies: string[];
  suggested_exercises: string[];
  summary_text: string;
  crisis_detected: string | null;
  created_at: string;
}

interface Props {
  userId?: string;
}

export default function SessionSummaryPage({ userId }: Props) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [selected, setSelected] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetch(`${backendUrl}/summaries/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setSummaries(d);
        if (d.length) setSelected(d[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className="min-h-screen w-full text-gray-900 font-['JetBrains_Mono',monospace] px-4 py-8 mx-auto"
      style={{
        background:
          "linear-gradient(145deg,#f8fafc 0%,#eef2ff 50%,#f8fafc 100%)",
      }}
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[0.6rem] tracking-[0.3em] text-violet-500/60 uppercase mb-1 flex items-center gap-2">
            <span className="w-4 h-px bg-violet-400/40 inline-block" />
            Session Insights
          </p>
          <h1
            className="text-3xl font-black tracking-[0.15em] uppercase"
            style={{
              background: "linear-gradient(135deg,#6d28d9,#0e7490)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Summaries
          </h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-50">
          <span className="text-4xl">📋</span>
          <p className="text-sm tracking-wide text-center text-gray-600">
            End a therapy session to generate your first summary.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {summaries.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="shrink-0 px-4 py-2 rounded-full text-[0.65rem] tracking-wide transition-all"
                style={{
                  background: selected?.id === s.id ? "#ede9fe" : "#f1f5f9",
                  border: `1px solid ${
                    selected?.id === s.id ? "#c4b5fd" : "#e2e8f0"
                  }`,
                  color: selected?.id === s.id ? "#5b21b6" : "#475569",
                }}
              >
                {formatDate(s.created_at)}
              </button>
            ))}
          </div>
          {selected && (
            <div
              className="rounded-2xl overflow-hidden shadow-sm"
              style={{
                border: "1px solid #e5e7eb",
                background: "#ffffff",
              }}
            >
              {selected.crisis_detected && (
                <div
                  className="px-5 py-3 flex items-center gap-2"
                  style={{
                    background: "#fee2e2",
                    borderBottom: "1px solid #fecaca",
                  }}
                >
                  <span>⚠️</span>
                  <p className="text-red-600 text-xs">
                    Crisis language detected: "
                    <em>{selected.crisis_detected}</em>"
                  </p>
                </div>
              )}
              <div className="px-5 py-5">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selected.summary_text}
                </p>
              </div>
              <div className="px-5 pb-4">
                <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-2">
                  Emotions Detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selected.dominant_emotions || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([emo, cnt]) => (
                      <span
                        key={emo}
                        className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold text-white"
                        style={{
                          background: EMOTION_COLOR[emo] ?? "#999",
                        }}
                      >
                        {emo} ×{cnt}
                      </span>
                    ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 px-5 pb-5">
                <div>
                  <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-2">
                    Topics
                  </p>
                  {(selected.topics_discussed || []).map((t, i) => (
                    <p
                      key={i}
                      className="text-gray-600 text-xs flex items-start gap-1.5"
                    >
                      <span className="text-violet-500 mt-0.5">›</span>
                      {t}
                    </p>
                  ))}
                </div>

                <div>
                  <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-2">
                    Coping Strategies
                  </p>
                  {(selected.coping_strategies || []).map((s, i) => (
                    <p
                      key={i}
                      className="text-gray-600 text-xs flex items-start gap-1.5"
                    >
                      <span className="text-cyan-500 mt-0.5">›</span>
                      {s}
                    </p>
                  ))}
                </div>
              </div>
              {(selected.suggested_exercises || []).length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-2">
                    Suggested Exercises
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.suggested_exercises.map((ex, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-[0.65rem]"
                        style={{
                          background: "#ecfeff",
                          border: "1px solid #a5f3fc",
                          color: "#0e7490",
                        }}
                      >
                        {ex.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
