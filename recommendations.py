from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
from database import supabase

load_dotenv()

router = APIRouter()

@router.get("/recommendations/{user_id}")
async def get_recommendations(user_id: str):
    """
    Fetch all active destinations without personalization.
    User preferences/onboarding removed - filtering done via UI only.
    """
    
    # Fetch ALL active destinations from database
    destinations_result = supabase.table("destinations") \
        .select("*") \
        .eq("active", True) \
        .execute()
    
    if not destinations_result.data:
        return []
    
    destinations = []

    for destination in destinations_result.data:
        # Build response with required fields
        destinations.append({
            "id": destination["id"],
            "name": destination["name"],
            "country": destination["country"],
            "description": destination.get("description"),
            "activities": destination.get("activities"),
            "travel_style": destination.get("travel_style"),
            "budget": destination.get("budget"),
            "activity_tags": destination.get("activity_tags")
        })

    return destinations
