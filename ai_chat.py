from fastapi import APIRouter, HTTPException
from groq import Groq
import os
from database import supabase
from datetime import datetime, timedelta

router = APIRouter()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# 🧠 Simple in-memory session memory
user_memory = {}

@router.post("/ai/chat/{user_id}")
async def chat_ai(user_id: str, data: dict):

    message = data.get("message")

    if not message:
        raise HTTPException(status_code=400, detail="Message missing")

    try:
        # 🧠 Detect trip intent
        message_lower = message.lower()

        trip_intent_keywords = [
            "plan trip",
            "book trip",
            "create trip",
            "add trip",
            "i want to go",
            "plan a trip"
        ]

        is_trip_request = any(k in message_lower for k in trip_intent_keywords)

        # 🧠 Auto detect destination
        destinations = ["Kyoto", "Paris", "Bali", "Reykjavik"]

        chosen_destination = None

        for d in destinations:
            if d.lower() in message_lower:
                chosen_destination = d

        # 🧠 Fetch user context from database
        user_info = supabase.table("users") \
            .select("*") \
            .eq("id", user_id) \
            .execute()

        user_trips = supabase.table("trips") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        prefs = supabase.table("user_preferences") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        # 🧠 Build user context
        travel_style = "Not set"
        interests = "Not set"
        budget = "Not set"

        if user_info.data:
            u = user_info.data[0]
            travel_style = u.get('travel_style', 'Not set')
            interests = u.get('interests', 'Not set')
            budget = u.get('budget', 'Not set')

        if prefs.data:
            p = prefs.data[0]
            travel_style = p.get('travel_styles', travel_style)
            budget = p.get('budget', budget)
            interests = p.get('interests', interests)

        # 🧠 Build trip list
        trip_list = ""
        if user_trips.data:
            for trip in user_trips.data:
                trip_list += f"- {trip.get('destination')} ({trip.get('status')})\n"
        else:
            trip_list = "No trips planned yet"

        # 🧠 Build comprehensive context prompt
        context_prompt = f"""
User Travel Style: {travel_style}
User Interests: {interests}
Budget: {budget}

Planned Trips:
{trip_list}
"""

        # 🧠 Memory tracking
        if user_id not in user_memory:
            user_memory[user_id] = {
                "history": [],
                "last_destinations": []
            }

        user_memory[user_id]["history"].append(message)

        # Keep last 5 messages only
        user_memory[user_id]["history"] = user_memory[user_id]["history"][-5:]

        # 🧠 Build context-aware system message
        system_message = """You are Tripolingo AI, a cinematic smart travel assistant.
Always personalize suggestions using the user's travel style, interests, and planned trips.

Behavior Rules:
- Speak like an intelligent travel planner
- Recommend destinations matching user interests and style
- Keep responses cinematic and inspiring
- Mention their existing trips when relevant
"""

        # 🧠 Groq API call with full context
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "system", "content": context_prompt},
                {"role": "user", "content": message}
            ],
        )

        reply = completion.choices[0].message.content

        # 🧠 Auto extract destinations from AI reply
        suggested = []

        for d in destinations:
            if d.lower() in reply.lower():
                suggested.append(d)

        user_memory[user_id]["last_destinations"] = suggested

        # 🎬 AI Trip Builder Engine
        created_trip = None

        if is_trip_request and chosen_destination:

            # Default cinematic future date = 30 days later
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

        return {
            "reply": reply,
            "suggested_destinations": suggested,
            "trip_created": created_trip
        }

    except Exception as e:
        print("🔥 GROQ ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
