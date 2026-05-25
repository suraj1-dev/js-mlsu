"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Page() {
  const [users, setUsers] = useState([]);

  console.log(users, "empty data");

  useEffect(() => {
    axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  console.log(users, "data");
  return (
    <div>
      <h1 className="text-3xl mb-10 text-green-600">Users</h1>

      {users.map((user, idx) => (
        <>
          <p className="text-xl text-red-600" key={user.id}>
            {user.name}
          </p>
          <h1 className="text-4xl bg-red-900">{user.email}</h1>
        </>
      ))}
    </div>
  );
}
