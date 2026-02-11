import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { selectedlanguage } from "./context/langContext";
import { LangSelect } from "./LangSelect";
import { Button } from "./ui/button";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { useCurrentUser } from "./context/userContext";
import { useNavigate } from "react-router-dom";
import { MicIcon } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface QnA {
  ai: string;
  user: string;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

const Therapist: React.FC = () => {
  const [transcript, setTranscript] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);

  const [qnaData, setQnaData] = useState<QnA[]>([]);
  const { language } = selectedlanguage();
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [evaluationResult, setEvaluationResult] = useState<{
    classification: string;
    evaluation: string;
  } | null>(null);

  const [showResult, setShowResult] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [sessionId, setSessionId] = useState("");

  const { user } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    const checkCamera = async () => {
      await axios.post(`${backendUrl}/camera-running-check`);
    };
    checkCamera();
  }, []);

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognitionClass() as SpeechRecognition;

    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = language;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      sendToBackend(text);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      rec.stop();
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const sendToBackend = async (message: string) => {
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      const newSessionId = crypto.randomUUID();

      activeSessionId = newSessionId;
      setSessionId(activeSessionId);
    }

    if (!message.trim()) return;

    try {
      console.log(activeSessionId);

      const res = await fetch("http://localhost:8000/therapy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, session_id: activeSessionId }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setResponse(data.response);
      speakResponse(data.response);

      setQnaData((prev) => [
        ...prev,
        {
          user: message,
          ai: data.response,
        },
      ]);
    } catch (error) {
      console.error("Error sending message to backend:", error);
    }
  };

  const speakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = language;
    utter.rate = 1;
    utter.pitch = 1;

    synth.speak(utter);
  };

  const handleResult = async () => {
    setIsEvaluating(true);
    try {
      const res = await axios.post(`${backendUrl}/stop`, {
        data: qnaData,
        user_id: user?.id,
      });

      const result = res.data;

      setEvaluationResult({
        classification: result.classification,
        evaluation: result.evaluation,
      });

      setShowResult(true);
    } catch (error) {
      console.log(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-3xl bg-white/70 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/40">
        <div className="flex justify-end mb-4 w-full">
          <LangSelect />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧠 AI Mental Health Assistant
          </h1>
          <p className="text-gray-600">
            Speak your thoughts, and I’ll respond supportively.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md flex flex-col items-center justify-center ${
              isListening
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-indigo-500 hover:bg-indigo-600 text-white"
            }`}
          >
            <MicIcon />
            {isListening ? "Stop Listening" : "Start Talking"}
          </button>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            🎤 Your Transcript
          </h3>
          <div className="bg-white shadow-inner border rounded-xl p-4 min-h-[80px] text-gray-700">
            {transcript || (
              <span className="text-gray-400 italic">Speak something...</span>
            )}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            🤖 AI Response
          </h3>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 min-h-[100px] shadow-inner text-gray-800">
            <p className="whitespace-pre-wrap">
              {response || (
                <span className="text-gray-400 italic">
                  Waiting for your message...
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-center">
          <Button
            onClick={handleResult}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition-all duration-300"
            disabled={isEvaluating}
          >
            {isEvaluating ? "Evaluating Converstion...." : "End Session"}
          </Button>
        </div>
      </div>
      {showResult && evaluationResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative animate-fade-in">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowResult(false);
                navigate("/");
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✖
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              🧾 Mental Wellness Evaluation
            </h2>
            <div className="mb-4">
              <span
                className={`px-4 py-2 rounded-full text-white text-sm font-semibold
          ${
            evaluationResult.classification === "Stable"
              ? "bg-green-500"
              : evaluationResult.classification === "Mild Emotional Strain"
                ? "bg-yellow-500"
                : evaluationResult.classification ===
                    "Moderate Emotional Strain"
                  ? "bg-orange-500"
                  : "bg-red-500"
          }`}
              >
                {evaluationResult.classification}
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 text-gray-700 whitespace-pre-wrap leading-relaxed">
              {evaluationResult.evaluation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Therapist;
