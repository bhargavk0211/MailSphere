/* Rich listing card with glassmorphism, gradients, and engaging layout */

import { useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Body1Strong,
  Caption1,
} from "@fluentui/react-components";
import {
  LocationRegular,
  ChatRegular,
  ImageRegular,
  ArrowRightRegular,
} from "@fluentui/react-icons";
import type { Listing } from "../types";
import {
  StatusBadge,
  formatPrice,
  CATEGORY_ICONS,
  CATEGORY_GRADIENTS,
  timeAgo,
  getConfidenceColor,
} from "./shared";

const useStyles = makeStyles({
  card: {
    cursor: "pointer",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    overflow: "hidden",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)",
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px 10px",
  },
  categoryPill: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#ffffff",
    letterSpacing: "0.3px",
  },
  timeLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: 500,
  },
  cardBody: {
    padding: "0 18px 14px",
  },
  title: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1e293b",
    lineHeight: 1.4,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
    marginBottom: "10px",
  },
  priceRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  price: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1e293b",
    letterSpacing: "-0.5px",
  },
  priceFree: {
    fontSize: "22px",
    fontWeight: 800,
    background: "linear-gradient(135deg, #22c55e, #10b981)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  meta: {
    display: "flex",
    gap: "14px",
    flexWrap: "wrap" as const,
    alignItems: "center",
    fontSize: "12px",
    color: "#64748b",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 18px",
    borderTop: "1px solid #f1f5f9",
    backgroundColor: "#fafbfc",
  },
  seller: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sellerAvatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    color: "#4f46e5",
  },
  sellerName: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#475569",
  },
  confidenceChip: {
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "10px",
    color: "#ffffff",
  },
});

interface Props {
  listing: Listing;
  showCategory?: boolean;
}

export default function ListingCard({ listing, showCategory = true }: Props) {
  const styles = useStyles();
  const navigate = useNavigate();

  const priceText = formatPrice(listing);
  const isFree = priceText === "FREE";
  const gradient =
    CATEGORY_GRADIENTS[listing.category] ?? CATEGORY_GRADIENTS["multi"];
  const initials = (listing.contact?.display_name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={styles.card}
      onClick={() => navigate(`/listing/${listing.listing_id}`)}
    >
      {/* Top bar — category + time */}
      <div className={styles.cardTop}>
        {showCategory ? (
          <div className={styles.categoryPill} style={{ background: gradient }}>
            <span>{CATEGORY_ICONS[listing.category] ?? "📦"}</span>
            <span>
              {listing.subcategory?.replace(/-/g, " ") ?? listing.category}
            </span>
          </div>
        ) : (
          <div />
        )}
        <span className={styles.timeLabel}>{timeAgo(listing.posted_at)}</span>
      </div>

      {/* Body */}
      <div className={styles.cardBody}>
        <div className={styles.title}>{listing.title}</div>

        <div className={styles.priceRow}>
          <span className={isFree ? styles.priceFree : styles.price}>
            {priceText}
          </span>
          <StatusBadge status={listing.status} />
        </div>

        <div className={styles.meta}>
          {listing.location?.area && (
            <span className={styles.metaItem}>
              <LocationRegular fontSize={13} /> {listing.location.area}
            </span>
          )}
          {listing.engagement && listing.engagement.replies > 0 && (
            <span className={styles.metaItem}>
              <ChatRegular fontSize={13} /> {listing.engagement.replies}
            </span>
          )}
          {listing.engagement && listing.engagement.photos > 0 && (
            <span className={styles.metaItem}>
              <ImageRegular fontSize={13} /> {listing.engagement.photos}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.cardFooter}>
        <div className={styles.seller}>
          <div className={styles.sellerAvatar}>{initials}</div>
          <span className={styles.sellerName}>
            {listing.contact?.display_name}
          </span>
        </div>
        <div
          className={styles.confidenceChip}
          style={{
            backgroundColor: getConfidenceColor(listing.extraction_confidence),
          }}
        >
          {Math.round(listing.extraction_confidence * 100)}%
        </div>
      </div>
    </div>
  );
}
