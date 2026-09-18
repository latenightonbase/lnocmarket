"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSession } from "@/components/SessionProvider";

export function MarketplaceHeader() {
  const { status } = useSession();

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-medium">Marketplace</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Book media placements directly from creators
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled
          title={
            status === "authenticated"
              ? "Create-listing flow is next on the build list"
              : "Connect your wallet to create a listing"
          }
          className="cursor-not-allowed rounded-lg border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--text-muted)]"
        >
          + List something
        </button>
        <ConnectButton showBalance={false} chainStatus="icon" />
      </div>
    </div>
  );
}
