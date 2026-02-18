from fastapi import APIRouter, HTTPException, status
from schemas import SignUpSchema, SignInSchema
from database import supabase
from models import hash_password, verify_password

router = APIRouter()


@router.post("/signup")
async def signup(user_data: SignUpSchema):
    """
    Register a new user.
    """

    try:
        # 1️⃣ Check if username already exists
        username_check = supabase.table("users") \
            .select("id") \
            .eq("username", user_data.username) \
            .execute()

        if username_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )

        # 2️⃣ Check if email already exists
        email_check = supabase.table("users") \
            .select("id") \
            .eq("email", user_data.email) \
            .execute()

        if email_check.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists"
            )

        # 3️⃣ Hash password
        hashed_password = hash_password(user_data.password)

        # 4️⃣ Insert user
        supabase.table("users").insert({
            "display_name": user_data.display_name,
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hashed_password
        }).execute()

        return {
            "message": "User created successfully",
            "user": {
                "username": user_data.username,
                "email": user_data.email,
                "display_name": user_data.display_name
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User registration failed: {str(e)}"
        )


@router.post("/signin")
async def signin(credentials: SignInSchema):
    """
    Sign in an existing user.
    """
    try:
        result = supabase.table("users") \
            .select("*") \
            .eq("username", credentials.username) \
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        user = result.data[0]

        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

        return {
            "message": "Sign in successful",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "display_name": user["display_name"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sign in failed: {str(e)}"
        )


@router.get("/user/{user_id}")
async def get_user_profile(user_id: int):
    """
    Get user profile information by user ID.
    """
    try:
        result = supabase.table("users") \
            .select("id, username, email, display_name, created_at, preferred_budget, preferred_activities, preferred_regions") \
            .eq("id", user_id) \
            .execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        user = result.data[0]
        
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "display_name": user["display_name"],
            "created_at": user.get("created_at"),
            "preferred_budget": user.get("preferred_budget"),
            "preferred_activities": user.get("preferred_activities", []),
            "preferred_regions": user.get("preferred_regions", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch user profile: {str(e)}"
        )
