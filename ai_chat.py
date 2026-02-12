from fastapi import APIRouter, HTTPException
from groq import Groq
import os

router = APIRouter()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

@router.post("/ai/chat/{user_id}")
async def chat_ai(user_id: str, data: dict):

    message = data.get("message")

    if not message:
        raise HTTPException(status_code=400, detail="Message missing")

    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are Tripolingo AI, a cinematic smart travel assistant."},
                {"role": "user", "content": message}
            ],
        )

        reply = completion.choices[0].message.content

        return {
            "reply": reply,
            "suggested_destinations": ["Kyoto"]
        }

    except Exception as e:
        print("🔥 GROQ ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
