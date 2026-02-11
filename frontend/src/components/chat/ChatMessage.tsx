import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: "user" | "assistant";
    timestamp: Date;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isAssistant ? "justify-start" : "justify-end",
      )}
    >
      {isAssistant && (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center shadow-sm">
          <Bot className="h-4 w-4 text-indigo-600" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-5 py-4 shadow-md transition-all duration-300",
          isAssistant
            ? "bg-white border border-gray-200 text-gray-800 rounded-tl-md"
            : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-md",
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={cn(
            "text-xs mt-3 opacity-70",
            isAssistant ? "text-gray-500" : "text-white/80",
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 text-purple-600" />
        </div>
      )}
    </div>
  );
}
