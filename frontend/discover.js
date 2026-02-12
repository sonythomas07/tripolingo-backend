const API_BASE_URL = "http://127.0.0.1:8000";

/* =========================
   LOAD DISCOVER PAGE
========================= */

document.addEventListener("DOMContentLoaded", () => {
  loadDiscover();

  document.getElementById("chat-icon").addEventListener("click", () => {
    document.getElementById("ai-chat-container").classList.toggle("show");
  });
});

async function loadDiscover() {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("Please login again");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recommendations/${userId}`);

    if (!response.ok) {
      const text = await response.text();
      console.error("Backend error:", text);
      throw new Error("API error");
    }

    const recommendations = await response.json();

    console.log("Recommendations:", recommendations);

    // ⭐ SAVE globally for AI highlight
    window.currentRecommendations = recommendations;

    renderDestinations(recommendations);

  } catch (error) {
    console.error("Fetch failed:", error);
  }
}

/* =========================
   RENDER DESTINATIONS
========================= */

function renderDestinations(destinations, highlighted = []) {

  const container = document.getElementById("destinations");
  container.innerHTML = "";

  if (!destinations || destinations.length === 0) {
    container.innerHTML = "<p>No destinations match your preferences yet.</p>";
    return;
  }

  destinations.forEach(dest => {

    const card = document.createElement("div");
    card.className = "card";

    // ⭐ AI Highlight
    if (highlighted.includes(dest.name)) {
      card.classList.add("highlight-card");

      // 🔥 auto scroll to suggestion
      setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }

    card.innerHTML = `
      <h3>${dest.name}, ${dest.country}</h3>
      <p>Match Score: ${dest.match}%</p>
    `;

    container.appendChild(card);
  });
}

/* =========================
   🤖 AI CHAT
========================= */

async function sendMessage() {

  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (!message) return;

  const chatMessages = document.getElementById("chat-messages");

  chatMessages.innerHTML += `<div class="user-msg">You: ${message}</div>`;
  input.value = "";

  const typingId = "typing-" + Date.now();
  chatMessages.innerHTML += `<div id="${typingId}" class="ai-msg typing">Tripolingo AI is typing...</div>`;

  chatMessages.scrollTop = chatMessages.scrollHeight;

  const userId = localStorage.getItem("user_id");

  try {
    const res = await fetch(`${API_BASE_URL}/ai/chat/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    // ⭐ IMPORTANT CHECK
    if (!res.ok) {
      throw new Error("Backend returned error");
    }

    const data = await res.json();

    console.log("AI RESPONSE:", data);

    document.getElementById(typingId)?.remove();

    await typeAIMessage(data.reply);

    // ⭐ Highlight only if exists
    if (data.suggested_destinations?.length && window.currentRecommendations) {
      renderDestinations(
        window.currentRecommendations,
        data.suggested_destinations
      );

      scrollToSuggested(data.suggested_destinations);
    }

  } catch (err) {
    console.error("AI CHAT ERROR:", err);
    document.getElementById(typingId)?.remove();
    chatMessages.innerHTML += `<div class="ai-msg" style="color:red">AI connection error.</div>`;
  }
}


async function typeAIMessage(text) {

  const chatMessages = document.getElementById("chat-messages");

  const msgDiv = document.createElement("div");
  msgDiv.className = "ai-msg";
  msgDiv.innerHTML = "Tripolingo AI: ";

  chatMessages.appendChild(msgDiv);

  for (let i = 0; i < text.length; i++) {
    msgDiv.innerHTML += text[i];
    await new Promise(r => setTimeout(r, 8)); // typing speed
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function scrollToSuggested(list) {

  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const title = card.querySelector("h3").innerText;

    list.forEach(name => {
      if (title.includes(name)) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    });
  });
}
