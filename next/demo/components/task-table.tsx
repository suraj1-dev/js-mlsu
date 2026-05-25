"use client";

import { useState } from "react";

type Priority = "High" | "Medium" | "Low";
type Status = "In Progress" | "Todo" | "Completed";

interface Task {
  id: number;
  name: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  completed: boolean;
}

const initialTasks: Task[] = [
  {
    id: 1,
    name: "Design system audit and documentation",
    dueDate: "Oct 24, 2023",
    priority: "High",
    status: "In Progress",
    completed: false,
  },
  {
    id: 2,
    name: "Client presentation for project Phoenix",
    dueDate: "Oct 26, 2023",
    priority: "Medium",
    status: "Todo",
    completed: false,
  },
  {
    id: 3,
    name: "Quarterly team sync up meeting",
    dueDate: "Oct 22, 2023",
    priority: "Low",
    status: "Completed",
    completed: true,
  },
  {
    id: 4,
    name: "Update mobile app navigation flows",
    dueDate: "Oct 28, 2023",
    priority: "High",
    status: "In Progress",
    completed: false,
  },
];

const priorityStyles: Record<Priority, string> = {
  High: "bg-red-100 text-red-600 border border-red-200",
  Medium: "bg-orange-100 text-orange-500 border border-orange-200",
  Low: "bg-purple-100 text-purple-500 border border-purple-200",
};

const statusStyles: Record<Status, { dot: string; text: string }> = {
  "In Progress": { dot: "bg-blue-500", text: "text-gray-700" },
  Todo: { dot: "bg-gray-400", text: "text-gray-700" },
  Completed: { dot: "bg-green-500", text: "text-green-600 font-medium" },
};

function ThreeDotsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="3" r="1.5" fill="#9CA3AF" />
      <circle cx="8" cy="8" r="1.5" fill="#9CA3AF" />
      <circle cx="8" cy="13" r="1.5" fill="#9CA3AF" />
    </svg>
  );
}

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all duration-150 flex-shrink-0 ${
        checked
          ? "bg-blue-600 border-blue-600"
          : "bg-white border-gray-300 hover:border-blue-400"
      }`}
    >
      {checked && (
        <svg
          width="11"
          height="9"
          viewBox="0 0 11 9"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 4L4 7.5L10 1"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

export const TaskTable = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              status: !t.completed ? "Completed" : "In Progress",
            }
          : t,
      ),
    );
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_140px_110px_140px_80px] px-6 py-3 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          Task Name
        </span>
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          Due Date
        </span>
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          Priority
        </span>
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
          Status
        </span>
        <span className="text-xs font-semibold tracking-widest text-gray-500 uppercase text-right">
          Actions
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {tasks.map((task) => {
          const { dot, text } = statusStyles[task.status];
          return (
            <div
              key={task.id}
              className="grid grid-cols-[1fr_140px_110px_140px_80px] items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-100"
            >
              {/* Task Name */}
              <div className="flex items-center gap-3 min-w-0">
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                />
                <span
                  className={`text-sm font-medium truncate transition-all duration-150 ${
                    task.completed
                      ? "line-through text-gray-400"
                      : "text-gray-800"
                  }`}
                >
                  {task.name}
                </span>
              </div>

              {/* Due Date */}
              <span
                className={`text-sm ${
                  task.completed ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {task.dueDate}
              </span>

              {/* Priority */}
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}
                >
                  {task.priority}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <span className={`text-sm ${text}`}>{task.status}</span>
              </div>

              {/* Actions */}
              <div className="flex justify-end relative">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === task.id ? null : task.id)
                  }
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ThreeDotsIcon />
                </button>
                {openMenu === task.id && (
                  <div className="absolute right-0 top-8 z-10 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      Edit
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      Duplicate
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                      onClick={() => {
                        setTasks((prev) =>
                          prev.filter((t) => t.id !== task.id),
                        );
                        setOpenMenu(null);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
