from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from recommendations import router as recommendations_router
from ai_chat import router as ai_router
from trips import router as trips_router
from admin import router as admin_router



app = FastAPI(title="Travel Agent API", version="1.0.0")

# ✅ ADD CORS (IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend
    allow_credentials=True,
    allow_methods=["*"],  # allow POST, GET, OPTIONS
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

app.include_router(
    recommendations_router,
    tags=["Recommendations"]
)

app.include_router(ai_router, tags=["AI Assistant"])

app.include_router(trips_router, tags=["Trips"])

app.include_router(admin_router, tags=["Admin"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Travel Agent API is running",
        "version": "1.0.0"
    }
