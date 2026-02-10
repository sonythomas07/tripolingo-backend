const API_BASE_URL = "http://127.0.0.1:8000";

// ---------------- SIGN UP ----------------
async function signup(event) {
  event.preventDefault();

  const displayName = document.getElementById("display_name").value;
  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        display_name: displayName,
        username: username,
        email: email,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Signup failed");
      return;
    }

    alert("Signup successful! Please login.");
    window.location.href = "login.html";

  } catch (error) {
    console.error(error);
    alert("Server error. Try again later.");
  }
}


// ---------------- SIGN IN ----------------
async function login(event) {
  event.preventDefault();

  const username = document.getElementById("login_username").value;
  const password = document.getElementById("login_password").value;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Login failed");
      return;
    }

    // Store user info for later use
    localStorage.setItem("user_id", data.user.id);
    localStorage.setItem("username", data.user.username);

    alert("Login successful!");
    // next page later: onboarding / dashboard
    // for now just log
    console.log("Logged in user:", data.user);

  } catch (error) {
    console.error(error);
    alert("Server error. Try again later.");
  }
}
