"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface QuizAttempt {
  attempt_id: number;
  quiz_id: number;
  title: string;
  topic: string;
  difficulty: string;
  score: int;
  total: int;
  percentage: number;
  feedback: string;
  timestamp: string;
}

interface QuizResponse {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  questions: any[];
  created_at: string;
}

interface QuizStats {
  total_quizzes: number;
  average_score: number;
  highest_score: number;
  success_rate: number;
  attempts_history: QuizAttempt[];
}

export default function QuizDashboardPage() {
  const [stats, setStats] = useState<QuizStats>({
    total_quizzes: 0,
    average_score: 0,
    highest_score: 0,
    success_rate: 0,
    attempts_history: [],
  });
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"history" | "browse">("history");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, quizzesRes] = await Promise.all([
          axios.get("http://localhost:8000/quiz/stats"),
          axios.get("http://localhost:8000/quiz/"),
        ]);
        setStats(statsRes.data);
        setQuizzes(quizzesRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

        .dashboard-container {
          max-width: 1040px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        /* --- Header --- */
        .hero-banner {
          background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #090a0f 100%);
          border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: 24px;
          padding: 40px;
          position: relative;
          overflow: hidden;
          margin-bottom: 40px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .hero-banner::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
          filter: blur(40px);
          pointer-events: none;
        }

        .hero-content {
          max-width: 600px;
          position: relative;
          z-index: 2;
        }

        .badge-premium {
          display: inline-block;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #c084fc;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 6px 14px;
          border-radius: 99px;
          margin-bottom: 16px;
        }

        .hero-title {
          font-size: 38px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.15;
          margin-bottom: 12px;
          background: linear-gradient(120deg, #ffffff 30%, #c084fc 70%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 15px;
          color: #9ca3af;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 28px;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 26px rgba(139, 92, 246, 0.5);
          opacity: 0.95;
        }

        /* --- Stats grid --- */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: rgba(17, 18, 28, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          transition: border-color 0.25s, transform 0.2s;
          display: flex;
          flex-direction: column;
        }

        .stat-card:hover {
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
        }

        .stat-label {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 30px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.02em;
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .stat-suffix {
          font-size: 14px;
          font-weight: 500;
          color: #9ca3af;
        }

        .stat-description {
          font-size: 11px;
          color: #6b7280;
          margin-top: 6px;
        }

        /* --- Tabs --- */
        .tab-section {
          margin-top: 20px;
        }

        .tabs-header {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 24px;
          gap: 32px;
        }

        .tab-btn {
          background: none;
          border: none;
          color: #9ca3af;
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          padding-bottom: 12px;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab-btn:hover {
          color: #ffffff;
        }

        .tab-btn.active {
          color: #c084fc;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #c084fc;
          box-shadow: 0 0 8px #c084fc;
        }

        /* --- Content Lists --- */
        .list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          background: rgba(17, 18, 28, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.08);
          border-radius: 20px;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 600;
          color: #f3f4f6;
          margin-bottom: 6px;
        }

        .empty-desc {
          font-size: 13px;
          color: #9ca3af;
          margin-bottom: 20px;
        }

        /* --- Attempt Card --- */
        .attempt-card {
          background: rgba(17, 18, 28, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .attempt-card:hover {
          background: rgba(17, 18, 28, 0.9);
          border-color: rgba(139, 92, 246, 0.2);
          transform: scale(1.005);
        }

        .attempt-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .attempt-topic {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .attempt-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #9ca3af;
        }

        .difficulty-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .difficulty-easy { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
        .difficulty-medium { background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
        .difficulty-hard { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

        .score-display {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .percentage-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .percentage-num {
          font-size: 20px;
          font-weight: 800;
        }

        .percentage-num.high { color: #34d399; }
        .percentage-num.mid { color: #fbbf24; }
        .percentage-num.low { color: #f87171; }

        .score-fraction {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f3f4f6;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
        }

        /* --- Browse Quiz Card --- */
        .quiz-card {
          background: rgba(17, 18, 28, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }

        .quiz-card:hover {
          background: rgba(17, 18, 28, 0.9);
          border-color: rgba(99, 102, 241, 0.2);
          transform: scale(1.005);
        }

        .quiz-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .quiz-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .quiz-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 12px;
          color: #9ca3af;
        }

        .loading-skeleton {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          color: #9ca3af;
          font-size: 14px;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #c084fc;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 12px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .hero-banner {
            padding: 30px;
          }
          .hero-title {
            font-size: 28px;
          }
          .attempt-card, .quiz-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .score-display {
            width: 100%;
            justify-content: space-between;
            align-items: center;
          }
        }
      `}</style>

      <div className="dashboard-container">
        {/* Banner Section */}
        <div className="hero-banner">
          <div className="hero-content">
            <span className="badge-premium">AI Learning Companion</span>
            <h1 className="hero-title">Expand Your Brain with Gemini AI</h1>
            <p className="hero-subtitle">
              Instantly generate customized educational quizzes on absolutely any topic you choose, powered by state-of-the-art AI. Test your skills, get detailed feedback, and master new concepts.
            </p>
            <Link href="/quiz/create" className="btn-primary">
              ⚡ Create Custom AI Quiz
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-skeleton">
            <div className="spinner" />
            Loading AI platform...
          </div>
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Quizzes</span>
                <span className="stat-value">{stats.total_quizzes}</span>
                <span className="stat-description">Attempted modules</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Average Score</span>
                <span className="stat-value">
                  {stats.average_score}
                  <span className="stat-suffix">%</span>
                </span>
                <span className="stat-description">Overall performance</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Highest Score</span>
                <span className="stat-value">
                  {stats.highest_score}
                  <span className="stat-suffix">pts</span>
                </span>
                <span className="stat-description">Personal record</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Success Rate</span>
                <span className="stat-value">
                  {stats.success_rate}
                  <span className="stat-suffix">%</span>
                </span>
                <span className="stat-description">Quizzes scored &ge; 70%</span>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="tab-section">
              <div className="tabs-header">
                <button
                  className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  Activity History ({stats.attempts_history.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === "browse" ? "active" : ""}`}
                  onClick={() => setActiveTab("browse")}
                >
                  All Generated Quizzes ({quizzes.length})
                </button>
              </div>

              {/* History List Tab */}
              {activeTab === "history" && (
                <div className="list-wrapper">
                  {stats.attempts_history.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">🧠</div>
                      <h3 className="empty-title">No attempts yet</h3>
                      <p className="empty-desc">Your past quiz scores and AI study guide recommendations will appear here.</p>
                      <Link href="/quiz/create" className="btn-primary">
                        Start Learning Now
                      </Link>
                    </div>
                  ) : (
                    stats.attempts_history.map((attempt) => {
                      const scoreClass =
                        attempt.percentage >= 80 ? "high" : attempt.percentage >= 50 ? "mid" : "low";
                      return (
                        <div className="attempt-card" key={attempt.attempt_id}>
                          <div className="attempt-details">
                            <h3 className="attempt-topic">{attempt.title}</h3>
                            <div className="attempt-meta">
                              <span className="difficulty-badge difficulty-medium">
                                {attempt.topic}
                              </span>
                              <span className={`difficulty-badge difficulty-${attempt.difficulty.toLowerCase()}`}>
                                {attempt.difficulty}
                              </span>
                              <span>{attempt.timestamp}</span>
                            </div>
                          </div>
                          <div className="score-display">
                            <div className="percentage-badge">
                              <span className={`percentage-num ${scoreClass}`}>
                                {attempt.percentage}%
                              </span>
                              <span className="score-fraction">
                                {attempt.score} / {attempt.total} questions
                              </span>
                            </div>
                            <Link
                              href={`/quiz/${attempt.quiz_id}/results?attempt=${attempt.attempt_id}`}
                              className="btn-secondary"
                            >
                              Review Feedback
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Browse/All Quizzes Tab */}
              {activeTab === "browse" && (
                <div className="list-wrapper">
                  {quizzes.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">📝</div>
                      <h3 className="empty-title">No quizzes generated yet</h3>
                      <p className="empty-desc">Create your very first AI-curated quiz on any topic.</p>
                      <Link href="/quiz/create" className="btn-primary">
                        Generate a Quiz
                      </Link>
                    </div>
                  ) : (
                    quizzes.map((quiz) => (
                      <div className="quiz-card" key={quiz.id}>
                        <div className="quiz-info">
                          <h3 className="quiz-title">{quiz.title}</h3>
                          <div className="quiz-meta">
                            <span className="difficulty-badge difficulty-medium">
                              {quiz.topic}
                            </span>
                            <span className={`difficulty-badge difficulty-${quiz.difficulty.toLowerCase()}`}>
                              {quiz.difficulty}
                            </span>
                            <span>{quiz.questions.length} Questions</span>
                            <span>Created {quiz.created_at}</span>
                          </div>
                        </div>
                        <Link href={`/quiz/${quiz.id}`} className="btn-primary">
                          ⚡ Start Quiz
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
