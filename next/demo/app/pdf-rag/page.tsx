"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Source {
  chunk_id: number;
  page: number;
  content: string;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  sources?: Source[];
}

interface DocStatus {
  filename: string | null;
  total_pages: number;
  total_chunks: number;
  is_loaded: boolean;
}

export default function PdfRagPage() {
  const [file, setFile] = useState<File | null>(null);
  const [docStatus, setDocStatus] = useState<DocStatus>({
    filename: null,
    total_pages: 0,
    total_chunks: 0,
    is_loaded: false,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState("");
  
  const [error, setError] = useState("");
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch current RAG status on component mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("http://localhost:8000/rag/status");
        if (res.ok) {
          const data = await res.json();
          setDocStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch RAG status:", err);
      }
    };
    fetchStatus();
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isQuerying]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please drop a valid PDF file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Only PDF files are supported.");
      }
    }
  };

  // Upload and process PDF
  const handleUpload = async () => {
    if (!file || isUploading) return;

    setIsUploading(true);
    setError("");
    setUploadProgressMsg("Uploading PDF...");

    const formData = new FormData();
    formData.append("file", file);

    // Simulate progress text
    const progressInterval = setInterval(() => {
      setUploadProgressMsg((prev) => {
        if (prev === "Uploading PDF...") return "Parsing pages...";
        if (prev === "Parsing pages...") return "Generating vector embeddings...";
        if (prev === "Generating vector embeddings...") return "Building vector index...";
        return prev;
      });
    }, 1500);

    try {
      const res = await fetch("http://localhost:8000/rag/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "PDF processing failed.");
      }

      const data = await res.json();
      setDocStatus({
        filename: data.filename,
        total_pages: data.total_pages,
        total_chunks: data.total_chunks,
        is_loaded: true,
      });
      setMessages([]);
      setFile(null);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "An error occurred during PDF indexing.");
    } finally {
      setIsUploading(false);
      setUploadProgressMsg("");
    }
  };

  // Query PDF
  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = input.trim();
    if (!queryText || isQuerying) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: queryText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsQuerying(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to query PDF.");
      }

      const data = await res.json();
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || "Query failed. Please try again.");
    } finally {
      setIsQuerying(false);
    }
  };

  // Clear PDF
  const handleClearPdf = async () => {
    if (isUploading || isQuerying) return;
    try {
      const res = await fetch("http://localhost:8000/rag/clear", {
        method: "POST",
      });
      if (res.ok) {
        setDocStatus({
          filename: null,
          total_pages: 0,
          total_chunks: 0,
          is_loaded: false,
        });
        setMessages([]);
        setFile(null);
        setError("");
      } else {
        throw new Error("Failed to clear PDF on backend.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to clear document.");
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-md border-b border-indigo-900/40 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group flex items-center justify-center h-10 w-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <svg
              className="h-5 w-5 transform group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div>
            <h1 className="font-bold text-lg tracking-wide bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent flex items-center gap-2">
              <span>PDF RAG Assistant</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-normal">
                LangChain + FAISS
              </span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${docStatus.is_loaded ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-xs text-slate-400 font-medium">
                {docStatus.is_loaded ? `Active document: ${docStatus.filename}` : "No PDF Loaded"}
              </span>
            </div>
          </div>
        </div>

        {docStatus.is_loaded && (
          <button
            onClick={handleClearPdf}
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
            Clear Document
          </button>
        )}
      </header>

      {/* Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-6 overflow-hidden">
        {!docStatus.is_loaded ? (
          /* UPLOAD VIEW */
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full mx-auto">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="w-full rounded-3xl border-2 border-dashed border-indigo-900/50 bg-slate-900/40 backdrop-blur-xl p-8 text-center flex flex-col items-center justify-center gap-6 shadow-2xl transition-all hover:border-indigo-500/50 hover:bg-slate-900/60 group"
            >
              <div className="h-20 w-20 rounded-2xl bg-indigo-950/80 border border-indigo-500/20 flex items-center justify-center text-4xl shadow-xl transition-transform group-hover:scale-105 duration-300">
                📄
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Upload your PDF</h3>
                <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                  Drag and drop your PDF here, or browse files. We'll parse it and build a local search index.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="application/pdf"
                className="hidden"
                disabled={isUploading}
              />

              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-lg shadow-indigo-500/20"
                >
                  Browse PDF File
                </button>
              ) : (
                <div className="w-full max-w-md bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-left">
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold text-sm tracking-wide transition-all cursor-pointer shadow-lg"
                  >
                    Index Document
                  </button>
                </div>
              )}
            </div>

            {/* Upload/Processing State */}
            {isUploading && (
              <div className="mt-8 flex flex-col items-center justify-center gap-4 text-center">
                <div className="relative flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <span className="absolute text-xs font-bold text-indigo-400 animate-pulse">RAG</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200 animate-pulse">
                    {uploadProgressMsg}
                  </p>
                  <p className="text-xs text-slate-500">
                    This creates vector chunks on-the-fly and stores them locally.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && !isQuerying && (
              <div className="mt-6 w-full p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-sm flex gap-3 items-center">
                <span className="text-xl">⚠️</span>
                <div className="text-left">
                  <p className="font-semibold">Error</p>
                  <p className="text-xs text-red-400/90">{error}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CHAT VIEW */
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
            {/* Sidebar info card */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="bg-slate-900/50 border border-indigo-950/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl flex flex-col gap-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-400">Indexed Document</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 uppercase">File Name</label>
                    <p className="text-sm font-semibold text-slate-200 truncate">{docStatus.filename}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Total Pages</label>
                      <p className="text-sm font-bold text-slate-200">{docStatus.total_pages}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Chunks</label>
                      <p className="text-sm font-bold text-slate-200">{docStatus.total_chunks}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      This document has been parsed and splits are stored in FAISS database. The LLM will only answer questions based on this file.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions Box */}
              <div className="bg-slate-900/50 border border-indigo-950/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl hidden lg:flex flex-col gap-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-purple-400">Quick Prompts</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setInput("What are the key points or main summary of this document?")}
                    className="p-2.5 text-left text-[11px] font-medium rounded-lg bg-slate-950/40 hover:bg-slate-850 hover:text-white border border-slate-900 transition-all text-slate-400 cursor-pointer"
                  >
                    📝 Summary of document
                  </button>
                  <button
                    onClick={() => setInput("List all key action items or conclusions from this PDF.")}
                    className="p-2.5 text-left text-[11px] font-medium rounded-lg bg-slate-950/40 hover:bg-slate-850 hover:text-white border border-slate-900 transition-all text-slate-400 cursor-pointer"
                  >
                    🎯 Action items & conclusions
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="lg:col-span-3 flex flex-col bg-slate-900/20 border border-indigo-950/50 rounded-3xl overflow-hidden shadow-2xl">
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-indigo-900/50 scrollbar-track-transparent">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 my-auto">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-2xl shadow-xl animate-bounce">
                      📖
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-slate-200">Interactive Document RAG</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Ask questions about the uploaded document. The assistant will search the document and cite sources.
                      </p>
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

                        {/* Bubble */}
                        <div className="max-w-[85%] flex flex-col gap-2">
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition-all duration-300 ${
                              msg.sender === "user"
                                ? "bg-indigo-600 text-white rounded-tr-none self-end"
                                : "bg-slate-900/90 border border-indigo-950/80 text-slate-200 rounded-tl-none self-start"
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

                          {/* Source Citation Section */}
                          {msg.sender === "ai" && msg.sources && msg.sources.length > 0 && (
                            <div className="self-start w-full max-w-md">
                              <button
                                onClick={() => toggleSources(msg.id)}
                                className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider pl-1 cursor-pointer"
                              >
                                <svg
                                  className={`h-3 w-3 transform transition-transform ${expandedSources[msg.id] ? "rotate-90" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                </svg>
                                {expandedSources[msg.id] ? "Hide Sources" : `View Sources (${msg.sources.length})`}
                              </button>

                              {expandedSources[msg.id] && (
                                <div className="mt-2 space-y-2 animate-fadeIn">
                                  {msg.sources.map((src) => (
                                    <div
                                      key={src.chunk_id}
                                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-[11px] leading-relaxed text-slate-400"
                                    >
                                      <div className="flex justify-between items-center mb-1.5 border-b border-slate-900 pb-1">
                                        <span className="font-bold text-indigo-300 text-[10px]">
                                          Source #{src.chunk_id}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 font-bold text-[9px]">
                                          Page {src.page}
                                        </span>
                                      </div>
                                      <p className="italic">"{src.content.trim()}"</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
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

                {/* Query Loader */}
                {isQuerying && (
                  <div className="flex gap-4 justify-start">
                    <div className="h-9 w-9 rounded-xl bg-indigo-900 border border-indigo-500/30 flex items-center justify-center text-sm font-semibold shrink-0 shadow-md">
                      ✨
                    </div>
                    <div className="bg-slate-900/90 border border-indigo-950/80 text-slate-200 rounded-2xl rounded-tl-none px-5 py-4 shadow-md flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-300 text-sm flex gap-3 items-center">
                    <span className="text-xl">⚠️</span>
                    <div className="flex-1">
                      <p className="font-semibold">Query Error</p>
                      <p className="text-xs text-red-400/90">{error}</p>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSubmitQuery} className="p-4 border-t border-indigo-950/40 bg-slate-900/10">
                <div className="flex items-center bg-slate-900/75 border border-indigo-950/85 rounded-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300 p-2 shadow-2xl backdrop-blur-lg">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask details from PDF..."
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitQuery(e);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm text-slate-100 placeholder-slate-500 px-3 py-2.5 resize-none max-h-24 scrollbar-none"
                  />
                  <button
                    type="submit"
                    disabled={isQuerying || !input.trim()}
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
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
