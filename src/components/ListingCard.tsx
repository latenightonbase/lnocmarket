import { CATEGORIES, type PublicListing } from "@/lib/api";

export function timeLeft(endDate?: string | null): string | null {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
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
  const price = isAuction ? listing.topBid ?? listing.price : listing.price;

  return (
    <div
      className="relative overflow-hidden rounded-lg bg-[var(--surface)] p-4"
      style={{
        borderTop: isAuction ? "2px solid var(--live)" : "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {isAuction && (
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--live)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
          </span>
          <span className="text-[11px] font-medium text-[var(--live)]">Live · {left}</span>
        </div>
      )}

      {!hideCreator && (
        <a
          href={`/creator/${listing.creator.id}`}
          className="mb-2.5 flex items-center gap-2 hover:opacity-80"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[10px] font-medium text-[var(--text-secondary)]">
            {initials(listing.creator.displayName)}
          </div>
          <span className="text-sm text-[var(--text-secondary)]">{listing.creator.displayName}</span>
        </a>
      )}

      <a href={`/listings/${listing.id}`} className="mb-3 block font-display text-[15px] leading-snug hover:opacity-80">
        {listing.title}
      </a>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] text-[var(--text-muted)]">{isAuction ? "Current bid" : "Price"}</div>
          <div className="font-mono text-lg font-medium text-[var(--spotlight)]">
            {price.toLocaleString()} <span className="text-sm text-[var(--text-secondary)]">{listing.currency}</span>
          </div>
        </div>
        <div className="text-right text-[11px] text-[var(--text-secondary)]">
          {isAuction ? null : `${listing.slotsAvailable} slot${listing.slotsAvailable === 1 ? "" : "s"} left`}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-[var(--text-muted)]">{categoryLabel(listing.category)}</div>
    </div>
  );
}
