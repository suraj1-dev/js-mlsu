"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUGGESTIONS = [
  "React Hooks & Context",
  "World War II History",
  "Quantum Mechanics",
  "Financial Literacy & Investing",
  "Python Algorithms",
  "Human Anatomy & Systems",
];

const LOADING_STATUSES = [
  "Awakening Gemini AI engine...",
  "Curating high-quality educational concepts...",
  "Drafting custom multiple-choice distractors...",
  "Verifying answer key correctness...",
  "Formatting responsive scorecard package...",
  "Deploying interactive quiz session...",
];

export default function CreateQuizPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);
  const [error, setError] = useState("");

  // Cycle through loading status strings for rich UX
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setStatusIndex((prev) => (prev + 1) % LOADING_STATUSES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please specify a topic for the quiz.");
      return;
    }
    setError("");
    setLoading(true);
    setStatusIndex(0);

    try {
      const res = await axios.post("http://localhost:8000/quiz/generate", {
        topic: topic.trim(),
        difficulty,
        num_questions: numQuestions,
      });
      // Redirect to the newly generated quiz taking session
      router.push(`/quiz/${res.data.id}`);
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      setError(
        err.response?.data?.detail || 
        "Failed to generate quiz. Please ensure the backend is running and Gemini API is accessible."
      );
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #090a0f;
          color: #f3f4f6;
          min-height: 100vh;
        }

        .creator-container {
          max-width: 580px;
          margin: 0 auto;
          padding: 56px 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 32px;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .creator-card {
          background: rgba(17, 18, 28, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }

        .creator-header {
          margin-bottom: 32px;
        }

        .creator-header h1 {
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .creator-header p {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.5;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .form-label {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #c084fc;
        }

        .input-text {
          width: 100%;
          background: rgba(9, 10, 15, 0.8);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
          color: #ffffff;
          font-family: inherit;
          font-size: 15px;
          transition: all 0.2s ease;
          outline: none;
        }

        .input-text:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
          background: rgba(9, 10, 15, 1);
        }

        /* --- Suggestions --- */
        .suggestions-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
          font-size: 11px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .suggestion-chip:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.3);
          color: #c084fc;
        }

        /* --- Selector buttons --- */
        .selector-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .selector-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selector-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .selector-btn.active {
          background: rgba(139, 92, 246, 0.1);
          border-color: #8b5cf6;
          color: #c084fc;
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.15);
        }

        /* --- Error Message --- */
        .error-card {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          padding: 12px 16px;
          color: #f87171;
          font-size: 13px;
          margin-bottom: 24px;
          font-weight: 500;
        }

        /* --- Loading Overlay --- */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 5, 9, 0.9);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 24px;
        }

        .loader-ring {
          width: 80px;
          height: 80px;
          border: 4px solid rgba(139, 92, 246, 0.1);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          margin-bottom: 32px;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
        }

        .loader-card {
          text-align: center;
          max-width: 420px;
        }

        .loader-title {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        .loader-status {
          font-size: 14px;
          color: #c084fc;
          font-weight: 600;
          min-height: 20px;
          animation: pulse 1.5s infinite;
        }

        .loader-sub {
          font-size: 12px;
          color: #6b7280;
          margin-top: 16px;
          line-height: 1.5;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .btn-submit {
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
          font-family: inherit;
          padding: 14px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
          width: 100%;
          margin-top: 12px;
        }

        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 26px rgba(139, 92, 246, 0.45);
        }
      `}</style>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loader-ring" />
          <div className="loader-card">
            <h3 className="loader-title">Generating AI Quiz</h3>
            <p className="loader-status">{LOADING_STATUSES[statusIndex]}</p>
            <p className="loader-sub">
              Our Gemini 2.5 Flash cognitive engine is crafting robust, pedagogically accurate questions, multiple distractors, and helpful study explanations.
            </p>
          </div>
        </div>
      )}

      <div className="creator-container">
        <Link href="/quiz" className="back-link">
          &larr; Back to Dashboard
        </Link>

        <div className="creator-card">
          <div className="creator-header">
            <h1>Configure AI Quiz</h1>
            <p>Define your parameters and let Gemini AI create a tailored multi-choice assessment instantly.</p>
          </div>

          {error && <div className="error-card">{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Topic Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="topic">
                Quiz Topic / Category
              </label>
              <input
                id="topic"
                type="text"
                className="input-text"
                placeholder="e.g. Organic Chemistry, ES6 Javascript, Ancient Rome"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
                required
              />
              <div className="suggestions-wrapper">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => setTopic(item)}
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="form-group">
              <label className="form-label">Difficulty Level</label>
              <div className="selector-row">
                {["Easy", "Medium", "Hard"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={`selector-btn ${difficulty === level ? "active" : ""}`}
                    onClick={() => setDifficulty(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Count Selector */}
            <div className="form-group">
              <label className="form-label">Number of Questions</label>
              <div className="selector-row">
                {[5, 10, 15].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`selector-btn ${numQuestions === num ? "active" : ""}`}
                    onClick={() => setNumQuestions(num)}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-submit">
              🚀 Generate Quiz with Gemini
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
