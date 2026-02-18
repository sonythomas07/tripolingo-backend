const API_BASE_URL = "http://127.0.0.1:8000";

/* =========================
   ADMIN SECTION NAVIGATION
========================= */

function showAdminSection(section) {
    // Hide all sections
    document.getElementById("add-place-section").style.display = "none";
    document.getElementById("manage-destination-section").style.display = "none";
    document.getElementById("user-login-section").style.display = "none";

    // Remove active class from all nav items
    document.querySelectorAll(".admin-ui-nav-item").forEach(item => {
        item.classList.remove("active");
    });

    // Show selected section and set active nav
    if (section === "add-place") {
        document.getElementById("add-place-section").style.display = "block";
        event.target.classList.add("active");
    }
    if (section === "manage-destination") {
        document.getElementById("manage-destination-section").style.display = "block";
        event.target.classList.add("active");
    }
    if (section === "user-login") {
        document.getElementById("user-login-section").style.display = "block";
        event.target.classList.add("active");
    }
}

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
        card.style.cssText = "transition: all 0.3s ease; cursor: default; position: relative;";

        const activeStatus = dest.active ? 
            '<span style="color: #51cf66; font-weight: bold;">✅ Active</span>' : 
            '<span style="color: #ff6b6b; font-weight: bold;">❌ Inactive</span>';

        const description = dest.description || 'No description';
        const activities = dest.activities ? (Array.isArray(dest.activities) ? dest.activities.join(', ') : dest.activities) : 'No activities';

        card.innerHTML = `
            <button class="trash-icon" data-id="${dest.id}">🗑️</button>
            
            <h3 style="margin-bottom: 10px;">${dest.name}</h3>
            <p style="color: #888; margin-bottom: 8px;">📍 ${dest.country || 'N/A'}</p>
            <p style="color: #888; margin-bottom: 8px;">🎨 Style: ${dest.travel_style || 'N/A'}</p>
            <p style="color: #888; margin-bottom: 8px;">💰 Budget: ${dest.budget || 'N/A'}</p>
            <p style="color: #cbd5e1; margin-bottom: 8px; font-size: 13px; line-height: 1.4;">${description}</p>
            <p style="color: #94a3b8; margin-bottom: 12px; font-size: 12px;">🎯 ${activities}</p>
            <p style="margin-bottom: 15px;">${activeStatus}</p>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="toggleDestination('${dest.id}')" 
                    style="flex: 1; padding: 8px; background: #667eea; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold;">
                    Toggle Active
                </button>
                
                <button onclick="openEditModal('${dest.id}')" 
                    style="flex: 1; padding: 8px; background: #00ffd0; border: none; border-radius: 6px; color: #000; cursor: pointer; font-weight: bold;">
                    Edit
                </button>
            </div>
        `;

        // Wire up trash icon
        const trashBtn = card.querySelector('.trash-icon');
        trashBtn.onclick = (e) => {
            e.stopPropagation();
            deleteDestination(dest.id);
        };

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
    const description = document.getElementById("dest-description").value.trim();
    const activitiesText = document.getElementById("dest-activities").value.trim();
    const active = document.getElementById("dest-active").checked;

    if (!name || !country) {
        alert("Name and country are required");
        return;
    }

    // Parse activities
    const activities = activitiesText ? activitiesText.split(',').map(a => a.trim()).filter(a => a) : [];

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
                description,
                activities,
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
   DELETE DESTINATION
========================= */

async function deleteDestination(id) {
    if (!confirm("Are you sure you want to delete this destination? This action cannot be undone.")) {
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/destinations/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            throw new Error("Delete failed");
        }

        showToast("🗑️ Destination deleted");
        await loadDestinations();

    } catch (err) {
        console.error(err);
        alert("Failed to delete destination");
    }
}

/* =========================
   DELETE USER
========================= */

