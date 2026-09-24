import { CATEGORIES, fetchListings, type ListingCategory, type PublicListing } from "@/lib/api";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { ListingCard } from "@/components/ListingCard";
import { FeaturedListing } from "@/components/FeaturedListing";

/** Picks the one listing to give the big billboard treatment to, mirroring
 * lnoc.app's own "today's featured auction" hero. Soonest-ending live
 * auction wins (most urgency); otherwise the highest-priced listing. */
function pickFeatured(listings: PublicListing[]): PublicListing | null {
  if (listings.length === 0) return null;
  const auctions = listings.filter((l) => l.pricingType === "AUCTION" && l.endDate);
  if (auctions.length > 0) {
    return [...auctions].sort(
      (a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime(),
    )[0];
  }
  return [...listings].sort((a, b) => b.price - a.price)[0];
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = (params.category as ListingCategory | undefined) ?? undefined;
  const listings = await fetchListings(category);

  // Only feature something on the unfiltered view - once someone's browsing
  // a specific category, the grid itself is the point, not a billboard.
  const featured = category ? null : pickFeatured(listings);
  const rest = featured ? listings.filter((l) => l.id !== featured.id) : listings;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <MarketplaceHeader />

      {featured && <FeaturedListing listing={featured} />}

      <div className="mb-8 flex gap-5 overflow-x-auto border-b border-[var(--border)] pb-px">
        {CATEGORIES.map((c) => {
          const active = (category ?? "ALL") === c.value;
          const href = c.value === "ALL" ? "/" : `/?category=${c.value}`;
          return (
            <a
              key={c.value}
              href={href}
              className={
                "whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors " +
                (active
                  ? "border-[var(--spotlight)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
              }
            >
              {c.label}
            </a>
          );
        })}
      </div>

      {rest.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          {featured ? "Nothing else active right now." : "No active listings yet in this category."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  );
}
