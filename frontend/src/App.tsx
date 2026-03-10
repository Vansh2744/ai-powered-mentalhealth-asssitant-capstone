import { Route, Routes } from "react-router-dom";
import AuthPage from "./components/AuthPage";
import Therapist from "./components/Therapist";
import { ChatSection } from "./components/chat/ChatSection";
import { ExercisesSection } from "./components/exercises/ExercisesSection";
import { HistorySection } from "./components/history/HistorySection";
import HomePage from "./components/HomePage";
import Layout from "./components/Layout";
import AttendedSessions from "./components/attended-sessions/AttendedSessions";
import SessionPage from "./components/attended-sessions/SessionPage";
import { ChatHistory } from "./components/history/ChatHistory";
import Therapy from "./components/Therapy";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/auth/" element={<AuthPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat/" element={<ChatSection />} />
          <Route path="/therapy/" element={<Therapy />} />
          <Route path="/exercise/" element={<ExercisesSection />} />
          <Route path="/history/" element={<HistorySection />} />
          <Route path="/attended-sessions/" element={<AttendedSessions />} />
          <Route path="/session/:sessionId" element={<SessionPage />} />
          <Route path="/chat-history/:sessionId" element={<ChatHistory />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
