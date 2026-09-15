"""Microsoft Marketplace – Pydantic models for the core data domain."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ────────────────────────────────────────────────────────────────────

class ListingStatus(str, Enum):
    AVAILABLE = "available"
    OPEN = "open"
    NEGOTIATING = "negotiating"
    RESERVED = "reserved"
    PARTIALLY_SOLD = "partially-sold"
    PARTIALLY_FILLED = "partially-filled"
    PARTIALLY_CLAIMED = "partially-claimed"
    SOLD = "sold"
    MATCHED = "matched"
    RESOLVED = "resolved"
    ANSWERED = "answered"
    STALE = "stale"
    EXPIRED = "expired"
    DUPLICATE = "duplicate"
    NOT_A_LISTING = "not-a-listing"


# ── Sub-models ───────────────────────────────────────────────────────────────

class Price(BaseModel):
    amount: Optional[float] = None
    currency: str = "INR"
    unit: Optional[str] = None
    negotiable: bool = False
    original_amount: Optional[float] = None
    price_drops: int = 0


class Location(BaseModel):
    area: Optional[str] = None
    city: str = "Hyderabad"


class Contact(BaseModel):
    display_name: str
    masked_email: Optional[str] = None
    teams_dm: bool = True
    posted_on_behalf_of: bool = False


class Engagement(BaseModel):
    replies: int = 0
    unique_participants: int = 0
    photos: int = 0
    has_attachments: bool = False


class Attachment(BaseModel):
    name: str
    content_type: str
    size_bytes: int = 0


class MessageUser(BaseModel):
    name: str
    email: str
    alias: Optional[str] = None


class MessageSource(BaseModel):
    type: str = "dl-email"
    dl: str = "hydchat@contoso.com"
    cross_posted_to: list[str] = Field(default_factory=list)


# ── Core Models ──────────────────────────────────────────────────────────────

class Listing(BaseModel):
    """A marketplace listing extracted from one or more Teams/DL messages."""

    listing_id: str
    thread_id: str
    source_message_ids: list[str] = Field(default_factory=list)
    title: str
    intent: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Price] = None
    attributes: Optional[dict] = None
    location: Optional[Location] = None
    urgency: Optional[str] = None
    status: ListingStatus = ListingStatus.AVAILABLE
    status_evidence: Optional[str] = None
    posted_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    engagement: Optional[Engagement] = None
    contact: Optional[Contact] = None
    extraction_confidence: float = 0.0
    cross_posted: bool = False
    featured_score: float = 0.0


class Message(BaseModel):
    """A single Teams / DL email message."""

    id: str
    thread_id: str
    conversation_index: int = 0
    is_root: bool = True
    parent_id: Optional[str] = None
    source: Optional[MessageSource] = None
    subject: Optional[str] = None
    from_user: Optional[MessageUser] = Field(None, alias="from")
    sent_datetime: Optional[datetime] = None
    importance: str = "normal"
    body_preview: Optional[str] = None
    body: Optional[str] = None
    has_attachments: bool = False
    attachments: list[Attachment] = Field(default_factory=list)
    reactions: Optional[dict] = None

    model_config = {"populate_by_name": True}


class Category(BaseModel):
    id: str
    label: str
    subcategories: list[str] = Field(default_factory=list)


# ── API request / response models ───────────────────────────────────────────

class SearchQuery(BaseModel):
    """Natural-language or structured search request."""

    q: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    location: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    status: Optional[str] = None
    sort_by: str = "posted_at"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


class DashboardStats(BaseModel):
    total_active: int = 0
    new_this_week: int = 0
    total_sold: int = 0
    categories_count: dict[str, int] = Field(default_factory=dict)
    trending: list[Listing] = Field(default_factory=list)
    recently_sold: list[Listing] = Field(default_factory=list)


class ListingDetail(BaseModel):
    listing: Listing
    messages: list[Message] = Field(default_factory=list)


class SearchResult(BaseModel):
    results: list[Listing]
    total: int
    page: int
    page_size: int
    parsed_filters: Optional[dict] = None
