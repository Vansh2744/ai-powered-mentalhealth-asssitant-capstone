import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-3 p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-200 transition-all duration-200">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Share what's on your mind..."
        className="flex-1 resize-none bg-transparent border-none outline-none text-sm min-h-[24px] max-h-32 py-2 placeholder:text-gray-400"
        rows={1}
        disabled={isLoading}
      />

      <Button
        size="icon"
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
