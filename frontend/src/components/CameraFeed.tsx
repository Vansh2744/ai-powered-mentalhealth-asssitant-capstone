import { useEffect, useRef, useState } from "react";

const EMOTION_COLOR: Record<string, string> = {
  happy: "#00ff88", sad: "#6699ff", angry: "#ff4444",
  fear: "#cc44ff", surprise: "#ffaa00", disgust: "#88cc00", neutral: "#aaaaaa",
};

interface Props {
  onConnected: (connected: boolean) => void;  // required — parent owns the state
}

export default function CameraFeed({ onConnected }: Props) {
  const imgRef    = useRef<HTMLImageElement>(null);
  const [emotion] = useState("detecting...");
  const camWsRef  = useRef<WebSocket | null>(null);
  const faceWsRef = useRef<WebSocket | null>(null);
  const [emotion2, setEmotion] = useState("detecting...");

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/camera");
      camWsRef.current = ws;
      ws.onopen    = () => onConnected(true);   // ← tell parent: connected
      ws.onclose   = () => { onConnected(false); setTimeout(connect, 2000); };
      ws.onmessage = (e) => {
        try {
          const { frame } = JSON.parse(e.data);
          if (imgRef.current && frame)
            imgRef.current.src = `data:image/jpeg;base64,${frame}`;
        } catch {}
      };
    };
    connect();
    return () => camWsRef.current?.close();
  }, []);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/face");
      faceWsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d.dominant_emotion) setEmotion(d.dominant_emotion);
        } catch {}
      };
      ws.onclose = () => setTimeout(connect, 2000);
    };
    connect();
    return () => faceWsRef.current?.close();
  }, []);

  const color = EMOTION_COLOR[emotion2] ?? "#ffffff";

  return (
    <div className="relative rounded-2xl overflow-hidden transition-all duration-500"
      style={{ border: `1.5px solid ${color}20`, boxShadow: `0 0 30px ${color}15` }}>

      <img ref={imgRef} alt="camera"
        className="w-full aspect-video object-cover bg-black block" />

      {/* Emotion badge */}
      <div className="absolute top-0 left-0 right-0 flex items-center
        justify-between px-3 py-2 bg-gradient-to-b from-black/60 to-transparent">
        <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-head
          font-bold tracking-wider text-black" style={{ background: color }}>
          {emotion2.toUpperCase()}
        </span>
      </div>
    </div>
  );
}