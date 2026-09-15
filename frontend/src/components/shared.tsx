/* Rich shared UI helpers — modern glassmorphism design system */

import { makeStyles, tokens, Badge } from "@fluentui/react-components";
import type { Listing } from "../types";

// ── Status badge with modern pill design ────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    color:
      | "success"
      | "warning"
      | "danger"
      | "informative"
      | "important"
      | "subtle";
    label: string;
  }
> = {
  available: { color: "success", label: "Available" },
  open: { color: "success", label: "Open" },
  negotiating: { color: "warning", label: "Negotiating" },
  reserved: { color: "important", label: "Reserved" },
  "partially-sold": { color: "warning", label: "Partial" },
  "partially-filled": { color: "warning", label: "Filling" },
  "partially-claimed": { color: "warning", label: "Claiming" },
  sold: { color: "danger", label: "Sold" },
  matched: { color: "informative", label: "Matched" },
  resolved: { color: "informative", label: "Resolved" },
  answered: { color: "informative", label: "Answered" },
  stale: { color: "subtle", label: "Stale" },
  expired: { color: "subtle", label: "Expired" },
  duplicate: { color: "subtle", label: "Duplicate" },
  "not-a-listing": { color: "subtle", label: "Not a listing" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    color: "subtle" as const,
    label: status,
  };
  return (
    <Badge color={config.color} appearance="tint" shape="rounded" size="medium">
      {config.label}
    </Badge>
  );
}

// ── Price formatting ────────────────────────────────────────────────────────

export function formatPrice(listing: Listing): string {
  if (
    !listing.price ||
    listing.price.amount === null ||
    listing.price.amount === undefined
  ) {
    return listing.price?.unit === "free" ? "FREE" : "Price on request";
  }
  const amt = listing.price.amount;
  if (amt === 0) return "FREE";
  let formatted: string;
  if (amt >= 100000) {
    formatted = `₹${(amt / 100000).toFixed(amt % 100000 === 0 ? 0 : 1)}L`;
  } else if (amt >= 1000) {
    formatted = `₹${(amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1)}k`;
  } else {
    formatted = `₹${amt.toLocaleString("en-IN")}`;
  }

  const unitLabel: Record<string, string> = {
    "per-month": "/mo",
    "per-day": "/day",
    "per-person": "/person",
    "per-item": "/each",
    "bundle-total": " bundle",
    "budget-max": " budget",
  };
  if (listing.price.unit && unitLabel[listing.price.unit]) {
    formatted += unitLabel[listing.price.unit];
  }
  if (listing.price.negotiable) {
    formatted += " ≈";
  }
  return formatted;
}

// ── Category icons & colors ─────────────────────────────────────────────────

export const CATEGORY_ICONS: Record<string, string> = {
  vehicles: "🚗",
  "real-estate": "🏠",
  "furniture-appliances": "🪑",
  electronics: "📱",
  "vouchers-tickets": "🎟️",
  "memberships-subscriptions": "💳",
  services: "🔧",
  "carpool-travel": "🚕",
  "community-events": "🎉",
  "community-help": "❤️",
  multi: "📦",
  "non-listing": "💬",
};

export const CATEGORY_LABELS: Record<string, string> = {
  vehicles: "Vehicles",
  "real-estate": "Real Estate",
  "furniture-appliances": "Furniture & Appliances",
  electronics: "Electronics",
  "vouchers-tickets": "Vouchers & Tickets",
  "memberships-subscriptions": "Memberships",
  services: "Services",
  "carpool-travel": "Carpool & Travel",
  "community-events": "Events",
  "community-help": "Community Help",
  multi: "Multi-Category",
  "non-listing": "Not a Listing",
};

export const CATEGORY_GRADIENTS: Record<string, string> = {
  vehicles: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "real-estate": "linear-gradient(135deg, #10b981, #059669)",
  "furniture-appliances": "linear-gradient(135deg, #f59e0b, #d97706)",
  electronics: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  "vouchers-tickets": "linear-gradient(135deg, #ec4899, #be185d)",
  "memberships-subscriptions": "linear-gradient(135deg, #06b6d4, #0891b2)",
  services: "linear-gradient(135deg, #64748b, #475569)",
  "carpool-travel": "linear-gradient(135deg, #22c55e, #16a34a)",
  "community-events": "linear-gradient(135deg, #f43f5e, #e11d48)",
  "community-help": "linear-gradient(135deg, #ef4444, #dc2626)",
  multi: "linear-gradient(135deg, #6366f1, #4f46e5)",
  "non-listing": "linear-gradient(135deg, #94a3b8, #64748b)",
};

// ── Date formatting ─────────────────────────────────────────────────────────

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Confidence display ──────────────────────────────────────────────────────

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return "#22c55e";
  if (confidence >= 0.8) return "#eab308";
  return "#f97316";
}
