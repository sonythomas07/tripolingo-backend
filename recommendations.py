from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

DESTINATIONS = [
    {
        "name": "Kyoto",
        "country": "Japan",
        "interests": ["History", "Culture", "Food"],
        "travel_styles": ["Cultural", "Solo"],
        "budget": "Moderate"
    },
    {
        "name": "Bali",
        "country": "Indonesia",
        "interests": ["Nature", "Adventure", "Wellness"],
        "travel_styles": ["Relaxed", "Adventure"],
        "budget": "Budget"
    },
    {
        "name": "Paris",
        "country": "France",
        "interests": ["Culture", "Food", "History"],
        "travel_styles": ["Luxury", "Romantic"],
        "budget": "Luxury"
    },
    {
        "name": "Reykjavik",
        "country": "Iceland",
        "interests": ["Nature", "Adventure", "Photography"],
        "travel_styles": ["Adventure"],
        "budget": "Luxury"
    }
]

def calculate_match_score(preferences, destination):
    score = 0

    # Interest match
    for interest in preferences["interests"]:
        if interest in destination["interests"]:
            score += 25

    # Travel style match
    for style in preferences["travel_styles"]:
        if style in destination["travel_styles"]:
            score += 20

    # Budget match
    if preferences["budget"] == destination["budget"]:
        score += 15

    return min(score, 100)

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    result = supabase.table("user_preferences") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Preferences not found")

    preferences = result.data[0]
    recommendations = []

    for destination in DESTINATIONS:
        match = calculate_match_score(preferences, destination)

        if match > 0:
            recommendations.append({
                "name": destination["name"],
                "country": destination["country"],
                "match": match
            })

    recommendations.sort(key=lambda x: x["match"], reverse=True)

    return recommendations
