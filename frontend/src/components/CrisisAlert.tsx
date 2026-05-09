import { useEffect, useRef } from "react";
import type { CrisisData } from "../types";

interface Props {
  crisis: CrisisData;
  onDismiss: () => void;
}

export default function CrisisAlert({ crisis, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const isCritical = crisis.tier <= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-3xl overflow-hidden outline-none"
        style={{
          border: `1.5px solid ${isCritical ? "#ff444460" : "#ffaa0060"}`,
          boxShadow: `0 0 60px ${isCritical ? "#ff444430" : "#ffaa0025"}`,
        }}
      >
        <div
          className="px-6 py-4 flex items-center gap-3"
          style={{
            background: isCritical
              ? "linear-gradient(135deg,#7f1d1d,#450a0a)"
              : "linear-gradient(135deg,#78350f,#292524)",
          }}
        >
          <span className="text-3xl">{isCritical ? "🆘" : "💛"}</span>
          <div>
            <p className="text-white font-bold text-sm tracking-wide">
              {isCritical ? "You're Not Alone" : "We're Here With You"}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              {isCritical
                ? "It sounds like you're in a lot of pain right now."
                : "It seems like things feel heavy. That's okay."}
            </p>
          </div>
        </div>

        <div className="bg-[#0f0f0f] px-6 py-5 flex flex-col gap-4">
          <p className="text-white/80 text-sm leading-relaxed">
            {isCritical
              ? "Please reach out to one of these support lines right now. Trained counsellors are ready to listen — for free, anytime."
              : "You don't have to carry this alone. These support lines are free and confidential."}
          </p>

          <div className="flex flex-col gap-2">
            {crisis.helplines.map((h, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <p className="text-white text-xs font-semibold">{h.name}</p>
                  <p className="text-white/40 text-[0.6rem] tracking-wide">
                    {h.available}
                  </p>
                </div>
                <a
                  href={`tel:${h.number.replace(/\s/g, "")}`}
                  className="px-3 py-1.5 rounded-full text-[0.65rem] font-bold tracking-widest"
                  style={{
                    background: isCritical ? "#ff4444" : "#f59e0b",
                    color: "#000",
                  }}
                >
                  {h.number}
                </a>
              </div>
            ))}
          </div>

          {!isCritical && (
            <button
              onClick={onDismiss}
              className="mt-1 text-white/40 text-xs tracking-widest uppercase hover:text-white/70 transition-colors"
            >
              Continue session →
            </button>
          )}
          {isCritical && (
            <p className="text-white/30 text-[0.6rem] text-center">
              Please speak to someone before continuing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
