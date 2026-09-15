# Microsoft Marketplace – Hackathon Demo Script

## 🎯 Elevator Pitch (30 seconds)

> "Community chat groups like HydChat are treasure troves of marketplace activity — cars, apartments, electronics, services — but listings get buried in chat noise within hours. Microsoft Marketplace uses AI to automatically extract, categorize, and present these listings in a structured, searchable portal. Think of it as an AI-powered OLX that reads your Teams chat."

---

## 🎬 Demo Flow (5 minutes)

### Scene 1: The Problem (30s)

- Show a sample HydChat email thread — a Skoda Kushaq for sale buried among 50 other messages
- "How do you find this listing 3 days later? You can't."
- "How do you know if it's still available? You don't."

### Scene 2: Dashboard (45s)

- Open the Microsoft Marketplace dashboard
- **Highlight the KPIs**: "22 active listings, 15 new this week, across 9 categories"
- **Show category breakdown**: "Vehicles, Real Estate, Electronics — all auto-classified"
- **Click a trending listing** to show the engagement metrics

### Scene 3: AI Extraction (60s)

- Pick the Skoda Kushaq listing
- Show how the AI extracted:
  - Make, model, year, fuel type, km driven, owners, insurance validity
  - Price with negotiation tracking (₹14.5L → ₹14L price drop)
  - Location (Nallagandla)
  - Status (Negotiating — detected from conversation thread)
- Show the **AI confidence score** (96%)
- "All of this was extracted automatically from a casual email."

### Scene 4: Conversation Thread (30s)

- Scroll to the conversation thread on the listing detail page
- Show how questions, answers, and offers are threaded
- Show the **status timeline**: posted → interest → price negotiation → price drop
- "You can follow the entire lifecycle without reading through hundreds of emails."

### Scene 5: Smart Search (60s)

- Navigate to Smart Search
- Type: **"Swift under 6 lakh in Gachibowli"**
- Show how AI parsed it into structured filters: category=vehicles, max_price=600000, location=Gachibowli
- Try: **"2BHK under 30k near Microsoft campus"**
- AI maps "near Microsoft campus" → Kondapur
- Try: **"free stuff"** → shows giveaways

### Scene 6: Categories & Filters (45s)

- Browse the Real Estate category
- Apply filters: price range, location, status
- Show the variety: flat rentals, flatmates, PG accommodation, resale
- "Each category has domain-specific extracted attributes — BHK, furnishing, deposit for real estate; make, model, km driven for vehicles."

### Scene 7: Featured Listings (30s)

- Show the Featured page
- "Rankings based on: completeness of extracted data, freshness, reactions, reply count"
- "Helps surface the highest-quality listings."

---

## 🏗 Architecture Talking Points

1. **Zero-setup ingestion**: Reads from existing DL/Teams messages — no seller action needed
2. **AI pipeline**: Azure OpenAI for classification, entity extraction, lifecycle detection
3. **Mock fallback**: Works without Azure keys using rule-based extraction
4. **Graph integration**: Ready to connect to real Teams data via Microsoft Graph API
5. **In-memory store**: Fast for hackathon; can swap to Cosmos DB for production

---

## 🔮 Future Vision

- **Real-time ingestion** via Graph webhooks (new messages auto-appear)
- **Duplicate detection** across DL groups
- **Price trend analytics** (market rates for common items)
- **Reputation system** based on successful transactions
- **Teams bot** for listing management (mark as sold, update price)
- **Azure AI Search** for enterprise-grade full-text + vector search
- **Image analysis** (Azure Computer Vision) for auto-tagging photos
