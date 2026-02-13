from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ===============================
# ✈️ CREATE TRIP
# ===============================
@router.post("/trips/create")
async def create_trip(data: dict):

    user_id = data.get("user_id")
    destination = data.get("destination")
    country = data.get("country")
    trip_date = data.get("travel_date")

    if not user_id or not destination or not trip_date:
        raise HTTPException(status_code=400, detail="Missing fields")

    trip = {
        "user_id": user_id,
        "destination": destination,
        "country": country,
        "trip_date": trip_date,
        "status": "planning"
    }

    try:
        res = supabase.table("trips").insert(trip).execute()
        return {"success": True, "trip": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# 📋 GET USER TRIPS
# ===============================
@router.get("/trips/{user_id}")
async def get_trips(user_id: str):

    try:
        res = supabase.table("trips").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# ✅ UPDATE TRIP STATUS
# ===============================
@router.patch("/trips/status/{trip_id}")
async def update_trip_status(trip_id: str):

    try:
        res = supabase.table("trips") \
            .update({"status": "completed"}) \
            .eq("id", trip_id) \
            .execute()

        return {"success": True, "data": res.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
