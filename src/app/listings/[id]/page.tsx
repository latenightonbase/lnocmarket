"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { useSession } from "@/components/SessionProvider";
import { initials, categoryLabel, timeLeft } from "@/components/ListingCard";
import {
  bookListing,
  fetchListing,
  fetchListingBidders,
  recordBid,
  type ListingBidder,
  type PublicListing,
} from "@/lib/api";
import {
  auctionHouseAbi,
  auctionHouseAddress,
  erc20Abi,
  LISTING_CHAIN_ID,
  paymentTokens,
} from "@/lib/contracts/auctionHouse";

type Step = "idle" | "switching" | "approving" | "signing" | "confirming" | "saving";

const STEP_LABEL: Record<Step, string> = {
  idle: "",
  switching: "Switch to Robinhood Chain in your wallet…",
  approving: "Approve USDG spending in your wallet…",
  signing: "Confirm the transaction in your wallet…",
  confirming: "Waiting for it to land on-chain…",
  saving: "Saving…",
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { status: authStatus } = useSession();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: LISTING_CHAIN_ID });
  const { openConnectModal } = useConnectModal();

  const [listing, setListing] = useState<PublicListing | null | undefined>(undefined);
  const [bidders, setBidders] = useState<ListingBidder[]>([]);
  const [bidAmount, setBidAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchListing(id).then(setListing);
    fetchListingBidders(id).then(setBidders).catch(() => {});
  }, [id]);

  const token = paymentTokens(LISTING_CHAIN_ID)[0];
  const contractAddress = auctionHouseAddress(LISTING_CHAIN_ID);

  if (listing === undefined) {
    return <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-[var(--text-muted)]">Loading…</main>;
  }
  if (listing === null) {
    return <main className="mx-auto max-w-2xl px-6 py-16 text-sm text-[var(--text-muted)]">Listing not found.</main>;
  }

  const isAuction = listing.pricingType === "AUCTION";
  const left = timeLeft(listing.endDate);
  const currentAsk = isAuction ? listing.topBid ?? listing.price : listing.price;
  const minNextBid = isAuction ? currentAsk + 1 : currentAsk;

  async function act() {
    setError(null);
    if (authStatus !== "authenticated" || !address) return openConnectModal?.();
    if (!token || !contractAddress) return setError("Payment token isn't configured for this chain.");

    const amountNumber = isAuction ? Number(bidAmount) : currentAsk;
    if (isAuction && (!Number.isFinite(amountNumber) || amountNumber < minNextBid)) {
      return setError(`Bid must be at least ${minNextBid.toLocaleString()} ${listing!.currency}.`);
    }

    try {
      if (chainId !== LISTING_CHAIN_ID) {
        setStep("switching");
        if (!switchChainAsync) throw new Error("Switch your wallet to Robinhood Chain and try again.");
        await switchChainAsync({ chainId: LISTING_CHAIN_ID });
      }
      if (!publicClient) throw new Error("Could not reach Robinhood Chain.");

      const amount = parseUnits(amountNumber.toFixed(token.decimals), token.decimals);

      const allowance = await publicClient.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, contractAddress],
      });

      if (allowance < amount) {
        setStep("approving");
        const approveHash = await writeContractAsync({
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [contractAddress, amount],
          account: address,
        });
        const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });
        if (approveReceipt.status === "reverted") throw new Error("The approval transaction reverted.");
      }

      setStep("signing");
      const fid = address;
      const hash = isAuction
        ? await writeContractAsync({
            address: contractAddress,
            abi: auctionHouseAbi,
            functionName: "placeBid",
            args: [listing!.id, amount, fid],
            account: address,
          })
        : await writeContractAsync({
            address: contractAddress,
            abi: auctionHouseAbi,
            functionName: "buyListing",
            args: [listing!.id, fid],
            account: address,
          });

      setStep("confirming");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") throw new Error("The transaction reverted.");

      setStep("saving");
      const updated = isAuction
        ? await recordBid(listing!.id, amountNumber, hash)
        : await bookListing(listing!.id, hash);

      setListing(updated);
      if (isAuction) fetchListingBidders(id).then(setBidders).catch(() => {});
      setBidAmount("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStep("idle");
    }
  }

  const busy = step !== "idle";
  const closed = listing.status !== "ACTIVE" || (isAuction && left === "Ended");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <a href="/" className="mb-6 inline-block text-sm text-[var(--text-secondary)]">
        &larr; Back to marketplace
      </a>

      <a href={`/creator/${listing.creator.id}`} className="mb-3 flex items-center gap-2 hover:opacity-80">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--spotlight-bg)] text-xs font-medium text-[var(--spotlight)]">
          {initials(listing.creator.displayName)}
        </div>
        <span className="text-sm font-medium">{listing.creator.displayName}</span>
      </a>

      <h1 className="mb-1 text-lg font-medium">{listing.title}</h1>
      <span className="mb-4 inline-block rounded-full bg-[var(--spotlight-bg)] px-2.5 py-0.5 text-xs text-[var(--spotlight)]">
        {categoryLabel(listing.category)}
      </span>

      {listing.description && (
        <p className="mb-6 text-sm text-[var(--text-secondary)]">{listing.description}</p>
      )}

      <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <div className="text-xs text-[var(--text-muted)]">{isAuction ? "Current bid" : "Price"}</div>
            <div className="text-2xl font-medium">
              {currentAsk.toLocaleString()} {listing.currency}
            </div>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {isAuction ? left ?? "" : `${listing.slotsAvailable} slot${listing.slotsAvailable === 1 ? "" : "s"} left`}
          </div>
        </div>

        {closed ? (
          <div className="rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm text-[var(--text-muted)]">
            This listing is no longer open.
          </div>
        ) : (
          <>
            {isAuction && (
              <input
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`${minNextBid.toLocaleString()} minimum`}
                inputMode="decimal"
                disabled={busy}
                className="mb-3 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              />
            )}
            <button
              onClick={act}
              disabled={busy}
              className="w-full rounded-lg border border-[var(--spotlight-border)] bg-[var(--spotlight-bg)] px-4 py-2.5 text-sm text-[var(--spotlight)] disabled:opacity-60"
            >
              {busy ? STEP_LABEL[step] : isAuction ? "Place bid" : "Buy now"}
            </button>
          </>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {isAuction && bidders.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-medium">Bid history</div>
          <div className="flex flex-col gap-1.5">
            {bidders.map((b) => (
              <div
                key={b.wallet}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
              >
                <span className="text-[var(--text-secondary)]">
                  {b.wallet.slice(0, 6)}…{b.wallet.slice(-4)} {b.leading && "· leading"}
                </span>
                <span className="font-medium">
                  {b.amount.toLocaleString()} {listing.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
