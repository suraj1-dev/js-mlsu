"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

type AssistantStatus = "idle" | "listening" | "processing" | "speaking" | "error";

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [error, setError] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs for audio recording
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const recordingRef = useRef<boolean>(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ref for fallback speech recognition
  const recognitionRef = useRef<any>(null);

  // Keep state in ref to avoid closure issues in callbacks
  const statusRef = useRef<AssistantStatus>("idle");
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecordingSession();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stopRecordingSession = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (processorRef.current && sourceRef.current) {
      try {
        sourceRef.current.disconnect();
        processorRef.current.disconnect();
      } catch (e) {
        console.warn("Failed to disconnect nodes:", e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    recordingRef.current = false;
    setRecordingTime(0);
  };

  // Helper: Write string to DataView (for WAV headers)
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Helper: Convert Float32Array to 16-bit PCM WAV ArrayBuffer
  const bufferToWav = (buffer: Float32Array, sampleRate: number): ArrayBuffer => {
    const bufferLength = buffer.length;
    const wavBuffer = new ArrayBuffer(44 + bufferLength * 2);
    const view = new DataView(wavBuffer);

    /* RIFF identifier */
    writeString(view, 0, "RIFF");
    /* file length */
    view.setUint32(4, 36 + bufferLength * 2, true);
    /* RIFF type */
    writeString(view, 8, "WAVE");
    /* format chunk identifier */
    writeString(view, 12, "fmt ");
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (1 = raw PCM) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 2, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, "data");
    /* data chunk length */
    view.setUint32(40, bufferLength * 2, true);

    // Write PCM audio samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return wavBuffer;
  };

  const handleRecordToggle = async () => {
    setError("");
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (recordingRef.current || status === "listening") {
      if (fallbackMode) {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } else {
        stopAndProcessAudio();
      }
      return;
    }

    setStatus("listening");

    if (fallbackMode) {
      startFallbackRecognition();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      chunksRef.current = [];
      recordingRef.current = true;

      processor.onaudioprocess = (e) => {
        if (!recordingRef.current) return;
        const channelData = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(channelData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      processorRef.current = processor;
      sourceRef.current = source;

      // Start recording timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access failed", err);
      setError("Microphone access denied. Please verify your browser permissions.");
      setStatus("idle");
      recordingRef.current = false;
    }
  };

  const stopAndProcessAudio = () => {
    if (!recordingRef.current) return;

    // Keep references to chunks before stopping sessions clears them
    const chunks = [...chunksRef.current];

    stopRecordingSession();
    setStatus("processing");

    // Combine float32 chunks
    let totalLength = 0;
    for (const chunk of chunks) {
      totalLength += chunk.length;
    }

    if (totalLength === 0) {
      setError("No audio captured. Please speak again.");
      setStatus("idle");
      return;
    }

    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to WAV Blob
    const wavBuffer = bufferToWav(result, 16000);
    const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });

    sendAudioToBackend(audioBlob);
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "query.wav");

    try {
      const res = await fetch("http://localhost:8000/chat/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Server failed to process voice query");
      }

      const data = await res.json();

      // Add user transcript
      const userMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text: data.user_text,
        timestamp: new Date(),
      };

      // Add AI reply
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      if (voiceEnabled && data.audio) {
        playBase64Audio(data.audio);
      } else {
        setStatus("idle");
      }

    } catch (err: any) {
      setError(err.message || "Failed to contact voice assistant API");
      setStatus("error");
    }
  };

  const playBase64Audio = (base64Audio: string) => {
    try {
      setStatus("speaking");
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(base64Audio);
      audioRef.current = audio;

      audio.onended = () => {
        setStatus("idle");
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setError("Audio playback failed. Showing text response instead.");
        setStatus("idle");
      };

      audio.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
      setStatus("idle");
    }
  };

  // --- Fallback Speech Recognition (Client-side) ---
  const startFallbackRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported natively in this browser. Try Chrome or Safari.");
      setStatus("idle");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setStatus("listening");
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setError(`Local Speech recognition failed: ${e.error}`);
      setStatus("idle");
    };

    rec.onend = () => {
      if (statusRef.current === "listening") {
        setStatus("idle");
      }
    };

    rec.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      if (!text.trim()) {
        setError("No text transcribed. Speak louder!");
        setStatus("idle");
        return;
      }
      setStatus("processing");
      sendTextQuery(text);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const sendTextQuery = async (text: string) => {
    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Server chat query failed");
      }

      const data = await res.json();

      const userMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "user",
        text: text,
        timestamp: new Date(),
      };

      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      if (voiceEnabled) {
        playFallbackTTS(data.response);
      } else {
        setStatus("idle");
      }

    } catch (err: any) {
      setError(err.message || "Failed to send query to standard chatbot endpoint");
      setStatus("error");
    }
  };

  const playFallbackTTS = (text: string) => {
    if (!window.speechSynthesis) {
      setStatus("idle");
      return;
    }
    setStatus("speaking");
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setStatus("idle");
    };
    utterance.onerror = (e) => {
      console.error(e);
      setStatus("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleClearMemory = async () => {
    try {
      const res = await fetch("http://localhost:8000/chat/clear", { method: "POST" });
      if (!res.ok) throw new Error("Failed to clear conversation history");
      setMessages([]);
      setError("");
      setStatus("idle");
    } catch (err: any) {
      setError(err.message || "Could not clear memory");
    }
  };

  // Helper: Format elapsed recording time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-950/70 backdrop-blur-lg border-b border-indigo-950/60 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <Link href="/" className="h-8 w-8 rounded-lg bg-slate-900 border border-indigo-900/50 flex items-center justify-center text-xs font-bold hover:bg-slate-800 transition">
            ←
          </Link>
          <div>
            <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              Gemini Voice Space
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${fallbackMode ? "bg-amber-500" : "bg-indigo-500"} animate-pulse`} />
              <span className="text-xs text-slate-400 font-medium">
                {fallbackMode ? "Local Speech Synthesis active" : "Server Voice API active"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {messages.length > 0 && (
            <button
              onClick={handleClearMemory}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/40 border border-red-500/20 text-red-300 transition active:scale-95 cursor-pointer"
            >
              Clear Session
            </button>
          )}
          <button
            onClick={() => setFallbackMode(!fallbackMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              fallbackMode
                ? "bg-amber-950/40 hover:bg-amber-900/40 border-amber-500/40 text-amber-300"
                : "bg-slate-950/40 hover:bg-indigo-950/40 border-indigo-500/40 text-indigo-300"
            }`}
          >
            {fallbackMode ? "Local Mode" : "Server Mode"}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* Left Side: Glowing Orb and Controller */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950/30 border border-indigo-950/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative min-h-[350px] md:min-h-[auto]">
          {/* Status Display */}
          <div className="absolute top-6 left-6 text-xs text-slate-400 font-semibold tracking-wider uppercase">
            System: <span className={`font-bold ${status === "listening" ? "text-emerald-400" : status === "processing" ? "text-purple-400" : status === "speaking" ? "text-amber-400" : "text-indigo-400"}`}>{status}</span>
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-full border border-indigo-950/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Voice Reply</span>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 border-slate-700 bg-slate-800 rounded focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Interactive Voice Orb */}
          <div className="relative flex items-center justify-center my-8 h-48 w-48">
            {/* Concentric Pulsing Aura Circles */}
            <div
              className={`absolute inset-0 rounded-full bg-indigo-500/10 blur-xl transition-transform duration-1000 ${
                status === "listening"
                  ? "scale-150 bg-emerald-500/20 animate-ping"
                  : status === "processing"
                  ? "scale-125 bg-purple-500/20 animate-pulse"
                  : status === "speaking"
                  ? "scale-150 bg-amber-500/20 animate-pulse"
                  : "scale-100 animate-pulse"
              }`}
            />
            <div
              className={`absolute inset-4 rounded-full bg-purple-500/10 blur-lg transition-transform duration-700 ${
                status === "listening"
                  ? "scale-130 bg-emerald-400/20 animate-pulse"
                  : status === "processing"
                  ? "scale-115 bg-pink-500/20 animate-spin"
                  : status === "speaking"
                  ? "scale-130 bg-orange-400/20 animate-pulse"
                  : "scale-90"
              }`}
            />

            {/* Central Interactive Orb Button */}
            <button
              onClick={handleRecordToggle}
              className={`h-32 w-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 active:scale-95 shadow-2xl border cursor-pointer z-10 ${
                status === "listening"
                  ? "bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 border-emerald-400 hover:from-emerald-500 hover:to-cyan-300 shadow-emerald-500/20"
                  : status === "processing"
                  ? "bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 border-purple-400 shadow-purple-500/20"
                  : status === "speaking"
                  ? "bg-gradient-to-tr from-amber-500 via-orange-400 to-yellow-300 border-amber-400 shadow-amber-500/20"
                  : "bg-gradient-to-tr from-indigo-700 via-purple-600 to-pink-500 border-indigo-400/50 hover:border-indigo-400 shadow-indigo-500/30"
              }`}
            >
              {/* Mic Icon / Status Emoji */}
              <div className="text-3xl filter drop-shadow">
                {status === "listening" ? (
                  "🎙️"
                ) : status === "processing" ? (
                  <span className="inline-block animate-spin">🌀</span>
                ) : status === "speaking" ? (
                  "🔊"
                ) : status === "error" ? (
                  "⚠️"
                ) : (
                  "🎤"
                )}
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase mt-1 text-slate-100">
                {status === "listening" ? "Listening" : status === "processing" ? "Thinking" : status === "speaking" ? "Speaking" : "Tap to Ask"}
              </span>
            </button>

            {/* Micro Waveform Indicators */}
            {status === "listening" && (
              <div className="absolute -bottom-8 flex gap-1.5">
                <span className="h-5 w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-8 w-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-10 w-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="h-6 w-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
              </div>
            )}
            {status === "speaking" && (
              <div className="absolute -bottom-8 flex gap-1.5">
                <span className="h-5 w-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-9 w-1 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                <span className="h-6 w-1 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
              </div>
            )}
          </div>

          {/* Recording Timer */}
          {status === "listening" && !fallbackMode && (
            <div className="text-sm font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded-full animate-pulse mt-2">
              Recording: {formatTime(recordingTime)}
            </div>
          )}

          {/* Instruction Label */}
          <div className="text-center mt-6 max-w-xs space-y-1">
            <h3 className="font-semibold text-sm text-slate-200">
              {status === "listening" ? "Stop when you finish speaking" : "Talk with your AI Companion"}
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              Uses speech recognition and Gemini LLM backend with persistent voice synthesis memory.
            </p>
          </div>

          {/* Error Message banner */}
          {error && (
            <div className="mt-6 w-full max-w-sm p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs flex gap-2.5 items-center">
              <span className="text-lg">⚠️</span>
              <p className="flex-1 leading-normal">{error}</p>
            </div>
          )}
        </div>

        {/* Right Side: Visual Transcription Feed */}
        <div className="flex-[1.2] flex flex-col bg-slate-950/35 border border-indigo-950/40 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl min-h-[350px]">
          <div className="px-5 py-4 border-b border-indigo-950/50 bg-slate-950/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversation Log</span>
            <span className="text-[10px] bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
              {messages.length / 2} Queries
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-950/50 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                <span className="text-4xl filter drop-shadow">👽</span>
                <div className="max-w-xs space-y-1">
                  <h4 className="font-bold text-sm text-slate-300">Space is Silent</h4>
                  <p className="text-xs text-slate-500">
                    Tap the microphone orb, speak a question, and let Gemini speak back to you!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-xs shrink-0 shadow-md">
                        ✨
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-normal shadow ${
                        msg.sender === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-900/80 border border-indigo-950 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          msg.sender === "user" ? "text-indigo-200" : "text-slate-500"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
