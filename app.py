from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from preferences import router as preferences_router

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

# Include preferences router
app.include_router(
    preferences_router,
    prefix="/user",
    tags=["User Preferences"]
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Travel Agent API is running",
        "version": "1.0.0"
    }
