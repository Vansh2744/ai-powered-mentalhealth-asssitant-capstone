import { backendUrl } from "@/utils/backendUrl";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, AlertTriangle, Flame, HeartPulse } from "lucide-react";

const getBadgeStyle = (classification: string) => {
  switch (classification) {
    case "Stable":
      return "bg-green-100 text-green-700";
    case "Mild Emotional Strain":
      return "bg-yellow-100 text-yellow-700";
    case "Moderate Emotional Strain":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
};

const getIcon = (classification: string) => {
  switch (classification) {
    case "Stable":
      return <BadgeCheck className="text-green-600" />;
    case "Mild Emotional Strain":
      return <HeartPulse className="text-yellow-600" />;
    case "Moderate Emotional Strain":
      return <Flame className="text-orange-600" />;
    default:
      return <AlertTriangle className="text-red-600" />;
  }
};

const SessionPage = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState({
    classification: "",
    evaluation: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/session/${sessionId}`);
        setSession({
          classification: data.classification,
          evaluation: data.evaluation,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getSession();
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 md:px-16 py-12 w-full">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl shadow-xl border border-gray-200 bg-white/90 backdrop-blur-md">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                🧾 Mental Wellness Evaluation
              </h2>

              {loading ? (
                <p className="text-gray-500">Loading session details...</p>
              ) : (
                <>
                  {/* Classification Badge */}
                  <div className="flex items-center gap-3 mb-6">
                    {getIcon(session.classification)}
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${getBadgeStyle(
                        session.classification,
                      )}`}
                    >
                      {session.classification}
                    </span>
                  </div>

                  {/* Evaluation Content */}
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                    {session.evaluation}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SessionPage;
