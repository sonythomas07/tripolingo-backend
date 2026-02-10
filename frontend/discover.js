const API_BASE_URL = "http://127.0.0.1:8000";

const destinations = [
  {
    name: "Kyoto",
    country: "Japan",
    climate: "Temperate",
    interests: ["History", "Culture", "Food"]
  },
  {
    name: "Bali",
    country: "Indonesia",
    climate: "Tropical",
    interests: ["Nature", "Adventure"]
  },
  {
    name: "Paris",
    country: "France",
    climate: "Continental",
    interests: ["Culture", "Food", "History"]
  },
  {
    name: "Reykjavik",
    country: "Iceland",
    climate: "Cold",
    interests: ["Nature", "Adventure", "Photography"]
  }
];

document.addEventListener("DOMContentLoaded", loadDiscover);

async function loadDiscover() {
  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("Please login again");
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/preferences/${userId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch preferences");
    }

    const preferences = await response.json();
    console.log("Preferences from API:", preferences);

    displayDestinations(preferences);

  } catch (error) {
    console.error(error);
    alert("Failed to load preferences");
  }
}

function displayDestinations(preferences) {
  const container = document.getElementById("destinations");
  container.innerHTML = "";

  const matched = destinations
    .map(dest => ({
      ...dest,
      match: calculateMatch(preferences, dest)
    }))
    .filter(dest => dest.match > 0)
    .sort((a, b) => b.match - a.match);

  if (matched.length === 0) {
    container.innerHTML = `<p>No destinations match your preferences yet.</p>`;
    return;
  }

  matched.forEach(dest => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${dest.name}, ${dest.country}</h3>
      <p>Climate: ${dest.climate}</p>
      <p>Match: ${dest.match}%</p>
      <p>Based on interests: ${dest.interests.join(", ")}</p>
    `;

    container.appendChild(card);
  });
}

function calculateMatch(preferences, destination) {
  let score = 0;

  const userInterests = preferences.interests.map(i => i.toLowerCase());
  const destInterests = destination.interests.map(i => i.toLowerCase());

  userInterests.forEach(interest => {
    if (destInterests.includes(interest)) {
      score += 25;
    }
  });

  return Math.min(score, 100);
}
