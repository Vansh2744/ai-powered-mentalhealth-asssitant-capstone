import { backendUrl } from "@/utils/backendUrl";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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

const EMOTION_ORDER = [
  "happy",
  "calm",
  "neutral",
  "surprise",
  "sad",
  "fear",
  "fearful",
  "angry",
  "disgust",
];

interface DayData {
  date: string;
  dominant: string;
  counts: Record<string, number>;
  total: number;
}

interface Props {
  userId?: string;
}

export default function MoodTimeline({ userId }: Props) {
  const [data, setData] = useState<DayData[]>([]);
  const [heatmap, setHeatmap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      fetch(`${backendUrl}/mood/timeline/${userId}?days=${days}`).then((r) =>
        r.json(),
      ),
      fetch(`${backendUrl}/mood/heatmap/${userId}`).then((r) => r.json()),
    ])
      .then(([timeline, hm]) => {
        setData(timeline);
        setHeatmap(hm);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, days]);

  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    emotionIndex: EMOTION_ORDER.indexOf(d.dominant),
    dominant: d.dominant,
    total: d.total,
    ...d.counts,
  }));

  const dowInsight = (() => {
    if (!Object.keys(heatmap).length) return null;
    const worst = Object.entries(heatmap)
      .filter(
        ([, v]: any) =>
          v.dominant &&
          ["sad", "angry", "fear", "fearful"].includes(v.dominant),
      )
      .sort((a: any, b: any) => b[1].total - a[1].total)[0];
    return worst
      ? `You tend to feel ${worst[1].dominant} most on ${worst[0]}s.`
      : null;
  })();

  const DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <div
      className="min-h-screen w-full text-gray-900 font-['JetBrains_Mono',monospace] px-4 py-8 mx-auto"
      style={{
        background:
          "linear-gradient(145deg,#f8fafc 0%,#eef2ff 50%,#f8fafc 100%)",
      }}
    >
      {/* Header */}
      <div className="mb-8">
        <p className="text-[0.6rem] tracking-[0.3em] text-cyan-600/70 uppercase mb-1 flex items-center gap-2">
          <span className="w-4 h-px bg-cyan-500/40 inline-block" />
          Emotional Intelligence
        </p>

        <h1
          className="text-3xl font-black tracking-[0.15em] uppercase"
          style={{
            background: "linear-gradient(135deg,#0e7490,#6d28d9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Mood Timeline
        </h1>

        {dowInsight && (
          <p className="mt-2 text-gray-500 text-xs tracking-wide">
            💡 {dowInsight}
          </p>
        )}
      </div>

      {/* Range selector */}
      <div className="flex gap-2 mb-6">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className="px-3 py-1 rounded-full text-[0.65rem] tracking-widest uppercase transition-all"
            style={{
              background: days === d ? "#ecfeff" : "#f1f5f9",
              border: `1px solid ${days === d ? "#67e8f9" : "#e2e8f0"}`,
              color: days === d ? "#0e7490" : "#475569",
            }}
          >
            {d}d
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-50">
          <span className="text-4xl">📊</span>
          <p className="text-sm tracking-wide text-gray-600">
            No data yet — complete a therapy session first.
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div
            className="rounded-2xl p-4 mb-6 shadow-sm"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-4">
              Emotion Over Time
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="emoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0891b2" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                />
                <YAxis hide domain={[0, EMOTION_ORDER.length - 1]} />

                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#6b7280", fontSize: 11 }}
                  formatter={(_, __, props: any) => [
                    <span
                      style={{
                        color: EMOTION_COLOR[props.payload.dominant] ?? "#000",
                        fontWeight: 700,
                      }}
                    >
                      {props.payload.dominant?.toUpperCase()}
                    </span>,
                    "Mood",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="emotionIndex"
                  stroke="#0891b2"
                  fill="url(#emoGrad)"
                  strokeWidth={2}
                  dot={{ fill: "#0891b2", r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {data
              .slice(-6)
              .reverse()
              .map((d) => {
                const color = EMOTION_COLOR[d.dominant] ?? "#aaa";
                return (
                  <div
                    key={d.date}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <p className="text-gray-500 text-[0.6rem] tracking-widest mb-1">
                      {d.date}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded-full text-[0.65rem] font-bold text-white"
                      style={{ background: color }}
                    >
                      {d.dominant.toUpperCase()}
                    </span>
                    <p className="text-gray-400 text-[0.6rem] mt-1">
                      {d.total} check-in{d.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
          </div>

          {/* Heatmap */}
          <div
            className="rounded-2xl p-4 shadow-sm"
            style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
          >
            <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-3">
              Weekly Pattern
            </p>

            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((day) => {
                const d = heatmap[day];
                const color = d?.dominant
                  ? (EMOTION_COLOR[d.dominant] ?? "#ccc")
                  : "#e5e7eb";

                return (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className="w-full aspect-square rounded-lg"
                      style={{
                        background: color,
                        opacity: d?.total
                          ? Math.min(0.3 + d.total * 0.1, 1)
                          : 0.3,
                      }}
                      title={d?.dominant ?? "no data"}
                    />
                    <span className="text-gray-400 text-[0.5rem] uppercase">
                      {day.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-3 flex-wrap">
              {Object.entries(EMOTION_COLOR)
                .slice(0, 7)
                .map(([emo, col]) => (
                  <div key={emo} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: col }}
                    />
                    <span className="text-gray-400 text-[0.55rem] uppercase">
                      {emo}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
