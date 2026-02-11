import { MessageCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "../context/userContext";
import { useNavigate } from "react-router-dom";

interface Chat {
  id: string;
  created_at: string;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
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

export function HistorySection() {
  const { user } = useCurrentUser();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/all/chat/${user.id}`);

        setChats(data);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user?.id]);

  return (
    <div className="flex flex-col min-h-screen w-full px-20 py-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Session History
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review your past conversations
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {loading && <p className="text-gray-500 text-sm">Loading history...</p>}

        {!loading && chats.length === 0 && (
          <div className="text-center mt-20">
            <MessageCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500">No conversations yet</p>
          </div>
        )}

        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => navigate(`/chat-history/${chat.id}`)}
            className={cn(
              "w-full flex items-center gap-4 p-5 rounded-2xl",
              "bg-white shadow-sm border border-gray-100",
              "hover:shadow-md hover:-translate-y-1",
              "transition-all duration-200 text-left",
            )}
          >
            {/* Icon */}
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">Chat Session</h3>

              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(chat.created_at)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
