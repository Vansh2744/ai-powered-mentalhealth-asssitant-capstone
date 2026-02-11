import { Wind, Heart, Sun, Moon, Waves, TreePine } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import { useState } from "react";
import { BreathingExercise } from "./BreathingExercise";
import { GroundingExercise } from "./GroundingExercise";
import { AffirmationExercise } from "./AffirmationExercise";
import { AnxietyReleaseExercise } from "./AnxietyReleaseExercise";

const exercises = [
  {
    id: "breathing",
    title: "Deep Breathing",
    description: "A guided breathing exercise to calm your mind.",
    duration: "5 min",
    icon: Wind,
    gradient: "bg-gradient-to-br from-primary to-primary/70",
  },
  {
    id: "grounding",
    title: "5-4-3-2-1 Grounding",
    description: "Calm anxiety using your senses.",
    duration: "6 min",
    icon: Waves,
    gradient: "bg-gradient-to-br from-blue-400 to-indigo-500",
  },
  {
    id: "affirmations",
    title: "Positive Affirmations",
    description: "Boost confidence and self-belief.",
    duration: "7 min",
    icon: Sun,
    gradient: "bg-gradient-to-br from-yellow-400 to-orange-500",
  },
  {
    id: "anxiety-release",
    title: "Anxiety Release",
    description: "Let go of anxious thoughts.",
    duration: "10 min",
    icon: Moon,
    gradient: "bg-gradient-to-br from-purple-400 to-indigo-500",
  },
];

export function ExercisesSection() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);

  const handleStartExercise = (id: string) => {
    setActiveExercise(id);
  };

  const handleCloseExercise = () => {
    setActiveExercise(null);
  };

  // 🔥 Separate full screen pages
  if (activeExercise === "breathing") {
    return <BreathingExercise onClose={handleCloseExercise} />;
  }

  if (activeExercise === "grounding") {
    return <GroundingExercise onClose={handleCloseExercise} />;
  }

  if (activeExercise === "affirmations") {
    return <AffirmationExercise onClose={handleCloseExercise} />;
  }

  if (activeExercise === "anxiety-release") {
    return <AnxietyReleaseExercise onClose={handleCloseExercise} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col px-20 py-10">
      <div className="px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Wellness Exercises 🌿
        </h2>
        <p className="text-gray-600 mt-2">
          Guided practices to calm your mind and support your emotional
          wellbeing.
        </p>
      </div>

      <div className="flex-1 px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              title={exercise.title}
              description={exercise.description}
              duration={exercise.duration}
              icon={exercise.icon}
              gradient={exercise.gradient}
              onStart={() => handleStartExercise(exercise.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
