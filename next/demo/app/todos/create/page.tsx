"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function CreateTodoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    completed: false,
  });
  const [loading, setLoading] = useState(false);

  console.log(form, "form");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // setError("");
    try {
      await axios.post("http://localhost:8000/todos", form);
      router.push("/todos");
    } catch {
      //  setError("Failed to create todo. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        .page-wrapper {
          max-width: 520px;
          margin: 0 auto;
          padding: 52px 24px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          margin-bottom: 28px;
          transition: color 0.15s;
          cursor: pointer;
          background: none;
          border: none;
        }

        .back-link:hover { color: #374151; }

        .form-card {
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .form-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .form-header h1 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.3px;
        }

        .form-header p {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }

        .form-body {
          padding: 24px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
          letter-spacing: 0.01em;
        }

        .field input[type="text"],
        .field textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #111827;
          background: #fafafa;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          outline: none;
        }

        .field input[type="text"]:focus,
        .field textarea:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }

        .field input::placeholder,
        .field textarea::placeholder {
          color: #9ca3af;
        }

        .field textarea {
          resize: vertical;
          min-height: 90px;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }

        .toggle-row:hover {
          border-color: #6366f1;
          background: #fafafe;
        }

        .toggle-row input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #6366f1;
          cursor: pointer;
          flex-shrink: 0;
        }

        .toggle-label {
          display: flex;
          flex-direction: column;
        }

        .toggle-label span {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .toggle-label small {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 1px;
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          font-size: 13px;
          color: #dc2626;
          font-weight: 500;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .btn-submit {
          flex: 1;
          padding: 11px 20px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(99,102,241,0.3);
          transition: opacity 0.2s, transform 0.15s;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99,102,241,0.4);
        }

        .btn-submit:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .btn-cancel {
          padding: 11px 20px;
          background: #f3f4f6;
          color: #374151;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .btn-cancel:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="page-wrapper">
        <button className="back-link" onClick={() => router.push("/todos")}>
          ← Back to Todos
        </button>

        <div className="form-card">
          <div className="form-header">
            <h1>Create New Todo</h1>
            <p>Fill in the details below to add a task</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-body">
              {/* Title */}
              <div className="field">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  required
                  placeholder="e.g. Buy groceries"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  required
                  placeholder="Add a short description…"
                  value={form.description}
                  rows={3}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {/* Completed toggle */}
              <label className="toggle-row">
                <input
                  type="checkbox"
                  id="completed"
                  checked={form.completed}
                  onChange={(e) =>
                    setForm({ ...form, completed: e.target.checked })
                  }
                />
                <div className="toggle-label">
                  <span>Mark as Completed</span>
                  <small>Check if the task is already done</small>
                </div>
              </label>

              {/* Error */}
              {/* {error && <div className="error-msg">⚠️ {error}</div>} */}

              {/* Actions */}
              <div className="actions">
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading && <span className="spinner" />}
                  {loading ? "Saving…" : "Create Todo"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => router.push("/todos")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
