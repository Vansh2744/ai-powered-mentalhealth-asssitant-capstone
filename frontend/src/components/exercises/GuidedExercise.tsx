import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuidedExerciseProps {
  title: string;
  description: string;
  audio: string;
  script: string[];
  onClose: () => void;
}

export function GuidedExercise({
  title,
  description,
  audio,
  script,
  onClose,
}: GuidedExerciseProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const speakStep = (index: number) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script[index]);
    utter.rate = 0.9;

    utter.onend = () => {
      if (index < script.length - 1 && isPlaying) {
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, 2000);
      }
    };

    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!isPlaying) return;

    if (!audioRef.current) {
      const music = new Audio(audio);
      music.loop = true;
      music.volume = 0.4;
      audioRef.current = music;
      music.play().catch(() => {});
    }

    speakStep(currentStep);

    return () => {};
  }, [isPlaying, currentStep]);

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    window.speechSynthesis.cancel();
    audioRef.current?.pause();
    audioRef.current = null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex items-center gap-3 p-6 border-b bg-white/70">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="text-lg font-medium text-primary">
          {script[currentStep]}
        </div>

        {/* Progress Dots */}
        <div className="flex gap-2">
          {script.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i <= currentStep ? "bg-primary" : "bg-muted"
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
