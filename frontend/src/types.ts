/* Microsoft Marketplace – TypeScript interfaces matching backend Pydantic models */

export interface Price {
  amount: number | null;
  currency: string;
  unit: string | null;
  negotiable: boolean;
  original_amount: number | null;
  price_drops: number;
}

export interface Location {
  area: string | null;
  city: string;
}

export interface Contact {
  display_name: string;
  masked_email: string | null;
  teams_dm: boolean;
  posted_on_behalf_of: boolean;
}

export interface Engagement {
  replies: number;
  unique_participants: number;
  photos: number;
  has_attachments: boolean;
}

export interface Attachment {
  name: string;
  content_type: string;
  size_bytes: number;
}

export interface MessageUser {
  name: string;
  email: string;
  alias: string | null;
}

export interface MessageSource {
  type: string;
  dl: string;
  cross_posted_to: string[];
}

export interface Listing {
  listing_id: string;
  thread_id: string;
  source_message_ids: string[];
  title: string;
  intent: string | null;
  category: string;
  subcategory: string | null;
  description: string | null;
  price: Price | null;
  attributes: Record<string, unknown> | null;
  location: Location | null;
  urgency: string | null;
  status: string;
  status_evidence: string | null;
  posted_at: string | null;
  last_activity_at: string | null;
  engagement: Engagement | null;
  contact: Contact | null;
  extraction_confidence: number;
  cross_posted: boolean;
  featured_score: number;
}

export interface Message {
  id: string;
  thread_id: string;
  conversation_index: number;
  is_root: boolean;
  parent_id: string | null;
  source: MessageSource | null;
  subject: string | null;
  from_user: MessageUser | null;
  sent_datetime: string | null;
  importance: string;
  body_preview: string | null;
  body: string | null;
  has_attachments: boolean;
  attachments: Attachment[];
  reactions: Record<string, number> | null;
}

export interface Category {
  id: string;
  label: string;
  subcategories: string[];
}

export interface DashboardStats {
  total_active: number;
  new_this_week: number;
  total_sold: number;
  categories_count: Record<string, number>;
  trending: Listing[];
  recently_sold: Listing[];
}

export interface ListingDetail {
  listing: Listing;
  messages: Message[];
}

export interface SearchResult {
  results: Listing[];
  total: number;
  page: number;
  page_size: number;
  parsed_filters?: Record<string, unknown> | null;
}
