import { MessageCircle, Calendar, Clock, ArrowRight, Search, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface Chat {
  id: string;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Group chats by date label
function groupByDate(chats: Chat[]): { label: string; items: Chat[] }[] {
  const groups: Record<string, Chat[]> = {};
  chats.forEach((chat) => {
    const label = formatDate(chat.created_at);
    if (!groups[label]) groups[label] = [];
    groups[label].push(chat);
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

const pastelColors = [
  { bg: "bg-violet-100", icon: "text-violet-600" },
  { bg: "bg-teal-100",   icon: "text-teal-600"   },
  { bg: "bg-rose-100",   icon: "text-rose-500"   },
  { bg: "bg-amber-100",  icon: "text-amber-600"  },
  { bg: "bg-sky-100",    icon: "text-sky-600"    },
];

export function HistorySection() {
  const { user } = useCurrentUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstMessages, setFirstMessages] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchMessages = async (sessionId: string) => {
    try {
      const { data } = await axios.get(`${backendUrl}/chat/history/${sessionId}`);
      setFirstMessages((prev) => ({
        ...prev,
        [sessionId]: data.length > 0 ? data[0].content : "No messages yet",
      }));
    } catch {
      setFirstMessages((prev) => ({ ...prev, [sessionId]: "No messages yet" }));
    }
  };

  useEffect(() => {
    if (chats.length > 0) chats.forEach((c) => fetchMessages(c.id));
  }, [chats]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/all/chat/${user.id}`);
        setChats(data);
      } catch {
        console.error("Failed to fetch chats");
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [user?.id]);

  const filtered = chats.filter((c) => {
    const msg = firstMessages[c.id] ?? "";
    return msg.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = groupByDate(filtered);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,400&display=swap');

        .history-page { font-family: 'DM Sans', sans-serif; }

        .history-bg {
          background-color: #f8f7ff;
          background-image:
            radial-gradient(ellipse 70% 50% at 0% 0%, rgba(124,58,237,0.06) 0%, transparent 65%),
            radial-gradient(ellipse 50% 60% at 100% 100%, rgba(13,148,136,0.05) 0%, transparent 65%);
        }

        .chat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .chat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -8px rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.2);
        }

        .search-box:focus-within {
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }

        .skeleton {
          background: linear-gradient(90deg, #f0eeff 25%, #e8e4ff 50%, #f0eeff 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 16px;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="history-page history-bg min-h-screen w-full px-4 sm:px-8 lg:px-16 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto">

          {/* ── HEADER ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mb-8"
          >
            <p className="text-[11px] font-bold text-violet-500 uppercase tracking-[0.18em] mb-2">
              Your Journey
            </p>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight"
              style={{ fontFamily: "'Fraunces', serif" }}
            >
              Session History
            </h1>
            <p className="text-sm text-gray-400 mt-2">
              {chats.length > 0
                ? `${chats.length} conversation${chats.length !== 1 ? "s" : ""} on record`
                : "Your past conversations will appear here"}
            </p>
          </motion.div>

          {/* ── SEARCH ── */}
          {chats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
              className="mb-7"
            >
              <div className="search-box flex items-center gap-2.5 bg-white rounded-2xl border border-gray-200 px-4 py-3 transition-all">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search conversations…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm text-gray-700 placeholder-gray-300 outline-none bg-transparent"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-gray-300 hover:text-gray-500 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* ── LOADING SKELETONS ── */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-20 w-full" />
              ))}
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!loading && chats.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-24"
            >
              <div className="w-16 h-16 rounded-3xl bg-violet-50 border border-violet-100 flex items-center justify-center mx-auto mb-4">
                <Inbox size={28} className="text-violet-300" />
              </div>
              <h3
                className="text-lg font-medium text-gray-700 mb-1"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                No conversations yet
              </h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Start a chat session and it'll appear here for you to revisit.
              </p>
            </motion.div>
          )}

          {/* ── NO SEARCH RESULTS ── */}
          {!loading && chats.length > 0 && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-400 text-sm">No results for "{search}"</p>
            </motion.div>
          )}

          {/* ── GROUPED CHAT LIST ── */}
          {!loading && grouped.map(({ label, items }, groupIdx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: groupIdx * 0.06, ease: "easeOut" }}
              className="mb-7"
            >
              {/* Date group label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  {label}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-2.5">
                {items.map((chat, i) => {
                  const color = pastelColors[i % pastelColors.length];
                  const msg = firstMessages[chat.id];

                  return (
                    <button
                      key={chat.id}
                      onClick={() => navigate(`/chat-history/${chat.id}`)}
                      className={cn(
                        "chat-card w-full flex items-center gap-4 p-4 sm:p-5 rounded-2xl",
                        "bg-white text-left group"
                      )}
                    >
                      {/* Icon */}
                      <div
                        className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0",
                          color.bg
                        )}
                      >
                        <MessageCircle size={18} className={color.icon} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate leading-snug">
                          {msg === undefined ? (
                            <span className="text-gray-300 italic">Loading…</span>
                          ) : (
                            msg
                          )}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Calendar size={10} />
                            {formatDate(chat.created_at)}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock size={10} />
                            {formatTime(chat.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0 w-7 h-7 rounded-xl bg-gray-50 group-hover:bg-violet-50 flex items-center justify-center transition-colors">
                        <ArrowRight
                          size={13}
                          className="text-gray-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}

        </div>
      </div>
    </>
  );
}