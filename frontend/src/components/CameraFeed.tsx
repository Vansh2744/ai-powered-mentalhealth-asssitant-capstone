import { useEffect, useRef, useState } from "react";

const EMOTION_COLOR: Record<string, string> = {
  happy: "#00ff88",
  sad: "#6699ff",
  angry: "#ff4444",
  fear: "#cc44ff",
  fearful: "#cc44ff",
  surprise: "#ffaa00",
  disgust: "#88cc00",
  neutral: "#aaaaaa",
  calm: "#44ddcc",
};

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8000";
const FPS = 5;

interface Props {
  onConnected: (connected: boolean) => void;
}

export default function CameraFeed({ onConnected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [emotion, setEmotion] = useState("detecting...");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
      } catch (err) {
        console.error("[CameraFeed] Camera denied:", err);
        setDenied(true);
        onConnected(false);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const connect = () => {
        const ws = new WebSocket(`${WS_URL}/ws/camera`);
        ws.binaryType = "arraybuffer";
        wsRef.current = ws;

        ws.onopen = () => {
          onConnected(true);
          timerRef.current = setInterval(() => sendFrame(ws), 1000 / FPS);
        };

        ws.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data as string);
            if (data.dominant_emotion) setEmotion(data.dominant_emotion);
          } catch {}
        };

        ws.onclose = () => {
          onConnected(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(connect, 2000);
        };

        ws.onerror = () => onConnected(false);
      };

      connect();
    }

    function sendFrame(ws: WebSocket) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || ws.readyState !== WebSocket.OPEN) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = 160;
      canvas.height = 120;
      ctx.drawImage(video, 0, 0, 160, 120);

      canvas.toBlob(
        (blob) => {
          if (!blob || ws.readyState !== WebSocket.OPEN) return;
          blob.arrayBuffer().then((buf) => ws.send(buf));
        },
        "image/jpeg",
        0.6,
      );
    }

    init();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      wsRef.current?.close();
      stream?.getTracks().forEach((t) => t.stop());
      onConnected(false);
    };
  }, []);

  if (denied) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          border: "1.5px solid #ff444420",
          boxShadow: "0 0 30px #ff444415",
        }}
      >
        <div
          className="w-full aspect-video bg-black flex flex-col items-center
          justify-center gap-4 px-6 text-center"
        >
          <span className="text-3xl">🚫</span>
          <p className="text-white text-sm font-semibold tracking-wide">
            Camera access blocked
          </p>
          <div className="flex flex-col gap-1.5 text-left w-full max-w-[220px]">
            {[
              "Click the 🔒 lock in your address bar",
              'Set "Camera" → Allow',
              "Refresh the page",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className="shrink-0 w-4 h-4 rounded-full bg-white/10
                  text-white/60 text-[0.55rem] flex items-center justify-center mt-0.5"
                >
                  {i + 1}
                </span>
                <p className="text-white/60 text-[0.65rem] leading-relaxed">
                  {s}
                </p>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20
            text-white text-[0.65rem] tracking-widest uppercase transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const color = EMOTION_COLOR[emotion] ?? "#ffffff";

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{
        border: `1.5px solid ${color}20`,
        boxShadow: `0 0 30px ${color}15`,
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        className="w-full aspect-video object-cover bg-black block scale-x-[-1]"
      />

      <canvas ref={canvasRef} className="hidden" />

      <div
        className="absolute top-0 left-0 right-0 flex items-center
        justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent"
      >
        <span
          className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-head
          font-bold tracking-wider text-black"
          style={{ background: color }}
        >
          {emotion.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
