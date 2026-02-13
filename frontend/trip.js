const API_BASE_URL = "http://127.0.0.1:8000";

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

    renderTrips(trips);

  } catch (err) {
    console.error(err);
  }
}


/* ===============================
   🎬 Render Cinematic Trip Cards
================================ */
function renderTrips(trips) {

  const container = document.getElementById("trip-container");
  container.innerHTML = "";

  if (!trips || trips.length === 0) {
    container.innerHTML = "<p>No trips created yet.</p>";
    return;
  }

  trips.forEach((trip, index) => {

    const card = document.createElement("div");
    card.className = "card";

    // 🎬 Fade-in animation with stagger
    card.style.cssText = `
      opacity: 0;
      animation: fadeIn 0.5s ease-out forwards;
      animation-delay: ${index * 0.1}s;
    `;

    // 🎬 Status badge with glow
    const statusBadge = getStatusBadge(trip.status);

    // 🎬 Country display (safe handling)
    const countryText = trip.country ? `, ${trip.country}` : "";

    // 🎬 Live countdown element
    let countdownHTML = "";

    if (trip.status === "completed") {
      countdownHTML = `<p class="countdown" style="color: #51cf66;">Completed ✅</p>`;
    } else {
      countdownHTML = `<p class="countdown" data-date="${trip.trip_date}" data-trip-id="${trip.id}" data-status="${trip.status}">Loading...</p>`;
    }

    card.innerHTML = `
      <h3>${trip.destination}${countryText}</h3>
      ${statusBadge}
      <p style="color: #888; font-size: 14px;">Travel Date: ${formatDate(trip.trip_date)}</p>
      ${countdownHTML}
    `;

    container.appendChild(card);
  });

  // 🎬 Start live countdown
  startLiveCountdown(trips);

  // 🎬 Smooth scroll to newest trip (first card)
  if (trips.length > 0) {
    setTimeout(() => {
      container.firstElementChild.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }, 300);
  }
}

/* ===============================
   🎬 Status Badge with Glow
================================ */
function getStatusBadge(status) {

  let badgeClass = "";
  let badgeText = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === "planning") {
    badgeClass = "cinematic-glow";
    return `<span class="status-badge ${badgeClass}" style="
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      background: rgba(102, 126, 234, 0.2);
      color: #667eea;
      border: 1px solid #667eea;
      box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    ">${badgeText}</span>`;
  }

  if (status === "completed") {
    return `<span class="status-badge" style="
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      background: rgba(81, 207, 102, 0.2);
      color: #51cf66;
      border: 1px solid #51cf66;
      box-shadow: 0 0 10px rgba(81, 207, 102, 0.5);
    ">${badgeText}</span>`;
  }

  // Default badge for other statuses
  return `<span class="status-badge" style="
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    background: rgba(150, 150, 150, 0.2);
    color: #999;
    border: 1px solid #999;
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
