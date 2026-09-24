import { categoryLabel, initials, timeLeft } from "@/components/ListingCard";
import type { PublicListing } from "@/lib/api";

export function FeaturedListing({ listing }: { listing: PublicListing }) {
  const isAuction = listing.pricingType === "AUCTION";
  const left = timeLeft(listing.endDate);
  const price = isAuction ? listing.topBid ?? listing.price : listing.price;

  return (
    <a
      href={`/listings/${listing.id}`}
      className="mb-10 block rounded-xl bg-[var(--surface)] p-6 sm:p-8"
      style={{ border: "1px solid var(--border)", borderTop: "2px solid var(--spotlight)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        {isAuction && (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--live)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--live)]" />
          </span>
        )}
        <span className="font-display text-sm italic text-[var(--text-secondary)]">
          {isAuction ? "Today's featured auction" : "Today's featured listing"}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[10px]">
              {initials(listing.creator.displayName)}
            </div>
            {listing.creator.displayName}
          </div>
          <h2 className="font-display text-2xl leading-tight sm:text-3xl">{listing.title}</h2>
          {listing.description && (
            <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)]">{listing.description}</p>
          )}
          <div className="mt-4 text-xs uppercase text-[var(--text-muted)]">{categoryLabel(listing.category)}</div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs text-[var(--text-muted)]">{isAuction ? "Current bid" : "Price"}</div>
          <div className="font-mono text-4xl font-medium text-[var(--spotlight)]">
            {price.toLocaleString()}
            <span className="ml-2 text-base text-[var(--text-secondary)]">{listing.currency}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {isAuction
              ? left
                ? `Ends in ${left}`
                : ""
              : `${listing.slotsAvailable} slot${listing.slotsAvailable === 1 ? "" : "s"} left`}
          </div>
        </div>
      </div>

      <div className="mt-6 inline-block rounded-lg border border-[var(--spotlight-border)] bg-[var(--spotlight-bg)] px-4 py-2 text-sm text-[var(--spotlight)]">
        {isAuction ? "Place a bid" : "View & buy"} &rarr;
      </div>
    </a>
  );
}
