"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function MarketplaceHeader() {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-medium">Marketplace</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Book media placements directly from creators
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="/listings/new"
          className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          + List something
        </a>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </div>
  );
}
