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
interface Reminder {
  exercise_id: string;
  reminder_time: string; // "HH:MM"
  enabled: boolean;
}

interface Props {
  userId?: string;
}

export default function ReminderSettings({ userId }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [exId, setExId] = useState("box-breathing");
  const [time, setTime] = useState("20:00");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load exercises + existing reminder
  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`${API}/exercises`).then((r) => r.json()),
      fetch(`${API}/reminder/${userId}`).then((r) => r.json()),
    ])
      .then(([exList, reminderData]) => {
        setExercises(exList);
        if (reminderData.reminder) {
          const r: Reminder = reminderData.reminder;
          setReminder(r);
          setExId(r.exercise_id);
          // Convert stored UTC time → local for the <input type="time">
          setTime(utcToLocal(r.reminder_time));
          setEnabled(r.enabled);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const utcTime = localToUtc(time); // always store as UTC in DB
      await fetch(`${API}/reminder/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: exId,
          reminder_time: utcTime,
          enabled,
        }),
      });
      setReminder({ exercise_id: exId, reminder_time: utcTime, enabled });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const selectedEx = exercises.find((e) => e.id === exId);

  // Convert local HH:MM → UTC HH:MM (for storing in DB)
  const localToUtc = (hhmm: string): string => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return (
      d.getUTCHours().toString().padStart(2, "0") +
      ":" +
      d.getUTCMinutes().toString().padStart(2, "0")
    );
  };

  // Convert UTC HH:MM → local HH:MM (for displaying to user)
  const utcToLocal = (hhmm: string): string => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setUTCHours(h, m, 0, 0);
    return (
      d.getHours().toString().padStart(2, "0") +
      ":" +
      d.getMinutes().toString().padStart(2, "0")
    );
  };

  // Format HH:MM for display (12h with AM/PM)
  const formatTime = (hhmm: string): string => {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // ONLY colors changed — structure untouched

  return (
    <div
      className="min-h-screen w-full text-gray-900 font-['JetBrains_Mono',monospace] px-4 py-8 mx-auto"
      style={{
        background:
          "linear-gradient(145deg,#f8fafc 0%,#eef2f7 50%,#f8fafc 100%)",
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-200/40 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-200/40 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-[0.6rem] tracking-[0.3em] text-cyan-600 uppercase mb-1 flex items-center gap-2">
          <span className="w-4 h-px bg-cyan-500 inline-block" />
          Notifications
        </p>

        <h1
          className="text-3xl font-black tracking-[0.15em] uppercase"
          style={{
            fontFamily: "'Syne',sans-serif",
            background: "linear-gradient(135deg,#0891b2,#7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Reminders
        </h1>

        <p className="text-gray-500 text-xs mt-1 tracking-wide">
          Get a daily email reminder to do your exercise.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* STATUS */}
          {reminder && (
            <div
              className="rounded-2xl px-5 py-4 flex items-center gap-3"
              style={{
                background: reminder.enabled
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(0,0,0,0.03)",
                border: `1px solid ${
                  reminder.enabled ? "rgba(16,185,129,0.3)" : "rgba(0,0,0,0.1)"
                }`,
              }}
            >
              <span className="text-xl">{reminder.enabled ? "🔔" : "🔕"}</span>
              <div>
                <p className="text-gray-900 text-sm font-semibold">
                  {reminder.enabled ? "Reminder active" : "Reminder disabled"}
                </p>
                {reminder.enabled && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    Daily at{" "}
                    <span className="text-gray-700">
                      {formatTime(utcToLocal(reminder.reminder_time))}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* EXERCISE PICKER */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div className="px-5 py-3 border-b border-black/5">
              <p className="text-gray-400 text-[0.6rem] tracking-widest uppercase">
                Choose Exercise
              </p>
            </div>

            <div className="flex flex-col divide-y divide-black/5">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setExId(ex.id)}
                  className="flex items-center gap-4 px-5 py-4 text-left"
                  style={{
                    background:
                      exId === ex.id ? `${ex.color}15` : "transparent",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: `${ex.color}20` }}
                  >
                    {ex.icon}
                  </div>

                  <div className="flex-1">
                    <p className="text-gray-900 text-sm font-semibold">
                      {ex.title}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {ex.subtitle} · {ex.duration}
                    </p>
                  </div>

                  {exId === ex.id && (
                    <span
                      className="text-[0.6rem] font-bold uppercase"
                      style={{ color: ex.color }}
                    >
                      Selected
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* TIME PICKER */}
          <div
            className="rounded-2xl px-5 py-4"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <p className="text-gray-400 text-[0.6rem] uppercase mb-3">
              Reminder Time
            </p>

            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-xl px-4 py-2 text-gray-900"
              style={{
                background: "#f1f5f9",
                border: "1px solid rgba(0,0,0,0.1)",
              }}
            />
          </div>

          {/* ✅ PREVIEW (RESTORED) */}
          {selectedEx && (
            <div
              className="rounded-2xl px-5 py-4"
              style={{
                background: `${selectedEx.color}10`,
                border: `1px solid ${selectedEx.color}30`,
              }}
            >
              <p className="text-gray-400 text-[0.6rem] uppercase mb-2">
                Preview — What you'll receive
              </p>

              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedEx.icon}</span>
                <div>
                  <p className="text-gray-900 text-sm font-semibold">
                    {selectedEx.title}
                  </p>
                  <p className="text-gray-500 text-xs">{selectedEx.subtitle}</p>
                </div>
              </div>

              <p className="text-gray-500 text-xs mt-2">
                You'll receive a daily email at{" "}
                <span className="text-gray-700">{formatTime(time)}</span>
              </p>
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleSave}
            className="py-3 rounded-2xl font-bold text-white"
            style={{ background: "#0891b2" }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Saving…
              </span>
            ) : saved ? (
              "✓ Saved"
            ) : (
              "Save Reminder"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
