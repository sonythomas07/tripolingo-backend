const API_BASE_URL = "http://127.0.0.1:8000";

// 🎬 Global trips storage
let allTrips = [];
let currentFilter = "all";

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
});

async function loadTrips() {

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("Login again");
    window.location.href = "login.html";
    return;
  }

  try {

    const res = await fetch(`${API_BASE_URL}/trips/${userId}`);

    if (!res.ok) throw new Error("Trips fetch failed");

    const trips = await res.json();

    console.log("TRIPS:", trips);

    // 🎬 Store trips globally
    allTrips = trips;

    renderTrips(trips);

  } catch (err) {
    console.error(err);
  }
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

  // Apply filter
  let filteredTrips = trips;
  if (currentFilter !== "all") {
    filteredTrips = trips.filter(t => t.status === currentFilter);
  }

  // Group trips by status
  const groups = groupTrips(filteredTrips);

  // Clear all sections
  ["wishlist-section", "planning-section", "upcoming-section", "ongoing-section", "completed-section", "cancelled-section"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  // Render each section
  renderSection("wishlist-section", "⭐ Wishlist", groups.wishlist);
  renderSection("planning-section", "📋 Planning", groups.planning);
  renderSection("upcoming-section", "✈️ Upcoming Trips", groups.upcoming);
  renderSection("ongoing-section", "🌍 Ongoing Adventures", groups.ongoing);
  renderSection("completed-section", "✅ Completed Journeys", groups.completed);
  renderSection("cancelled-section", "❌ Cancelled", groups.cancelled);

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

  // 🎬 Fade-in animation with stagger
  card.style.cssText = `
    opacity: 0;
    animation: fadeIn 0.5s ease-out forwards;
    animation-delay: ${index * 0.05}s;
  `;

  // 🎬 Status badge with glow
  const statusBadge = getStatusBadge(trip.status);

  // 🎬 Live countdown element
  let countdownHTML = "";

  if (trip.status === "wishlist") {
    countdownHTML = `<p class="countdown" style="color: #00ffd5;">⭐ Saved to Wishlist</p>`;
  } else if (trip.status === "completed") {
    countdownHTML = `<p class="countdown" style="color: #51cf66;">Completed ✅</p>`;
  } else if (trip.status === "cancelled") {
    countdownHTML = `<p class="countdown" style="color: #ff4d4d;">Cancelled</p>`;
  } else {
    countdownHTML = `<p class="countdown" data-date="${trip.trip_date}" data-trip-id="${trip.id}" data-status="${trip.status}">Loading...</p>`;
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
        <span class="meta-item">📅 ${formatDate(trip.trip_date)}</span>
      </div>

      ${countdownHTML}

      <div class="card-actions">
        <button class="action-save" onclick="alert('Trip already saved!')">
          Saved
        </button>
        <button class="action-icon" title="View trip details">
          ❤️
        </button>
        <button class="action-icon" title="More options">
          →
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
    ">${badgeText}</span>`;
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

  if (!trips || trips.length === 0) {
    calendarGrid.innerHTML = "<p style='text-align:center; color:#94a3b8; padding:40px;'>No trips to display in calendar view.</p>";
    return;
  }

  // Apply current filter
  let filteredTrips = trips;
  if (currentFilter !== "all") {
    filteredTrips = trips.filter(t => t.status === currentFilter);
  }

  // Sort trips by date
  const sortedTrips = [...filteredTrips].sort((a, b) => new Date(a.trip_date) - new Date(b.trip_date));

  sortedTrips.forEach(trip => {
    const calendarItem = document.createElement("div");
    calendarItem.className = "calendar-item";

    // Status color coding
    let statusColor = "#00ffd5";
    if (trip.status === "wishlist") statusColor = "#00ffd5";
    if (trip.status === "completed") statusColor = "#51cf66";
    if (trip.status === "cancelled") statusColor = "#ff4d4d";
    if (trip.status === "ongoing") statusColor = "#ffa500";

    const tripDate = new Date(trip.trip_date);
    const today = new Date();
    const daysUntil = Math.ceil((tripDate - today) / (1000*60*60*24));

    let countdownText = "";
    if (trip.status === "wishlist") {
      countdownText = "Saved to Wishlist";
    } else if (trip.status === "completed") {
      countdownText = "Completed";
    } else if (trip.status === "cancelled") {
      countdownText = "Cancelled";
    } else if (daysUntil < 0) {
      countdownText = "Overdue";
    } else if (daysUntil === 0) {
      countdownText = "Today!";
    } else {
      countdownText = `${daysUntil} days`;
    }

    calendarItem.innerHTML = `
      <div style="border-left: 4px solid ${statusColor}; padding-left: 12px;">
        <h3 style="margin: 0 0 8px 0; color: #e2e8f0; font-size: 18px;">
          ${trip.destination}
        </h3>
        <p style="margin: 0; color: #94a3b8; font-size: 14px;">
          📅 ${formatDate(trip.trip_date)}
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

    countdownElements.forEach(el => {

      // Skip completed trips
      if (!el.dataset.date) return;

      const tripDate = new Date(el.dataset.date);
      const diff = Math.ceil((tripDate - today) / (1000*60*60*24));

      el.classList.remove("urgent", "soon");

      if (diff < 0) {
        // Allow clickable completion for past trips
        const tripId = el.dataset.tripId;
        const status = el.dataset.status;
        
        if (status !== "completed") {
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
      } else if (diff <= 7) {
        el.classList.add("soon");
      }

      el.innerHTML = `${diff} days remaining`;
    });
  }

  updateCountdown();

  setInterval(updateCountdown, 60000);
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
