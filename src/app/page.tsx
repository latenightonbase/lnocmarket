import { CATEGORIES, fetchListings, type ListingCategory, type PublicListing } from "@/lib/api";

function timeLeft(endDate?: string | null): string | null {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  if (ms <= 0) return "Ended";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ListingCard({ listing }: { listing: PublicListing }) {
  const isAuction = listing.pricingType === "AUCTION";
  const left = timeLeft(listing.endDate);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-bg)] text-xs font-medium text-[var(--accent)]">
          {initials(listing.creator.displayName)}
        </div>
        <span className="text-sm font-medium">{listing.creator.displayName}</span>
      </div>

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

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = (params.category as ListingCategory | undefined) ?? undefined;
  const listings = await fetchListings(category);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Marketplace</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Book media placements directly from creators
          </p>
        </div>
        <button
          disabled
          title="Creator listing flow is next — not wired up yet"
          className="cursor-not-allowed rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-muted)]"
        >
          + List something
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = (category ?? "ALL") === c.value;
          const href = c.value === "ALL" ? "/" : `/?category=${c.value}`;
          return (
            <a
              key={c.value}
              href={href}
              className={
                "rounded-full px-3 py-1.5 text-sm " +
                (active
                  ? "bg-[var(--accent-bg)] text-[var(--accent)]"
                  : "border border-[var(--border)] text-[var(--text-secondary)]")
              }
            >
              {c.label}
            </a>
          );
        })}
      </div>

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          No active listings yet in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
