import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Heart, Plus, Sparkles, Clock } from "lucide-react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "../context/userContext";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
          `${backendUrl}/chat/session/${user?.id}`
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
        session_id: activeSessionId,
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

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,400&display=swap');

        .chat-page { font-family: 'DM Sans', sans-serif; }

        .chat-bg {
          background-color: #f8f7ff;
          background-image:
            radial-gradient(ellipse 60% 50% at 10% 20%, rgba(124,58,237,0.07) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 90% 80%, rgba(13,148,136,0.06) 0%, transparent 70%);
        }

        .message-enter {
          animation: msgIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .typing-dot {
          animation: typingBounce 1.1s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.18s; }
        .typing-dot:nth-child(3) { animation-delay: 0.36s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }

        .header-glass {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .input-glass {
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .session-badge {
          background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(13,148,136,0.08));
          border: 1px solid rgba(124,58,237,0.15);
        }
      `}</style>

      <div className="chat-page flex flex-col h-screen w-full chat-bg">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-full">

          {/* ── HEADER ── */}
          <div className="header-glass border-b border-gray-100 px-4 sm:px-6 py-3.5 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              {/* Left: avatar + info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shadow-md shadow-violet-200">
                    <Heart size={16} className="text-white fill-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h2
                    className="font-semibold text-gray-900 text-[0.95rem] leading-tight"
                    style={{ fontFamily: "'Fraunces', serif" }}
                  >
                    MindfulAI Therapist
                  </h2>
                  <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Online · Always here to listen
                  </p>
                </div>
              </div>

              {/* Right: session info + new chat */}
              <div className="flex items-center gap-2">
                {sessionId && (
                  <div className="hidden sm:flex session-badge rounded-xl px-3 py-1.5 items-center gap-1.5">
                    <Clock size={11} className="text-violet-500" />
                    <span className="text-[11px] text-violet-600 font-medium">{timeStr}</span>
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={handleNewChat}
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 gap-1.5 text-xs px-3 h-8"
                >
                  <Plus size={13} />
                  New Chat
                </Button>
              </div>
            </div>
          </div>

          {/* ── MESSAGES ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-1">
            {/* Session start marker */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[11px] text-gray-400 font-medium px-2 flex items-center gap-1">
                <Sparkles size={10} />
                Session started
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2.5 pt-2"
              >
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-violet-500 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <Heart size={12} className="text-white fill-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="typing-dot w-2 h-2 rounded-full bg-violet-400 inline-block" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-violet-400 inline-block" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-violet-400 inline-block" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── INPUT ── */}
          <div className="input-glass border-t border-gray-100 px-4 sm:px-6 py-4">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            <p className="text-center text-[10px] text-gray-300 mt-2">
              MindfulAI is not a substitute for professional mental health care.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}