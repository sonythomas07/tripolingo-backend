from fastapi import APIRouter, HTTPException, status
from database import supabase
from schemas import UserPreferencesSchema

router = APIRouter()


@router.post("/preferences/{user_id}")
async def save_preferences(user_id: str, data: UserPreferencesSchema):
    """
    Create or update user travel preferences
    """
    try:
        supabase.table("user_preferences").upsert({
            "user_id": user_id,
            "travel_styles": data.travel_styles,
            "budget": data.budget,
            "interests": data.interests,
            "travel_frequency": data.travel_frequency
        }).execute()

        return {"message": "Preferences saved successfully"}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/preferences/{user_id}")
async def get_preferences(user_id: str):
    result = supabase.table("user_preferences") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Preferences not found"
        )

    preferences = result.data[0]

    return {
        "user_id": preferences["user_id"],
        "travel_styles": preferences["travel_styles"],
        "budget": preferences["budget"],
        "interests": preferences["interests"],
        "travel_frequency": preferences["travel_frequency"]
    }
