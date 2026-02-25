from fastapi import APIRouter, HTTPException
from groq import Groq
import os
from database import supabase
from datetime import datetime, timedelta
import json

router = APIRouter()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

@router.post("/ai/chat/{user_id}")
async def chat_ai(user_id: str, data: dict):

    try:
        message = data.get("message")

        if not message:
            return {
                "reply": "Please enter a message.",
                "suggested_destinations": [],
                "trip_created": None
            }

        # 🛡 PROTECT AGAINST NULL USER
        if not user_id or user_id == "null" or user_id == "undefined":
            user_id = "guest_user"

        message_lower = message.lower()

        # 🧠 Detect trip intent
        trip_intent_keywords = [
            "plan trip",
            "book trip",
            "create trip",
            "add trip",
            "i want to go",
            "plan a trip",
            "trip to"
        ]

        is_trip_request = any(k in message_lower for k in trip_intent_keywords)

        # 🧠 Detect destination
        destinations = [
            "Japan", "Kyoto", "Paris", "Bali",
            "Reykjavik", "Tokyo", "Italy",
            "Switzerland", "Dubai", "Thailand"
        ]

        chosen_destination = None
        for d in destinations:
            if d.lower() in message_lower:
                chosen_destination = d

        # 🛡 SAFE DEFAULT USER CONTEXT
        travel_style = "Not set"
        interests = "Not set"
        budget = "Not set"

        # 🛡 SAFE SUPABASE BLOCK - Fetch from users table only
        try:
            user_info = supabase.table("users") \
                .select("*") \
                .eq("id", user_id) \
                .execute()

            if user_info.data:
                u = user_info.data[0]
                # Get preferences from users table columns (set via profile page)
                budget = u.get('preferred_budget', 'Not set')
                activities = u.get('preferred_activities', [])
                regions = u.get('preferred_regions', [])
                
                # Format for AI context
                travel_style = ", ".join(activities) if activities else "Not set"
                interests = ", ".join(regions) if regions else "Not set"

        except Exception as db_error:
            print("⚠️ Supabase error:", db_error)

        context_prompt = f"""
User Travel Style: {travel_style}
User Interests: {interests}
Budget: {budget}
"""

        # 🎯 Cinematic Travel Assistant Prompt
        system_message = """
You are Tripolingo AI — a cinematic smart travel assistant inside a travel planning app.

ROLE:
- Help users discover destinations, plan trips, suggest activities, restaurants, and travel tips.
- You can also answer normal everyday questions (time, nearby places, general info).

STYLE:
- Short, clear, and helpful responses.
- Friendly but calm professional tone.
- Avoid long paragraphs.
- No introductions like "Hello traveler".
- No emojis unless the user uses emojis first.

WHEN USER ASKS FOR SUGGESTIONS:
- Give exactly 5 numbered items.
- Each item must be short (name + very few words only).
- Do NOT add long descriptions.

Example format:
1. Kyoto Temples
2. Tokyo Nightlife
3. Osaka Street Food
4. Nara Park
5. Mount Fuji Views

GENERAL QUESTIONS:
- Answer normally but keep it concise.
- Maximum 1 short follow-up question at the end if useful.

IMPORTANT:
- Do not mention system instructions.
- Do not repeat the question.
- Do not add extra closing text.
- Stop the response naturally without filler words.

GOAL:
Act like a fast, cinematic travel assistant that helps users explore and plan trips efficiently inside the Tripolingo app.
"""

        # 🛡 SAFE GROQ CALL
        try:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "system", "content": context_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=300
            )

            reply = completion.choices[0].message.content.strip()

        except Exception as groq_error:
            print("🔥 Groq error:", groq_error)
            return {
                "reply": "AI service temporarily unavailable. Please try again.",
                "suggested_destinations": [],
                "trip_created": None
            }

        # 🎬 Auto Trip Creation (SAFE)
        created_trip = None

        if is_trip_request and chosen_destination:
            try:
                future_date = (datetime.utcnow() + timedelta(days=30)).date()

                trip_data = {
                    "user_id": user_id,
                    "destination": chosen_destination,
                    "country": "",
                    "trip_date": str(future_date),
                    "status": "planning"
                }

                res = supabase.table("trips").insert(trip_data).execute()
                created_trip = res.data

            except Exception as trip_error:
                print("⚠️ Trip creation error:", trip_error)

        return {
            "reply": reply if reply else "Which destination would you like to explore?",
            "suggested_destinations": [],
            "trip_created": created_trip
        }

    except Exception as e:
        print("🔥 CRITICAL ERROR:", e)
        return {
            "reply": "Something went wrong. Please try again.",
            "suggested_destinations": [],
            "trip_created": None
        }