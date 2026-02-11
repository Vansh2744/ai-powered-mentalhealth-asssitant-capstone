import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Sparkles } from "lucide-react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "../context/userContext";
import { Button } from "../ui/button";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'm here to support you on your mental wellness journey. How are you feeling today?",
    role: "assistant",
    timestamp: new Date(),
  },
];

export function ChatSection() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState("");

  const { user } = useCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);

    try {
      let activeSessionId = sessionId;

      if (!activeSessionId) {
        const sessionRes = await axios.post(
          `${backendUrl}/chat/session/${user?.id}`,
        );

        activeSessionId = sessionRes.data.session_id;
        setSessionId(activeSessionId);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        role: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      await axios.post(`${backendUrl}/chat/message`, {
        session_id: activeSessionId,
        role: "user",
        content,
      });

      const { data } = await axios.post(`${backendUrl}/chat`, {
        message: content,
        session_id: activeSessionId
      });

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiResponse]);

      await axios.post(`${backendUrl}/chat/message`, {
        session_id: activeSessionId,
        role: "assistant",
        content: data.response,
      });
    } catch (error) {
      console.error("Message sending failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages(initialMessages);
    setSessionId("");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 backdrop-blur-md bg-white/70 border-b border-gray-200 sticky top-0 z-0 rounded-b-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-800">
                MindfulAI Therapist
              </h2>
              <p className="text-xs text-gray-500">Always here to listen 🌿</p>
            </div>
          </div>
          <div>
            <Button
              className="float-end bg-indigo-600 hover:bg-indigo-500"
              onClick={handleNewChat}
            >
              New Chat
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce delay-150" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 backdrop-blur-md bg-white/70 border-t border-gray-200 rounded-t-2xl">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
