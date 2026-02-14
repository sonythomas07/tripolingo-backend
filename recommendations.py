from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from database import supabase

load_dotenv()

router = APIRouter()

def calculate_match_score(preferences, destination):
    # Default score if preferences are missing or empty
    if not preferences:
        return 50
    
    score = 0

    # Travel style match
    pref_style = preferences.get("travel_style")
    dest_style = destination.get("travel_style")
    
    if pref_style and dest_style and pref_style == dest_style:
        score += 50

    # Budget match
    pref_budget = preferences.get("budget")
    dest_budget = destination.get("budget")
    
    if pref_budget and dest_budget and pref_budget == dest_budget:
        score += 50

    # Return default score of 50 if no matches found
    return score if score > 0 else 50

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    result = supabase.table("user_preferences") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Preferences not found")

    preferences = result.data[0]
    
    # Fetch ALL active destinations from database
    destinations_result = supabase.table("destinations") \
        .select("*") \
        .eq("active", True) \
        .execute()
    
    if not destinations_result.data:
        return []
    
    recommendations = []

    for destination in destinations_result.data:
        match = calculate_match_score(preferences, destination)

        recommendations.append({
            "id": destination["id"],
            "name": destination["name"],
            "country": destination["country"],
            "travel_style": destination.get("travel_style"),
            "budget": destination.get("budget"),
            "description": destination.get("description"),
            "tags": destination.get("tags"),
            "season": destination.get("season"),
            "match": match
        })

    recommendations.sort(key=lambda x: x["match"], reverse=True)

    return recommendations
