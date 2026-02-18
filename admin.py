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
        description = data.get("description")
        activities = data.get("activities")
        active = data.get("active", True)

        destination_data = {
            "name": name,
            "country": country,
            "travel_style": travel_style,
            "budget": budget,
            "description": description,
            "activities": activities,
            "active": active
        }

        result = supabase.table("destinations").insert(destination_data).execute()
        return {"success": True, "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/admin/destinations/{destination_id}")
async def update_destination(destination_id: str, data: dict = None):
    try:
        # Get current destination
        current = supabase.table("destinations").select("*").eq("id", destination_id).execute()
        
        if not current.data or len(current.data) == 0:
            raise HTTPException(status_code=404, detail="Destination not found")
        
        # If no data provided, toggle active status (backward compatibility)
        if not data:
            current_active = current.data[0].get("active", False)
            new_active = not current_active
            result = supabase.table("destinations").update({"active": new_active}).eq("id", destination_id).execute()
            return {"success": True, "data": result.data}
        
        # Build update object from provided data
        update_data = {}
        if "name" in data:
            update_data["name"] = data["name"]
        if "country" in data:
            update_data["country"] = data["country"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "activities" in data:
            update_data["activities"] = data["activities"]
        if "travel_style" in data:
            update_data["travel_style"] = data["travel_style"]
        if "budget" in data:
            update_data["budget"] = data["budget"]
        if "active" in data:
            update_data["active"] = data["active"]
        
        # Update in database
        result = supabase.table("destinations").update(update_data).eq("id", destination_id).execute()
        
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

@router.delete("/admin/destinations/{destination_id}")
async def delete_destination(destination_id: str):
    try:
        result = supabase.table("destinations").delete().eq("id", destination_id).execute()
        return {"success": True, "data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str):
    try:
        # Convert user_id to string for matching
        user_id_str = str(user_id)
        
        print(f"Attempting to delete user: {user_id_str}")
        
        # Delete user's trips first (trips.user_id is text)
        try:
            trips_result = supabase.table("trips").delete().eq("user_id", user_id_str).execute()
            print(f"Deleted {len(trips_result.data) if trips_result.data else 0} trips")
        except Exception as trip_err:
            print(f"Error deleting trips: {trip_err}")
            # Continue even if trips deletion fails
        
        # Delete user preferences (user_id is text)
        try:
            prefs_result = supabase.table("user_preferences").delete().eq("user_id", user_id_str).execute()
            print(f"Deleted {len(prefs_result.data) if prefs_result.data else 0} preferences")
        except Exception as pref_err:
            print(f"Error deleting preferences: {pref_err}")
            # Continue even if preferences deletion fails
        
        # Delete the user (users.id is uuid)
        try:
            user_result = supabase.table("users").delete().eq("id", user_id_str).execute()
            print(f"User deleted successfully")
            return {"success": True}
        except Exception as user_err:
            print(f"Error deleting user: {user_err}")
            return {"success": False, "error": f"Failed to delete user: {str(user_err)}"}
            
    except Exception as e:
        print(f"Unexpected error in delete_user: {e}")
        return {"success": False, "error": str(e)}
