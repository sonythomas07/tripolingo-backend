const API_BASE_URL = "http://127.0.0.1:8000";

// Check if user is logged in
const userId = localStorage.getItem("user_id");
if (!userId) {
  alert("Please login first");
  window.location.href = "login.html";
}

// Store filter options from Discover page
let availableActivities = [];
let availableRegions = [];

// Fetch and display user profile
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user/${userId}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }
    
    const data = await response.json();
    displayProfile(data);
    
  } catch (error) {
    console.error("Error loading profile:", error);
    // Display stored data as fallback
    displayFallbackProfile();
  }
  
  // Load filter options from Discover page (saved in localStorage)
  loadFilterOptionsFromDiscover();
  
  // Load saved preferences from localStorage
  loadSavedPreferences();
}

function loadFilterOptionsFromDiscover() {
  // Read filter options saved by discover.js
  const filterOptionsStr = localStorage.getItem("filterOptions");
  
  if (filterOptionsStr) {
    try {
      const filterOptions = JSON.parse(filterOptionsStr);
      availableActivities = filterOptions.activities || [];
      availableRegions = filterOptions.regions || [];
      
      console.log("Loaded filter options from Discover page");
      console.log("Available activities:", availableActivities);
      console.log("Available regions:", availableRegions);
    } catch (error) {
      console.error("Error parsing filter options:", error);
      // Use fallback lists
      useFallbackFilterOptions();
    }
  } else {
    console.log("No filter options found. Using fallback. Visit Discover page first.");
    // Use fallback lists
    useFallbackFilterOptions();
  }
}

function useFallbackFilterOptions() {
  availableActivities = ["Adventure", "Beach", "Cultural", "Nature", "Urban", "Relaxation"];
  availableRegions = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania"];
}

function displayProfile(user) {
  // Display avatar (first letter of display name)
  const avatarText = document.getElementById("avatar-text");
  const initial = user.display_name ? user.display_name.charAt(0).toUpperCase() : "U";
  avatarText.textContent = initial;
  
  // Display name, username, email
  document.getElementById("profile-display-name").textContent = user.display_name || "User";
  document.getElementById("profile-username").textContent = user.username || "unknown";
  document.getElementById("profile-email").textContent = user.email || "No email provided";
  
  // Display join date
  const joinDate = user.created_at ? formatDate(user.created_at) : "Unknown";
  document.getElementById("profile-joined").textContent = joinDate;
}

