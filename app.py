from fastapi import FastAPI
from auth import router as auth_router
from preferences import router as preferences_router

app = FastAPI(title="Travel Agent API", version="1.0.0")

# Include authentication router
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])


@app.get("/")
async def root():
    """Root endpoint returning backend status."""
    return {
        "status": "online",
        "message": "Travel Agent API is running",
        "version": "1.0.0"
    }


app.include_router(
    preferences_router,
    prefix="/user",
    tags=["User Preferences"]
)
