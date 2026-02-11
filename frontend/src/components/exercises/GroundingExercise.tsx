import { useState, useEffect } from "react";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
}

const steps = [
  "Take a slow deep breath.",
  "Name five things you can see.",
  "Name four things you can feel.",
  "Name three things you can hear.",
  "Name two things you can smell.",
  "Name one thing you are grateful for.",
];

export function GroundingExercise({ onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!isPlaying) return;

    speak(steps[stepIndex]);

    const timer = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex((prev) => prev + 1);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex]);

  const handleReset = () => {
    setIsPlaying(false);
    setStepIndex(0);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <div className="flex items-center p-6 border-b bg-white/70">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 font-semibold">5-4-3-2-1 Grounding</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-6">
        <p className="text-xl font-medium animate-fade-in">
          {steps[stepIndex]}
        </p>

        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i <= stepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

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
