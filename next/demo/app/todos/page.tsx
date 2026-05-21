"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:8000/todos")
      .then((res) => setTodos(res.data))
      .finally(() => setLoading(false));
  }, []);

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
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .header-left h1 {
          font-size: 26px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.4px;
        }

        .header-left p {
          font-size: 13px;
          color: #6b7280;
          margin-top: 4px;
        }

        .btn-create {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #fff;
          padding: 10px 20px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-create:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.45);
        }

        .card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        thead th {
          text-align: left;
          padding: 13px 20px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #9ca3af;
        }

        tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }

        tbody tr:last-child {
          border-bottom: none;
        }

        tbody tr:hover {
          background: #f9fafb;
        }

        tbody td {
          padding: 16px 20px;
          font-size: 14px;
          color: #374151;
          vertical-align: middle;
        }

        .td-id {
          color: #9ca3af;
          font-size: 13px;
          font-weight: 500;
          width: 56px;
        }

        .todo-title {
          font-weight: 600;
          color: #111827;
          font-size: 14px;
        }

        .todo-desc {
          color: #6b7280;
          font-size: 13px;
          margin-top: 3px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .badge-done {
          background: #dcfce7;
          color: #16a34a;
        }

        .badge-pending {
          background: #fef3c7;
          color: #d97706;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .dot-done { background: #16a34a; }
        .dot-pending { background: #d97706; }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          color: #9ca3af;
        }

        .empty-state .icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .empty-state p {
          font-size: 15px;
          font-weight: 500;
        }

        .loading-row td {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }

        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .stats-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .stat-chip strong {
          font-weight: 700;
          color: #111827;
        }
      `}</style>

      <div className="page-wrapper">
        <div className="header">
          <div className="header-left">
            <h1>📋 All Todos</h1>
            <p>Manage and track your tasks</p>
          </div>
          <Link href="/todos/create" className="btn-create">
            <span>＋</span> Create Todo
          </Link>
        </div>

        {!loading && todos.length > 0 && (
          <div className="stats-bar">
            <div className="stat-chip">
              Total <strong>{todos.length}</strong>
            </div>
            <div className="stat-chip">
              ✅ Done <strong>{todos.filter((t) => t.completed).length}</strong>
            </div>
            <div className="stat-chip">
              ⏳ Pending <strong>{todos.filter((t) => !t.completed).length}</strong>
            </div>
          </div>
        )}

        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr className="loading-row">
                    <td colSpan={3}>
                      <span className="spinner" />
                      Loading todos…
                    </td>
                  </tr>
                )}

                {!loading && todos.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state">
                        <div className="icon">🗒️</div>
                        <p>No todos yet. Create your first one!</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  todos.map((todo) => (
                    <tr key={todo.id}>
                      <td className="td-id">{todo.id}</td>
                      <td>
                        <div className="todo-title">{todo.title}</div>
                        {todo.description && (
                          <div className="todo-desc">{todo.description}</div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            todo.completed ? "badge-done" : "badge-pending"
                          }`}
                        >
                          <span
                            className={`dot ${
                              todo.completed ? "dot-done" : "dot-pending"
                            }`}
                          />
                          {todo.completed ? "Done" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
