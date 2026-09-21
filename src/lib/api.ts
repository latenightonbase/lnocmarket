/**
 * Client for the existing LNOC marketplace API (api.lnoc.app) — the SAME
 * backend that powers the live auction site at lnoc.app. This does not
 * fork or modify that backend in any way.
 *
 * fetchListings/fetchMe are plain reads. createListing writes a real row
 * via POST /listings, gated server-side to SUPERADMIN — see its docstring.
 */

import { getApiOrigin } from "@/lib/api-origin";

const API_ORIGIN = getApiOrigin();

export type UserRole = "USER" | "SUPERADMIN";

export type PublicUser = {
  id: string;
  createdAt: string;
  username?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  email?: string | null;
  wallets: Array<{ address: string; chainId: number; isPrimary: boolean; verifiedAt: string }>;
};

export function isSuperadmin(user: PublicUser | null | undefined) {
  return user?.role === "SUPERADMIN";
}

/** Client-side session check — goes through the /backend proxy so the session
 * cookie (set on api.lnoc.app) is sent along correctly. */
export async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch("/backend/auth/me", { credentials: "include", cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");
  const data = (await res.json()) as { user: PublicUser };
  return data.user;
}

export type ListingCategory =
  | "SHOUTOUT"
  | "SPONSORED_POST"
  | "VIDEO_INTEGRATION"
  | "DEDICATED_VIDEO"
  | "LIVESTREAM"
  | "PODCAST"
  | "NEWSLETTER"
  | "AMA"
  | "COLLAB"
  | "CONSULTING"
  | "OTHER";

export type PricingType = "FIXED" | "AUCTION";

export type PublicCreator = {
  id: string;
  displayName: string;
  username?: string | null;
  avatarUrl?: string | null;
  verified: boolean;
};

export type PublicListing = {
  id: string;
  title: string;
  description?: string | null;
  category: ListingCategory;
  pricingType: PricingType;
  price: number;
  currency: string;
  slotsAvailable: number;
  endDate?: string | null;
  status: string;
  creator: PublicCreator;
  topBid?: number | null;
};

export const CATEGORIES: { value: ListingCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "SHOUTOUT", label: "Shoutout" },
  { value: "SPONSORED_POST", label: "Sponsored post" },
  { value: "VIDEO_INTEGRATION", label: "Video integration" },
  { value: "DEDICATED_VIDEO", label: "Dedicated video" },
  { value: "LIVESTREAM", label: "Livestream" },
  { value: "PODCAST", label: "Podcast" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "AMA", label: "AMA" },
  { value: "COLLAB", label: "Collab" },
  { value: "CONSULTING", label: "Consulting" },
  { value: "OTHER", label: "Other" },
];

/** Same string passed to startAuction / startFixedPriceListing on-chain — the client
 * generates this id, writes it to the contract, then posts it here with the tx fields. */
export interface NewListingInput {
  id: string;
  title: string;
  description?: string;
  category: ListingCategory;
  pricingType: PricingType;
  price: number;
  currency?: string;
  endDate: string;
  placement?: string;
  platform?: "YOUTUBE" | "TWITTER" | "INSTAGRAM" | "TIKTOK";
  turnaroundDays?: number;
  slotsAvailable?: number;
  txHash: string;
  chainId: number;
  contractAddress: string;
  tokenAddress: string;
  tokenName?: string;
}

/** Persists a listing after its on-chain tx has confirmed. 403s unless the
 * signed-in wallet is SUPERADMIN or the approval-queue branch is merged (then
 * it saves as PENDING_REVIEW for everyone else instead). */
export async function createListing(input: NewListingInput): Promise<PublicListing> {
  const res = await fetch("/backend/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Failed to create listing (${res.status})`);
  }
  return data.listing as PublicListing;
}

export type PendingListing = PublicListing & { submittedAt: string };

/** Admin-only. Will fail until the approval-queue branch in house is merged —
 * these endpoints don't exist on the live API yet. */
export async function fetchPendingListings(): Promise<PendingListing[]> {
  const res = await fetch("/backend/listings/pending", { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load review queue (${res.status})`);
  const data = await res.json();
  return (data.listings ?? []) as PendingListing[];
}

export async function approveListing(id: string): Promise<PublicListing> {
  const res = await fetch(`/backend/listings/${id}/approve`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed to approve (${res.status})`);
  return data.listing as PublicListing;
}

export async function rejectListing(id: string): Promise<PublicListing> {
  const res = await fetch(`/backend/listings/${id}/reject`, { method: "POST", credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed to reject (${res.status})`);
  return data.listing as PublicListing;
}

export type CreatorDetail = {
  id: string;
  wallet?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string | null;
  verified: boolean;
  totalRevenue: number;
  auctionCount: number;
  bookingsThisMonth: number;
  reach?: string;
  engagement?: string;
};

/** Public creator profile + their live listings. Server-side only, same pattern
 * as fetchListings. Returns null on any failure so the page can show a clean
 * "not found" rather than crash. */
export async function fetchCreator(
  id: string,
): Promise<{ creator: CreatorDetail; listings: PublicListing[] } | null> {
  try {
    const res = await fetch(`${API_ORIGIN}/creators/${id}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { creator: data.creator as CreatorDetail, listings: (data.listings ?? []) as PublicListing[] };
  } catch {
    return null;
  }
}

export async function fetchListings(category?: ListingCategory): Promise<PublicListing[]> {
  const params = new URLSearchParams({ status: "ACTIVE" });
  if (category) params.set("category", category);

  try {
    const res = await fetch(`${API_ORIGIN}/listings?${params.toString()}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.listings ?? []) as PublicListing[];
  } catch {
    // API shape may differ until this is wired against the real deployment —
    // fail soft so the page still renders during early development.
    return [];
  }
}
