import { backendUrl } from "@/utils/backendUrl";
import axios from "axios";
import { useEffect, useState } from "react";
import { useCurrentUser } from "../context/userContext";
import { Spinner } from "../ui/spinner";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { History, CalendarDays } from "lucide-react";

interface Session {
  id: string;
  classification: string;
  evaluation: string;
  created_at: string;
}

const AttendedSessions = () => {
  const { user } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const getSessions = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/session-history/${user.id}`);
        setSessions(res.data);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    getSessions();
  }, [user?.id]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 md:px-16 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <History className="text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Your Session History
            </h1>
          </div>
          <p className="text-gray-600">
            Review your past therapy and chat sessions to reflect on your
            emotional journey.
          </p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Spinner className="h-8 w-8" />
          </div>
        ) : sessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/session/${session.id}`}>
                  <Card className="rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-md shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <CalendarDays size={16} />
                          {new Date(session.created_at).toLocaleString()}
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 font-medium">
                          {session.classification}
                        </span>
                      </div>

                      <p className="text-gray-700 text-sm line-clamp-3">
                        {session.evaluation}
                      </p>

                      <div className="mt-4 text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition">
                        View Details →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-20 bg-white/70 rounded-2xl shadow-sm">
            <History className="text-indigo-400 mb-4" size={40} />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Sessions Yet
            </h2>
            <p className="text-gray-600 max-w-md">
              You haven’t attended any therapy or chat sessions yet. Start a new
              session and begin your mental wellness journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendedSessions;
