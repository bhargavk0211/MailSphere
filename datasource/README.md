# Chat2Market — POC sample dataset

A drop-in replacement for a live Microsoft Graph feed. Point your POC at these files,
build the whole pipeline and portal, and swap in Graph later without changing your schema.

**Provenance.** Modelled on real traffic patterns observed in the HydChat distribution list
(flat rentals, flatmate replacements, car sales, lease transfers, move-out sales, voucher and
ticket resale, membership transfers, carpools, recommendation threads, blood requirements,
community events, and non-listing chatter). **All names, email addresses, societies-as-contacts
and phone details are synthetic** — nothing here is real personal data, so it is safe to commit
to a repo or show on a demo screen.

## Files

| File | What it is |
|---|---|
| `sample_dataset.json` | Everything in one envelope — metadata, messages, listings |
| `messages.json` | 60 raw messages across 26 threads, Graph-message-shaped |
| `messages.ndjson` | Same messages, one JSON per line in chronological order — replay as a stream |
| `listings.json` | The **golden output**: what a perfect extraction pipeline should produce |
| `listings.csv` | Flat view for Excel or seeding a SQL table |
| `taxonomy.json` | Categories, subcategories, intents, statuses and the status-signal phrase bank |
| `categories_index.json` | Listing IDs grouped by category — backs the Categorized view |
| `featured.json` | Top 10 by `featured_score` — backs the Featured view |

## Coverage

26 threads · 60 messages · 26 listings · 12 categories · 46 participants · window 15 Jul – 6 Aug 2026

| Category | Threads |
|---|---|
| Vehicles (car, bike, lease transfer, wanted-scooter, repost) | 5 |
| Real Estate (2BHK rent, 3BHK rent, flatmate, short-stay, resale) | 5 |
| Furniture & Appliances (9-item move-out bundle, giveaway) | 2 |
| Electronics (iPhone, PS5) | 2 |
| Vouchers & Tickets (Amex Taj vouchers, movie tickets) | 2 |
| Memberships (FitPass transfer) | 1 |
| Services (driving school recos, cook available) | 2 |
| Carpool & Travel (day trip, daily commute) | 2 |
| Community Events (murder mystery) | 1 |
| Community Help (blood requirement) | 1 |
| Combined multi-intent post | 1 |
| Non-listing noise (coffee machine, workplace query) | 2 |

## The hard cases (this is what makes the demo)

Each is deliberately planted so you can show the pipeline earning its keep:

| Thread | What it exercises |
|---|---|
| `thr-002` | Lowercase, punctuation-free, abbreviation-heavy text → clean structured output |
| `thr-010` | One message, **9 sub-listings across 4 categories**, with per-item status from a later reply |
| `thr-011` | One message that must **split into 3 listings** in 2 categories — and it's cross-posted to another city DL |
| `thr-012` | Full negotiation arc: ask → counter → agreed price → `reserved` |
| `thr-013` | Seller **corrects himself** in a follow-up (disc → digital), then goes silent → `stale` |
| `thr-014` | Quantity 2, one unit claimed → `partially-sold`, plus hard expiry on the voucher |
| `thr-015` | Time-critical — must appear in "Closing soon" and auto-expire after showtime |
| `thr-019` | A **wanted** post that pulls two supply offers into the thread → `matched` |
| `thr-020` | Inventory decrement inferred from conversation (2 seats → 1) |
| `thr-022` | Urgent help — pins to top, then closes on "both units arranged" |
| `thr-024`, `thr-025` | **Negative samples** — must NOT become listings |
| `thr-026` | **Duplicate repost** of `thr-001` — collapse it, but count the repost as fresh activity |

## Shapes

**Message** — mirrors a Graph message closely enough that swapping to the real API is a mapping change, not a rewrite:

```json
{
  "id": "msg-0001",
  "thread_id": "thr-001",
  "is_root": true,
  "parent_id": null,
  "source": { "type": "dl-email", "dl": "hydchat@contoso.com", "cross_posted_to": [] },
  "subject": "Skoda Kushaq 1.5 Style MT for Sale",
  "from": { "name": "...", "email": "...", "alias": "..." },
  "sent_datetime": "2026-07-28T09:12:00+05:30",
  "importance": "normal",
  "body_preview": "...",
  "body": "...",
  "has_attachments": true,
  "attachments": [{ "name": "kushaq-front.jpg", "content_type": "image/jpeg", "size_bytes": 248312 }],
  "reactions": { "like": 3 }
}
```

**Listing** — the target schema for your store and search index:

```json
{
  "listing_id": "lst-001",
  "thread_id": "thr-001",
  "source_message_ids": ["msg-0001", "..."],
  "title": "Skoda Kushaq 1.5 Style MT (2022) — single owner",
  "intent": "sell",
  "category": "vehicles",
  "subcategory": "car",
  "price": { "amount": 1400000, "currency": "INR", "unit": "total", "negotiable": true,
             "original_amount": 1450000, "price_drops": 1 },
  "attributes": { "make": "Skoda", "year": 2022, "km_driven": 38500, "owners": 1 },
  "location": { "area": "Nallagandla", "city": "Hyderabad" },
  "status": "negotiating",
  "status_evidence": "Buyer offer at ... + seller price drop at ...",
  "posted_at": "...", "last_activity_at": "...",
  "engagement": { "replies": 4, "unique_participants": 3, "photos": 2 },
  "contact": { "display_name": "...", "masked_email": "a****@contoso.com", "teams_dm": true },
  "extraction_confidence": 0.96,
  "featured_score": 0.84
}
```

Every listing carries `status_evidence` — the actual conversational moment that justified the
status. Show that in the UI and reviewers immediately trust the inference.

## Featured ranking

`featured_score` is deliberately simple and explainable:

```
0.30 × freshness      (decays to 0 over 21 days of no activity)
0.25 × engagement     (replies + unique participants)
0.30 × completeness   (price, photos, location, ≥4 extracted attributes)
0.15 × urgency        (critical = 1.0, high = 0.6)
→ forced to 0 for sold / duplicate / expired / resolved / non-listing
```

Tune the weights in `build.py::score()`. Keeping it interpretable matters more than accuracy
for a hackathon — you can explain any card's position on stage.

## Suggested POC flow

1. Load `messages.ndjson` and replay it in timestamp order to simulate a live DL.
2. Run your classifier + extractor over each message; write results to your own store.
3. Diff against `listings.json` — that's your accuracy metric, per field, with no labelling effort.
4. Serve the three views from your store: Categorized (`categories_index.json` shape),
   Featured (`featured.json` shape), Conversation (join back via `source_message_ids`).
5. For the demo money-shot: replay the corpus up to `thr-002`'s second message, show the bike
   as live, then deliver the "Sold." reply and let the card grey itself out on screen.

## Regenerating

`threads.py` holds the corpus, `build.py` derives every artifact.

```
python build.py
```

Add a thread to `threads.py` and rerun — IDs, scores, indexes and the CSV all rebuild.
