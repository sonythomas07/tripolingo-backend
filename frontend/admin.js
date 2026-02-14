const API_BASE_URL = "http://127.0.0.1:8000";

/* =========================
   LOAD ADMIN PAGE
========================= */

document.addEventListener("DOMContentLoaded", () => {
    loadDestinations();
    loadUsers();

    document.getElementById("add-destination-form").addEventListener("submit", (e) => {
        e.preventDefault();
        addDestination();
    });
});

/* =========================
   LOAD DESTINATIONS
========================= */

async function loadDestinations() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/destinations`);

        if (!res.ok) throw new Error("Failed to fetch destinations");

        const destinations = await res.json();

        console.log("Destinations:", destinations);

        renderDestinationCards(destinations);

    } catch (err) {
        console.error(err);
        document.getElementById("destinations-container").innerHTML = 
            "<p style='color: #ff6b6b;'>Failed to load destinations</p>";
    }
}

/* =========================
   RENDER DESTINATION CARDS
========================= */

function renderDestinationCards(destinations) {
    const container = document.getElementById("destinations-container");
    container.innerHTML = "";

    if (!destinations || destinations.length === 0) {
        container.innerHTML = "<p>No destinations yet. Add one above!</p>";
        return;
    }

    destinations.forEach(dest => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "transition: all 0.3s ease; cursor: default;";

        const activeStatus = dest.active ? 
            '<span style="color: #51cf66; font-weight: bold;">✅ Active</span>' : 
            '<span style="color: #ff6b6b; font-weight: bold;">❌ Inactive</span>';

        card.innerHTML = `
            <h3 style="margin-bottom: 10px;">${dest.name}</h3>
            <p style="color: #888; margin-bottom: 8px;">📍 ${dest.country || 'N/A'}</p>
            <p style="color: #888; margin-bottom: 8px;">🎨 Style: ${dest.travel_style || 'N/A'}</p>
            <p style="color: #888; margin-bottom: 15px;">💰 Budget: ${dest.budget || 'N/A'}</p>
            <p style="margin-bottom: 15px;">${activeStatus}</p>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="toggleDestination('${dest.id}')" 
                    style="flex: 1; padding: 8px; background: #667eea; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold;">
                    Toggle Active
                </button>
                
                <button onclick="editDestination('${dest.id}', '${dest.name}', '${dest.country}')" 
                    style="flex: 1; padding: 8px; background: #00ffd0; border: none; border-radius: 6px; color: #000; cursor: pointer; font-weight: bold;">
                    Edit
                </button>
            </div>
        `;

        card.addEventListener("mouseenter", () => {
            card.style.boxShadow = "0 0 20px rgba(0,255,208,0.4)";
            card.style.transform = "translateY(-4px)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.boxShadow = "";
            card.style.transform = "";
        });

        container.appendChild(card);
    });
}

/* =========================
   ADD NEW DESTINATION
========================= */

async function addDestination() {
    const name = document.getElementById("dest-name").value.trim();
    const country = document.getElementById("dest-country").value.trim();
    const travel_style = document.getElementById("dest-style").value;
    const budget = document.getElementById("dest-budget").value;
    const active = document.getElementById("dest-active").checked;

    if (!name || !country) {
        alert("Name and country are required");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/admin/destinations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                country,
                travel_style,
                budget,
                active
            })
        });

        if (!res.ok) throw new Error("Failed to create destination");

        // Clear form
        document.getElementById("add-destination-form").reset();
        document.getElementById("dest-active").checked = true;

        // Show success message
        showToast("✨ Destination added successfully!");

        // Reload destinations
        loadDestinations();

    } catch (err) {
        console.error(err);
        alert("Failed to add destination");
    }
}

/* =========================
   TOGGLE DESTINATION ACTIVE
========================= */

async function toggleDestination(id) {

  try {

    const res = await fetch(`${API_BASE_URL}/admin/destinations/${id}`, {
      method: "PATCH"
    });

    if (!res.ok) {
      throw new Error("Toggle failed");
    }

    await loadDestinations();

  } catch (err) {
    console.error(err);
    alert("Failed to toggle destination");
  }
}

/* =========================
   EDIT DESTINATION
========================= */

async function editDestination(destinationId, currentName, currentCountry) {
    const newName = prompt("Enter new destination name:", currentName);
    
    if (!newName || newName === currentName) return;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/destinations/${destinationId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: newName
            })
        });

        if (!res.ok) throw new Error("Failed to update destination");

        showToast("✏️ Destination updated!");

        loadDestinations();

    } catch (err) {
        console.error(err);
        alert("Failed to update destination");
    }
}

/* =========================
   LOAD USERS
========================= */

async function loadUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users`);

        if (!res.ok) throw new Error("Failed to fetch users");

        const users = await res.json();

        console.log("Users:", users);

        renderUserCards(users);

    } catch (err) {
        console.error(err);
        document.getElementById("users-container").innerHTML = 
            "<p style='color: #ff6b6b;'>Failed to load users</p>";
    }
}

/* =========================
   RENDER USER CARDS
========================= */

function renderUserCards(users) {
    const container = document.getElementById("users-container");
    container.innerHTML = "";

    if (!users || users.length === 0) {
        container.innerHTML = "<p>No users registered yet.</p>";
        return;
    }

    users.forEach(user => {
        const card = document.createElement("div");
        card.className = "card";
        card.style.cssText = "transition: all 0.3s ease;";

        const createdDate = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : 'N/A';

        card.innerHTML = `
            <h3 style="margin-bottom: 10px; color: #00ffd0;">👤 ${user.email || 'No email'}</h3>
            <p style="color: #888; margin-bottom: 8px;">ID: ${user.id}</p>
            <p style="color: #888;">Joined: ${createdDate}</p>
        `;

        card.addEventListener("mouseenter", () => {
            card.style.boxShadow = "0 0 15px rgba(102,126,234,0.4)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.boxShadow = "";
        });

        container.appendChild(card);
    });
}

/* =========================
   TOAST NOTIFICATION
========================= */

function showToast(message) {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease-in";
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/* =========================
   🔐 LOGOUT
========================= */

function logoutUser() {
  localStorage.removeItem("user_id");
  window.location.href = "login.html";
}
