/* Rich Dashboard — hero stats, visual category cards, trending grid */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Spinner,
  Body1,
  Caption1,
} from "@fluentui/react-components";
import {
  ArrowTrendingRegular,
  CartRegular,
  NewRegular,
  CheckmarkCircleRegular,
  ArrowRightRegular,
} from "@fluentui/react-icons";
import { api } from "../api";
import type { DashboardStats } from "../types";
import ListingCard from "../components/ListingCard";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
} from "../components/shared";

const useStyles = makeStyles({
  /* Hero stats row */
  hero: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "40px",
  },
  statCard: {
    position: "relative" as const,
    borderRadius: "20px",
    padding: "28px 24px",
    overflow: "hidden",
    color: "#ffffff",
    cursor: "default",
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "scale(1.02)",
    },
  },
  statGlow: {
    position: "absolute" as const,
    top: "-50%",
    right: "-30%",
    width: "150px",
    height: "150px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    pointerEvents: "none" as const,
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    backdropFilter: "blur(8px)",
  },
  statValue: {
    fontSize: "40px",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "6px",
    letterSpacing: "-1px",
  },
  statLabel: {
    fontSize: "13px",
    fontWeight: 500,
    opacity: 0.85,
    letterSpacing: "0.3px",
  },

  /* Section */
  section: {
    marginBottom: "44px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  sectionLink: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#6366f1",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    ":hover": {
      color: "#4f46e5",
    },
  },

  /* Category cards */
  categoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "14px",
  },
  categoryCard: {
    position: "relative" as const,
    borderRadius: "16px",
    padding: "20px",
    cursor: "pointer",
    overflow: "hidden",
    color: "#ffffff",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: "0 12px 28px rgba(0,0,0,0.15)",
    },
  },
  catIconLarge: {
    fontSize: "32px",
    marginBottom: "12px",
    display: "block",
  },
  catCount: {
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "4px",
  },
  catLabel: {
    fontSize: "12px",
    fontWeight: 500,
    opacity: 0.85,
    letterSpacing: "0.3px",
  },
  catGlow: {
    position: "absolute" as const,
    bottom: "-20px",
    right: "-20px",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.1)",
    pointerEvents: "none" as const,
  },

  /* Listing grid */
  listingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "20px",
  },

  /* Spinner */
  spinner: {
    display: "flex",
    justifyContent: "center",
    padding: "80px",
  },
});

export default function Dashboard() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboard()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.spinner}>
        <Spinner size="large" label="Loading marketplace..." />
      </div>
    );
  }

  if (!stats) return <Body1>Failed to load dashboard.</Body1>;

  const statCards = [
    {
      label: "Active Listings",
      value: stats.total_active,
      icon: <CartRegular fontSize={22} />,
      bg: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
    },
    {
      label: "New This Week",
      value: stats.new_this_week,
      icon: <NewRegular fontSize={22} />,
      bg: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
    },
    {
      label: "Sold / Resolved",
      value: stats.total_sold,
      icon: <CheckmarkCircleRegular fontSize={22} />,
      bg: "linear-gradient(135deg, #22c55e 0%, #10b981 100%)",
    },
    {
      label: "Categories",
      value: Object.keys(stats.categories_count).length,
      icon: <ArrowTrendingRegular fontSize={22} />,
      bg: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    },
  ];

  return (
    <div>
      {/* Hero Stats */}
      <div className={styles.hero}>
        {statCards.map((s) => (
          <div
            key={s.label}
            className={styles.statCard}
            style={{ background: s.bg }}
          >
            <div className={styles.statGlow} />
            <div className={styles.statIcon}>{s.icon}</div>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>🏷️ Browse Categories</span>
          <span
            className={styles.sectionLink}
            onClick={() => navigate("/categories")}
          >
            View all <ArrowRightRegular fontSize={14} />
          </span>
        </div>
        <div className={styles.categoryGrid}>
          {Object.entries(stats.categories_count).map(([cat, count]) => (
            <div
              key={cat}
              className={styles.categoryCard}
              style={{
                background:
                  CATEGORY_GRADIENTS[cat] ?? CATEGORY_GRADIENTS["multi"],
              }}
              onClick={() => navigate(`/categories/${cat}`)}
            >
              <div className={styles.catGlow} />
              <span className={styles.catIconLarge}>
                {CATEGORY_ICONS[cat] ?? "📦"}
              </span>
              <div className={styles.catCount}>{count}</div>
              <div className={styles.catLabel}>
                {CATEGORY_LABELS[cat] ?? cat}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Listings */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>🔥 Trending Now</span>
          <span
            className={styles.sectionLink}
            onClick={() => navigate("/featured")}
          >
            See all featured <ArrowRightRegular fontSize={14} />
          </span>
        </div>
        <div className={styles.listingGrid}>
          {stats.trending.map((listing) => (
            <ListingCard key={listing.listing_id} listing={listing} />
          ))}
        </div>
      </div>

      {/* Recently Sold */}
      {stats.recently_sold.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              ✅ Recently Sold / Resolved
            </span>
          </div>
          <div className={styles.listingGrid}>
            {stats.recently_sold.map((listing) => (
              <ListingCard key={listing.listing_id} listing={listing} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
