import { Route, Routes, useNavigate } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import { ChatSection } from "./components/chat/ChatSection";
import { HistorySection } from "./components/history/HistorySection";
import HomePage from "./components/HomePage";
import Layout from "./components/Layout";
import { ChatHistory } from "./components/history/ChatHistory";
import Therapy from "./components/Therapy";
import ProtectedRoute from "./components/ProtectedRoute";
import Exercises from "./components/exercises/Exercises";
import SessionSummaryPage from "./components/attended-sessions/SessionSummaryPage";
import { useCurrentUser } from "./components/context/userContext";
import MoodTimeline from "./components/MoodTimeline";
import AnalyticsDashboard from "./components/history/AnalyticsDashboard";
import ReminderSettings from "./components/settings/ReminderSettings";
import { ProfileSection } from "./components/settings/ProfileSection";
import CopingPlan from "./components/CopingPlan";

const App = () => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  return (
    <div>
      <Routes>
        <Route path="/auth/" element={<AuthPage />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/" element={<ChatSection />} />
          <Route path="/therapy/" element={<Therapy />} />
          <Route path="/exercise/" element={<Exercises />} />
          <Route path="/history/" element={<HistorySection />} />
          <Route path="/chat-history/:sessionId" element={<ChatHistory />} />
          <Route
            path="/session-summary"
            element={<SessionSummaryPage userId={user?.id} />}
          />
          <Route
            path="/moodtimeline"
            element={<MoodTimeline userId={user?.id} />}
          />
          <Route
            path="/analytics"
            element={<AnalyticsDashboard userId={user?.id} />}
          />
          <Route
            path="/set-reminder"
            element={<ReminderSettings userId={user?.id} />}
          />
          <Route
            path="/profile"
            element={<ProfileSection userId={user?.id} />}
          />
          <Route
            path="/coping-plan"
            element={
              <CopingPlan
                userId={user?.id}
                onStartExercise={() => navigate("/exercise")}
              />
            }
          />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
