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

  // 🎚️ Budget slider handler
  const budgetSlider = document.getElementById("budget-slider");
  if (budgetSlider) {
    budgetSlider.addEventListener("input", updateBudgetDisplay);
  }

  // 📄 Show More button
  const showMoreBtn = document.getElementById("show-more-btn");
  if (showMoreBtn) {
    showMoreBtn.addEventListener("click", () => {
      visibleCount += 10;
      renderVisibleDestinations();
    });
  }

  // 🎬 Trip Detail Overlay - Close button
  const closeOverlayBtn = document.getElementById("close-overlay");
  if (closeOverlayBtn) {
    closeOverlayBtn.addEventListener("click", () => {
      document.getElementById("trip-detail-overlay").classList.add("hidden");
    });
  }

  // 🎬 Planner Overlay - Close button
  const closePlannerBtn = document.getElementById("close-planner");
  if (closePlannerBtn) {
    closePlannerBtn.addEventListener("click", () => {
      document.getElementById("planner-overlay").classList.add("hidden");
    });
  }

  // 🎬 Add Todo button
  const addTodoBtn = document.getElementById("addTodoBtn");
  if (addTodoBtn) {
    addTodoBtn.addEventListener("click", addTodoItem);
  }

  // 🎬 Confirm Trip button
  const confirmTripBtn = document.getElementById("confirmTripBtn");
  if (confirmTripBtn) {
    confirmTripBtn.addEventListener("click", confirmPlannedTrip);
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
  const countries = [...new Set(destinations.map(d => d.country).filter(Boolean))];

  // Populate Activities (scrollable checkboxes)
  const activitiesContainer = document.getElementById("filter-activities");
  if (activitiesContainer) {
    activitiesContainer.innerHTML = styles.map(style => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="activity" value="${style}">
        ${style}
      </label>
    `).join("");
  }

  // Populate Region (scrollable checkboxes)
  const regionContainer = document.getElementById("filter-region");
  if (regionContainer) {
    regionContainer.innerHTML = countries.map(country => `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="region" value="${country}">
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

function mapBudgetRange(value) {
  if (value <= 500) return "low";
  if (value <= 1500) return "moderate";
  if (value <= 2500) return "high";
  return "premium";
}

function updateBudgetDisplay() {
  const slider = document.getElementById("budget-slider");
  const display = document.getElementById("budget-value");
  
  if (!slider || !display) return;
  
  const budgetRanges = ["", "$0 - $500", "$500 - $1500", "$1500 - $3000", "$3000+"];
  display.textContent = budgetRanges[slider.value];
}

function applyFilters() {
  // Only filter from fullDestinationsList (original Supabase data)
  if (!fullDestinationsList || fullDestinationsList.length === 0) {
    console.warn("No destinations loaded from API");
    return;
  }

  // Reset pagination on new filter
  visibleCount = 10;

  // Get budget from slider - convert to dollar value, then to budget category
  const budgetSlider = document.getElementById("budget-slider");
  let selectedBudget = null;
  let budgetActive = false;
  
  if (budgetSlider && budgetSlider.value !== "2") {
    // Map slider values to representative dollar amounts
    const sliderToDollar = {
      "1": 250,    // $0 - $500 range
      "2": 1000,   // $500 - $1500 range
      "3": 2250,   // $1500 - $3000 range
      "4": 3001    // $3000+ range
    };
    
    const dollarValue = sliderToDollar[budgetSlider.value];
    selectedBudget = mapBudgetRange(dollarValue);
    budgetActive = true;
  }

  // Get selected activities (checkboxes)
  const selectedActivities = Array.from(
    document.querySelectorAll('input[name="activity"]:checked')
  ).map(cb => cb.value);

  // Get selected regions (checkboxes)
  const selectedRegions = Array.from(
    document.querySelectorAll('input[name="region"]:checked')
  ).map(cb => cb.value);

  // Check if any filters are active
  const activitiesActive = selectedActivities.length > 0;
  const regionsActive = selectedRegions.length > 0;
  const anyFilterActive = budgetActive || activitiesActive || regionsActive;

  // If no filters selected, keep original order
  if (!anyFilterActive) {
    allDestinations = fullDestinationsList;
    renderVisibleDestinations();
    toggleFilters();
    return;
  }

  // Calculate matchScore for each destination
  const destinationsWithScore = fullDestinationsList.map(dest => {
    let matchScore = 0;

    // +1 if budget matches (compare lowercase)
    if (budgetActive && dest.budget && dest.budget.toLowerCase() === selectedBudget) {
      matchScore += 1;
    }

    // +1 if activity matches (check travel_style or activity_tags)
    if (activitiesActive) {
      const hasMatchingActivity = selectedActivities.includes(dest.travel_style) ||
        (dest.activity_tags && dest.activity_tags.some(tag => selectedActivities.includes(tag)));
      if (hasMatchingActivity) {
        matchScore += 1;
      }
    }

    // +1 if country matches selected region
    if (regionsActive && selectedRegions.includes(dest.country)) {
      matchScore += 1;
    }

    return { ...dest, matchScore };
  });

  // Sort by matchScore descending (higher scores first)
  destinationsWithScore.sort((a, b) => b.matchScore - a.matchScore);

  console.log(`Filters applied | All destinations sorted by match score`);
  
  // Update allDestinations with sorted results (all destinations kept)
  allDestinations = destinationsWithScore;
  renderVisibleDestinations();
  toggleFilters();
}

function clearFilters() {
  // Clear all checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Reset budget slider to default (Moderate = 2)
  const budgetSlider = document.getElementById("budget-slider");
  if (budgetSlider) {
    budgetSlider.value = "2";
    updateBudgetDisplay();
  }

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

    const destinations = await response.json();

    console.log("✅ API Response received:", destinations.length, "destinations");
    
    // 🔍 Store destinations
    fullDestinationsList = destinations; // 📄 Keep original full list
    allDestinations = destinations; // Current active list
    
    // ⭐ SAVE globally for AI highlight
    window.currentRecommendations = destinations;

    // 🎬 Build dynamic filters from loaded destinations
    buildDynamicFilters(destinations);

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

    // 🎯 Process activities - show max 2 in vertical layout
    let activityListHTML = '';
    const activities = dest.activities || [];
    
    if (activities.length > 0) {
      const activity1 = activities[0];
      const activity2 = activities.length > 1 ? activities[1] : null;
      const overflowCount = activities.length - 2;
      
      // Line 1: First activity
      activityListHTML += `<div class="activity-row">
        <span class="activity-pill">${activity1}</span>
      </div>`;
      
      // Line 2: Second activity + overflow badge (if applicable)
      if (activity2) {
        activityListHTML += `<div class="activity-row">
          <span class="activity-pill">${activity2}</span>`;
        
        if (overflowCount > 0) {
          activityListHTML += `<span class="activity-more">+${overflowCount}</span>`;
        }
        
        activityListHTML += `</div>`;
      }
    } else {
      // Fallback
      activityListHTML = `<div class="activity-row">
        <span class="activity-pill">Explore & Discover</span>
      </div>`;
    }

    // 🎯 Conditional match badge rendering
    const matchBadge = (dest.match !== undefined && dest.match !== null && typeof dest.match === 'number')
      ? `<span class="match-badge">${dest.match}% Match</span>`
      : "";

    card.innerHTML = `
      <div class="card-image" style="background-image: url('https://picsum.photos/400/250?random=${Math.random()}');">
        <div class="card-image-overlay">
          <h3 class="card-title">${dest.name}</h3>
          <p class="card-country">${dest.country || ""}</p>
        </div>
        ${matchBadge}
      </div>

      <div class="card-body">

        <p class="card-desc">
          ${dest.description || "Discover this amazing destination and create unforgettable memories."}
        </p>

        <div class="activity-list">
          ${activityListHTML}
        </div>

        <div class="card-meta">
          <span class="meta-item">💰 ${dest.budget || "Flexible"}</span>
          <span class="meta-divider">•</span>
          <span class="meta-item">📅 ${dest.season || "Year-round"}</span>
        </div>

        <div class="card-actions">
          <button class="plan-trip-btn" onclick='openPlanner(${JSON.stringify(dest)})'>
            Plan Trip
          </button>
          <button class="save-btn" onclick='saveTrip(${JSON.stringify(dest)})'>
            Save
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
   🎬 FULLSCREEN PLANNER
========================= */

let currentPlannerDestination = null;

function openPlanner(destination) {
  currentPlannerDestination = destination;
  
  const overlay = document.getElementById("planner-overlay");
  overlay.classList.remove("hidden");
  
  // Set title
  document.getElementById("planner-title").textContent = `Plan Your Trip to ${destination.name}`;
  
  // Set default dates
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 30);
  document.getElementById("startDate").value = startDate.toISOString().split("T")[0];
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  document.getElementById("endDate").value = endDate.toISOString().split("T")[0];
  
  // Initialize todo list from destination activities
  const todoContainer = document.getElementById("todoContainer");
  todoContainer.innerHTML = "";
  
  if (destination.activities && destination.activities.length > 0) {
    destination.activities.forEach(activity => {
      addTodoItem(activity);
    });
  } else {
    // Add one empty todo item
    addTodoItem();
  }
}

function addTodoItem(initialValue = "") {
  const todoContainer = document.getElementById("todoContainer");
  
  const todoItem = document.createElement("div");
  todoItem.className = "planner-todo-item";
  
  todoItem.innerHTML = `
    <input type="text" class="todo-input" placeholder="Enter activity..." value="${initialValue}" />
    <button class="remove-todo-btn" onclick="this.parentElement.remove()">×</button>
  `;
  
  todoContainer.appendChild(todoItem);
}

function confirmPlannedTrip() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  
  if (!startDate || !endDate) {
    showToast("⚠️ Please select start and end dates");
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    showToast("⚠️ End date must be after start date");
    return;
  }
  
  // Collect todos
  const todoInputs = document.querySelectorAll(".todo-input");
  const todos = Array.from(todoInputs)
    .map(input => input.value.trim())
    .filter(value => value !== "");
  
  if (todos.length === 0) {
    showToast("⚠️ Add at least one activity");
    return;
  }
  
  // Call save function
  savePlannedTrip(currentPlannerDestination, startDate, endDate, todos);
}

async function savePlannedTrip(destination, startDate, endDate, todos) {
  const accessToken = localStorage.getItem("access_token");
  
  if (!accessToken) {
    showToast("⚠️ Login required");
    return;
  }
  
  if (!destination.id) {
    showToast("❌ Invalid destination");
    return;
  }
  
  try {
    const res = await fetch("http://127.0.0.1:8000/trips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        destination_id: destination.id,
        status: "planning",
        trip_date: startDate,
        activities: todos
      })
    });
    
    if (res.ok) {
      showToast("✅ Trip planned successfully!");
      
      // Close planner
      document.getElementById("planner-overlay").classList.add("hidden");
      
      // Optional: redirect to My Trips page
      setTimeout(() => {
        window.location.href = "trip.html";
      }, 1500);
    } else {
      const errorText = await res.text();
      console.log("Error response:", errorText);
      showToast("❌ Failed to plan trip");
    }
  } catch (err) {
    console.error("Plan trip error:", err);
    showToast("❌ Trip planning failed");
  }
}

/* =========================
   🎬 TRIP DETAIL OVERLAY
========================= */

function openTripDetail(destinationName) {
  // Find the destination from fullDestinationsList
  const destination = fullDestinationsList.find(d => d.name === destinationName);
  
  if (!destination) {
    console.error("Destination not found:", destinationName);
    return;
  }

  const overlay = document.getElementById("trip-detail-overlay");
  overlay.classList.remove("hidden");

  // Set title
  document.getElementById("trip-title").innerText = `${destination.name}, ${destination.country || ""}`;

  // Set hero image
  const heroEl = document.getElementById("trip-hero");
  heroEl.style.backgroundImage = `url('https://picsum.photos/900/240?random=${Math.random()}')`;

  // Set default date (30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  document.getElementById("trip-date").value = futureDate.toISOString().split("T")[0];
  
  // Set default time
  document.getElementById("trip-time").value = "09:00";

  // Build TODO list from activities
  const todoContainer = document.getElementById("trip-todo-list");
  todoContainer.innerHTML = "";

  if (destination.activities && destination.activities.length > 0) {
    destination.activities.forEach(activity => {
      const item = document.createElement("div");
      item.className = "todo-item";
      item.innerHTML = `
        <input type="checkbox" class="todo-checkbox"/>
        <span class="todo-text">${activity}</span>
      `;
      todoContainer.appendChild(item);
    });
  } else {
    todoContainer.innerHTML = '<p class="no-activities">No activities available for this destination.</p>';
  }
}

/* =========================
   🎬 SAVE TRIP (NEW)
========================= */

async function saveTrip(destination) {

  const accessToken = localStorage.getItem("access_token");

  if (!accessToken) {
    showToast("⚠️ Login required");
    return;
  }

  // Validate destination_id
  if (!destination.id) {
    showToast("❌ Invalid destination");
    return;
  }

  try {

    const res = await fetch("http://127.0.0.1:8000/trips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        destination_id: destination.id,
        status: "planning"
      })
    });

    if (res.ok) {
      // Success: Show toast and update UI instantly (no reload)
      showToast("✅ Trip Saved");
      
      // Optional: Update the save button to show "Saved" state
      const saveButtons = document.querySelectorAll('.action-save');
      saveButtons.forEach(btn => {
        const btnDestId = btn.getAttribute('data-dest-id');
        if (btnDestId === destination.id) {
          btn.textContent = "Saved";
          btn.disabled = true;
          btn.style.opacity = "0.6";
        }
      });

    } else {
      // Log full response text for debugging
      const errorText = await res.text();
      console.log("Error response:", errorText);
      showToast("❌ Trip save failed");
    }

  } catch (err) {
    console.error("Save trip error:", err);
    showToast("❌ Trip save failed");
  }
}


/* =========================
   🎬 PLAN TRIP (CINEMATIC)
========================= */

async function planTrip(destination, buttonElement) {

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    showToast("⚠️ Login required");
    return;
  }

  // Validate destination
  if (!destination.id) {
    showToast("❌ Invalid destination");
    return;
  }

  // 🎬 Disable button and change text
  const originalText = buttonElement.innerHTML;
  buttonElement.innerHTML = "Saving...";
  buttonElement.disabled = true;

  // 🎬 Add planning-glow to card
  const card = buttonElement.closest(".card");
  card.classList.add("planning-glow");

  // Call saveTrip function
  try {
    await saveTrip(destination);
  } catch (err) {
    // Reset button on error
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
    card.classList.remove("planning-glow");
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
