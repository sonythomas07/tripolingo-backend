const API_BASE_URL = "http://127.0.0.1:8000";

// 🔍 Store all destinations for live search
let allDestinations = [];
let fullDestinationsList = []; // 📄 Keep original full list for reset

// 📄 Pagination support
let visibleCount = 10;

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

  // 🔍 Live search functionality
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  // 🎬 Filters functionality
  const filtersBtn = document.getElementById("filters-btn");
  if (filtersBtn) {
    filtersBtn.addEventListener("click", toggleFilters);
  }

  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", applyFilters);
  }

  const clearFiltersBtn = document.getElementById("clear-filters");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
  }

  // 📄 Show More button
  const showMoreBtn = document.getElementById("show-more-btn");
  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", () => {
      visibleCount += 10;
      renderVisibleDestinations();
    });
  }
});

/* =========================
   🔍 SEARCH HANDLER
========================= */

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  // Only search from fullDestinationsList (original Supabase data)
  if (!fullDestinationsList || fullDestinationsList.length === 0) {
    console.warn("No destinations loaded from API");
    return;
  }

  // Reset pagination on new search
  visibleCount = 10;

  // Empty query = show all loaded destinations
  if (query === "") {
    allDestinations = fullDestinationsList;
    renderVisibleDestinations();
    return;
  }

  // Filter ONLY from fullDestinationsList (original Supabase API data)
  const filtered = fullDestinationsList.filter(dest =>
    (dest.name && dest.name.toLowerCase().includes(query)) ||
    (dest.country && dest.country.toLowerCase().includes(query)) ||
    (dest.travel_style && dest.travel_style.toLowerCase().includes(query))
  );

  console.log(`Search query: "${query}" | Results: ${filtered.length}`);
  
  // Update allDestinations with filtered results for pagination
  allDestinations = filtered;
  renderVisibleDestinations();
}

/* =========================
   🎬 FILTER SYSTEM
========================= */

function buildDynamicFilters(destinations) {
  if (!destinations || destinations.length === 0) return;

  // Extract unique values from destinations
  const styles = [...new Set(destinations.map(d => d.travel_style).filter(Boolean))];
  const budgets = [...new Set(destinations.map(d => d.budget).filter(Boolean))];
  const countries = [...new Set(destinations.map(d => d.country).filter(Boolean))];

  // Populate Activities
  const activitiesContainer = document.getElementById("filter-activities");
  if (activitiesContainer) {
    activitiesContainer.innerHTML = styles.map(style => `
      <label>
        <input type="radio" name="activity" value="${style}">
        ${style}
      </label>
    `).join("");
  }

  // Populate Budget
  const budgetContainer = document.getElementById("filter-budget");
  if (budgetContainer) {
    budgetContainer.innerHTML = budgets.map(budget => `
      <label>
        <input type="radio" name="budget" value="${budget}">
        ${budget}
      </label>
    `).join("");
  }

  // Populate Region (countries)
  const regionContainer = document.getElementById("filter-region");
  if (regionContainer) {
    regionContainer.innerHTML = countries.map(country => `
      <label>
        <input type="radio" name="region" value="${country}">
        ${country}
      </label>
    `).join("");
  }
}

function toggleFilters() {
  const panel = document.getElementById("filters-panel");
  if (panel) {
    panel.classList.toggle("show");
  }
}

function applyFilters() {
  // Only filter from fullDestinationsList (original Supabase data)
  if (!fullDestinationsList || fullDestinationsList.length === 0) {
    console.warn("No destinations loaded from API");
    return;
  }

  // Reset pagination on new filter
  visibleCount = 10;

  const selectedBudget = document.querySelector('input[name="budget"]:checked')?.value;
  const selectedActivity = document.querySelector('input[name="activity"]:checked')?.value;
  const selectedRegion = document.querySelector('input[name="region"]:checked')?.value;

  let filtered = fullDestinationsList;

  // Apply filters only if values are selected
  filtered = filtered.filter(d => !selectedBudget || d.budget === selectedBudget);
  filtered = filtered.filter(d => !selectedActivity || d.travel_style === selectedActivity);
  filtered = filtered.filter(d => !selectedRegion || d.country === selectedRegion);

  console.log(`Filters applied | Results: ${filtered.length}`);
  
  // Update allDestinations with filtered results for pagination
  allDestinations = filtered;
  renderVisibleDestinations();
  toggleFilters();
}

