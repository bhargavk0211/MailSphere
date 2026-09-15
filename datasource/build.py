import json, os, re, csv, hashlib
from datetime import datetime
from threads import THREADS

OUT = os.path.dirname(os.path.abspath(__file__))
DL = "hydchat@contoso.com"

TAXONOMY = {
    "version": "1.0",
    "dl": DL,
    "categories": [
        {"id": "vehicles", "label": "Vehicles",
         "subcategories": ["car", "motorcycle", "scooter", "car-lease-transfer", "accessories"]},
        {"id": "real-estate", "label": "Real Estate",
         "subcategories": ["flat-rent", "flat-resale", "flatmate", "temporary-accommodation", "pg-hostel"]},
        {"id": "furniture-appliances", "label": "Furniture & Appliances",
         "subcategories": ["furniture", "appliances", "move-out-bundle", "free-giveaway"]},
        {"id": "electronics", "label": "Electronics",
         "subcategories": ["mobile", "laptop", "gaming", "audio", "accessories"]},
        {"id": "vouchers-tickets", "label": "Vouchers & Tickets",
         "subcategories": ["hotel-voucher", "gift-card", "movie-tickets", "event-tickets", "travel"]},
        {"id": "memberships-subscriptions", "label": "Memberships & Subscriptions",
         "subcategories": ["fitness", "club", "streaming", "software"]},
        {"id": "services", "label": "Services & Recommendations",
         "subcategories": ["driving-school", "domestic-help", "tutor", "packers-movers", "repairs", "other"]},
        {"id": "carpool-travel", "label": "Carpool & Travel",
         "subcategories": ["daily-commute", "day-trip", "airport-drop", "outstation"]},
        {"id": "community-events", "label": "Community & Events",
         "subcategories": ["social-event", "volunteering", "sports", "wellbeing"]},
        {"id": "community-help", "label": "Community Help",
         "subcategories": ["blood-requirement", "emergency", "lost-and-found"]},
        {"id": "non-listing", "label": "Not a listing (noise)",
         "subcategories": ["facilities-feedback", "workplace-query", "announcement", "banter"]},
    ],
    "intents": ["sell", "rent-out", "transfer", "wanted", "giveaway", "service-offer",
                "recommendation-request", "urgent-help", "announce", "question", "discuss", "multi"],
    "statuses": [
        {"id": "available", "meaning": "Open and active"},
        {"id": "open", "meaning": "Open request or registration"},
        {"id": "negotiating", "meaning": "Active price negotiation in thread"},
        {"id": "reserved", "meaning": "Buyer committed, handover pending"},
        {"id": "partially-sold", "meaning": "Some units/items gone"},
        {"id": "partially-filled", "meaning": "Some capacity remaining"},
        {"id": "partially-claimed", "meaning": "Some giveaway items claimed"},
        {"id": "sold", "meaning": "Explicitly closed by poster"},
        {"id": "matched", "meaning": "Demand met by an in-thread supply offer"},
        {"id": "resolved", "meaning": "Help request closed"},
        {"id": "answered", "meaning": "Question or request answered"},
        {"id": "stale", "meaning": "No poster activity, unanswered follow-ups"},
        {"id": "expired", "meaning": "Past its event date or validity"},
        {"id": "duplicate", "meaning": "Collapsed into an earlier listing"},
        {"id": "not-a-listing", "meaning": "Classified as noise"},
    ],
    "status_signals": {
        "sold": ["sold", "gone", "no longer available", "closing this", "gets sold", "taken"],
        "reserved": ["done", "will collect", "i'll take it", "confirmed", "blocked for"],
        "negotiating": ["would you take", "last price", "can you do", "final offer"],
        "bump": ["bumping", "reposting", "still available", "up again", "got buried"],
        "resolved": ["arranged", "thank you all", "requirement met", "closing this"],
    },
}


def norm(name):
    return re.sub(r"[^a-z]", "", name.lower())


