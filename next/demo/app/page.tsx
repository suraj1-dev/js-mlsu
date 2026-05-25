"use client";
import { TaskTable } from "@/components/task-table";
import axios from "axios";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [title, setTitle] = useState("");

  const [userId, setUserId] = useState("");

  const [response, setResponse] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !userId) {
      alert("Please fill all fields");

      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        "https://dummyjson.com/posts/add",

        {
          title,

          userId: Number(userId),
        },

        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      setResponse(res.data);

      setTitle("");

      setUserId("");
    } catch (error) {
      console.log(error);

      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold">Demo Project</h1>
        <div className="flex gap-4">
          <Link
            href="/gemini"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
          >
            Open Gemini Chat 🤖
          </Link>
          <Link
            href="/voice"
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200"
          >
            Open Gemini Voice 🎙️
          </Link>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-5">Add Post</h1>

      <div className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Enter user id"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-black text-white p-2 rounded"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>

      {response && (
        <div className="mt-6 border p-4 rounded">
          <h2 className="font-bold mb-2">API Response</h2>

          {/* <p>
            <strong>ID:</strong> {response.id}
          </p> */}

          <p>
            <strong>Title:</strong> {response.title}
          </p>

          <p>
            <strong>User ID:</strong> {response.userId}
          </p>
        </div>
      )}
    </div>
  );
}
