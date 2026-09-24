"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/components/SessionProvider";
import {
  approveListing,
  rejectListing,
  fetchPendingListings,
  type PendingListing,
} from "@/lib/api";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export default function ReviewQueuePage() {
  const { status, user } = useSession();
  const [listings, setListings] = useState<PendingListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || user?.role !== "SUPERADMIN") return;
    fetchPendingListings()
      .then(setListings)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load queue"));
  }, [status, user]);

  async function act(id: string, action: "approve" | "reject") {
    setActingOn(id);
    setError(null);
    try {
      await (action === "approve" ? approveListing(id) : rejectListing(id));
      setListings((prev) => prev?.filter((l) => l.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActingOn(null);
    }
  }

  if (status === "loading") {
    return <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-[var(--text-muted)]">Loading…</main>;
  }

  if (status !== "authenticated" || user?.role !== "SUPERADMIN") {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-2 font-display text-xl italic">Review queue</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Only the platform operator can review pending listings.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-xl italic">Review queue</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          {listings ? `${listings.length} listing${listings.length === 1 ? "" : "s"} waiting for your approval` : "Loading…"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {error}
          {error.includes("404") || error.includes("Failed to load") ? (
            <div className="mt-1 text-xs text-red-400/80">
              This likely means the approval-queue branch in `house` hasn't been merged yet —
              these endpoints don't exist on the live API until then.
            </div>
          ) : null}
        </div>
      )}

      {listings && listings.length === 0 && !error && (
        <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-16 text-center text-sm text-[var(--text-muted)]">
          Nothing waiting for review.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {listings?.map((listing) => (
          <div
            key={listing.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--spotlight-bg)] text-xs font-medium text-[var(--spotlight)]">
                {initials(listing.creator.displayName)}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {listing.creator.displayName}{" "}
                  <span className="font-normal text-[var(--text-secondary)]">— {listing.title}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {listing.price.toLocaleString()} {listing.currency} · submitted{" "}
                  {new Date(listing.submittedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <button
                disabled={actingOn === listing.id}
                onClick={() => act(listing.id, "approve")}
                className="rounded-lg border border-green-800/50 bg-green-950/30 px-3.5 py-1.5 text-xs text-green-300 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                disabled={actingOn === listing.id}
                onClick={() => act(listing.id, "reject")}
                className="rounded-lg px-3.5 py-1.5 text-xs text-[var(--text-secondary)] disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
