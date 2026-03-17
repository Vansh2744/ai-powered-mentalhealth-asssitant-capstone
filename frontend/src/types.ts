export interface EmotionScores {
  [emotion: string]: number;
}

export interface VoiceResult {
  emotion: string;
  confidence: number;
  probabilities: EmotionScores;
}

export interface FaceResult {
  emotion: string;
  confidence: number;
  emotions: EmotionScores;
}

export interface TherapistResult {
  text: string;
  audio_b64: string;
}

export interface CombinedResult {
  timestamp: string;
  transcript: string;
  voice: VoiceResult;
  face: FaceResult;
  verdict: string;
  therapist: TherapistResult;
  language: string;
}

export interface HistoryRecord {
  timestamp: string;
  transcript: string;
  voice_emotion: string;
  voice_confidence: string;
  face_emotion: string;
  face_confidence: string;
  verdict: string;
  therapist_response: string;
}

export interface CurrentUser {
  id: string;
  email: string;
}