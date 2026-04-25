async function getUsers() {
  try {
    const response = await fetch("https://dummyjson.com/recipes");
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.log(error);
  }
}

getUsers();

// async function loginUser() {
//   const res = await fetch("https://dummyjson.com/auth/login", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       username: "emilys",
//       password: "emilyspass"
//     })
//   });

//   const data = await res.json();
//   console.log(data);
// }

// loginUser();