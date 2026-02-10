const API_BASE_URL = "http://127.0.0.1:8000";

document.getElementById("preferencesForm").addEventListener("submit", savePreferences);

async function savePreferences(event) {
  event.preventDefault();

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    alert("User not logged in. Please login again.");
    window.location.href = "login.html";
    return;
  }

  // Collect travel styles
  const travelStyles = Array.from(
    document.querySelectorAll('input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  const budget = document.getElementById("budget").value;
  const travelFrequency = document.getElementById("travel_frequency").value;

  // Interests = subset of checkboxes (simple approach for now)
  const interests = travelStyles; // reuse for now (can refine later)

  try {
    const response = await fetch(
      `${API_BASE_URL}/user/preferences/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          travel_styles: travelStyles,
          budget: budget,
          interests: interests,
          travel_frequency: travelFrequency
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Failed to save preferences");
      return;
    }

    alert("Preferences saved successfully!");
    console.log("Saved preferences:", data);

    // Next step later: redirect to dashboard / discover
    // window.location.href = "discover.html";

  } catch (error) {
    console.error(error);
    alert("Server error. Try again later.");
  }
}
