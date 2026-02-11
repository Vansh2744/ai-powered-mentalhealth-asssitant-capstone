import { useState, useEffect } from "react";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
}

const steps = [
  "Close your eyes.",
  "Take a slow deep breath.",
  "Notice your anxious thoughts.",
  "Do not fight them.",
  "Let them pass like clouds.",
  "You are safe in this moment.",
];

export function AnxietyReleaseExercise({ onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [step, setStep] = useState(0);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!isPlaying) return;

    speak(steps[step]);

    const timer = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep((prev) => prev + 1);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  const handleReset = () => {
    setIsPlaying(false);
    setStep(0);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-100 to-indigo-100 flex flex-col">
      <div className="flex items-center p-6 border-b bg-white/70">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 font-semibold">Anxiety Release</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-6">
        <p className="text-xl font-medium animate-fade-in">
          {steps[step]}
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
