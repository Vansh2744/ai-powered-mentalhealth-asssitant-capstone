import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreathingExerciseProps {
  onClose: () => void;
}

type BreathPhase = "inhale" | "hold" | "exhale" | "rest";

const phaseConfig: Record<
  BreathPhase,
  { label: string; duration: number; instruction: string; voice: string }
> = {
  inhale: {
    label: "Breathe In",
    duration: 4,
    instruction: "Slowly fill your lungs",
    voice: "Breathe in slowly",
  },
  hold: {
    label: "Hold",
    duration: 4,
    instruction: "Gently hold your breath",
    voice: "Hold your breath",
  },
  exhale: {
    label: "Breathe Out",
    duration: 6,
    instruction: "Release slowly and completely",
    voice: "Now breathe out slowly",
  },
  rest: {
    label: "Rest",
    duration: 2,
    instruction: "Relax before the next breath",
    voice: "Relax",
  },
};

const phaseOrder: BreathPhase[] = ["inhale", "hold", "exhale", "rest"];

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>("inhale");
  const [timeLeft, setTimeLeft] = useState(phaseConfig.inhale.duration);
  const [cycleCount, setCycleCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  const speakPhase = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!isPlaying) return;

    speakPhase(phaseConfig[currentPhase].voice);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const currentIndex = phaseOrder.indexOf(currentPhase);
          const nextIndex = (currentIndex + 1) % phaseOrder.length;
          const nextPhase = phaseOrder[nextIndex];

          if (nextIndex === 0) {
            setCycleCount((c) => c + 1);
          }

          setCurrentPhase(nextPhase);
          speakPhase(phaseConfig[nextPhase].voice);

          return phaseConfig[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    if (audioRef.current) audioRef.current.play().catch(() => {});

    return () => clearInterval(timer);
  }, [isPlaying, currentPhase]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPhase("inhale");
    setTimeLeft(phaseConfig.inhale.duration);
    setCycleCount(0);
    window.speechSynthesis.cancel();
  };

  const progress = (timeLeft / phaseConfig[currentPhase].duration) * 100;
  const circleScale =
    currentPhase === "inhale" ? 1.15 : currentPhase === "exhale" ? 0.9 : 1;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex flex-col">
      <div className="flex items-center gap-4 px-8 py-6 bg-white/70 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">Deep Breathing</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        <div className="text-4xl font-bold text-indigo-600">{timeLeft}</div>
        <div className="text-lg">{phaseConfig[currentPhase].label}</div>

        <p className="text-gray-600">{phaseConfig[currentPhase].instruction}</p>

        <p className="text-sm text-muted-foreground">
          {cycleCount} cycles completed
        </p>

        <div className="flex gap-6 mt-6">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw />
          </Button>

          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause /> : <Play />}
          </Button>
        </div>
      </div>
    </div>
  );
}
