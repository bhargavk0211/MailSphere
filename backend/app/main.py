"""Microsoft Marketplace – FastAPI application entry point.

Exposes REST APIs for:
 - Dashboard stats
 - Listing CRUD & search
 - Category browsing
 - Featured listings
 - Thread / conversation view
 - AI-powered smart search
 - Message ingestion trigger
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.ai_pipeline import AIExtractionPipeline
from app.graph_service import GraphService
from app.ingestion import IngestionService
from app.models import (
    DashboardStats,
    Listing,
    ListingDetail,
    ListingStatus,
    Message,
    SearchQuery,
    SearchResult,
)
from app.store import DataStore

load_dotenv()

# ── Globals initialised at startup ───────────────────────────────────────────

DATA_DIR = os.getenv("DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "datasource"))
store: DataStore
graph: GraphService
ai_pipeline: AIExtractionPipeline
ingestion: IngestionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise services and seed data on startup."""
    global store, graph, ai_pipeline, ingestion

    store = DataStore(DATA_DIR)
    graph = GraphService(DATA_DIR)
    ai_pipeline = AIExtractionPipeline()
    ingestion = IngestionService(store, graph, ai_pipeline)

    print(f"[Microsoft Marketplace] Loaded {len(store.listings)} listings, {len(store.messages)} messages")
    print(f"[Microsoft Marketplace] AI pipeline: {'Azure OpenAI' if ai_pipeline.enabled else 'Mock (rule-based)'}")
    print(f"[Microsoft Marketplace] Graph service: {'Live' if not graph.use_mock else 'Mock (datasource files)'}")

    yield  # App is running

    # Cleanup (nothing to do for in-memory store)


app = FastAPI(
    title="Microsoft Marketplace API",
    description="Transforms Teams/DL marketplace conversations into a structured searchable portal.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "listings": len(store.listings),
        "messages": len(store.messages),
        "ai_enabled": ai_pipeline.enabled,
    }


# ── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard", response_model=DashboardStats)
async def get_dashboard():
    """Return dashboard statistics: active count, new this week, trending, recently sold."""
    return store.get_dashboard_stats()


# ── Categories ───────────────────────────────────────────────────────────────

@app.get("/api/categories")
async def get_categories():
    """Return the full category taxonomy."""
    return store.categories


@app.get("/api/categories/{category_id}/listings", response_model=list[Listing])
async def get_category_listings(category_id: str):
    """Return all listings in a category."""
    return store.get_listings_by_category(category_id)


# ── Listings ─────────────────────────────────────────────────────────────────

@app.get("/api/listings", response_model=list[Listing])
async def get_listings():
    """Return all listings."""
    return store.get_all_listings()


@app.get("/api/listings/featured", response_model=list[Listing])
async def get_featured(limit: int = Query(10, ge=1, le=50)):
    """Return top featured listings ranked by completeness, freshness, and engagement."""
    return store.get_featured(limit)


@app.get("/api/listings/{listing_id}", response_model=ListingDetail)
async def get_listing_detail(listing_id: str):
    """Return full listing detail including conversation thread."""
    detail = store.get_listing_detail(listing_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Listing not found")
    return detail


@app.patch("/api/listings/{listing_id}/status")
async def update_listing_status(listing_id: str, status: str):
    """Update a listing's status."""
    try:
        new_status = ListingStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    listing = store.update_status(listing_id, new_status)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


# ── Threads ──────────────────────────────────────────────────────────────────

@app.get("/api/threads/{thread_id}", response_model=list[Message])
async def get_thread(thread_id: str):
    """Return all messages in a conversation thread."""
    messages = store.get_thread_messages(thread_id)
    if not messages:
        raise HTTPException(status_code=404, detail="Thread not found")
    return messages


# ── Search ───────────────────────────────────────────────────────────────────

@app.get("/api/search", response_model=SearchResult)
async def search_listings(
    q: str | None = None,
    category: str | None = None,
    subcategory: str | None = None,
    location: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    status: str | None = None,
    sort_by: str = "posted_at",
    sort_order: str = "desc",
    page: int = 1,
    page_size: int = 20,
):
    """Search listings with filters."""
    query = SearchQuery(
        q=q,
        category=category,
        subcategory=subcategory,
        location=location,
        min_price=min_price,
        max_price=max_price,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )
    return store.search(query)


@app.get("/api/search/smart")
async def smart_search(q: str):
    """AI-powered natural language search.

    Converts queries like 'Swift under 6 lakh in Gachibowli' into structured filters.
    """
    # Parse the query
    if ai_pipeline.enabled:
        parsed = await ai_pipeline.parse_smart_search(q)
    else:
        parsed = ai_pipeline.mock_parse_search(q)

    # Build search query from parsed filters
    query = SearchQuery(
        q=parsed.get("q"),
        category=parsed.get("category"),
        subcategory=parsed.get("subcategory"),
        location=parsed.get("location"),
        min_price=parsed.get("min_price"),
        max_price=parsed.get("max_price"),
        status=parsed.get("status"),
    )
    result = store.search(query)
    return {
        **result.model_dump(),
        "parsed_filters": parsed,
        "original_query": q,
    }


# ── Ingestion ────────────────────────────────────────────────────────────────

@app.post("/api/ingest")
async def trigger_ingestion(group_id: str = ""):
    """Trigger message ingestion from Graph API (or mock data)."""
    summary = await ingestion.ingest_from_graph(group_id)
    return summary


# ── Graph helpers ────────────────────────────────────────────────────────────

@app.get("/api/graph/user/{email}")
async def get_user_profile(email: str):
    """Fetch user profile from Graph API (or mock)."""
    return await graph.fetch_user_profile(email)


@app.get("/api/graph/deeplink")
async def get_deep_link(message_id: str, thread_id: str, group_id: str = ""):
    """Generate a deep link back to the original Teams message."""
    link = graph.generate_teams_deep_link(message_id, thread_id, group_id)
    return {"url": link}
