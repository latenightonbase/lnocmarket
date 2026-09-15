/**
 * Read-only client for the existing LNOC marketplace API (api.lnoc.app).
 *
 * This talks to the SAME backend that powers the live auction site at
 * lnoc.app — it does not touch, fork, or modify that backend in any way.
 * Everything here is GET-only. Write flows (creating a listing, bidding)
 * come later, once this is reviewed, and will need auth wired in.
 */

const API_ORIGIN = (process.env.API_ORIGIN || "https://api.lnoc.app").replace(/\/+$/, "");

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

/**
 * Fetches active listings from the live marketplace API. Server-side only
 * (called from a Server Component) so it never runs in the browser and
 * never needs CORS configured on the API.
 */
export async function fetchListings(category?: ListingCategory): Promise<PublicListing[]> {
  const params = new URLSearchParams({ status: "ACTIVE" });
  if (category) params.set("category", category);

  try {
    const res = await fetch(`${API_ORIGIN}/listings?${params.toString()}`, {
      next: { revalidate: 30 },
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
