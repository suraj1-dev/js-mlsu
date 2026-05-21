"use client";

import { useEffect, useState, Suspense } from "react";
import axios from "axios";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface QuestionGrading {
  id: number;
  question: string;
  options: string[];
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
}

interface QuizAttempt {
  attempt_id: number;
  quiz_id: number;
  title: string;
  topic: string;
  difficulty: string;
  score: number;
  total: number;
  percentage: number;
  feedback: string;
  timestamp: string;
  results: QuestionGrading[];
}

function ResultsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const quizId = params.id;
  const attemptId = searchParams.get("attempt");

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await axios.get("http://localhost:8000/quiz/history");
        const history: QuizAttempt[] = res.data;
        
        let foundAttempt: QuizAttempt | undefined;
        
        if (attemptId) {
          foundAttempt = history.find((a) => a.attempt_id === Number(attemptId));
        } else if (quizId) {
          // If no attempt ID passed, default to the latest attempt for this quiz ID
          foundAttempt = history.find((a) => a.quiz_id === Number(quizId));
        }

        if (foundAttempt) {
          setAttempt(foundAttempt);
        } else {
          setError("Could not find the results for this quiz attempt.");
        }
      } catch (err) {
        console.error("Error fetching results history:", err);
        setError("Failed to load results from backend. Make sure the server is online.");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [quizId, attemptId]);

  if (loading) {
    return (
      <div className="results-loading">
        <style>{`
          .results-loading {
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
        <p>Analyzing scorecard data...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="results-error">
        <style>{`
          .results-error {
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
        <h3>⚠️ Scorecard Not Found</h3>
        <p style={{ marginTop: 8, color: "#9ca3af" }}>{error}</p>
        <Link href="/quiz" className="btn-back">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { title, topic, difficulty, score, total, percentage, feedback, results, timestamp } = attempt;

  // Determine achievement levels
  let badgeTitle = "Novice Explorer 📚";
  let badgeColor = "#f87171";
  if (percentage >= 90) {
    badgeTitle = "Mastermind Champion 🏆";
    badgeColor = "#34d399";
  } else if (percentage >= 70) {
    badgeTitle = "Accomplished Achiever 🌟";
    badgeColor = "#fbbf24";
  } else if (percentage >= 50) {
    badgeTitle = "Capable Apprentice ⏳";
    badgeColor = "#a78bfa";
  }

  // Radial Circle Calculations
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

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

        .results-wrapper {
          max-width: 800px;
          margin: 0 auto;
          padding: 48px 24px 100px;
        }

        .header-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.15s;
        }

        .back-link:hover {
          color: #ffffff;
        }

        /* --- Score Showcase Banner --- */
        .scorecard-banner {
          background: linear-gradient(135deg, #111322 0%, #1e152d 100%);
          border: 1px solid rgba(139, 92, 246, 0.12);
          border-radius: 24px;
          padding: 36px;
          display: flex;
          align-items: center;
          gap: 40px;
          margin-bottom: 36px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }

        /* Radial ring */
        .radial-progress-wrapper {
          position: relative;
          width: 140px;
          height: 140px;
          display: flex;
          justify-content: center;
          align-items: center;
          flex-shrink: 0;
        }

        .radial-percent-txt {
          position: absolute;
          font-size: 26px;
          font-weight: 800;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .radial-percent-label {
          font-size: 10px;
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .score-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .badge-achievement {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 12px;
          border-radius: 6px;
          width: fit-content;
        }

        .score-title {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .score-meta {
          font-size: 13px;
          color: #9ca3af;
          line-height: 1.5;
        }

        /* --- AI Feedback Companion Card --- */
        .ai-feedback-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 40px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .ai-feedback-card::before {
          content: '✦';
          position: absolute;
          top: 24px;
          right: 28px;
          font-size: 22px;
          color: #c084fc;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .ai-section-title {
          font-size: 15px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #c084fc;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-body-text {
          font-size: 14.5px;
          color: #e5e7eb;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        /* --- Question Review Section --- */
        .review-section-header {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }

        .review-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .review-card {
          background: rgba(17, 18, 28, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 28px;
        }

        .review-card.correct-border {
          border-left: 4px solid #10b981;
        }

        .review-card.incorrect-border {
          border-left: 4px solid #ef4444;
        }

        .review-question-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }

        .question-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 13px;
          font-weight: 700;
          color: #9ca3af;
          flex-shrink: 0;
        }

        .question-text {
          font-size: 15.5px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.5;
        }

        .review-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .review-option-pill {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.03);
          background: rgba(255, 255, 255, 0.01);
          color: #9ca3af;
        }

        .review-option-pill.user-correct {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.3);
          color: #34d399;
          font-weight: 600;
        }

        .review-option-pill.user-incorrect {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
          font-weight: 600;
        }

        .review-option-pill.correct-unselected {
          background: rgba(16, 185, 129, 0.04);
          border-color: rgba(16, 185, 129, 0.2);
          color: #34d399;
          font-style: italic;
        }

        .indicator-icon {
          font-size: 12px;
          font-weight: 700;
        }

        .explanation-box {
          background: rgba(9, 10, 15, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 16px;
          font-size: 12.5px;
          color: #9ca3af;
          line-height: 1.5;
          display: flex;
          gap: 10px;
        }

        .bulb-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .explanation-text {
          flex: 1;
        }

        /* --- Footer CTAs --- */
        .action-footer {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 48px;
        }

        .btn-footer-primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }

        .btn-footer-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(139, 92, 246, 0.45);
        }

        .btn-footer-secondary {
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.06);
          color: #f3f4f6;
          font-size: 14px;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-footer-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 640px) {
          .scorecard-banner {
            flex-direction: column;
            text-align: center;
            padding: 30px;
            gap: 24px;
          }
          .radial-progress-wrapper {
            margin: 0 auto;
          }
          .score-info {
            align-items: center;
          }
          .action-footer {
            flex-direction: column;
            gap: 12px;
          }
          .btn-footer-primary, .btn-footer-secondary {
            text-align: center;
            width: 100%;
          }
        }
      `}</style>

      <div className="results-wrapper">
        {/* Navigation Bar */}
        <div className="header-nav">
          <Link href="/quiz" className="back-link">
            &larr; Back to Dashboard
          </Link>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
            Tested {timestamp}
          </span>
        </div>

        {/* Scorecard Banner */}
        <div className="scorecard-banner">
          <div className="radial-progress-wrapper">
            <svg width="140" height="140">
              <circle
                stroke="rgba(255, 255, 255, 0.03)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx="70"
                cy="70"
              />
              <circle
                stroke={badgeColor}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx="70"
                cy="70"
                transform="rotate(-90 70 70)"
                style={{
                  strokeDashoffset,
                  transition: "stroke-dashoffset 0.8s ease-in-out",
                }}
              />
            </svg>
            <div className="radial-percent-txt">
              <span>{Math.round(percentage)}%</span>
              <span className="radial-percent-label">Score</span>
            </div>
          </div>

          <div className="score-info">
            <span
              className="badge-achievement"
              style={{ background: badgeColor + "20", color: badgeColor, border: `1px solid ${badgeColor}35` }}
            >
              {badgeTitle}
            </span>
            <h1 className="score-title">
              You scored {score} out of {total}
            </h1>
            <p className="score-meta">
              Module: <strong>{title}</strong><br />
              Target Topic: <strong>{topic}</strong> | Difficulty: <strong>{difficulty}</strong>
            </p>
          </div>
        </div>

        {/* AI study companion letter */}
        <div className="ai-feedback-card">
          <h3 className="ai-section-title">✦ AI Study Guide & Evaluation</h3>
          <p className="ai-body-text">{feedback}</p>
        </div>

        {/* Question by Question Review */}
        <h2 className="review-section-header">Answer Breakdown</h2>
        <div className="review-list">
          {results.map((item, idx) => {
            const isCorrect = item.is_correct;
            return (
              <div
                className={`review-card ${isCorrect ? "correct-border" : "incorrect-border"}`}
                key={item.id}
              >
                <div className="review-question-header">
                  <div className="question-number">{idx + 1}</div>
                  <h3 className="question-text">{item.question}</h3>
                </div>

                <div className="review-options">
                  {item.options.map((opt) => {
                    const isUserAns = item.user_answer === opt;
                    const isCorrectAns = item.correct_answer === opt;

                    let pillClass = "";
                    let indicator = "";

                    if (isCorrectAns && isUserAns) {
                      pillClass = "user-correct";
                      indicator = "✓";
                    } else if (isUserAns && !isCorrectAns) {
                      pillClass = "user-incorrect";
                      indicator = "✗";
                    } else if (isCorrectAns && !isUserAns) {
                      pillClass = "correct-unselected";
                      indicator = "⭐";
                    }

                    return (
                      <div className={`review-option-pill ${pillClass}`} key={opt}>
                        {indicator && <span className="indicator-icon">{indicator}</span>}
                        <span>{opt}</span>
                        {isUserAns && !isCorrectAns && (
                          <span style={{ fontSize: 10, marginLeft: "auto", opacity: 0.7, fontWeight: 700 }}>YOUR CHOICE</span>
                        )}
                        {isCorrectAns && isUserAns && (
                          <span style={{ fontSize: 10, marginLeft: "auto", opacity: 0.7, fontWeight: 700 }}>CORRECT CHOICE</span>
                        )}
                        {isCorrectAns && !isUserAns && (
                          <span style={{ fontSize: 10, marginLeft: "auto", opacity: 0.7, fontWeight: 700 }}>CORRECT ANSWER</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation tool */}
                <div className="explanation-box">
                  <div className="bulb-icon">💡</div>
                  <div className="explanation-text">
                    <strong>Explanation:</strong> {item.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="action-footer">
          <Link href="/quiz" className="btn-footer-secondary">
            📋 Dashboard
          </Link>
          <Link href="/quiz/create" className="btn-footer-primary">
            ⚡ Generate Another Quiz
          </Link>
        </div>
      </div>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading scorecard...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
