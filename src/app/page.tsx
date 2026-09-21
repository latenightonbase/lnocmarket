import { CATEGORIES, fetchListings, type ListingCategory } from "@/lib/api";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { ListingCard } from "@/components/ListingCard";

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
      <MarketplaceHeader />

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
