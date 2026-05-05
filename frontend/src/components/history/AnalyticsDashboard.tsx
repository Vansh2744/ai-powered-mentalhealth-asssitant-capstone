import { backendUrl } from "@/utils/backendUrl";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* ================= TYPES ================= */
interface HeatmapDay {
  date: string;
  dominant: string;
  counts: Record<string, number>;
  total: number;
}
interface AlignDay {
  date: string;
  match_pct: number;
  total: number;
}
interface AlignData {
  overall_match_pct: number | null;
  total_analyzed: number;
  total_matched: number;
  daily: AlignDay[];
  mismatch_breakdown: Record<string, number>;
}
interface StreakDay {
  date: string;
  day: string;
  has_session: boolean;
}
interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days: number;
  today_done: boolean;
  last_7: StreakDay[];
}

/* ================= CONFIG ================= */
const EMOTION_COLOR: Record<string, string> = {
  happy: "#00ff88",
  sad: "#6699ff",
  angry: "#ff4444",
  fear: "#cc44ff",
  fearful: "#cc44ff",
  neutral: "#aaaaaa",
  surprise: "#ffaa00",
  disgust: "#88cc00",
  calm: "#44ddcc",
};

/* ================= COMMON UI ================= */
function Spinner() {
  return (
    <div className="flex items-center justify-center h-40 gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-gray-500 text-[0.6rem] tracking-widest uppercase mb-3">
      {children}
    </p>
  );
}

/* ================= STREAK ================= */
function StreakPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<StreakData | null>(null);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    fetch(`${backendUrl}/analytics/streak/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoad(false));
  }, [userId]);

  if (load)
    return (
      <Card>
        <Spinner />
      </Card>
    );
  if (!data) return null;

  return (
    <Card>
      <SectionLabel>Session Streak</SectionLabel>

      <div className="flex items-end gap-6 mb-5">
        <div>
          <p className="text-5xl font-black text-orange-500">
            {data.current_streak}
          </p>
          <p className="text-gray-500 text-xs uppercase">Current</p>
        </div>

        <div>
          <p className="text-gray-700 text-sm">
            {data.current_streak} days streak 🔥
          </p>
          <p className="text-gray-500 text-xs">
            Best: {data.longest_streak}d · Total: {data.total_days}d
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {data.last_7.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <div
              className="h-10 rounded-lg flex items-center justify-center"
              style={{
                background: d.has_session ? "#fde68a" : "#f1f5f9",
              }}
            >
              {d.has_session ? "✓" : ""}
            </div>
            <span className="text-gray-400 text-xs">{d.day}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================= HEATMAP ================= */
function HeatmapPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<HeatmapDay[]>([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    fetch(`${backendUrl}/analytics/heatmap/${userId}?weeks=12`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoad(false));
  }, [userId]);

  if (load)
    return (
      <Card>
        <Spinner />
      </Card>
    );

  return (
    <Card>
      <SectionLabel>Emotion Heatmap</SectionLabel>

      <div className="grid grid-cols-12 gap-1">
        {data.map((d) => (
          <div
            key={d.date}
            className="h-4 rounded"
            style={{
              background: EMOTION_COLOR[d.dominant] || "#e5e7eb",
              opacity: d.total ? 0.7 : 0.3,
            }}
          />
        ))}
      </div>
    </Card>
  );
}

/* ================= ALIGNMENT ================= */
function AlignmentPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<AlignData | null>(null);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    fetch(`${backendUrl}/analytics/alignment/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoad(false));
  }, [userId]);

  if (load)
    return (
      <Card>
        <Spinner />
      </Card>
    );
  if (!data) return null;

  return (
    <Card>
      <SectionLabel>Alignment</SectionLabel>

      <p className="text-3xl font-bold text-indigo-600">
        {data.overall_match_pct ?? 0}%
      </p>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data.daily}>
          <CartesianGrid stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
            }}
          />
          <Line
            type="monotone"
            dataKey="match_pct"
            stroke="#6366f1"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

/* ================= MAIN ================= */
export default function AnalyticsDashboard({ userId }: { userId?: string }) {
  return (
    <div
      className="min-h-screen w-full text-gray-900 px-4 py-8"
      style={{
        background:
          "linear-gradient(145deg,#f8fafc 0%,#eef2ff 50%,#f8fafc 100%)",
      }}
    >
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      {!userId ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-5">
          <StreakPanel userId={userId} />
          <HeatmapPanel userId={userId} />
          <AlignmentPanel userId={userId} />
        </div>
      )}
    </div>
  );
}
