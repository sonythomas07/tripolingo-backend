from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
from datetime import datetime
import os

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ===============================
# 💾 SAVE TRIP (Simple Save)
# ===============================
@router.post("/trips")
async def save_trip(data: dict):
    """
    Save trip with destination_id and status.
    Frontend sends: user_id, destination_id, status
    """
    user_id = data.get("user_id")
    destination_id = data.get("destination_id")
    status = data.get("status", "planning")

    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")
    
    if not destination_id:
        raise HTTPException(status_code=400, detail="Missing destination_id")

    trip = {
        "user_id": user_id,
        "destination_id": destination_id,
        "status": status
    }

    try:
        res = supabase.table("trips").insert(trip).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===============================
# ✈️ CREATE TRIP
# ===============================
@router.post("/trips/create")
async def create_trip(data: dict):

    user_id = data.get("user_id")
    destination = data.get("destination")
    country = data.get("country")
    trip_date = data.get("travel_date")
    image = data.get("image", "")
    description = data.get("description", "")
    activities = data.get("activities", [])

    if not user_id or not destination or not trip_date:
        raise HTTPException(status_code=400, detail="Missing fields")

    # 🎬 Smart Status Detection based on travel date
    today = datetime.utcnow().date()
    trip_date_obj = datetime.strptime(trip_date, "%Y-%m-%d").date()
    diff = (trip_date_obj - today).days

    if diff > 30:
        status = "planning"
    elif diff > 0:
        status = "upcoming"
    elif diff == 0:
        status = "ongoing"
    else:
        status = "completed"

    trip = {
        "user_id": user_id,
        "destination": destination,
        "country": country,
        "trip_date": trip_date,
        "image": image,
        "description": description,
        "activities": activities,
        "status": status
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