async function deleteUser(userId) {
    if (!confirm("Delete this user permanently? This will also delete their trips and preferences.")) {
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
            console.error("Delete failed:", errorData);
            alert(`Failed to delete user: ${errorData.error || res.statusText}`);
            return;
        }

        const result = await res.json();
        
        if (result.success) {
            showToast("✅ User deleted successfully");
            await loadUsers();
        } else {
            alert(`Failed to delete user: ${result.error || "Unknown error"}`);
        }

    } catch (err) {
        console.error(err);
        alert("Failed to delete user");
    }
}

/* =========================
   OPEN EDIT MODAL
========================= */

let currentEditingDestination = null;

async function openEditModal(destinationId) {
    try {
        // Fetch destination details
        const res = await fetch(`${API_BASE_URL}/admin/destinations`);
        if (!res.ok) throw new Error("Failed to fetch destinations");
        
        const destinations = await res.json();
        const dest = destinations.find(d => d.id === destinationId);
        
        if (!dest) {
            alert("Destination not found");
            return;
        }
        
        currentEditingDestination = dest;
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'edit-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const activities = Array.isArray(dest.activities) ? dest.activities.join(', ') : (dest.activities || '');
        
        modal.innerHTML = `
            <div style="background: #1e293b; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto;">
                <h2 style="color: #00ffd5; margin-bottom: 20px;">✏️ Edit Destination</h2>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e1; display: block; margin-bottom: 5px;">Name</label>
                    <input id="edit-name" type="text" value="${dest.name}" 
                        style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e1; display: block; margin-bottom: 5px;">Country</label>
                    <input id="edit-country" type="text" value="${dest.country || ''}" 
                        style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e1; display: block; margin-bottom: 5px;">Description</label>
                    <textarea id="edit-description" rows="3" 
                        style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; resize: vertical;">${dest.description || ''}</textarea>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e1; display: block; margin-bottom: 5px;">Activities (comma-separated)</label>
                    <textarea id="edit-activities" rows="2" 
                        style="width: 100%; padding: 10px; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #e2e8f0; resize: vertical;">${activities}</textarea>
                    <small style="color: #64748b;">Example: Hiking, Photography, Culture</small>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 25px;">
                    <button onclick="saveDestinationEdit()" 
                        style="flex: 1; padding: 12px; background: #00ffd5; border: none; border-radius: 8px; color: #000; font-weight: bold; cursor: pointer;">
                        Save Changes
                    </button>
                    <button onclick="closeEditModal()" 
                        style="flex: 1; padding: 12px; background: #334155; border: none; border-radius: 8px; color: #cbd5e1; font-weight: bold; cursor: pointer;">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (err) {
        console.error(err);
        alert("Failed to load destination details");
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.remove();
    currentEditingDestination = null;
}

async function saveDestinationEdit() {
    if (!currentEditingDestination) return;
    
    const name = document.getElementById('edit-name').value.trim();
    const country = document.getElementById('edit-country').value.trim();
    const description = document.getElementById('edit-description').value.trim();
    const activitiesText = document.getElementById('edit-activities').value.trim();
    
    if (!name) {
        alert("Name is required");
        return;
    }
    
    // Parse activities
    const activities = activitiesText ? activitiesText.split(',').map(a => a.trim()).filter(a => a) : [];
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/destinations/${currentEditingDestination.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                country,
                description,
                activities
            })
        });

        if (!res.ok) throw new Error("Failed to update destination");

        showToast("✏️ Destination updated!");
        closeEditModal();
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
        card.style.cssText = "transition: all 0.3s ease; position: relative;";

        const createdDate = user.created_at ? 
            new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            }) : 'N/A';

        card.innerHTML = `
            <button class="trash-icon user-trash" data-id="${user.id}">🗑️</button>
            
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

        // Wire up trash icon
        const userTrashBtn = card.querySelector('.user-trash');
        userTrashBtn.onclick = (e) => {
            e.stopPropagation();
            deleteUser(user.id);
        };

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
