/* Microsoft Marketplace – API client for FastAPI backend */

import type {
  Category,
  DashboardStats,
  Listing,
  ListingDetail,
  Message,
  SearchResult,
} from "./types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: () => get<DashboardStats>("/dashboard"),

  // Categories
  getCategories: () => get<Category[]>("/categories"),
  getCategoryListings: (categoryId: string) =>
    get<Listing[]>(`/categories/${encodeURIComponent(categoryId)}/listings`),

  // Listings
  getListings: () => get<Listing[]>("/listings"),
  getFeatured: (limit = 10) =>
    get<Listing[]>(`/listings/featured?limit=${limit}`),
  getListingDetail: (id: string) =>
    get<ListingDetail>(`/listings/${encodeURIComponent(id)}`),
  updateStatus: (id: string, status: string) =>
    patch<Listing>(
      `/listings/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`,
      {},
    ),

  // Threads
  getThread: (threadId: string) =>
    get<Message[]>(`/threads/${encodeURIComponent(threadId)}`),

  // Search
  search: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    return get<SearchResult>(`/search?${qs.toString()}`);
  },
  smartSearch: (q: string) =>
    get<
      SearchResult & {
        parsed_filters: Record<string, unknown>;
        original_query: string;
      }
    >(`/search/smart?q=${encodeURIComponent(q)}`),

  // Ingestion
  triggerIngestion: () => post<Record<string, number>>("/ingest"),

  // Graph helpers
  getUserProfile: (email: string) =>
    get<Record<string, string>>(`/graph/user/${encodeURIComponent(email)}`),
  getDeepLink: (messageId: string, threadId: string) =>
    get<{ url: string }>(
      `/graph/deeplink?message_id=${encodeURIComponent(messageId)}&thread_id=${encodeURIComponent(threadId)}`,
    ),
};
