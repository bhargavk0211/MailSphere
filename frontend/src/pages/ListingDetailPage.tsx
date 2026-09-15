/* Rich Listing Detail — full-width hero, metadata cards, conversation timeline */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  makeStyles,
  Spinner,
  Body1,
  Caption1,
  Button,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  LocationRegular,
  MoneyRegular,
  TagRegular,
  CalendarRegular,
  PersonRegular,
  ChatRegular,
  ImageRegular,
  HeartRegular,
} from "@fluentui/react-icons";
import { api } from "../api";
import type { ListingDetail } from "../types";
import ConversationThread from "../components/ConversationThread";
import {
  StatusBadge,
  formatPrice,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
  timeAgo,
  getConfidenceColor,
} from "../components/shared";

const useStyles = makeStyles({
  backBtn: {
    marginBottom: "20px",
  },
  hero: {
    position: "relative" as const,
    borderRadius: "24px",
    padding: "36px 40px",
    color: "#ffffff",
    marginBottom: "32px",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute" as const,
    top: "-50%",
    right: "-10%",
    width: "350px",
    height: "350px",
    background:
      "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  heroContent: {
    position: "relative" as const,
    zIndex: 1,
  },
  heroCategory: {
    fontSize: "12px",
    fontWeight: 600,
    opacity: 0.85,
    letterSpacing: "0.5px",
    textTransform: "uppercase" as const,
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  heroTitle: {
    fontSize: "32px",
    fontWeight: 800,
    letterSpacing: "-0.8px",
    marginBottom: "12px",
    lineHeight: 1.3,
  },
  heroMeta: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    marginTop: "16px",
  },
  heroMetaItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    opacity: 0.9,
  },
  heroPrice: {
    fontSize: "36px",
    fontWeight: 800,
    marginTop: "4px",
    letterSpacing: "-0.5px",
  },

  /* Grid layout */
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "28px",
    marginBottom: "40px",
  },
  mainCol: {},
  sideCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  /* Cards */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    marginBottom: "24px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  /* Description */
  description: {
    fontSize: "14px",
    lineHeight: 1.8,
    color: "#475569",
    whiteSpace: "pre-wrap" as const,
  },

  /* Attributes */
  attrGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
  },
  attrItem: {
    padding: "14px",
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    border: "1px solid #f1f5f9",
  },
  attrLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  attrValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1e293b",
  },

  /* Seller card */
  sellerCard: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    textAlign: "center" as const,
  },
  sellerAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: 700,
    color: "#4f46e5",
    margin: "0 auto 12px",
  },
  sellerName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: "4px",
  },
  sellerEmail: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "12px",
    wordBreak: "break-all" as const,
  },

  /* Confidence */
  confidenceBar: {
    height: "8px",
    borderRadius: "4px",
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
    marginTop: "8px",
  },
  confidenceFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.5s ease",
  },

  /* Engagement */
  engagementRow: {
    display: "flex",
    justifyContent: "space-around",
    marginTop: "12px",
  },
  engItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  engValue: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1e293b",
  },
  engLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 500,
  },

  spinner: {
    display: "flex",
    justifyContent: "center",
    padding: "80px",
  },
});

export default function ListingDetailPage() {
  const styles = useStyles();
  const { listingId: id } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getListingDetail(id)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.spinner}>
        <Spinner size="large" label="Loading listing..." />
      </div>
    );
  }

  if (!detail) {
    return <Body1>Listing not found.</Body1>;
  }

  const listing = detail.listing;
  const gradient =
    CATEGORY_GRADIENTS[listing.category] ?? CATEGORY_GRADIENTS["multi"];
  const priceText = formatPrice(listing);
  const initials = (listing.contact?.display_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const confPercent = Math.round(listing.extraction_confidence * 100);

  return (
    <div>
      {/* Back button */}
      <Button
        appearance="subtle"
        icon={<ArrowLeftRegular />}
        className={styles.backBtn}
        onClick={() => navigate(-1)}
      >
        Back
      </Button>

      {/* Hero */}
      <div className={styles.hero} style={{ background: gradient }}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContent}>
          <div className={styles.heroCategory}>
            {CATEGORY_ICONS[listing.category] ?? "📦"}{" "}
            {CATEGORY_LABELS[listing.category] ?? listing.category}{" "}
            {listing.subcategory
              ? ` / ${listing.subcategory.replace(/-/g, " ")}`
              : ""}
          </div>
          <div className={styles.heroTitle}>{listing.title}</div>
          <div className={styles.heroPrice}>{priceText}</div>
          <div className={styles.heroMeta}>
            <span className={styles.heroMetaItem}>
              <LocationRegular fontSize={16} />
              {listing.location?.area ?? "Unknown"}
              {listing.location?.city ? `, ${listing.location.city}` : ""}
            </span>
            <span className={styles.heroMetaItem}>
              <CalendarRegular fontSize={16} /> Posted{" "}
              {timeAgo(listing.posted_at)}
            </span>
            <StatusBadge status={listing.status} />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.mainCol}>
          {/* Description */}
          {listing.description && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📝 Description</div>
              <div className={styles.description}>{listing.description}</div>
            </div>
          )}

          {/* Attributes */}
          {listing.attributes && Object.keys(listing.attributes).length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📋 Details</div>
              <div className={styles.attrGrid}>
                {Object.entries(listing.attributes).map(([key, val]) => (
                  <div key={key} className={styles.attrItem}>
                    <div className={styles.attrLabel}>{key}</div>
                    <div className={styles.attrValue}>
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          {detail.messages.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                💬 Conversation ({detail.messages.length} messages)
              </div>
              <ConversationThread messages={detail.messages} />
            </div>
          )}
        </div>

        {/* Right column */}
        <div className={styles.sideCol}>
          {/* Seller */}
          <div className={styles.sellerCard}>
            <div className={styles.sellerAvatar}>{initials}</div>
            <div className={styles.sellerName}>
              {listing.contact?.display_name}
            </div>
            <div className={styles.sellerEmail}>
              {listing.contact?.masked_email}
            </div>
          </div>

          {/* Confidence */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>🎯 AI Confidence</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Caption1 style={{ fontWeight: 600, color: "#64748b" }}>
                Extraction Score
              </Caption1>
              <Caption1
                style={{
                  fontWeight: 700,
                  color: getConfidenceColor(listing.extraction_confidence),
                }}
              >
                {confPercent}%
              </Caption1>
            </div>
            <div className={styles.confidenceBar}>
              <div
                className={styles.confidenceFill}
                style={{
                  width: `${confPercent}%`,
                  backgroundColor: getConfidenceColor(
                    listing.extraction_confidence,
                  ),
                }}
              />
            </div>
          </div>

          {/* Engagement */}
          {listing.engagement && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>📊 Engagement</div>
              <div className={styles.engagementRow}>
                <div className={styles.engItem}>
                  <span className={styles.engValue}>
                    {listing.engagement.replies}
                  </span>
                  <span className={styles.engLabel}>
                    <ChatRegular fontSize={12} /> Replies
                  </span>
                </div>
                <div className={styles.engItem}>
                  <span className={styles.engValue}>
                    {listing.engagement.unique_participants}
                  </span>
                  <span className={styles.engLabel}>
                    <HeartRegular fontSize={12} /> Participants
                  </span>
                </div>
                <div className={styles.engItem}>
                  <span className={styles.engValue}>
                    {listing.engagement.photos}
                  </span>
                  <span className={styles.engLabel}>
                    <ImageRegular fontSize={12} /> Photos
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
