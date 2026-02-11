import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExerciseCardProps {
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  gradient: string;
  onStart: () => void;
}

export function ExerciseCard({
  title,
  description,
  duration,
  icon: Icon,
  gradient,
  onStart,
}: ExerciseCardProps) {
  return (
    <div className="group bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:-translate-y-1">
      <div
        className={cn(
          "h-14 w-14 rounded-xl flex items-center justify-center mb-4 shadow-soft transition-transform duration-300 group-hover:scale-105",
          gradient,
        )}
      >
        <Icon className="h-7 w-7 text-primary-foreground" />
      </div>

      <h3 className="font-semibold text-gray-800 text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-5 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {duration}
        </span>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
          onClick={onStart}
        >
          Start
        </Button>
      </div>
    </div>
  );
}
