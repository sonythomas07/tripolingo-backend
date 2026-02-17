const API_BASE_URL = "http://127.0.0.1:8000";

// 🎬 Global trips storage
let allTrips = [];
let currentFilter = "all";

// 🎬 Global state for planner
let currentEditTrip = null;

document.addEventListener("DOMContentLoaded", () => {
  // 🎬 Add CSS animations (since we're not modifying CSS file)
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

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
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 15px rgba(102, 126, 234, 0.5);
      }
      50% {
        box-shadow: 0 0 25px rgba(102, 126, 234, 0.8);
      }
    }
  `;
  document.head.appendChild(style);

  loadTrips();

  // 🎬 Setup filter dropdown
  document.getElementById("status-filter").addEventListener("change", (e) => {
    currentFilter = e.target.value;
    renderTrips(allTrips);
  });

  // 🎬 Setup view toggle buttons
  document.getElementById("grid-btn").addEventListener("click", () => {
    document.getElementById("trip-sections").style.display = "block";
    document.getElementById("calendar-view").style.display = "none";
    document.getElementById("grid-btn").classList.add("active");
    document.getElementById("calendar-btn").classList.remove("active");
  });

  document.getElementById("calendar-btn").addEventListener("click", () => {
    document.getElementById("trip-sections").style.display = "none";
    document.getElementById("calendar-view").style.display = "block";
    document.getElementById("grid-btn").classList.remove("active");
    document.getElementById("calendar-btn").classList.add("active");
    renderCalendar(allTrips);
  });

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
    confirmTripBtn.addEventListener("click", updatePlannedTrip);
  }
});

async function loadTrips() {

  // Load from localStorage instead of API
  const plannedTrips = JSON.parse(localStorage.getItem("plannedTrips") || "[]");
  const wishlistTrips = JSON.parse(localStorage.getItem("wishlistTrips") || "[]");

  // Get today's date for status calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

  // Combine and format trips for rendering with dynamic status calculation
  const allTripsFromStorage = [
    ...plannedTrips.map(trip => {
      const startDate = trip.startDate || new Date().toISOString().split('T')[0];
      const endDate = trip.endDate || startDate;
      
      // Normalize status to lowercase and calculate dynamic status based on dates
      let normalizedStatus = (trip.status || "planning").toLowerCase();
      let status = calculateTripStatus(startDate, endDate, normalizedStatus);
      
      return {
        ...trip,
        status: status,
        trip_date: startDate,
        start_date: startDate,
        end_date: endDate,
        destination: trip.destination,
        country: trip.country,
        description: trip.description,
        activities: trip.todos || trip.activities || []
      };
    }),
    ...wishlistTrips.map(trip => ({
      ...trip,
      status: "wishlist", // Wishlist always stays wishlist
      trip_date: new Date().toISOString().split('T')[0],
      destination: trip.destination,
      country: trip.country,
      description: trip.description,
      activities: trip.activities || []
    }))
  ];

  console.log("TRIPS FROM LOCALSTORAGE:", allTripsFromStorage);

  // 🎬 Store trips globally
  allTrips = allTripsFromStorage;

  renderTrips(allTripsFromStorage);
}


/* ===============================
   🎬 CALCULATE TRIP STATUS
   Based on start_date, end_date, and today
================================ */
function calculateTripStatus(startDate, endDate, currentStatus) {
  // Normalize status to lowercase
  const normalizedStatus = (currentStatus || "").toLowerCase();
  
  // Keep wishlist and cancelled status as-is
  if (normalizedStatus === "wishlist" || normalizedStatus === "cancelled") {
    return normalizedStatus;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate || startDate);
  end.setHours(0, 0, 0, 0);

  // Calculate status based on date comparison
  if (today < start) {
    return "upcoming";
  } else if (today >= start && today <= end) {
    return "ongoing";
  } else if (today > end) {
    return "completed";
  }
  
  return "planning"; // Fallback
}


/* ===============================
   🎬 GROUP TRIPS BY STATUS
================================ */
function groupTrips(trips) {
  return {
    wishlist: trips.filter(t => t.status === "wishlist"),
    planning: trips.filter(t => t.status === "planning"),
    upcoming: trips.filter(t => t.status === "upcoming"),
    ongoing: trips.filter(t => t.status === "ongoing"),
    completed: trips.filter(t => t.status === "completed"),
    cancelled: trips.filter(t => t.status === "cancelled")
  };
}


/* ===============================
   🎬 Render Cinematic Trip Cards
================================ */
function renderTrips(trips) {

  // 🛡️ Filter out cancelled and completed trips
  trips = trips.filter(t => 
    t.status !== "cancelled" && 
    t.status !== "completed"
  );

  // Apply filter
  let filteredTrips = trips;
  if (currentFilter !== "all") {
    filteredTrips = trips.filter(t => t.status === currentFilter);
  }

  // Group trips by status
  const groups = groupTrips(filteredTrips);

  // Clear all sections
  ["wishlist-section", "planning-section", "upcoming-section", "ongoing-section"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  // Render each section
  renderSection("wishlist-section", "⭐ Wishlist", groups.wishlist);
  renderSection("planning-section", "📋 Planning", groups.planning);
  renderSection("upcoming-section", "✈️ Upcoming Trips", groups.upcoming);
  renderSection("ongoing-section", "🌍 Ongoing Adventures", groups.ongoing);

  // Start live countdown
  startLiveCountdown(filteredTrips);
}


/* ===============================
   🎬 RENDER SECTION WITH TITLE
================================ */
function renderSection(sectionId, title, trips) {
  const section = document.getElementById(sectionId);
  
  if (!trips || trips.length === 0) {
    return; // Don't render empty sections
  }

  // Add section title
  const titleEl = document.createElement("h2");
  titleEl.className = "section-title";
  titleEl.textContent = title;
  section.appendChild(titleEl);

  // Create grid container for cards
  const grid = document.createElement("div");
  grid.className = "destinations-grid";

  // Render each trip card
  trips.forEach((trip, index) => {
    const card = createTripCard(trip, index);
    grid.appendChild(card);
  });

  section.appendChild(grid);
}


/* ===============================
   🎬 CREATE TRIP CARD
================================ */
function createTripCard(trip, index) {
  const card = document.createElement("div");
  card.className = "card";
  
  // 🎬 Add unique identifier for card removal
  card.setAttribute("data-trip-id", trip.destination);
  
  // 🎬 Store trip data for edit functionality
  card.setAttribute("data-trip-data", JSON.stringify({
    destination: trip.destination,
    startDate: trip.start_date || trip.trip_date,
    endDate: trip.end_date,
    activities: trip.activities || [],
    status: trip.status
  }));

  // 🎬 Fade-in animation with stagger
  card.style.cssText = `
    opacity: 0;
    animation: fadeIn 0.5s ease-out forwards;
    animation-delay: ${index * 0.05}s;
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  // 🎬 Status badge with glow
  const statusBadge = getStatusBadge(trip.status);

  // 🎬 Live countdown element
  let countdownHTML = "";

  const tripDate = new Date(trip.start_date || trip.trip_date);
  
  if (trip.status === "wishlist") {
    countdownHTML = `<p class="countdown" style="color: #00ffd5;">⭐ Saved to Wishlist</p>`;
  } else if (trip.status === "ongoing") {
    countdownHTML = `<p class="countdown" style="color: #ffa500;">🔥 Trip is happening now!</p>`;
  } else {
    countdownHTML = `<p class="countdown" data-date="${trip.start_date || trip.trip_date}" data-trip-id="${trip.id}" data-status="${trip.status}">Loading...</p>`;
  }

  // 🎬 Process activities - show max 2
  let activityListHTML = '';
  const activities = trip.activities || [];
  
  if (activities.length > 0) {
    const displayActivities = activities.slice(0, 2);
    activityListHTML = displayActivities.map(activity => 
      `<span class="activity-pill">${activity}</span>`
    ).join('');
    
    if (activities.length > 2) {
      activityListHTML += `<span class="activity-more">+${activities.length - 2} more</span>`;
    }
  }

  // 🎬 Cinematic card layout (same as Discover page)
  card.innerHTML = `
    <div class="card-image" style="background-image: url('${trip.image || `https://picsum.photos/400/250?random=${Math.random()}`}');">
      <div class="card-image-overlay">
        <h3 class="card-title">${trip.destination}</h3>
        <p class="card-country">${trip.country || ""}</p>
      </div>
      ${statusBadge}
    </div>

    <div class="card-body">

      <p class="card-desc">
        ${(trip.description || "Your upcoming adventure awaits!").substring(0, 120)}${trip.description && trip.description.length > 120 ? '...' : ''}
      </p>

      <div class="activity-list">
        ${activityListHTML}
      </div>

      <div class="card-meta">
        <span class="meta-item">📅 ${formatDate(trip.start_date || trip.trip_date)}${trip.end_date && trip.end_date !== trip.start_date ? ' - ' + formatDate(trip.end_date) : ''}</span>
      </div>

      ${countdownHTML}

      <div class="trip-actions">
        <button class="edit-btn" onclick="openTripPlannerFromCard(this)">
          ✏️ Edit
        </button>
        <button class="cancel-btn" onclick="cancelTrip('${trip.destination.replace(/'/g, "\\'")}')">
          🗑️ Cancel
        </button>
      </div>

    </div>
  `;

  return card;
}


/* ===============================
   🎬 Status Badge with Glow
================================ */
function getStatusBadge(status) {

  let badgeClass = "";
  let badgeText = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === "wishlist") {
    return `<span class="status-badge" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(0,255,213,0.2);
      color: #00ffd5;
      border: 1px solid #00ffd5;
      box-shadow: 0 2px 8px rgba(0,255,213,0.3);
      z-index: 2;
    ">⭐ ${badgeText}</span>`;
  }

  if (status === "planning") {
    badgeClass = "cinematic-glow";
    return `<span class="status-badge ${badgeClass}" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(102, 126, 234, 0.95);
      color: #fff;
      border: 1px solid #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
      z-index: 2;
    ">${badgeText}</span>`;
  }

  if (status === "upcoming") {
    return `<span class="status-badge" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(102, 126, 234, 0.95);
      color: #fff;
      border: 1px solid #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
      z-index: 2;
    ">✈️ ${badgeText}</span>`;
  }

  if (status === "ongoing") {
    return `<span class="status-badge cinematic-glow" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(255, 165, 0, 0.95);
      color: #fff;
      border: 1px solid #ffa500;
      box-shadow: 0 2px 8px rgba(255, 165, 0, 0.5);
      z-index: 2;
    ">🔥 ${badgeText}</span>`;
  }

  if (status === "completed") {
    return `<span class="status-badge" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(81, 207, 102, 0.95);
      color: #020617;
      border: 1px solid #51cf66;
      box-shadow: 0 2px 8px rgba(81, 207, 102, 0.5);
      z-index: 2;
    ">✅ ${badgeText}</span>`;
  }

  if (status === "cancelled") {
    return `<span class="status-badge" style="
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: rgba(255, 77, 77, 0.95);
      color: #fff;
      border: 1px solid #ff4d4d;
      box-shadow: 0 2px 8px rgba(255, 77, 77, 0.5);
      z-index: 2;
    ">❌ ${badgeText}</span>`;
  }

  // Default badge for other statuses
  return `<span class="status-badge" style="
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    background: rgba(150, 150, 150, 0.95);
    color: #020617;
    border: 1px solid #999;
    z-index: 2;
  ">${badgeText}</span>`;
}

