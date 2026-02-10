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
    """
    Fetch user travel preferences
    """
    result = supabase.table("user_preferences") \
        .select("*") \
        .eq("user_id", user_id) \
        .single() \
        .execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Preferences not found"
        )

    return result.data
