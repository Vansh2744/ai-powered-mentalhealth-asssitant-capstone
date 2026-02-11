import { useState, useEffect } from "react";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onClose: () => void;
}

const affirmations = [
  "I am strong.",
  "I am capable.",
  "I believe in myself.",
  "I am growing every day.",
  "I deserve peace and happiness.",
];

export function AffirmationExercise({ onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [index, setIndex] = useState(0);

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (!isPlaying) return;

    speak(affirmations[index]);

    const timer = setTimeout(() => {
      if (index < affirmations.length - 1) {
        setIndex((prev) => prev + 1);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isPlaying, index]);

  const handleReset = () => {
    setIsPlaying(false);
    setIndex(0);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-100 to-orange-100 flex flex-col">
      <div className="flex items-center p-6 border-b bg-white/70">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 font-semibold">Positive Affirmations</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-6">
        <p className="text-2xl font-semibold text-orange-600 animate-pulse">
          {affirmations[index]}
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
