"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function GeminiPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update or loading state changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    // Create user message
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Request failed");
      }

      const data = await res.json();
      
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (loading) return;
    try {
      const res = await fetch("http://localhost:8000/chat/clear", {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error("Failed to clear backend chat memory");
      }
      setMessages([]);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to clear chat history");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Gemini Chatbot
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">LangChain Memory Active</span>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-red-300 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Memory
          </button>
        )}
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col justify-between overflow-hidden">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-6 scrollbar-thin scrollbar-thumb-indigo-900/50 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 my-auto">
              <div className="h-16 w-16 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-xl animate-bounce">
                🤖
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-semibold text-xl text-slate-100">Welcome to Gemini AI</h3>
                <p className="text-sm text-slate-400">
                  Ask me anything! This interface connects directly to Gemini-2.5-Flash with conversation memory.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md w-full pt-4">
                <button
                  onClick={() => setInput("What is LangChain and why do we use memory?")}
                  className="p-3 text-left rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-indigo-950 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  💡 "What is LangChain?"
                </button>
                <button
                  onClick={() => setInput("Tell me a developer joke about artificial intelligence.")}
                  className="p-3 text-left rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-indigo-950 text-xs text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  🎭 "Tell me an AI developer joke."
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* AI Avatar */}
                  {msg.sender === "ai" && (
                    <div className="h-9 w-9 rounded-xl bg-indigo-900 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold shrink-0 shadow-md">
                      ✨
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition-all duration-300 ${
                      msg.sender === "user"
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : "bg-slate-900/80 border border-indigo-950 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 text-right font-medium ${
                        msg.sender === "user" ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {msg.sender === "user" && (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-sm font-semibold shrink-0 shadow-md text-white">
                      U
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="h-9 w-9 rounded-xl bg-indigo-900 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold shrink-0 shadow-md">
                ✨
              </div>
              <div className="bg-slate-900/80 border border-indigo-950 text-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-md flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-sm flex gap-3 items-center">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Connection Error</p>
                <p className="text-xs text-red-400/90">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center bg-slate-900/75 border border-indigo-950 rounded-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300 p-2 shadow-2xl backdrop-blur-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-slate-100 placeholder-slate-500 px-3 py-2.5 resize-none max-h-24 scrollbar-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-lg disabled:shadow-none shrink-0"
            >
              <svg
                className="h-5 w-5 transform rotate-90"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Press Enter to send, Shift + Enter for new line.
          </p>
        </form>
      </main>
    </div>
  );
}
