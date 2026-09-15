"""Azure OpenAI-powered AI extraction pipeline.

Responsibilities:
 1. Determine if a message is a marketplace listing.
 2. Categorize and extract structured entities.
 3. Generate confidence score.
 4. Detect lifecycle updates (sold, available, booked, etc.).
 5. Detect duplicates by comparing with existing listings.
"""

from __future__ import annotations

import json
import os
from typing import Optional

from app.models import Listing, Message

# ── Prompt Templates ─────────────────────────────────────────────────────────

CLASSIFICATION_PROMPT = """You are a marketplace listing classifier for "HydChat", an internal employee community distribution list in Hyderabad, India.

Given a message from the group, determine:
1. Is this a marketplace listing? (true/false)
2. If yes, classify it.

Categories:
- vehicles (car, motorcycle, scooter, car-lease-transfer, accessories)
- real-estate (flat-rent, flat-resale, flatmate, temporary-accommodation, pg-hostel)
- furniture-appliances (furniture, appliances, move-out-bundle, free-giveaway)
- electronics (mobile, laptop, gaming, audio, accessories)
- vouchers-tickets (hotel-voucher, gift-card, movie-tickets, event-tickets, travel)
- memberships-subscriptions (fitness, club, streaming, software)
- services (driving-school, domestic-help, tutor, packers-movers, repairs, other)
- carpool-travel (daily-commute, day-trip, airport-drop, outstation)
- community-events (social-event, volunteering, sports, wellbeing)
- community-help (blood-requirement, emergency, lost-and-found)

Intents: sell, rent-out, transfer, wanted, giveaway, service-offer, recommendation-request, urgent-help, announce, question, discuss, multi

Respond with a JSON object:
{
  "is_listing": true/false,
  "category": "...",
  "subcategory": "...",
  "intent": "...",
  "confidence": 0.0-1.0
}"""

EXTRACTION_PROMPT = """You are a structured data extractor for marketplace listings from "HydChat", an employee community group in Hyderabad, India.

Given a message classified as a marketplace listing, extract all relevant entities into structured JSON.

Extract these fields when present:
- title: A concise listing title
- price: { amount, currency (default INR), unit (total/per-month/per-day/per-person/bundle-total/budget-max/per-item/free), negotiable }
- location: { area, city (default Hyderabad) }
- urgency: normal / urgent / time-sensitive

For vehicles: make, model, variant, year, fuel, transmission, km_driven, owners, colour, insurance_valid_till, accident_history, service_records
For real estate: bhk, furnishing, society_name, floor, total_floors, sqft, rent, deposit, available_from
For electronics: brand, model, storage, condition, battery_health, warranty_till
For furniture/appliances: items (list of {name, price, condition})

Also extract:
- contact: { display_name, teams_dm }

Respond with a JSON object matching these fields. Omit fields that are not present in the message."""

LIFECYCLE_PROMPT = """You are a listing lifecycle detector for "HydChat" marketplace.

Given a reply message in a listing thread, determine if it indicates a status change.

Possible status updates:
- sold: Item has been sold
- reserved: Buyer committed, handover pending
- available: Still available (price may have changed)
- negotiating: Price negotiation happening
- withdrawn: Seller withdrew the listing
- expired: Past event/validity date

Also detect:
- price_change: { new_amount, direction (up/down) }
- new_interested_buyer: true/false

Respond with JSON:
{
  "status_update": null or "sold"/"reserved"/"available" etc.,
  "price_change": null or { "new_amount": number, "direction": "up"/"down" },
  "new_interested_buyer": true/false,
  "confidence": 0.0-1.0
}"""

SMART_SEARCH_PROMPT = """You are a search query parser for "HydChat" marketplace in Hyderabad.

Convert natural language search queries into structured filters.

Examples:
- "Swift under 6 lakh in Gachibowli" -> { category: "vehicles", max_price: 600000, location: "Gachibowli", q: "Swift" }
- "2BHK under 30k near Microsoft campus" -> { category: "real-estate", max_price: 30000, location: "Kondapur", q: "2BHK" }
- "Washing machine below 10k" -> { category: "furniture-appliances", max_price: 10000, q: "washing machine" }
- "carpool from Bachupally" -> { category: "carpool-travel", location: "Bachupally" }
- "free stuff" -> { max_price: 0, q: "free" }

Respond with JSON:
{
  "q": "free text search terms",
  "category": "category-id or null",
  "subcategory": "subcategory or null",
  "location": "area name or null",
  "min_price": number or null,
  "max_price": number or null,
  "status": "status or null"
}"""


