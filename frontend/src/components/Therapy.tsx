import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { backendUrl } from "@/utils/backendUrl";
import { Mic, MicOff } from "lucide-react";

const Therapy: React.FC = () => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const checkCamera = async () => {
      await axios.post(`${backendUrl}/camera-running-check`);
    };
    checkCamera();
  }, []);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    chunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      sendToBackend(blob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const response = await axios.post(`${backendUrl}/therapy`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
      });

      const url = URL.createObjectURL(response.data);

      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200">
      <div className="bg-white/70 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          AI Voice Therapist
        </h1>

        <p className="text-gray-600 mb-8">
          Tap the microphone and start speaking
        </p>

        <button
          onClick={toggleRecording}
          className={`w-24 h-24 flex items-center justify-center rounded-full shadow-lg transition-all duration-300
          ${
            isRecording
              ? "bg-red-500 animate-pulse"
              : "bg-indigo-600 hover:scale-110"
          }`}
        >
          {isRecording ? (
            <MicOff size={40} color="white" />
          ) : (
            <Mic size={40} color="white" />
          )}
        </button>

        <p className="mt-6 text-gray-700 font-medium">
          {isRecording
            ? "Listening... tap again to stop"
            : "Tap mic to start speaking"}
        </p>
      </div>
    </div>
  );
};

export default Therapy;
