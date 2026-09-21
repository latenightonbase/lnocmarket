import { CATEGORIES, type PublicListing } from "@/lib/api";

export function timeLeft(endDate?: string | null): string | null {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

export function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function ListingCard({ listing, hideCreator = false }: { listing: PublicListing; hideCreator?: boolean }) {
  const isAuction = listing.pricingType === "AUCTION";
  const left = timeLeft(listing.endDate);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {!hideCreator && (
        <a
          href={`/creator/${listing.creator.id}`}
          className="mb-2.5 flex items-center gap-2 hover:opacity-80"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-bg)] text-xs font-medium text-[var(--accent)]">
            {initials(listing.creator.displayName)}
          </div>
          <span className="text-sm font-medium">{listing.creator.displayName}</span>
        </a>
      )}

      <div className="mb-1 text-sm font-medium leading-snug">{listing.title}</div>

      <span className="mb-2.5 inline-block rounded-full bg-[var(--accent-bg)] px-2.5 py-0.5 text-xs text-[var(--accent)]">
        {categoryLabel(listing.category)}
      </span>

      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs text-[var(--text-muted)]">
            {isAuction ? "Current bid" : "Price"}
          </div>
          <div className="text-base font-medium">
            {(isAuction ? listing.topBid ?? listing.price : listing.price).toLocaleString()}{" "}
            {listing.currency}
          </div>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          {isAuction ? left ?? "" : `${listing.slotsAvailable} slot${listing.slotsAvailable === 1 ? "" : "s"} left`}
        </div>
      </div>
    </div>
  );
}
