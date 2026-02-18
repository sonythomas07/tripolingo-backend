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

        # 🛡 SAFE SUPABASE BLOCK
        try:
            user_info = supabase.table("users") \
                .select("*") \
                .eq("id", user_id) \
                .execute()

            prefs = supabase.table("user_preferences") \
                .select("*") \
                .eq("user_id", user_id) \
                .execute()

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

        except Exception as db_error:
            print("⚠️ Supabase error:", db_error)

        context_prompt = f"""
User Travel Style: {travel_style}
User Interests: {interests}
Budget: {budget}
"""

        # 🎯 Controlled AI Prompt
        system_message = """
You are Tripolingo AI.

RULES:

1. If user greets (hello, hi, hey):
Return:
{
  "places": [],
  "follow_up_question": "Which destination would you like to explore?"
}

2. If user mentions a destination:
- Return ONLY 4 to 5 top places.
- No explanation.
- Ask ONE short follow-up question.

3. Response MUST be valid JSON only.

Format:
{
  "places": ["Place1","Place2","Place3","Place4","Place5"],
  "follow_up_question": "One short question"
}
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
                temperature=0.3,
                max_tokens=200
            )

            reply = completion.choices[0].message.content

        except Exception as groq_error:
            print("🔥 Groq error:", groq_error)
            return {
                "reply": "AI service temporarily unavailable. Please try again.",
                "suggested_destinations": [],
                "trip_created": None
            }

        # 🛡 SAFE JSON PARSE
        try:
            reply_json = json.loads(reply)
        except Exception:
            reply_json = {
                "places": [],
                "follow_up_question": "Which destination would you like to explore?"
            }

        places = reply_json.get("places", [])
        question = reply_json.get("follow_up_question", "")

        reply_text = ""

        if places:
            reply_text += "Top places to visit:\n"
            for i, place in enumerate(places, 1):
                reply_text += f"{i}. {place}\n"

        if question:
            reply_text += f"\n{question}"

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
            "reply": reply_text.strip() if reply_text else "Which destination would you like to explore?",
            "suggested_destinations": places,
            "trip_created": created_trip
        }

    except Exception as e:
        print("🔥 CRITICAL ERROR:", e)
        return {
            "reply": "Something went wrong. Please try again.",
            "suggested_destinations": [],
            "trip_created": None
        }