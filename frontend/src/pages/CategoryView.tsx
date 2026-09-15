/* Rich Category View — sidebar with pill navigation, modern filters, fluid grid */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  makeStyles,
  tokens,
  Spinner,
  Body1,
  Caption1,
  Input,
  Dropdown,
  Option,
  Button,
} from "@fluentui/react-components";
import {
  FilterRegular,
  DismissRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import { api } from "../api";
import type { Category, SearchResult } from "../types";
import ListingCard from "../components/ListingCard";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CATEGORY_GRADIENTS,
} from "../components/shared";

const useStyles = makeStyles({
  layout: {
    display: "flex",
    gap: "32px",
  },
  sidebar: {
    width: "260px",
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
    marginBottom: "12px",
  },
  catList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  catItem: {
    padding: "12px 16px",
    cursor: "pointer",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.15s ease",
    fontSize: "14px",
    fontWeight: 500,
    color: "#475569",
    ":hover": {
      backgroundColor: "#f1f5f9",
      color: "#1e293b",
    },
  },
  catItemActive: {
    padding: "12px 16px",
    cursor: "pointer",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
  },
  catEmoji: {
    fontSize: "18px",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: "4px",
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "24px",
  },
  filters: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap" as const,
    marginBottom: "24px",
    padding: "18px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    alignItems: "end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  filterLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "18px",
  },
  resultCount: {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "16px",
    fontWeight: 500,
  },
  spinner: {
    display: "flex",
    justifyContent: "center",
    padding: "60px",
  },
  empty: {
    textAlign: "center" as const,
    padding: "60px 24px",
    color: "#94a3b8",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px dashed #e2e8f0",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
});

export default function CategoryView() {
  const styles = useStyles();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number | undefined> = {
      category: categoryId,
      location: location || undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      status: status || undefined,
      page_size: 50,
    };
    api
      .search(params)
      .then(setSearchResult)
      .finally(() => setLoading(false));
  }, [categoryId, location, minPrice, maxPrice, status]);

  const clearFilters = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setStatus("");
  };

  const activeLabel = categoryId
    ? (CATEGORY_LABELS[categoryId] ?? categoryId)
    : "All Listings";

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Categories</div>
        <div className={styles.catList}>
          <div
            className={!categoryId ? styles.catItemActive : styles.catItem}
            onClick={() => navigate("/categories")}
          >
            <span className={styles.catEmoji}>📋</span> All Listings
          </div>
          {categories
            .filter((c) => c.id !== "non-listing")
            .map((cat) => (
              <div
                key={cat.id}
                className={
                  categoryId === cat.id ? styles.catItemActive : styles.catItem
                }
                onClick={() => navigate(`/categories/${cat.id}`)}
              >
                <span className={styles.catEmoji}>
                  {CATEGORY_ICONS[cat.id] ?? "📦"}
                </span>
                {cat.label}
              </div>
            ))}
        </div>
      </div>

      {/* Main */}
      <div className={styles.main}>
        <div className={styles.pageTitle}>{activeLabel}</div>
        <div className={styles.pageSubtitle}>
          {categoryId
            ? `Showing all ${activeLabel.toLowerCase()} listings`
            : "Browse all marketplace listings across categories"}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Location</span>
            <Input
              placeholder="e.g. Gachibowli"
              value={location}
              onChange={(_, d) => setLocation(d.value)}
              size="medium"
              contentBefore={<SearchRegular fontSize={14} />}
              style={{ width: "160px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Min Price ₹</span>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(_, d) => setMinPrice(d.value)}
              size="medium"
              style={{ width: "110px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Max Price ₹</span>
            <Input
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={(_, d) => setMaxPrice(d.value)}
              size="medium"
              style={{ width: "110px" }}
            />
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <Dropdown
              placeholder="All"
              value={status || "All"}
              onOptionSelect={(_, d) =>
                setStatus(d.optionValue === "all" ? "" : (d.optionValue ?? ""))
              }
              size="medium"
              style={{ minWidth: "130px" }}
            >
              <Option value="all">All</Option>
              <Option value="available">Available</Option>
              <Option value="negotiating">Negotiating</Option>
              <Option value="reserved">Reserved</Option>
              <Option value="sold">Sold</Option>
            </Dropdown>
          </div>
          <Button
            icon={<DismissRegular />}
            size="medium"
            appearance="subtle"
            onClick={clearFilters}
          >
            Clear
          </Button>
        </div>

        {/* Results */}
        {loading ? (
          <div className={styles.spinner}>
            <Spinner size="large" label="Loading..." />
          </div>
        ) : searchResult && searchResult.results.length > 0 ? (
          <>
            <div className={styles.resultCount}>
              {searchResult.total} listing{searchResult.total !== 1 ? "s" : ""}{" "}
              found
            </div>
            <div className={styles.grid}>
              {searchResult.results.map((listing) => (
                <ListingCard
                  key={listing.listing_id}
                  listing={listing}
                  showCategory={!categoryId}
                />
              ))}
            </div>
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <Body1 style={{ color: "#64748b", fontWeight: 500 }}>
              No listings found matching your filters
            </Body1>
            <Caption1 style={{ display: "block", marginTop: "8px" }}>
              Try adjusting your filters or browse a different category
            </Caption1>
          </div>
        )}
      </div>
    </div>
  );
}