function clearFilters() {
  // Clear all radio buttons
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.checked = false;
  });

  // Reset pagination
  visibleCount = 10;

  // Restore full list
  allDestinations = fullDestinationsList;

  // Show all destinations from fullDestinationsList (original Supabase data)
  if (allDestinations && allDestinations.length > 0) {
    renderVisibleDestinations();
  }

  toggleFilters();
}

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

    console.log("✅ API Response received:", recommendations.length, "destinations");
    console.log("Raw API data:", recommendations);

    // ✅ Remove duplicates using destination name
    const unique = removeDuplicates(recommendations);

    console.log("✅ After deduplication:", unique.length, "unique destinations");
    console.log("✅ Unique destination names:", unique.map(d => d.name).join(", "));

    // 🔍 Store ONLY Supabase data (no demo/fallback data)
    fullDestinationsList = unique; // 📄 Keep original full list
    allDestinations = unique; // Current active list
    
    // ⭐ SAVE globally for AI highlight (same as allDestinations)
    window.currentRecommendations = unique;

    // 🎬 Build dynamic filters from loaded destinations
    buildDynamicFilters(unique);

    // Render visible destinations with pagination
    renderVisibleDestinations();

  } catch (error) {
    console.error("❌ Failed to load destinations from API:", error);
    // Clear all arrays to prevent showing stale/duplicate data
    fullDestinationsList = [];
    allDestinations = [];
    window.currentRecommendations = [];
    
    // Clear the UI
    const container = document.getElementById("destinations");
    if (container) {
      container.innerHTML = "<p>Failed to load destinations. Please refresh the page.</p>";
    }
  }
}

/* =========================
   RENDER DESTINATIONS
========================= */

function removeDuplicates(list) {
  // Remove duplicates using destination name as unique identifier
  return list.filter(
    (item, index, self) =>
      index === self.findIndex(d => d.name === item.name)
  );
}

function renderVisibleDestinations(highlighted = []) {
  // Get only the visible slice of destinations
  const visible = allDestinations.slice(0, visibleCount);
  
  // Render the visible destinations
  renderDestinations(visible, highlighted);

  // Show/hide "Show More" button
  const btn = document.getElementById("show-more-btn");
  if (btn) {
    if (visibleCount >= allDestinations.length) {
      btn.style.display = "none";
    } else {
      btn.style.display = "block";
    }
  }
}

function renderDestinations(destinations, highlighted = []) {

  const container = document.getElementById("destinations");
  
  // ✅ ALWAYS clear container before rendering (prevent duplicates)
  container.innerHTML = "";

  // Only show message if NO destinations from API
  if (!destinations || destinations.length === 0) {
    container.innerHTML = "<p>No destinations available. Please check your preferences or contact support.</p>";
    return;
  }

  console.log("🎨 Rendering", destinations.length, "destination(s):", destinations.map(d => d.name).join(", "));

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
      <div class="card-image" style="background-image: url('https://picsum.photos/400/250?random=${Math.random()}');"></div>

      <div class="card-body">

        <div class="card-header">
          <span class="badge">${dest.travel_style || "Travel"}</span>
          <span class="match">${dest.match}% Match</span>
        </div>

        <h3 class="title">${dest.name}</h3>
        <p class="country">📍 ${dest.country || ""}</p>

        <p class="desc">
          ${dest.description || ""}
        </p>

        <div class="tag-row">
          ${(dest.tags && Array.isArray(dest.tags) && dest.tags.length > 0)
            ? dest.tags.map(t=>`<span class="tag">${t}</span>`).join("")
            : ""}
        </div>

        <div class="action-row">
          <span class="pill">Visit Highlights</span>
          <span class="pill">Explore Local Spots</span>
          <span class="pill">+2</span>
        </div>

        <div class="meta">
          <span>💰 ${dest.budget || ""}</span>
          <span>📅 ${dest.season || ""}</span>
        </div>

        <div class="card-actions">
          <button class="save-btn">Save</button>
          <button class="plan-btn" id="plan-btn-${dest.name.replace(/\s+/g, '-')}"
            onclick="planTrip('${dest.name}','${dest.country}', this)">
            Plan Trip ✈️
          </button>
        </div>

      </div>
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
      renderVisibleDestinations(data.suggested_destinations);

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

/* =========================
   🔐 LOGOUT
========================= */

function logoutUser() {
  localStorage.removeItem("user_id");
  window.location.href = "login.html";
}
