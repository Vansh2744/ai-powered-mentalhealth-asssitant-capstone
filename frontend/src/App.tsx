import { Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import { ChatSection } from "./components/chat/ChatSection";
import { HistorySection } from "./components/history/HistorySection";
import HomePage from "./components/HomePage";
import Layout from "./components/Layout";
import AttendedSessions from "./components/attended-sessions/AttendedSessions";
import SessionPage from "./components/attended-sessions/SessionPage";
import { ChatHistory } from "./components/history/ChatHistory";
import Therapy from "./components/Therapy";
import ProtectedRoute from "./components/ProtectedRoute";
import Exercises from "./components/exercises/Exercises";
import SessionSummaryPage from "./components/SessionSummaryPage";
import { useCurrentUser } from "./components/context/userContext";
import MoodTimeline from "./components/MoodTimeline";
import AnalyticsDashboard from "./components/history/Analyticsdashboard";

const App = () => {
  const { user } = useCurrentUser();
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
          <Route path="/attended-sessions/" element={<AttendedSessions />} />
          <Route path="/session/:sessionId" element={<SessionPage />} />
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
        </Route>
      </Routes>
    </div>
  );
};

export default App;
