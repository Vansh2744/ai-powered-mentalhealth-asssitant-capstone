import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { cn } from "@/lib/utils";
import { useParams } from "react-router-dom";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  created_at: string;
  session_id: string;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatHistory() {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {sessionId} = useParams()

  useEffect(() => {

    const fetchMessages = async () => {
      const { data } = await axios.get(
        `${backendUrl}/chat/history/${sessionId}`
      );
      
      setMessages(data);
    };

    fetchMessages();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      {/* Header */}
      <div className="px-6 py-4 bg-white/70 backdrop-blur-md border-b shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          Chat Conversation
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] px-4 py-3 rounded-2xl shadow-sm text-sm",
                message.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border rounded-bl-sm"
              )}
            >
              <p className="whitespace-pre-wrap">
                {message.content}
              </p>

              <div
                className={cn(
                  "text-[10px] mt-2 text-right",
                  message.role === "user"
                    ? "text-indigo-200"
                    : "text-gray-400"
                )}
              >
                {formatTime(message.created_at)}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
