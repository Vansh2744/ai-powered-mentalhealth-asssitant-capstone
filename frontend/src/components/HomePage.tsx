import { motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Brain,
  MessageCircle,
  Shield,
  ArrowRight,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileDropdown } from "./user-profile/ProfileDropdown";
import { useState } from "react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: MessageCircle,
    color: "text-violet-500",
    bg: "bg-violet-50",
    border: "border-violet-100",
    label: "Chatting",
    desc: "Real-time supportive conversations with your AI mental health assistant, available anytime.",
    route: "/chat/",
  },
  {
    icon: Brain,
    color: "text-teal-500",
    bg: "bg-teal-50",
    border: "border-teal-100",
    label: "Therapy",
    desc: "Guided AI-based therapy sessions designed to help you manage stress and emotions.",
    route: "/therapy/",
  },
  {
    icon: Heart,
    color: "text-rose-400",
    bg: "bg-rose-50",
    border: "border-rose-100",
    label: "Exercises",
    desc: "Breathing exercises, mindfulness activities, and daily reflections to ground you.",
    route: "/exercise/",
  },
  {
    icon: Shield,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    label: "History",
    desc: "Track and revisit previous sessions to see how far you've come on your journey.",
    route: "/history/",
  },
];

const stats = [
  { value: "10k+", label: "Active Users" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "24/7", label: "Always Available" },
  { value: "50k+", label: "Sessions Completed" },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen font-sans"
      style={{ fontFamily: "'DM Sans', 'Instrument Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,400&display=swap');

        .display-font { font-family: 'Fraunces', Georgia, serif; }

        .hero-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          pointer-events: none;
        }

        .feature-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 48px -12px rgba(0,0,0,0.12);
        }

        .chat-bubble {
          animation: float 4s ease-in-out infinite;
        }
        .chat-bubble:nth-child(2) { animation-delay: 0.8s; }
        .chat-bubble:nth-child(3) { animation-delay: 1.6s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }

        .gradient-text {
          background: linear-gradient(135deg, #7c3aed 0%, #0d9488 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .nav-link {
          position: relative;
          color: #4b5563;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1.5px;
          background: #7c3aed;
          transition: width 0.25s ease;
        }
        .nav-link:hover { color: #7c3aed; }
        .nav-link:hover::after { width: 100%; }

        .stat-card {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.9);
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
              <Heart size={16} className="text-white fill-white" />
            </div>
            <span className="font-semibold text-gray-900 text-[1rem] tracking-tight">
              Mindful<span className="text-violet-600">AI</span>
            </span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#chat-preview" className="nav-link">
              How It Works
            </a>
            <a href="#cta" className="nav-link">
              About
            </a>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              size="sm"
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 px-4"
              onClick={() => navigate("/therapy/")}
            >
              Get Started
            </Button>
            <ProfileDropdown />
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-100 bg-white px-5 pb-4"
          >
            <div className="flex flex-col gap-3 pt-3">
              <a
                href="#features"
                className="text-gray-600 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#chat-preview"
                className="text-gray-600 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#cta"
                className="text-gray-600 text-sm py-1"
                onClick={() => setMenuOpen(false)}
              >
                About
              </a>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  size="sm"
                  className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => {
                    navigate("/therapy/");
                    setMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
                <ProfileDropdown />
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50/60 via-white to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background blobs */}
        <div className="hero-blob w-72 h-72 sm:w-96 sm:h-96 bg-violet-300 top-[-80px] left-[-80px]" />
        <div className="hero-blob w-64 h-64 sm:w-80 sm:h-80 bg-teal-200 bottom-0 right-[-60px]" />
        <div className="hero-blob w-48 h-48 bg-rose-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
            >
              <Sparkles size={12} />
              AI-Powered Mental Wellness
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="display-font text-4xl sm:text-5xl lg:text-6xl font-semibold text-gray-900 leading-[1.1] tracking-tight"
            >
              Your Personal{" "}
              <span className="gradient-text italic">Mental Health</span>{" "}
              Companion
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-5 text-base sm:text-lg text-gray-500 leading-relaxed max-w-lg"
            >
              Talk, reflect, and grow with AI-powered emotional support. Track
              your mood, understand your emotions, and build a healthier mindset
              — one conversation at a time.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-200 px-6 gap-2 group"
                onClick={() => navigate("/chat/")}
              >
                Start Chatting
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 px-6"
                onClick={() => navigate("/therapy/")}
              >
                Explore Therapy
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {stats.map((s) => (
                <div key={s.label} className="stat-card rounded-2xl px-4 py-3">
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — chat preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            id="chat-preview"
            className="relative"
          >
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 p-6 sm:p-8 border border-gray-100">
              {/* Chat header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                  <Heart size={16} className="text-white fill-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    MindfulAI
                  </p>
                  <p className="text-xs text-teal-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                    Online
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <div className="chat-bubble flex gap-2.5 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart size={12} className="text-violet-600" />
                  </div>
                  <div className="bg-violet-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-gray-700">
                      How are you feeling today? I'm here to listen. 💜
                    </p>
                  </div>
                </div>

                <div className="chat-bubble flex gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">You</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-gray-700">
                      I've been feeling a bit overwhelmed lately.
                    </p>
                  </div>
                </div>

                <div className="chat-bubble flex gap-2.5 max-w-[90%]">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart size={12} className="text-violet-600" />
                  </div>
                  <div className="bg-violet-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-gray-700">
                      That's completely valid. Let's slow down and break things
                      down together — small steps lead to big shifts. 🌱
                    </p>
                  </div>
                </div>
              </div>

              {/* Input bar */}
              <div className="mt-5 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <p className="text-sm text-gray-400 flex-1">
                  Type a message...
                </p>
                <button
                  className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center hover:bg-violet-700 transition"
                  onClick={() => navigate("/chat/")}
                >
                  <ArrowRight size={14} className="text-white" />
                </button>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white rounded-2xl shadow-lg shadow-gray-200/80 px-3 py-2 border border-gray-100 flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  AI Powered
                </p>
                <p className="text-[10px] text-gray-400">Always learning</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center max-w-xl mx-auto mb-14"
          >
            <p className="text-violet-600 font-semibold text-sm mb-3 uppercase tracking-widest">
              Features
            </p>
            <h2 className="display-font text-3xl sm:text-4xl font-semibold text-gray-900 leading-tight">
              Designed for Your Well-being
            </h2>
            <p className="mt-4 text-gray-500 text-base">
              Every tool built with one goal — to help you feel better, every
              single day.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                onClick={() => navigate(f.route)}
                className={`feature-card rounded-2xl border ${f.border} bg-white p-6 cursor-pointer group`}
              >
                <div
                  className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.label}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {f.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-violet-600 transition-colors">
                  Explore{" "}
                  <ArrowRight
                    size={12}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 sm:py-28 bg-gray-50/70">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-violet-600 font-semibold text-sm mb-3 uppercase tracking-widest">
              Process
            </p>
            <h2 className="display-font text-3xl sm:text-4xl font-semibold text-gray-900">
              How It Works
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden sm:block absolute top-8 left-[calc(16%+1rem)] right-[calc(16%+1rem)] h-px bg-gradient-to-r from-violet-200 via-teal-200 to-violet-200" />

            {[
              {
                num: "01",
                title: "Create an Account",
                desc: "Sign up in seconds and tell us a little about how you're feeling.",
                emoji: "✨",
              },
              {
                num: "02",
                title: "Start a Session",
                desc: "Chat, try a therapy session, or pick an exercise that fits your mood.",
                emoji: "💬",
              },
              {
                num: "03",
                title: "Track Your Growth",
                desc: "Review your history and watch your emotional wellbeing improve over time.",
                emoji: "📈",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="relative text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-violet-100 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm relative z-10">
                  {step.emoji}
                </div>
                <p className="text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase mb-1">
                  {step.num}
                </p>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[200px] mx-auto">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="cta" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-violet-700 to-teal-600" />
        <div className="hero-blob w-64 h-64 bg-white/10 top-[-40px] right-[-40px] blur-3xl" />
        <div className="hero-blob w-48 h-48 bg-teal-300/20 bottom-0 left-10 blur-2xl" />

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative max-w-2xl mx-auto px-5 sm:px-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Sparkles size={12} />
            Join 10,000+ people on their journey
          </div>
          <h2 className="display-font text-3xl sm:text-4xl font-semibold text-white leading-tight">
            Take the First Step Toward{" "}
            <span className="italic">Better Mental Health</span>
          </h2>
          <p className="mt-4 text-white/75 text-base max-w-md mx-auto">
            Build healthier emotional habits with MindfulAI — your
            compassionate, always-on companion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button
              size="lg"
              className="rounded-xl bg-white text-violet-700 hover:bg-gray-50 shadow-lg px-7 font-semibold gap-2 group"
              onClick={() => navigate("/therapy/")}
            >
              Try It Free
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-xl border-white/30 text-black hover:bg-white/10 px-7"
              onClick={() => navigate("/chat/")}
            >
              Start Chatting
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
              <Heart size={12} className="text-white fill-white" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">
              Mindful<span className="text-violet-600">AI</span>
            </span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} MindfulAI. All rights reserved.
          </p>
          <div className="flex gap-5">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-gray-400 hover:text-violet-600 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
