"use client";

import { useEffect, useState } from "react";

export default function About() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");

  // //run when components mount
  // useEffect(() => {
  //   console.log("helllo");
  // }, []);

  //run on every render
  useEffect(() => {
    console.log("helllo");
  }, [name]);

  console.log(count, "count");

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Counter Page</h1>

      {/* Name input field */}
      <div style={{ margin: "20px 0" }}>
        <label
          htmlFor="name-input"
          style={{ fontSize: "16px", marginRight: "10px" }}
        >
          Name:
        </label>
        <input
          id="name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={{
            padding: "8px 14px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            outline: "none",
          }}
        />
      </div>

      {name && (
        <p style={{ fontSize: "18px", color: "#555", margin: "8px 0 20px" }}>
          Hello, <strong>{name}</strong>!
        </p>
      )}

      <p style={{ fontSize: "24px", margin: "20px 0" }}>Count: {count}</p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          onClick={() => setCount(count - 1)}
          style={{
            padding: "10px 24px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "#f44336",
            color: "#fff",
          }}
        >
          −
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: "10px 24px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "#9e9e9e",
            color: "#fff",
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(count + 1)}
          style={{
            padding: "10px 24px",
            fontSize: "18px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            cursor: "pointer",
            background: "#4caf50",
            color: "#fff",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
