# Microsoft Marketplace

> Transform Teams/DL marketplace conversations into a structured, searchable portal.

## Problem

Community chat groups (HydChat) act as informal marketplaces where employees post cars, apartments, furniture, electronics, services, lease transfers, giveaways, and commute requests. Listings quickly disappear in chat noise with no categorization, search, lifecycle tracking, or discoverability.

## Solution

A portal that ingests Teams/DL messages, extracts marketplace listings using AI, and presents them in a structured marketplace experience.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React + Fluent UI                      │
│  Dashboard │ Categories │ Featured │ Search │ Detail     │
├──────────────────────────────────────────────────────────┤
│                    FastAPI Backend                        │
│  REST API │ Search │ Ingestion │ Dashboard │ Graph       │
├─────────────┬────────────────┬───────────────────────────┤
│ In-Memory   │ Azure OpenAI   │ MS Graph API              │
│ Store       │ AI Pipeline    │ (Mock fallback)            │
└─────────────┴────────────────┴───────────────────────────┘
```

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Edit with your Azure OpenAI keys (optional)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # Opens http://localhost:3000
```

The Vite dev server proxies `/api/*` requests to the FastAPI backend at port 8000.

## API Endpoints

| Method | Endpoint                        | Description                               |
| ------ | ------------------------------- | ----------------------------------------- |
| GET    | `/api/health`                   | Health check                              |
| GET    | `/api/dashboard`                | Dashboard KPIs + trending + recently sold |
| GET    | `/api/categories`               | Full category taxonomy                    |
| GET    | `/api/categories/{id}/listings` | Listings in a category                    |
| GET    | `/api/listings`                 | All listings                              |
| GET    | `/api/listings/featured`        | Top featured listings                     |
| GET    | `/api/listings/{id}`            | Listing detail + conversation thread      |
| PATCH  | `/api/listings/{id}/status`     | Update listing status                     |
| GET    | `/api/search`                   | Structured search with filters            |
| GET    | `/api/search/smart`             | AI natural-language search                |
| GET    | `/api/threads/{id}`             | Conversation thread messages              |
| POST   | `/api/ingest`                   | Trigger message ingestion                 |
| GET    | `/api/graph/user/{email}`       | User profile (Graph/mock)                 |
| GET    | `/api/graph/deeplink`           | Teams deep link                           |

## Pages

1. **Dashboard** — KPIs, category breakdown, trending listings, recently sold
2. **Categories** — Browse by category with location, price, status filters
3. **Featured** — Ranked by completeness, freshness, engagement
4. **Smart Search** — Natural language queries parsed into structured filters
5. **Listing Detail** — Full listing, extracted metadata, seller profile, conversation thread, timeline

## AI Pipeline

- **Classification** — Determines if a message is a marketplace listing
- **Entity Extraction** — Extracts price, location, attributes per category
- **Lifecycle Detection** — Detects status changes from reply messages
- **Smart Search** — Converts natural language to structured filters
- Falls back to rule-based mock when Azure OpenAI keys are not configured

## Tech Stack

| Layer       | Technology                                       |
| ----------- | ------------------------------------------------ |
| Frontend    | React 18, TypeScript, Fluent UI v9, React Router |
| Backend     | Python, FastAPI, Pydantic v2                     |
| Auth        | MSAL (Microsoft Authentication Library)          |
| AI          | Azure OpenAI (GPT-4o)                            |
| Storage     | In-memory (seeded from datasource JSON)          |
| Integration | Microsoft Graph API (mock fallback)              |
| Hosting     | Azure App Service                                |

## Project Structure

```
MarketPlace/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app + routes
│   │   ├── models.py            # Pydantic data models
│   │   ├── store.py             # In-memory data store
│   │   ├── ai_pipeline.py       # Azure OpenAI extraction pipeline
│   │   ├── graph_service.py     # MS Graph API service layer
│   │   └── ingestion.py         # Message ingestion orchestrator
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # App entry point
│   │   ├── App.tsx              # Root layout + routing
│   │   ├── api.ts               # API client
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── authConfig.ts        # MSAL configuration
│   │   ├── components/
│   │   │   ├── shared.tsx       # Shared UI utilities
│   │   │   ├── ListingCard.tsx  # Listing card component
│   │   │   └── ConversationThread.tsx
│   │   └── pages/
│   │       ├── Dashboard.tsx
│   │       ├── CategoryView.tsx
│   │       ├── FeaturedPage.tsx
│   │       ├── SmartSearchPage.tsx
│   │       └── ListingDetailPage.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
├── datasource/                  # Seed data (messages, listings, taxonomy)
├── deploy/                      # Azure deployment configs
└── DEMO_SCRIPT.md               # Hackathon demo walkthrough
```
