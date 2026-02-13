const API_BASE_URL = "http://127.0.0.1:8000";

/* =========================
   LOAD DISCOVER PAGE
========================= */

document.addEventListener("DOMContentLoaded", () => {
  // 🎬 Add CSS animations (since we're not modifying CSS file)
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .cinematic-glow {
      animation: cardGlow 0.8s ease-out;
    }

    @keyframes cardGlow {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      50% {
        box-shadow: 0 0 30px rgba(102, 126, 234, 0.8);
        transform: scale(1.02);
      }
    }

    .toast {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: #0b0b0b;
      border: 1px solid #00ffd0;
      padding: 14px 20px;
      border-radius: 8px;
      color: #00ffd0;
      box-shadow: 0 0 15px #00ffd055;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.4s ease;
      z-index: 10000;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    .planning-glow {
      box-shadow: 0 0 30px #00ffd0aa;
      transition: 0.4s ease;
    }
  `;
  document.head.appendChild(style);

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

    // 🌌 Destination Theme Engine
    const themeMap = {
      "Bali": "theme-tropical",
      "Reykjavik": "theme-ice",
      "Kyoto": "theme-sakura",
      "Paris": "theme-luxury"
    };

    if (themeMap[dest.name]) {
      card.classList.add(themeMap[dest.name]);
    }

    // ⭐ AI Highlight
    if (highlighted.includes(dest.name)) {

      card.classList.add("highlight-card");

      // 🌌 AI Awareness Animation
      setTimeout(() => {
        card.classList.add("ai-focus");
      }, 100);

      // 🎬 Auto scroll cinematic focus
      setTimeout(() => {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 300);
    }

    card.innerHTML = `
      <h3>${dest.name}, ${dest.country}</h3>
      <p>Match Score: ${dest.match}%</p>

      <button class="plan-btn" id="plan-btn-${dest.name.replace(/\s+/g, '-')}"
        onclick="planTrip('${dest.name}','${dest.country}', this)">
        Plan Trip ✈️
      </button>
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

    // 🌌 AI Background Reaction
    document.body.classList.add("ai-background-flash");

    setTimeout(() => {
      document.body.classList.remove("ai-background-flash");
    }, 800);

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

/* =========================
   🎬 PLAN TRIP (CINEMATIC)
========================= */

async function planTrip(destination, country, buttonElement) {

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    showToast("⚠️ Login required");
    return;
  }

  // 🎬 Disable button and change text
  const originalText = buttonElement.innerHTML;
  buttonElement.innerHTML = "Planning...";
  buttonElement.disabled = true;

  // 🎬 Add planning-glow to card
  const card = buttonElement.closest(".card");
  card.classList.add("planning-glow");

  // 🎬 Default cinematic future date (30 days ahead)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const travelDate = futureDate.toISOString().split("T")[0];

  try {

    const res = await fetch("http://127.0.0.1:8000/trips/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: userId,
        destination: destination,
        country: country || "",
        travel_date: travelDate
      })
    });

    if (!res.ok) throw new Error("Trip create failed");

    // 🎬 Success: Show cinematic toast
    showToast("🎬 Trip added to My Trips");

    // 🎬 Redirect after 800ms
    setTimeout(() => {
      window.location.href = "trip.html";
    }, 800);

  } catch (err) {
    console.error(err);
    
    // Reset button on error
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
    card.classList.remove("planning-glow");
    
    showToast("❌ Trip creation failed");
  }
}

/* =========================
   🎬 CINEMATIC TOAST
========================= */

function showToast(message) {
  // Create toast element
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Trigger show animation
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);
  
  // Remove after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}
