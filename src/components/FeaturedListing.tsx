"use client";

import { useEffect, useState } from "react";
import { Crown, Zap, ArrowUpRight } from "lucide-react";
import { categoryLabel, initials } from "@/components/ListingCard";
import type { PublicListing } from "@/lib/api";

function useCountdown(endDate?: string | null) {
  const [remaining, setRemaining] = useState({ h: "00", m: "00", s: "00", ended: false });

  useEffect(() => {
    if (!endDate) return;
    const tick = () => {
      const ms = new Date(endDate).getTime() - Date.now();
      if (ms <= 0) return setRemaining({ h: "00", m: "00", s: "00", ended: true });
      const totalSeconds = Math.floor(ms / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      setRemaining({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
        ended: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return remaining;
}

function CountdownDigit({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="rounded-lg bg-[var(--surface-raised)] px-3 py-2 font-mono text-2xl font-bold">
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

export function FeaturedListing({ listing }: { listing: PublicListing }) {
  const isAuction = listing.pricingType === "AUCTION";
  const countdown = useCountdown(listing.endDate);
  const price = isAuction ? listing.topBid ?? listing.price : listing.price;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-8 py-10 text-center">
      <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--violet)]/40 bg-[var(--violet-bg)] px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-[var(--violet)]">
        <Crown size={12} /> Today&apos;s attention
      </div>
      <h2 className="font-display text-3xl uppercase leading-tight sm:text-4xl">
        The spotlight is <span className="text-[var(--spotlight)]">open</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-secondary)]">
        Win the listing below and your project takes the marketplace spotlight.
      </p>

      <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-6 text-left">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {isAuction && (
              <div className="mb-2 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--live)] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--live)]" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--live)]">
                  Live now
                </span>
              </div>
            )}
            <div className="mb-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface)] text-[9px]">
                {initials(listing.creator.displayName)}
              </div>
              {listing.creator.displayName}
            </div>
            <h3 className="font-display text-xl leading-snug">{listing.title}</h3>
          </div>
          <a
            href={`/listings/${listing.id}`}
            className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            View details <ArrowUpRight size={12} />
          </a>
        </div>

        {listing.description && (
          <p className="mb-4 text-sm text-[var(--text-secondary)]">{listing.description}</p>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[var(--violet)]">
              {isAuction ? "Current bid" : "Price"}
            </div>
            <div className="mt-1 font-mono text-3xl font-bold text-[var(--spotlight)]">
              ${price.toLocaleString()}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">{listing.currency}</div>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="text-[11px] uppercase tracking-wide text-[var(--violet)]">
              {categoryLabel(listing.category)}
            </div>
            <div className="mt-1 text-sm font-medium">
              {isAuction
                ? "Open bidding"
                : `${listing.slotsAvailable} slot${listing.slotsAvailable === 1 ? "" : "s"} left`}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isAuction ? "Highest bid wins" : "First come, first served"}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {isAuction && !countdown.ended ? (
            <div className="flex gap-2">
              <CountdownDigit value={countdown.h} label="Hrs" />
              <CountdownDigit value={countdown.m} label="Min" />
              <CountdownDigit value={countdown.s} label="Sec" />
            </div>
          ) : (
            <div />
          )}
          <a
            href={`/listings/${listing.id}`}
            className="flex items-center gap-2 rounded-lg bg-[var(--spotlight)] px-6 py-3 text-sm font-semibold text-[#1a0620]"
          >
            <Zap size={16} fill="currentColor" /> {isAuction ? "Place bid" : "View & buy"}
          </a>
        </div>
      </div>
    </div>
  );
}
