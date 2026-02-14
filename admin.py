from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
import os

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

@router.get("/admin/destinations")
async def get_all_destinations():
    try:
        result = supabase.table("destinations").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/destinations")
async def create_destination(data: dict):
    try:
        name = data.get("name")
        country = data.get("country")
        travel_style = data.get("travel_style")
        budget = data.get("budget")
        active = data.get("active", True)

        destination_data = {
            "name": name,
            "country": country,
            "travel_style": travel_style,
            "budget": budget,
            "active": active
        }

        result = supabase.table("destinations").insert(destination_data).execute()
        return {"success": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/admin/destinations/{destination_id}")
async def toggle_destination(destination_id: str):
    try:
        # Get current destination
        current = supabase.table("destinations").select("*").eq("id", destination_id).execute()
        
        if not current.data or len(current.data) == 0:
            raise HTTPException(status_code=404, detail="Destination not found")
        
        # Toggle active status
        current_active = current.data[0].get("active", False)
        new_active = not current_active
        
        # Update in database
        result = supabase.table("destinations").update({"active": new_active}).eq("id", destination_id).execute()
        
        return {"success": True, "data": result.data}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/admin/users")
async def get_all_users():
    try:
        result = supabase.table("users").select("*").execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
