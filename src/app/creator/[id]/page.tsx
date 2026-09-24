import { notFound } from "next/navigation";
import { fetchCreator } from "@/lib/api";
import { ListingCard, initials } from "@/components/ListingCard";

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  x: "X",
  instagram: "Instagram",
  tiktok: "TikTok",
};

function LinkedAccounts({
  platforms,
  socials,
}: {
  platforms?: string[];
  socials?: { platform: string; followers: string }[];
}) {
  // Rich version: real per-platform counts, once house's
  // creator-social-breakdown branch is merged.
  if (socials && socials.length > 0) {
    return (
      <div className="mb-8">
        <div className="mb-2 text-sm font-display italic text-[var(--text-secondary)]">
          Linked accounts
        </div>
        <div className="flex flex-wrap gap-2">
          {socials.map((s) => (
            <div
              key={s.platform}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              <span className="text-[var(--text-secondary)]">
                {PLATFORM_LABEL[s.platform] ?? s.platform}
              </span>{" "}
              <span className="font-medium">{s.followers}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: connected platform names only, no counts - what's actually
  // live on the API today, before that branch merges.
  if (platforms && platforms.length > 0) {
    return (
      <div className="mb-8">
        <div className="mb-2 text-sm font-display italic text-[var(--text-secondary)]">
          Linked accounts
        </div>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <div key={p} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {PLATFORM_LABEL[p] ?? p}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--spotlight-bg)] text-lg font-medium text-[var(--spotlight)]">
          {initials(creator.displayName)}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-display text-xl">{creator.displayName}</h1>
            {creator.verified && (
              <span className="rounded-full bg-[var(--spotlight-bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--spotlight)]">
                Verified
              </span>
            )}
          </div>
          {creator.username && (
            <div className="text-sm text-[var(--text-secondary)]">@{creator.username}</div>
          )}
        </div>
      </div>

      <LinkedAccounts platforms={creator.platforms} socials={creator.socials} />

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