class AIExtractionPipeline:
    """Wraps Azure OpenAI calls for listing extraction and search parsing."""

    def __init__(self):
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
        api_key = os.getenv("AZURE_OPENAI_KEY", "")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
        self.deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
        self.enabled = bool(endpoint and api_key)

        if self.enabled:
            from openai import AsyncAzureOpenAI

            self.client = AsyncAzureOpenAI(
                azure_endpoint=endpoint,
                api_key=api_key,
                api_version=api_version,
            )
        else:
            self.client = None

    async def _chat(self, system: str, user: str) -> dict:
        """Send a chat completion and parse the JSON response."""
        if not self.enabled or not self.client:
            return {}

        response = await self.client.chat.completions.create(
            model=self.deployment,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    async def classify_message(self, message: Message) -> dict:
        """Classify whether a message is a marketplace listing."""
        user_content = f"Subject: {message.subject or ''}\n\nBody: {message.body or message.body_preview or ''}"
        return await self._chat(CLASSIFICATION_PROMPT, user_content)

    async def extract_entities(self, message: Message, category: str) -> dict:
        """Extract structured entities from a classified listing message."""
        user_content = (
            f"Category: {category}\n"
            f"Subject: {message.subject or ''}\n\n"
            f"Body: {message.body or message.body_preview or ''}"
        )
        return await self._chat(EXTRACTION_PROMPT, user_content)

    async def detect_lifecycle(self, reply: Message, original_listing_title: str) -> dict:
        """Detect if a reply indicates a listing status change."""
        user_content = (
            f"Original listing: {original_listing_title}\n\n"
            f"Reply from {reply.from_user.name if reply.from_user else 'unknown'}:\n"
            f"{reply.body or reply.body_preview or ''}"
        )
        return await self._chat(LIFECYCLE_PROMPT, user_content)

    async def parse_smart_search(self, query: str) -> dict:
        """Convert a natural-language search query into structured filters."""
        return await self._chat(SMART_SEARCH_PROMPT, query)

    # ── Fallback / mock methods for demo without Azure OpenAI ────────────

    def mock_classify(self, message: Message) -> dict:
        """Rule-based classification fallback."""
        body = (message.body or message.body_preview or "").lower()
        subject = (message.subject or "").lower()
        text = subject + " " + body

        sell_keywords = ["for sale", "selling", "sell my", "moving out", "price", "₹", "lakh", "k "]
        rent_keywords = ["for rent", "bhk", "flat available", "semi-furnished", "fully furnished", "flatmate"]
        vehicle_keywords = ["car", "bike", "scooter", "kushaq", "creta", "enfield", "swift", "km driven"]

        is_listing = any(kw in text for kw in sell_keywords + rent_keywords + vehicle_keywords)

        category = "non-listing"
        if any(kw in text for kw in vehicle_keywords):
            category = "vehicles"
        elif any(kw in text for kw in rent_keywords):
            category = "real-estate"
        elif any(kw in text for kw in ["iphone", "laptop", "ps5", "gaming", "samsung", "macbook"]):
            category = "electronics"
        elif any(kw in text for kw in ["sofa", "table", "washing machine", "fridge", "furniture", "move-out"]):
            category = "furniture-appliances"
        elif any(kw in text for kw in ["carpool", "cab", "commute", "ride"]):
            category = "carpool-travel"

        return {
            "is_listing": is_listing,
            "category": category,
            "subcategory": None,
            "intent": "sell" if is_listing else "discuss",
            "confidence": 0.75 if is_listing else 0.6,
        }

    def mock_parse_search(self, query: str) -> dict:
        """Rule-based search parsing fallback."""
        import re

        q_lower = query.lower()
        q_tokens = q_lower.split()

        result: dict = {}
        noise_words = {"under", "below", "less", "than", "max", "budget", "near", "in", "at", "for", "the", "a", "an", "with", "from", "to", "stuff", "things", "items", "wanted"}

        # Handle "free" queries
        if "free" in q_tokens:
            result["max_price"] = 0

        # Detect category keywords — check carpool before vehicles (avoid "car" substring match)
        cat_keywords: dict[str, list[str]] = {
            "carpool-travel": ["carpool", "ride", "commute"],
            "vehicles": ["car", "bike", "scooter", "vehicle", "swift", "creta", "kushaq", "enfield"],
            "real-estate": ["bhk", "flat", "room", "apartment", "rent", "pg", "2bhk", "3bhk", "1bhk"],
            "electronics": ["phone", "iphone", "laptop", "ps5", "gaming", "samsung", "macbook"],
            "furniture-appliances": ["sofa", "table", "washing", "fridge", "furniture", "machine"],
        }
        for cat, keywords in cat_keywords.items():
            if any(w in q_tokens for w in keywords):
                result["category"] = cat
                break

        # Detect price
        price_match = re.search(r"(?:under|below|less than|max|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(lakh|l|k)?", q_lower)
        if price_match:
            amount = float(price_match.group(1))
            unit = (price_match.group(2) or "").lower()
            if unit in ("lakh", "l"):
                amount *= 100000
            elif unit == "k":
                amount *= 1000
            result["max_price"] = amount

        # Detect location
        locations = [
            "gachibowli", "kondapur", "nallagandla", "miyapur", "madhapur",
            "hitech city", "banjara hills", "jubilee hills", "kokapet",
            "narsingi", "gopanpally", "tellapur", "bachupally", "lb nagar",
            "microsoft campus",
        ]
        # Map aliases
        location_aliases = {"microsoft campus": "Kondapur"}
        for loc in locations:
            if loc in q_lower:
                result["location"] = location_aliases.get(loc, loc.title())
                break

        # Extract clean search terms (remove noise, price, location words)
        price_pattern = re.compile(r"(?:under|below|less than|max|budget)\s*(?:₹|rs\.?|inr)?\s*\d+\s*(?:lakh|l|k)?", re.I)
        clean_q = price_pattern.sub("", q_lower)
        # Remove detected location
        if result.get("location"):
            for loc in locations:
                clean_q = clean_q.replace(loc, "")
        # Remove noise words and category keywords
        all_cat_kw = {kw for kws in cat_keywords.values() for kw in kws}
        tokens = [t for t in clean_q.split() if t not in noise_words and t not in all_cat_kw and len(t) > 1]
        if tokens:
            result["q"] = " ".join(tokens)

        return result
