/* Rich Featured page — ranked listings with medal styling and visual scores */

import { useEffect, useState } from "react";
import { makeStyles, Spinner, Body1 } from "@fluentui/react-components";
import { api } from "../api";
import type { Listing } from "../types";
import ListingCard from "../components/ListingCard";

const useStyles = makeStyles({
  hero: {
    background:
      "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fbbf24 100%)",
    borderRadius: "20px",
    padding: "36px 40px",
    marginBottom: "32px",
    position: "relative" as const,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute" as const,
    top: "-30%",
    right: "-5%",
    width: "200px",
    height: "200px",
    background:
      "radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#78350f",
    letterSpacing: "-0.5px",
    zIndex: 1,
    position: "relative" as const,
    marginBottom: "8px",
  },
  heroSubtitle: {
    fontSize: "14px",
    color: "#92400e",
    opacity: 0.8,
    zIndex: 1,
    position: "relative" as const,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "20px",
  },
  rankWrapper: {
    position: "relative" as const,
  },
  rankBadge: {
    position: "absolute" as const,
    top: "-6px",
    left: "-6px",
    zIndex: 10,
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    border: "3px solid #ffffff",
  },
  gold: {
    background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    color: "#78350f",
  },
  silver: {
    background: "linear-gradient(135deg, #d1d5db, #9ca3af)",
    color: "#1f2937",
  },
  bronze: {
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    color: "#ffffff",
  },
  regular: {
    background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)",
    color: "#475569",
    fontSize: "12px",
  },
  spinner: {
    display: "flex",
    justifyContent: "center",
    padding: "80px",
  },
});

export default function FeaturedPage() {
  const styles = useStyles();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFeatured(20)
      .then(setListings)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.spinner}>
        <Spinner size="large" label="Loading featured listings..." />
      </div>
    );
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return styles.gold;
    if (index === 1) return styles.silver;
    if (index === 2) return styles.bronze;
    return styles.regular;
  };

  const getRankLabel = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  return (
    <div>
      {/* Hero banner */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroTitle}>⭐ Featured Listings</div>
        <div className={styles.heroSubtitle}>
          Our top picks — ranked by data completeness, freshness, community
          reactions, and reply count.
          <br />
          These are the highest-quality listings in the marketplace right now.
        </div>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {listings.map((listing, index) => (
          <div key={listing.listing_id} className={styles.rankWrapper}>
            <div className={`${styles.rankBadge} ${getRankStyle(index)}`}>
              {getRankLabel(index)}
            </div>
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