/* ===============================
   📅 Format Date
================================ */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}


/* ===============================
   📅 CALENDAR VIEW RENDERER
================================ */
function renderCalendar(trips) {
  const calendarGrid = document.getElementById("calendar-grid");
  calendarGrid.innerHTML = "";

  // 🛡️ Filter out cancelled and completed trips
  trips = trips.filter(t => 
    t.status !== "cancelled" && 
    t.status !== "completed"
  );

  if (!trips || trips.length === 0) {
    calendarGrid.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:40px;'>No trips to display in calendar view.</p>";
    return;
  }

  // Apply current filter
  let filteredTrips = trips;
  if (currentFilter !== "all") {
    filteredTrips = trips.filter(t => t.status === currentFilter);
  }

  // Sort trips by date (use start_date or trip_date)
  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const dateA = new Date(a.start_date || a.trip_date);
    const dateB = new Date(b.start_date || b.trip_date);
    return dateA - dateB;
  });

  sortedTrips.forEach(trip => {
    const calendarItem = document.createElement("div");
    calendarItem.className = "calendar-item";

    // Status color coding
    let statusColor = "#00ffd5";
    if (trip.status === "wishlist") statusColor = "#00ffd5";
    if (trip.status === "ongoing") statusColor = "#ffa500";
    if (trip.status === "upcoming") statusColor = "#667eea";

    const tripStartDate = new Date(trip.start_date || trip.trip_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    tripStartDate.setHours(0, 0, 0, 0);
    
    const daysUntil = Math.ceil((tripStartDate - today) / (1000*60*60*24));

    let countdownText = "";
    if (trip.status === "wishlist") {
      countdownText = "Saved to Wishlist";
    } else if (trip.status === "ongoing") {
      countdownText = "Ongoing Now!";
    } else if (daysUntil < 0) {
      countdownText = "Overdue";
    } else if (daysUntil === 0) {
      countdownText = "Today!";
    } else {
      countdownText = `${daysUntil} days`;
    }

    // Format date range if both start and end dates exist
    let dateDisplay = formatDate(trip.start_date || trip.trip_date);
    if (trip.end_date && trip.end_date !== trip.start_date) {
      dateDisplay += ` - ${formatDate(trip.end_date)}`;
    }

    calendarItem.innerHTML = `
      <div style="border-left: 4px solid ${statusColor}; padding-left: 12px;">
        <h3 style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 18px;">
          ${trip.destination}
        </h3>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          📅 ${dateDisplay}
        </p>
        <p style="margin: 4px 0 0 0; color: ${statusColor}; font-weight: 600; font-size: 13px;">
          ${countdownText} • ${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </p>
        ${trip.country ? `<p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">📍 ${trip.country}</p>` : ''}
      </div>
    `;

    calendarGrid.appendChild(calendarItem);
  });
}


/* ===============================
   ⏳ LIVE Countdown System
================================ */
function startLiveCountdown(trips) {

  const countdownElements = document.querySelectorAll(".countdown");

  function updateCountdown() {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    countdownElements.forEach(el => {

      // Skip completed trips and those without dates
      if (!el.dataset.date) return;

      const tripDate = new Date(el.dataset.date);
      tripDate.setHours(0, 0, 0, 0);
      
      const diff = Math.ceil((tripDate - today) / (1000*60*60*24));

      el.classList.remove("urgent", "soon");

      if (diff < 0) {
        // Allow clickable completion for past trips
        const tripId = el.dataset.tripId;
        const status = el.dataset.status;
        
        if (status !== "completed" && status !== "ongoing") {
          el.innerHTML = "Trip completed ✈️";
          el.style.cursor = "pointer";
          el.style.color = "#667eea";
          el.onclick = () => completeTrip(tripId);
        }
        return;
      }

      if (diff === 0) {
        el.innerHTML = "Trip is today 🔥";
        el.classList.add("urgent");
        return;
      }

      if (diff <= 3) {
        el.classList.add("urgent");
        el.innerHTML = `${diff} days remaining ⚡`;
      } else if (diff <= 7) {
        el.classList.add("soon");
        el.innerHTML = `${diff} days remaining`;
      } else {
        el.innerHTML = `${diff} days remaining`;
      }
    });
  }

  updateCountdown();

  // Update every minute
  setInterval(updateCountdown, 60000);
}

/* ===============================
   🗑️ CANCEL TRIP - Remove Card
================================ */
async function cancelTrip(tripId) {
  const card = document.querySelector(`[data-trip-id="${tripId}"]`);

  // Smooth remove animation
  if (card) {
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";
    setTimeout(() => {
      card.remove();
    }, 300);
  }

  // Remove from localStorage
  const plannedTrips = JSON.parse(localStorage.getItem("plannedTrips") || "[]");
  const wishlistTrips = JSON.parse(localStorage.getItem("wishlistTrips") || "[]");
  
  const updatedPlanned = plannedTrips.filter(trip => trip.destination !== tripId);
  const updatedWishlist = wishlistTrips.filter(trip => trip.destination !== tripId);
  
  localStorage.setItem("plannedTrips", JSON.stringify(updatedPlanned));
  localStorage.setItem("wishlistTrips", JSON.stringify(updatedWishlist));

  // Optional backend call (ignore failure)
  try {
    await fetch(`${API_BASE_URL}/trips/status/${tripId}`, {
      method: "PATCH"
    });
  } catch (e) {
    console.log("Cancel sync skipped");
  }
}

/* ===============================
   ✏️ OPEN TRIP PLANNER (Edit Mode)
================================ */
function openTripPlannerFromCard(buttonElement) {
  const card = buttonElement.closest(".card");
  const tripData = JSON.parse(card.getAttribute("data-trip-data"));
  openTripPlanner(tripData.destination, tripData.startDate, tripData.endDate, tripData.activities, tripData.status);
}

function openTripPlanner(destination, startDate, endDate, activities, status) {
  currentEditTrip = {
    destination: destination,
    startDate: startDate,
    endDate: endDate,
    activities: activities || [],
    status: status
  };

  const overlay = document.getElementById("planner-overlay");
  overlay.classList.remove("hidden");

  // Set title based on status
  const titleText = status === "ongoing" 
    ? `🔥 Ongoing Trip: ${destination} (Dates Locked)` 
    : `Edit Trip: ${destination}`;
  document.getElementById("planner-title").textContent = titleText;

  // Set dates
  if (startDate) {
    document.getElementById("startDate").value = startDate;
  } else {
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() + 30);
    document.getElementById("startDate").value = defaultStart.toISOString().split("T")[0];
  }

  if (endDate) {
    document.getElementById("endDate").value = endDate;
  } else {
    const start = new Date(document.getElementById("startDate").value);
    const defaultEnd = new Date(start);
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    document.getElementById("endDate").value = defaultEnd.toISOString().split("T")[0];
  }

  // Lock/unlock date inputs based on status
  const startInput = document.getElementById("startDate");
  const endInput = document.getElementById("endDate");

  if (status === "ongoing") {
    // Lock dates for ongoing trips
    startInput.disabled = true;
    endInput.disabled = true;
    startInput.classList.add("locked-date");
    endInput.classList.add("locked-date");
  } else {
    // Unlock dates for other statuses
    startInput.disabled = false;
    endInput.disabled = false;
    startInput.classList.remove("locked-date");
    endInput.classList.remove("locked-date");
  }

  // Initialize todo list
  const todoContainer = document.getElementById("todoContainer");
  todoContainer.innerHTML = "";

  if (activities && activities.length > 0) {
    activities.forEach(activity => addTodoItem(activity));
  } else {
    addTodoItem("");
  }
}

/* ===============================
   ➕ ADD TODO ITEM
================================ */
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

/* ===============================
   💾 UPDATE PLANNED TRIP
================================ */
function updatePlannedTrip() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;

  // Skip date validation for ongoing trips (dates are locked)
  if (currentEditTrip.status !== "ongoing") {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("End date must be after start date");
      return;
    }
  }

  // Collect todos
  const todoInputs = document.querySelectorAll(".todo-input");
  const todos = Array.from(todoInputs)
    .map(input => input.value.trim())
    .filter(value => value !== "");

  if (todos.length === 0) {
    alert("Please add at least one activity");
    return;
  }

  // Update in localStorage
  const plannedTrips = JSON.parse(localStorage.getItem("plannedTrips") || "[]");
  const wishlistTrips = JSON.parse(localStorage.getItem("wishlistTrips") || "[]");

  // Find and update the trip
  const plannedIndex = plannedTrips.findIndex(t => t.destination === currentEditTrip.destination);
  const wishlistIndex = wishlistTrips.findIndex(t => t.destination === currentEditTrip.destination);

  if (plannedIndex !== -1) {
    plannedTrips[plannedIndex].startDate = startDate;
    plannedTrips[plannedIndex].endDate = endDate;
    plannedTrips[plannedIndex].todos = todos;
    plannedTrips[plannedIndex].activities = todos;
    localStorage.setItem("plannedTrips", JSON.stringify(plannedTrips));
  } else if (wishlistIndex !== -1) {
    wishlistTrips[wishlistIndex].startDate = startDate;
    wishlistTrips[wishlistIndex].endDate = endDate;
    wishlistTrips[wishlistIndex].activities = todos;
    localStorage.setItem("wishlistTrips", JSON.stringify(wishlistTrips));
  }

  // Close planner and reload
  document.getElementById("planner-overlay").classList.add("hidden");
  
  // Show success message based on status
  const message = currentEditTrip.status === "ongoing" 
    ? "✅ Ongoing trip activities updated!" 
    : "✅ Trip updated successfully";
  alert(message);
  
  // Reload trips
  loadTrips();
}

/* ===============================
   ✅ Complete Trip (PATCH)
================================ */
async function completeTrip(tripId) {

  try {

    const res = await fetch(`${API_BASE_URL}/trips/status/${tripId}`, {
      method: "PATCH"
    });

    if (!res.ok) throw new Error("Failed to update trip status");

    // 🎬 Cinematic reload with fade effect
    document.body.style.opacity = "0";
    document.body.style.transition = "opacity 0.3s ease-out";

    setTimeout(() => {
      location.reload();
    }, 300);

  } catch (err) {
    console.error("Update failed", err);
    alert("Failed to mark trip as completed");
  }
}

/* =========================
   🔐 LOGOUT
========================= */

function logoutUser() {
  localStorage.removeItem("user_id");
  window.location.href = "login.html";
}
