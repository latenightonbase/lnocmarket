"use client";

import { useEffect, useState } from "react";
import { Zap, ArrowUpRight } from "lucide-react";
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

export function FeaturedListing({ listing }: { listing: PublicListing }) {
  const isAuction = listing.pricingType === "AUCTION";
  const countdown = useCountdown(listing.endDate);
  const price = isAuction ? listing.topBid ?? listing.price : listing.price;

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {isAuction && (
          <div className="mb-1.5 flex items-center gap-1.5">
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
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[9px]">
            {initials(listing.creator.displayName)}
          </div>
          {listing.creator.displayName}
          <span className="text-[var(--text-muted)]">· {categoryLabel(listing.category)}</span>
        </div>
        <h2 className="font-display truncate text-lg">{listing.title}</h2>
      </div>

      <div className="flex flex-shrink-0 items-center gap-5">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--violet)]">
            {isAuction ? "Current bid" : "Price"}
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--spotlight)]">
            ${price.toLocaleString()}
          </div>
        </div>

        {isAuction && !countdown.ended && (
          <div className="hidden text-center font-mono text-sm text-[var(--text-secondary)] sm:block">
            {countdown.h}:{countdown.m}:{countdown.s}
            <div className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Remaining</div>
          </div>
        )}

        <a
          href={`/listings/${listing.id}`}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-[var(--spotlight)] px-5 py-2.5 text-sm font-semibold text-[#1a0620]"
        >
          <Zap size={15} fill="currentColor" /> {isAuction ? "Place bid" : "View & buy"}
        </a>
      </div>
    </div>
  );
}
