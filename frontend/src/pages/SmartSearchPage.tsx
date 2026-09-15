/* Rich Smart Search — AI-powered with visual query parsing display */

import { useState } from "react";
import {
  makeStyles,
  Spinner,
  Body1,
  Caption1,
  Input,
  Button,
} from "@fluentui/react-components";
import { SearchRegular, SparkleRegular } from "@fluentui/react-icons";
import { api } from "../api";
import type { SearchResult } from "../types";
import ListingCard from "../components/ListingCard";

const useStyles = makeStyles({
  hero: {
    background:
      "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #a5b4fc 100%)",
    borderRadius: "24px",
    padding: "40px 44px",
    marginBottom: "32px",
    position: "relative" as const,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute" as const,
    top: "-40%",
    right: "5%",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none" as const,
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#312e81",
    letterSpacing: "-0.5px",
    zIndex: 1,
    position: "relative" as const,
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  heroSubtitle: {
    fontSize: "14px",
    color: "#4338ca",
    opacity: 0.7,
    zIndex: 1,
    position: "relative" as const,
    marginBottom: "24px",
  },
  searchBox: {
    display: "flex",
    gap: "12px",
    zIndex: 1,
    position: "relative" as const,
  },
  searchInput: {
    flex: 1,
    maxWidth: "600px",
  },
  examples: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
    marginBottom: "28px",
  },
  exampleChip: {
    padding: "8px 16px",
    borderRadius: "24px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontWeight: 500,
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      color: "#6366f1",
      backgroundColor: "#eef2ff",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 8px rgba(99,102,241,0.1)",
    },
  },
  parsedCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    padding: "18px 22px",
    marginBottom: "24px",
    border: "1px solid #e0e7ff",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
  parsedLabel: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#6366f1",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  parsedPills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  parsedPill: {
    padding: "4px 12px",
    borderRadius: "8px",
    backgroundColor: "#eef2ff",
    fontSize: "12px",
    fontWeight: 600,
    color: "#4338ca",
    border: "1px solid #c7d2fe",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "20px",
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
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px dashed #e2e8f0",
  },
});

const EXAMPLE_QUERIES = [
  "Swift under 6 lakh in Gachibowli",
  "2BHK under 50k",
  "iPhone under 65k",
  "Carpool from Bachupally",
  "Free stuff",
  "PS5 gaming",
  "Flatmate wanted",
  "Washing machine",
];

export default function SmartSearchPage() {
  const styles = useStyles();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<
    (SearchResult & { parsed_filters?: Record<string, unknown> }) | null
  >(null);
  const [loading, setLoading] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setQuery(q);
    try {
      const res = await api.smartSearch(q);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <div>
      {/* Hero with search */}
      <div className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroTitle}>
          <SparkleRegular fontSize={28} /> Smart Search
        </div>
        <div className={styles.heroSubtitle}>
          Type naturally — our AI converts your query into precise marketplace
          filters
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.searchBox}>
            <Input
              placeholder='Try "2BHK under 30k near Kondapur" or "free stuff"'
              value={query}
              onChange={(_, d) => setQuery(d.value)}
              contentBefore={<SearchRegular />}
              className={styles.searchInput}
              size="large"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                border: "2px solid rgba(99,102,241,0.2)",
              }}
            />
            <Button
              appearance="primary"
              icon={<SparkleRegular />}
              size="large"
              type="submit"
              disabled={loading}
              style={{
                borderRadius: "14px",
                padding: "0 24px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Example queries */}
      <div className={styles.examples}>
        <Caption1
          style={{ marginRight: "8px", fontWeight: 600, color: "#64748b" }}
        >
          Try:
        </Caption1>
        {EXAMPLE_QUERIES.map((eq) => (
          <span
            key={eq}
            className={styles.exampleChip}
            onClick={() => doSearch(eq)}
          >
            {eq}
          </span>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.spinner}>
          <Spinner size="large" label="AI is parsing your query..." />
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <>
          {/* Parsed filters visualization */}
          {result.parsed_filters && (
            <div className={styles.parsedCard}>
              <span className={styles.parsedLabel}>AI Parsed:</span>
              <div className={styles.parsedPills}>
                {Object.entries(result.parsed_filters)
                  .filter(([, v]) => v !== null && v !== undefined)
                  .map(([k, v]) => (
                    <span key={k} className={styles.parsedPill}>
                      {k}: {JSON.stringify(v)}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className={styles.resultCount}>
            {result.total} result{result.total !== 1 ? "s" : ""} found
          </div>

          {result.results.length > 0 ? (
            <div className={styles.grid}>
              {result.results.map((listing) => (
                <ListingCard key={listing.listing_id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔍</div>
              <Body1 style={{ color: "#64748b", fontWeight: 500 }}>
                No listings match your search
              </Body1>
              <Caption1
                style={{ display: "block", marginTop: "8px", color: "#94a3b8" }}
              >
                Try different keywords or browse categories
              </Caption1>
            </div>
          )}
        </>
      )}
    </div>
  );
}
