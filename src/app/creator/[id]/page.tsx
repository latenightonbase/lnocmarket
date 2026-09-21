import { notFound } from "next/navigation";
import { fetchCreator } from "@/lib/api";
import { ListingCard, initials } from "@/components/ListingCard";

export default async function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await fetchCreator(id);
  if (!result) notFound();

  const { creator, listings } = result;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <a href="/" className="mb-6 inline-block text-sm text-[var(--text-secondary)]">
        &larr; Back to marketplace
      </a>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-bg)] text-lg font-medium text-[var(--accent)]">
          {initials(creator.displayName)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-lg font-medium">{creator.displayName}</h1>
            {creator.verified && (
              <span className="rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                Verified
              </span>
            )}
          </div>
          {creator.username && (
            <div className="text-sm text-[var(--text-secondary)]">@{creator.username}</div>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <div className="text-lg font-medium">{creator.auctionCount}</div>
          <div className="text-xs text-[var(--text-secondary)]">listings booked</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <div className="text-lg font-medium">{creator.bookingsThisMonth}</div>
          <div className="text-xs text-[var(--text-secondary)]">this month</div>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
          <div className="text-lg font-medium">{creator.reach ?? "—"}</div>
          <div className="text-xs text-[var(--text-secondary)]">reach</div>
        </div>
      </div>

      <div className="mb-3 text-sm font-medium">Active listings</div>
      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
          Nothing listed right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} hideCreator />
          ))}
        </div>
      )}
    </main>
  );
}
