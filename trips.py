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
    status = data.get("status", "wishlist")  # Default to wishlist for simple saves

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
    start_date = data.get("start_date") or trip_date  # Support both formats
    end_date = data.get("end_date") or trip_date
    image = data.get("image", "")
    description = data.get("description", "")
    activities = data.get("activities", [])
    status = data.get("status", "planning")  # Allow explicit status (e.g., wishlist)

    if not user_id or not destination or not start_date:
        raise HTTPException(status_code=400, detail="Missing fields")

    # 🎬 Smart Status Detection based on dates (only if not wishlist/cancelled)
    if status not in ["wishlist", "cancelled"]:
        today = datetime.utcnow().date()
        start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else start_date_obj

        if today < start_date_obj:
            status = "upcoming"
        elif start_date_obj <= today <= end_date_obj:
            status = "ongoing"
        elif today > end_date_obj:
            status = "completed"
        else:
            status = "planning"

    trip = {
        "user_id": user_id,
        "destination": destination,
        "country": country,
        "trip_date": trip_date or start_date,  # Keep backward compatibility
        "start_date": start_date,
        "end_date": end_date,
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
        trips = res.data
        
        # 🎬 Calculate dynamic status based on dates
        today = datetime.utcnow().date()
        
        for trip in trips:
            # Keep wishlist and cancelled as-is
            if trip.get("status") in ["wishlist", "cancelled"]:
                continue
            
            # Get start and end dates (support both trip_date and start_date formats)
            start_date = trip.get("start_date") or trip.get("trip_date")
            end_date = trip.get("end_date") or trip.get("trip_date")
            
            if not start_date:
                continue
            
            # Parse dates
            try:
                start_date_obj = datetime.strptime(start_date, "%Y-%m-%d").date()
                end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else start_date_obj
                
                # Calculate status
                if today < start_date_obj:
                    trip["status"] = "upcoming"
                elif start_date_obj <= today <= end_date_obj:
                    trip["status"] = "ongoing"
                elif today > end_date_obj:
                    trip["status"] = "completed"
            except (ValueError, TypeError):
                # If date parsing fails, keep original status
                pass
        
        return trips
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