def build():
    messages, listings, participants = [], [], {}
    mid = 0
    for t_i, t in enumerate(THREADS, start=1):
        tid = t["thread_id"]
        thread_msgs = []
        for i, m in enumerate(t["messages"]):
            mid += 1
            name, email = m["from"]
            participants[email] = name
            body = m["body"]
            msg = {
                "id": f"msg-{mid:04d}",
                "thread_id": tid,
                "conversation_index": i,
                "is_root": i == 0,
                "parent_id": None if i == 0 else f"msg-{mid-1:04d}",
                "source": {"type": "dl-email", "dl": DL,
                           "cross_posted_to": t.get("cross_posted_to", [])},
                "subject": t["subject"] if i == 0 else f"Re: {t['subject']}",
                "from": {"name": name, "email": email,
                         "alias": email.split("@")[0].replace(".", "")[:8]},
                "sent_datetime": m["at"],
                "importance": m.get("importance", "normal"),
                "body_preview": body[:180].replace("\n", " "),
                "body": body,
                "has_attachments": bool(m.get("attachments")),
                "attachments": [
                    {"name": a,
                     "content_type": "application/pdf" if a.endswith(".pdf") else "image/jpeg",
                     "size_bytes": 120000 + (hash(a) % 400000)}
                    for a in m.get("attachments", [])],
                "reactions": {"like": (mid * 3) % 5},
            }
            messages.append(msg)
            thread_msgs.append(msg["id"])

        L = dict(t["listing"])
        first, last = t["messages"][0], t["messages"][-1]
        replies = len(t["messages"]) - 1
        uniq = len({m["from"][1] for m in t["messages"]})
        photos = sum(1 for m in t["messages"]
                     for a in m.get("attachments", []) if not a.endswith(".pdf"))
        poster_name, poster_email = first["from"]

        listing = {
            "listing_id": f"lst-{t_i:03d}",
            "thread_id": tid,
            "source_message_ids": thread_msgs,
            "title": L.get("title"),
            "intent": L.get("intent"),
            "category": L.get("category"),
            "subcategory": L.get("subcategory"),
            "price": L.get("price"),
            "attributes": L.get("attributes", {}),
            "location": L.get("location", {}),
            "available_from": L.get("available_from"),
            "expires_at": L.get("expires_at"),
            "urgency": L.get("urgency", "normal"),
            "status": L.get("status"),
            "status_evidence": L.get("status_evidence"),
            "posted_at": first["at"],
            "last_activity_at": last["at"],
            "engagement": {"replies": replies, "unique_participants": uniq,
                           "photos": photos, "has_attachments": photos > 0},
            "contact": {
                "display_name": poster_name,
                "masked_email": poster_email[0] + "****@" + poster_email.split("@")[1],
                "teams_dm": True,
                "posted_on_behalf_of": L.get("posted_on_behalf_of", False),
                "pii_sensitive": L.get("pii_sensitive", False),
            },
            "extraction_confidence": L.get("confidence"),
            "is_duplicate_of": L.get("is_duplicate_of"),
            "duplicate_signals": L.get("duplicate_signals"),
            "cross_posted": L.get("cross_posted", bool(t.get("cross_posted_to"))),
            "child_items": L.get("child_items"),
            "split_into": L.get("split_into"),
            "corrections_applied": L.get("corrections_applied"),
            "poc_note": L.get("note"),
        }
        listing["featured_score"] = score(listing)
        listings.append({k: v for k, v in listing.items() if v is not None})
    return messages, listings, participants


def score(l):
    """Transparent featured ranking: freshness + engagement + completeness + urgency."""
    now = datetime.fromisoformat("2026-08-06T18:00:00+05:30")
    age_days = (now - datetime.fromisoformat(l["last_activity_at"])).total_seconds() / 86400
    freshness = max(0.0, 1 - age_days / 21)
    eng = min(1.0, (l["engagement"]["replies"] * 0.15) +
              (l["engagement"]["unique_participants"] * 0.1))
    complete = sum([
        0.3 if l.get("price") else 0,
        0.25 if l["engagement"]["photos"] else 0,
        0.25 if l.get("location") else 0,
        0.2 if len(l.get("attributes") or {}) >= 4 else 0,
    ])
    urgency = {"critical": 1.0, "high": 0.6}.get(l.get("urgency"), 0.0)
    dead = l["status"] in ("sold", "duplicate", "not-a-listing", "expired", "resolved")
    raw = 0.30 * freshness + 0.25 * eng + 0.30 * complete + 0.15 * urgency
    return round(0.0 if dead else raw, 3)


def main():
    messages, listings, participants = build()
    live = [l for l in listings if l["status"] not in
            ("not-a-listing", "duplicate", "sold", "resolved", "expired")]

    dataset = {
        "dataset": "chat2market-poc-sample",
        "version": "1.0",
        "generated_for": "Chat2Market hackathon POC — use in place of a live Microsoft Graph feed",
        "source_pattern": "Modelled on real HydChat DL traffic. All names, emails and "
                          "contact details are synthetic; no real personal data is included.",
        "dl": DL,
        "window": {"from": "2026-07-15", "to": "2026-08-06"},
        "counts": {
            "threads": len(THREADS), "messages": len(messages), "listings": len(listings),
            "live_listings": len(live), "participants": len(participants),
            "categories": len({l["category"] for l in listings}),
        },
        "messages": messages,
        "listings": listings,
    }

    write("sample_dataset.json", dataset)
    write("messages.json", messages)
    write("listings.json", listings)
    write("taxonomy.json", TAXONOMY)
    write("featured.json", sorted(live, key=lambda x: -x["featured_score"])[:10])

    by_cat = {}
    for l in listings:
        by_cat.setdefault(l["category"], []).append(
            {"listing_id": l["listing_id"], "title": l["title"], "status": l["status"],
             "featured_score": l["featured_score"]})
    write("categories_index.json", by_cat)

    # Flat CSV for quick eyeballing / Excel / seeding a SQL table
    with open(os.path.join(OUT, "listings.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["listing_id", "category", "subcategory", "intent", "title", "price",
                    "unit", "location", "status", "posted_at", "replies", "photos",
                    "confidence", "featured_score"])
        for l in listings:
            p = l.get("price") or {}
            loc = l.get("location") or {}
            w.writerow([l["listing_id"], l["category"], l.get("subcategory"), l["intent"],
                        l["title"], p.get("amount", ""), p.get("unit", ""),
                        loc.get("society") or loc.get("area") or loc.get("city", ""),
                        l["status"], l["posted_at"], l["engagement"]["replies"],
                        l["engagement"]["photos"], l.get("extraction_confidence", ""),
                        l["featured_score"]])

    # NDJSON stream — mimics ingesting messages one event at a time
    with open(os.path.join(OUT, "messages.ndjson"), "w", encoding="utf-8") as f:
        for m in sorted(messages, key=lambda x: x["sent_datetime"]):
            f.write(json.dumps(m, ensure_ascii=False) + "\n")

    print(json.dumps(dataset["counts"], indent=2))
    for c, items in sorted(by_cat.items()):
        print(f"{c:28} {len(items)}")


def write(name, obj):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
