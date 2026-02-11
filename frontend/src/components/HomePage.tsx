import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Brain, MessageCircle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileDropdown } from "./user-profile/ProfileDropdown";

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-20">
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">MindfulAI</h1>
        </div>

        <div>
          <Button className="rounded-2xl" onClick={() => navigate("/therapy/")}>
            Get Started
          </Button>

          <ProfileDropdown />
        </div>
      </nav>
      <section className="max-w-7xl mx-auto px-8 py-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">
            Your Personal <span className="text-indigo-600">Mental Health</span>{" "}
            Companion
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Talk, reflect, and grow with AI-powered emotional support. Track
            your mood, understand your emotions, and build a healthier mindset —
            one conversation at a time.
          </p>
          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              className="rounded-2xl px-8"
              onClick={() => navigate("/chat/")}
            >
              Start Chatting
            </Button>
            <Button size="lg" variant="outline" className="rounded-2xl px-8">
              Learn More
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-xl"
        >
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">AI Assistant</p>
              <p className="text-gray-800">How are you feeling today?</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-right">
              <p className="text-sm text-gray-600">You</p>
              <p className="text-gray-800">
                I’ve been feeling a bit overwhelmed lately.
              </p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl">
              <p className="text-gray-800">
                That’s completely okay. Let’s break things down together and
                find small steps to help you feel lighter.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <h3 className="text-3xl font-bold text-center text-gray-800">
            Designed for Your Well-being
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <Card
              className="rounded-2xl shadow-md hover:shadow-xl transition group cursor-pointer"
              onClick={() => navigate("/chat/")}
            >
              <CardContent className="p-6 text-center">
                <MessageCircle
                  className="mx-auto text-indigo-600 group-hover:scale-110 transition"
                  size={32}
                />
                <h4 className="mt-4 font-semibold text-lg">Chatting</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Have real-time supportive conversations with your AI mental
                  health assistant anytime.
                </p>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl shadow-md hover:shadow-xl transition group cursor-pointer"
              onClick={() => navigate("/therapy/")}
            >
              <CardContent className="p-6 text-center">
                <Brain
                  className="mx-auto text-purple-600 group-hover:scale-110 transition"
                  size={32}
                />
                <h4 className="mt-4 font-semibold text-lg">Therapy</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Access guided AI-based therapy sessions designed to help you
                  manage stress and emotions.
                </p>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl shadow-md hover:shadow-xl transition group cursor-pointer"
              onClick={() => navigate("/exercise/")}
            >
              <CardContent className="p-6 text-center">
                <Heart
                  className="mx-auto text-pink-500 group-hover:scale-110 transition"
                  size={32}
                />
                <h4 className="mt-4 font-semibold text-lg">Exercises</h4>
                <p className="text-gray-600 text-sm mt-2">
                  Practice breathing exercises, mindfulness activities, and
                  daily reflections.
                </p>
              </CardContent>
            </Card>

            <Card
              className="rounded-2xl shadow-md hover:shadow-xl transition group cursor-pointer"
              onClick={() => navigate("/history/")}
            >
              <CardContent className="p-6 text-center">
                <Shield
                  className="mx-auto text-green-600 group-hover:scale-110 transition"
                  size={32}
                />
                <h4 className="mt-4 font-semibold text-lg">History</h4>
                <p className="text-gray-600 text-sm mt-2">
                  View and track your previous therapy and chat sessions to
                  monitor your progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h3 className="text-3xl font-bold">
            Take the First Step Toward Better Mental Health
          </h3>
          <p className="mt-4 text-lg opacity-90">
            Join thousands who are building healthier emotional habits with
            MindEase.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 rounded-2xl px-10"
            onClick={() => navigate("/therapy/")}
          >
            Try It Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 bg-white">
        © {new Date().getFullYear()} MindfulAI. All rights reserved.
      </footer>
    </div>
  );
}