function displayFallbackProfile() {
  // Use localStorage data if API fails
  const username = localStorage.getItem("username") || "User";
  const avatarText = document.getElementById("avatar-text");
  avatarText.textContent = username.charAt(0).toUpperCase();
  
  document.getElementById("profile-display-name").textContent = username;
  document.getElementById("profile-username").textContent = username;
  document.getElementById("profile-email").textContent = "Email not available";
  document.getElementById("profile-joined").textContent = "Recently";
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/* =========================
   PREFERENCES MANAGEMENT
========================= */

function loadSavedPreferences() {
  const prefs = getUserPreferences();
  
  // Display budget
  const budgetMap = {
    "1": "$0 - $500",
    "2": "$500 - $1500",
    "3": "$1500 - $3000",
    "4": "$3000+"
  };
  const budgetDisplay = prefs.budget ? budgetMap[prefs.budget] : "Not set";
  document.getElementById("pref-budget").textContent = budgetDisplay;
  
  // Display activities
  const activitiesContainer = document.getElementById("pref-activities");
  if (prefs.activities && prefs.activities.length > 0) {
    activitiesContainer.innerHTML = prefs.activities
      .map(activity => `<span class="pref-tag">${activity}</span>`)
      .join("");
  } else {
    activitiesContainer.innerHTML = `<span class="pref-tag-empty">No activities selected</span>`;
  }
  
  // Display regions
  const regionsContainer = document.getElementById("pref-regions");
  if (prefs.regions && prefs.regions.length > 0) {
    regionsContainer.innerHTML = prefs.regions
      .map(region => `<span class="pref-tag">${region}</span>`)
      .join("");
  } else {
    regionsContainer.innerHTML = `<span class="pref-tag-empty">No regions selected</span>`;
  }
}

function getUserPreferences() {
  const prefsStr = localStorage.getItem("userPreferences");
  if (prefsStr) {
    return JSON.parse(prefsStr);
  }
  return {
    budget: "",
    activities: [],
    regions: []
  };
}

function saveUserPreferences(prefs) {
  localStorage.setItem("userPreferences", JSON.stringify(prefs));
}

/* =========================
   BUDGET MODAL
========================= */

function openBudgetModal() {
  const modal = document.getElementById("budget-modal");
  modal.classList.remove("hidden");
  
  // Load current preference
  const prefs = getUserPreferences();
  const slider = document.getElementById("pref-budget-slider");
  slider.value = prefs.budget || "2";
  updateBudgetDisplay();
  
  // Add event listener for slider
  slider.addEventListener("input", updateBudgetDisplay);
}

function closeBudgetModal() {
  const modal = document.getElementById("budget-modal");
  modal.classList.add("hidden");
}

function updateBudgetDisplay() {
  const slider = document.getElementById("pref-budget-slider");
  const display = document.getElementById("pref-budget-value");
  
  const budgetRanges = ["", "$0 - $500", "$500 - $1500", "$1500 - $3000", "$3000+"];
  display.textContent = budgetRanges[slider.value];
}

function saveBudgetPreference() {
  const slider = document.getElementById("pref-budget-slider");
  const prefs = getUserPreferences();
  prefs.budget = slider.value;
  saveUserPreferences(prefs);
  
  loadSavedPreferences();
  closeBudgetModal();
  showToast("Budget preference saved!");
}

/* =========================
   ACTIVITIES MODAL
========================= */

function openActivitiesModal() {
  const modal = document.getElementById("activities-modal");
  modal.classList.remove("hidden");
  
  // Populate activities list
  const container = document.getElementById("pref-activities-list");
  const prefs = getUserPreferences();
  
  container.innerHTML = availableActivities.map(activity => {
    const checked = prefs.activities.includes(activity) ? "checked" : "";
    return `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="pref-activity" value="${activity}" ${checked}>
        ${activity}
      </label>
    `;
  }).join("");
}

function closeActivitiesModal() {
  const modal = document.getElementById("activities-modal");
  modal.classList.add("hidden");
}

function saveActivitiesPreference() {
  const selected = Array.from(
    document.querySelectorAll('input[name="pref-activity"]:checked')
  ).map(cb => cb.value);
  
  const prefs = getUserPreferences();
  prefs.activities = selected;
  saveUserPreferences(prefs);
  
  loadSavedPreferences();
  closeActivitiesModal();
  showToast("Activities preference saved!");
}

/* =========================
   REGIONS MODAL
========================= */

function openRegionsModal() {
  const modal = document.getElementById("regions-modal");
  modal.classList.remove("hidden");
  
  // Populate regions list
  const container = document.getElementById("pref-regions-list");
  const prefs = getUserPreferences();
  
  container.innerHTML = availableRegions.map(region => {
    const checked = prefs.regions.includes(region) ? "checked" : "";
    return `
      <label class="filter-checkbox-label">
        <input type="checkbox" name="pref-region" value="${region}" ${checked}>
        ${region}
      </label>
    `;
  }).join("");
}

function closeRegionsModal() {
  const modal = document.getElementById("regions-modal");
  modal.classList.add("hidden");
}

function saveRegionsPreference() {
  const selected = Array.from(
    document.querySelectorAll('input[name="pref-region"]:checked')
  ).map(cb => cb.value);
  
  const prefs = getUserPreferences();
  prefs.regions = selected;
  saveUserPreferences(prefs);
  
  loadSavedPreferences();
  closeRegionsModal();
  showToast("Regions preference saved!");
}

/* =========================
   TOAST NOTIFICATION
========================= */

function showToast(message) {
  // Check if toast exists
  let toast = document.getElementById("pref-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pref-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Load profile on page load
document.addEventListener("DOMContentLoaded", loadProfile);
