"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface QuestionResponse {
  id: number;
  question: str;
  options: string[];
}

interface QuizResponse {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  questions: QuestionResponse[];
  created_at: string;
}

export default function ActiveQuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch the quiz structure
  useEffect(() => {
    async function fetchQuiz() {
      if (!quizId) return;
      try {
        const res = await axios.get(`http://localhost:8000/quiz/${quizId}`);
        setQuiz(res.data);
        // Initialize user answers array with empty strings
        setSelectedAnswers(new Array(res.data.questions.length).fill(""));
      } catch (err: any) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load the quiz session. It may have been deleted or the backend is offline.");
      } finally {
        setLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  // Make selection for the current question
  const handleSelectOption = (option: string) => {
    const updated = [...selectedAnswers];
    updated[currentIdx] = option;
    setSelectedAnswers(updated);
  };

  // Move to next question or submit if last
  const handleNext = async () => {
    if (!quiz) return;
    if (currentIdx < quiz.questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Submit Answers
      setSubmitLoading(true);
      try {
        const res = await axios.post(`http://localhost:8000/quiz/${quizId}/submit`, {
          answers: selectedAnswers,
        });
        // Redirect to results passing the newly created attempt ID
        router.push(`/quiz/${quizId}/results?attempt=${res.data.attempt_id || res.data.quiz_id}`);
      } catch (err) {
        console.error("Error submitting answers:", err);
        alert("Failed to submit answers. Please try again.");
        setSubmitLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="active-loading">
        <style>{`
          .active-loading {
            background: #090a0f;
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-family: sans-serif;
          }
          .spinner {
            width: 28px;
            height: 28px;
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="spinner" />
        <p>Loading your quiz session...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="active-error">
        <style>{`
          .active-error {
            background: #090a0f;
            color: #f3f4f6;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            font-family: sans-serif;
            padding: 24px;
            text-align: center;
          }
          .btn-back {
            background: #8b5cf6;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 16px;
            font-weight: 600;
          }
        `}</style>
        <h3>⚠️ Oops!</h3>
        <p style={{ marginTop: 8, color: "#9ca3af" }}>{error}</p>
        <Link href="/quiz" className="btn-back">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const selectedAnswer = selectedAnswers[currentIdx];
  const progressPercent = ((currentIdx + 1) / quiz.questions.length) * 100;

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

        .quiz-wrapper {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px 100px;
        }

        /* --- Header & Progress --- */
        .quiz-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .quiz-info h1 {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
        }

        .quiz-info p {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 4px;
        }

        .difficulty-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          background: rgba(139, 92, 246, 0.15);
          color: #c084fc;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        /* --- Progress Bar --- */
        .progress-container {
          margin-bottom: 36px;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .progress-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6 0%, #a78bfa 100%);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
          border-radius: 99px;
          transition: width 0.30s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* --- Question Card --- */
        .question-card {
          background: rgba(17, 18, 28, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          margin-bottom: 30px;
        }

        .question-text {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.5;
          margin-bottom: 28px;
        }

        /* --- Options Grid --- */
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .option-item {
          background: rgba(9, 10, 15, 0.5);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .option-item:hover {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.12);
        }

        .option-item.selected {
          background: rgba(139, 92, 246, 0.08);
          border-color: #8b5cf6;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.15);
        }

        .option-letter {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 13px;
          font-weight: 700;
          color: #9ca3af;
          margin-right: 16px;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .option-item.selected .option-letter {
          background: #8b5cf6;
          border-color: #8b5cf6;
          color: #ffffff;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
        }

        .option-content {
          font-size: 15px;
          font-weight: 500;
          color: #f3f4f6;
          line-height: 1.4;
        }

        .option-item.selected .option-content {
          color: #ffffff;
          font-weight: 600;
        }

        /* Active checkmark */
        .checkmark-icon {
          margin-left: auto;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #8b5cf6;
          display: none;
          justify-content: center;
          align-items: center;
          font-size: 10px;
          color: white;
        }

        .option-item.selected .checkmark-icon {
          display: flex;
        }

        /* --- Footer Navigation --- */
        .navigation-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(9, 10, 15, 0.85);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 20px 24px;
          z-index: 100;
        }

        .nav-inner {
          max-width: 720px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .btn-nav-prev {
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          color: #9ca3af;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-nav-prev:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        .btn-nav-prev:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .btn-nav-next {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          border: none;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }

        .btn-nav-next:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(139, 92, 246, 0.45);
        }

        .btn-nav-next:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: #6b7280;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Submit loader */
        .submit-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(4, 5, 9, 0.92);
          backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          color: #ffffff;
        }

        .grading-loader {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(139, 92, 246, 0.1);
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 24px;
        }
      `}</style>

      {/* Submission Overlay Loading */}
      {submitLoading && (
        <div className="submit-overlay">
          <div className="grading-loader" />
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Evaluating Performance</h3>
          <p style={{ color: "#c084fc", fontWeight: 600, fontSize: 14 }}>
            Gemini is reading your choices and drafting custom feedback...
          </p>
        </div>
      )}

      <div className="quiz-wrapper">
        {/* Header Block */}
        <div className="quiz-header">
          <div className="quiz-info">
            <h1>{quiz.title}</h1>
            <p>Topic: {quiz.topic}</p>
          </div>
          <span className="difficulty-badge">{quiz.difficulty}</span>
        </div>

        {/* Progress Timeline */}
        <div className="progress-container">
          <div className="progress-meta">
            <span>
              Question {currentIdx + 1} of {quiz.questions.length}
            </span>
            <span>{Math.round(progressPercent)}% Complete</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Question Panel */}
        <div className="question-card">
          <h2 className="question-text">{currentQuestion.question}</h2>
          
          <div className="options-grid">
            {currentQuestion.options.map((option, index) => {
              const letter = ["A", "B", "C", "D"][index] || String(index + 1);
              const isSelected = selectedAnswer === option;
              
              return (
                <div
                  key={option}
                  className={`option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectOption(option)}
                >
                  <div className="option-letter">{letter}</div>
                  <div className="option-content">{option}</div>
                  <div className="checkmark-icon">✓</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="navigation-bar">
        <div className="nav-inner">
          <button
            className="btn-nav-prev"
            onClick={handlePrev}
            disabled={currentIdx === 0}
          >
            &larr; Previous
          </button>
          
          <button
            className="btn-nav-next"
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            {currentIdx === quiz.questions.length - 1 ? "Submit Quiz 🎉" : "Next Question &rarr;"}
          </button>
        </div>
      </div>
    </>
  );
}
