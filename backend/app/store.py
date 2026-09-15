"""In-memory data store — seeded from datasource JSON files at startup."""

from __future__ import annotations

import json
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

from app.models import (
    Category,
    DashboardStats,
    Listing,
    ListingDetail,
    ListingStatus,
    Message,
    SearchQuery,
    SearchResult,
)

IST = timezone(timedelta(hours=5, minutes=30))


class DataStore:
    """Singleton in-memory store for listings, messages, and categories."""

    def __init__(self, data_dir: str):
        self.data_dir = Path(data_dir)
        self.listings: dict[str, Listing] = {}
        self.messages: dict[str, Message] = {}
        self.threads: dict[str, list[str]] = {}  # thread_id -> [message_ids]
        self.categories: list[Category] = []
        self._load()

    # ── Seed data ────────────────────────────────────────────────────────

    def _load(self) -> None:
        self._load_categories()
        self._load_messages()
        self._load_listings()

    def _load_categories(self) -> None:
        path = self.data_dir / "taxonomy.json"
        if not path.exists():
            return
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        for cat in data.get("categories", []):
            self.categories.append(Category(**cat))

    def _load_messages(self) -> None:
        path = self.data_dir / "messages.json"
        if not path.exists():
            path = self.data_dir / "sample_dataset.json"
        if not path.exists():
            return
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
        items = raw if isinstance(raw, list) else raw.get("messages", [])
        for m in items:
            # Rename 'from' -> 'from_user' so Pydantic can parse
            if "from" in m:
                m["from_user"] = m.pop("from")
            msg = Message.model_validate(m)
            self.messages[msg.id] = msg
            self.threads.setdefault(msg.thread_id, []).append(msg.id)

    def _load_listings(self) -> None:
        path = self.data_dir / "listings.json"
        if not path.exists():
            return
        with open(path, encoding="utf-8") as f:
            raw = json.load(f)
        items = raw if isinstance(raw, list) else raw.get("listings", [])
        for item in items:
            listing = Listing.model_validate(item)
            self.listings[listing.listing_id] = listing

    # ── Queries ──────────────────────────────────────────────────────────

    def get_all_listings(self) -> list[Listing]:
        return list(self.listings.values())

    def get_listing(self, listing_id: str) -> Listing | None:
        return self.listings.get(listing_id)

    def get_listing_detail(self, listing_id: str) -> ListingDetail | None:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        msgs = [
            self.messages[mid]
            for mid in listing.source_message_ids
            if mid in self.messages
        ]
        msgs.sort(key=lambda m: m.conversation_index)
        return ListingDetail(listing=listing, messages=msgs)

    def get_thread_messages(self, thread_id: str) -> list[Message]:
        ids = self.threads.get(thread_id, [])
        msgs = [self.messages[mid] for mid in ids if mid in self.messages]
        msgs.sort(key=lambda m: m.conversation_index)
        return msgs

    def get_listings_by_category(self, category: str) -> list[Listing]:
        return [l for l in self.listings.values() if l.category == category]

    def get_featured(self, limit: int = 10) -> list[Listing]:
        active = [
            l
            for l in self.listings.values()
            if l.featured_score > 0
            and l.status
            not in (
                ListingStatus.SOLD,
                ListingStatus.DUPLICATE,
                ListingStatus.NOT_A_LISTING,
                ListingStatus.EXPIRED,
            )
        ]
        active.sort(key=lambda l: l.featured_score, reverse=True)
        return active[:limit]

    def search(self, query: SearchQuery) -> SearchResult:
        results = list(self.listings.values())

        # Filter out non-listings
        results = [
            r for r in results if r.status != ListingStatus.NOT_A_LISTING
        ]

        # Category filter
        if query.category:
            results = [r for r in results if r.category == query.category]

        # Subcategory filter
        if query.subcategory:
            results = [
                r for r in results if r.subcategory == query.subcategory
            ]

        # Status filter
        if query.status:
            results = [r for r in results if r.status.value == query.status]

        # Location filter (case-insensitive substring match)
        if query.location:
            loc_lower = query.location.lower()
            results = [
                r
                for r in results
                if r.location
                and (
                    (r.location.area and loc_lower in r.location.area.lower())
                    or loc_lower in r.location.city.lower()
                )
            ]

        # Price range filter
        if query.min_price is not None:
            results = [
                r
                for r in results
                if r.price and r.price.amount is not None and r.price.amount >= query.min_price
            ]
        if query.max_price is not None:
            results = [
                r
                for r in results
                if r.price and r.price.amount is not None and r.price.amount <= query.max_price
            ]

        # Free-text search across title + description + attributes
        if query.q:
            q_lower = query.q.lower()
            filtered = []
            for r in results:
                searchable = (r.title or "").lower()
                if r.description:
                    searchable += " " + r.description.lower()
                if r.attributes:
                    searchable += " " + json.dumps(r.attributes).lower()
                if r.location:
                    searchable += " " + (r.location.area or "").lower()
                    searchable += " " + r.location.city.lower()
                if q_lower in searchable:
                    filtered.append(r)
                else:
                    # Token-level match: if every query word appears somewhere
                    tokens = q_lower.split()
                    if all(t in searchable for t in tokens):
                        filtered.append(r)
            results = filtered

        # Sorting
        reverse = query.sort_order == "desc"
        if query.sort_by == "price":
            results.sort(
                key=lambda r: r.price.amount if r.price and r.price.amount else 0,
                reverse=reverse,
            )
        elif query.sort_by == "featured_score":
            results.sort(key=lambda r: r.featured_score, reverse=reverse)
        else:
            results.sort(
                key=lambda r: r.posted_at or datetime.min.replace(tzinfo=IST),
                reverse=reverse,
            )

        # Pagination
        total = len(results)
        start = (query.page - 1) * query.page_size
        end = start + query.page_size
        page_results = results[start:end]

        return SearchResult(
            results=page_results,
            total=total,
            page=query.page,
            page_size=query.page_size,
        )

    def get_dashboard_stats(self) -> DashboardStats:
        now = datetime.now(IST)
        week_ago = now - timedelta(days=7)

        active_statuses = {
            ListingStatus.AVAILABLE,
            ListingStatus.OPEN,
            ListingStatus.NEGOTIATING,
            ListingStatus.RESERVED,
            ListingStatus.PARTIALLY_SOLD,
            ListingStatus.PARTIALLY_FILLED,
            ListingStatus.PARTIALLY_CLAIMED,
        }
        sold_statuses = {ListingStatus.SOLD, ListingStatus.MATCHED, ListingStatus.RESOLVED}

        all_listings = [
            l
            for l in self.listings.values()
            if l.status != ListingStatus.NOT_A_LISTING
            and l.status != ListingStatus.DUPLICATE
        ]

        active = [l for l in all_listings if l.status in active_statuses]
        sold = [l for l in all_listings if l.status in sold_statuses]

        new_this_week = [
            l
            for l in all_listings
            if l.posted_at and l.posted_at >= week_ago
        ]

        # Category counts
        cat_counts: dict[str, int] = {}
        for l in active:
            cat_counts[l.category] = cat_counts.get(l.category, 0) + 1

        # Trending = most engagement among active
        trending = sorted(
            active,
            key=lambda l: (
                (l.engagement.replies if l.engagement else 0)
                + (l.engagement.unique_participants if l.engagement else 0)
            ),
            reverse=True,
        )[:5]

        # Recently sold
        recently_sold = sorted(
            sold,
            key=lambda l: l.last_activity_at or l.posted_at or datetime.min.replace(tzinfo=IST),
            reverse=True,
        )[:5]

        return DashboardStats(
            total_active=len(active),
            new_this_week=len(new_this_week),
            total_sold=len(sold),
            categories_count=cat_counts,
            trending=trending,
            recently_sold=recently_sold,
        )

    # ── Mutations ────────────────────────────────────────────────────────

    def upsert_listing(self, listing: Listing) -> Listing:
        self.listings[listing.listing_id] = listing
        return listing

    def update_status(self, listing_id: str, status: ListingStatus) -> Listing | None:
        listing = self.listings.get(listing_id)
        if not listing:
            return None
        listing.status = status
        listing.last_activity_at = datetime.now(IST)
        return listing

    def add_message(self, message: Message) -> Message:
        self.messages[message.id] = message
        self.threads.setdefault(message.thread_id, []).append(message.id)
        return message
