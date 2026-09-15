"""Message ingestion service.

Orchestrates:
 1. Fetching new messages from Graph / mock source
 2. Running the AI extraction pipeline (or mock fallback)
 3. Upserting listings and messages into the in-memory store
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

from app.ai_pipeline import AIExtractionPipeline
from app.graph_service import GraphService
from app.models import (
    Contact,
    Engagement,
    Listing,
    ListingStatus,
    Location,
    Message,
    Price,
)
from app.store import DataStore

IST = timezone(timedelta(hours=5, minutes=30))


class IngestionService:
    """Ingests Teams/DL messages, classifies them via AI, and stores listings."""

    def __init__(self, store: DataStore, graph: GraphService, ai: AIExtractionPipeline):
        self.store = store
        self.graph = graph
        self.ai = ai

    async def ingest_from_graph(self, group_id: str = "") -> dict:
        """Fetch new messages from Graph and process them.

        Returns a summary of the ingestion run.
        """
        raw_messages = await self.graph.fetch_messages(group_id)

        processed = 0
        new_listings = 0
        status_updates = 0
        skipped = 0

        for raw in raw_messages:
            # Skip already-ingested messages
            msg_id = raw.get("id", "")
            if msg_id in self.store.messages:
                skipped += 1
                continue

            # Parse into Message model
            if "from" in raw:
                raw["from_user"] = raw.pop("from")
            msg = Message.model_validate(raw)
            self.store.add_message(msg)
            processed += 1

            if msg.is_root:
                # Classify the message
                if self.ai.enabled:
                    classification = await self.ai.classify_message(msg)
                else:
                    classification = self.ai.mock_classify(msg)

                if not classification.get("is_listing", False):
                    continue

                # Extract entities
                category = classification.get("category", "")
                if self.ai.enabled:
                    entities = await self.ai.extract_entities(msg, category)
                else:
                    entities = {}

                # Build listing
                listing = Listing(
                    listing_id=f"lst-auto-{uuid.uuid4().hex[:8]}",
                    thread_id=msg.thread_id,
                    source_message_ids=[msg.id],
                    title=entities.get("title", msg.subject or "Untitled Listing"),
                    intent=classification.get("intent", "sell"),
                    category=category,
                    subcategory=classification.get("subcategory"),
                    description=msg.body or msg.body_preview,
                    price=Price(**entities["price"]) if entities.get("price") else None,
                    attributes=entities.get("attributes"),
                    location=Location(**entities["location"]) if entities.get("location") else None,
                    status=ListingStatus.AVAILABLE,
                    posted_at=msg.sent_datetime or datetime.now(IST),
                    last_activity_at=msg.sent_datetime or datetime.now(IST),
                    engagement=Engagement(
                        has_attachments=msg.has_attachments,
                        photos=len([a for a in msg.attachments if a.content_type.startswith("image/")]),
                    ),
                    contact=Contact(
                        display_name=msg.from_user.name if msg.from_user else "Unknown",
                        masked_email=_mask_email(msg.from_user.email) if msg.from_user else None,
                    ),
                    extraction_confidence=classification.get("confidence", 0.0),
                )
                self.store.upsert_listing(listing)
                new_listings += 1

            else:
                # Reply — check for lifecycle updates
                thread_listings = [
                    l
                    for l in self.store.listings.values()
                    if l.thread_id == msg.thread_id
                ]
                for listing in thread_listings:
                    # Add message to listing's source messages
                    if msg.id not in listing.source_message_ids:
                        listing.source_message_ids.append(msg.id)

                    # Detect lifecycle
                    if self.ai.enabled:
                        lifecycle = await self.ai.detect_lifecycle(msg, listing.title)
                    else:
                        lifecycle = _mock_lifecycle(msg)

                    if lifecycle.get("status_update"):
                        new_status = lifecycle["status_update"]
                        try:
                            listing.status = ListingStatus(new_status)
                            listing.last_activity_at = msg.sent_datetime or datetime.now(IST)
                            status_updates += 1
                        except ValueError:
                            pass

                    # Update engagement
                    if listing.engagement:
                        listing.engagement.replies += 1

        return {
            "processed": processed,
            "new_listings": new_listings,
            "status_updates": status_updates,
            "skipped": skipped,
        }


def _mask_email(email: str) -> str:
    """Mask an email address for privacy: a****@contoso.com"""
    parts = email.split("@")
    if len(parts) != 2:
        return email
    local = parts[0]
    masked = local[0] + "****" if len(local) > 1 else local
    return f"{masked}@{parts[1]}"


def _mock_lifecycle(msg: Message) -> dict:
    """Simple rule-based lifecycle detection fallback."""
    body = (msg.body or msg.body_preview or "").lower()
    if any(w in body for w in ["sold", "gone", "handed over", "deal done"]):
        return {"status_update": "sold", "confidence": 0.8}
    if any(w in body for w in ["reserved", "committed", "booked"]):
        return {"status_update": "reserved", "confidence": 0.7}
    if any(w in body for w in ["dropping the price", "reduced to", "new price"]):
        return {"status_update": "available", "confidence": 0.7}
    return {"status_update": None, "confidence": 0.5}
