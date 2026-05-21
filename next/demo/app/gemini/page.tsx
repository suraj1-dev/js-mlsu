"use client";

import { useState } from "react";

export default function GeminiPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse("");
    setError("");

    try {
      const res = await fetch("http://localhost:8000/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Request failed");
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 24 }}>Gemini Chat</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
          style={{
            width: "100%",
            padding: 10,
            fontSize: 15,
            border: "1px solid #ccc",
            borderRadius: 6,
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          style={{
            marginTop: 10,
            padding: "8px 20px",
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {error && (
        <p style={{ marginTop: 20, color: "red" }}>Error: {error}</p>
      )}

      {response && (
        <div style={{ marginTop: 24 }}>
          <strong>Response:</strong>
          <p style={{ marginTop: 8, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {response}
          </p>
        </div>
      )}
    </div>
  );
}
