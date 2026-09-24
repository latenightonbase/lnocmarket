"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

import { useSession } from "@/components/SessionProvider";
import { CATEGORIES, createListing, type ListingCategory, type PricingType } from "@/lib/api";
import {
  auctionHouseAbi,
  auctionHouseAddress,
  durationHoursUntil,
  LISTING_CHAIN_ID,
  paymentTokens,
} from "@/lib/contracts/auctionHouse";

type Step = "form" | "switching" | "signing" | "confirming" | "saving" | "done";

const STEP_LABEL: Record<Step, string> = {
  form: "",
  switching: "Switch to Robinhood Chain in your wallet…",
  signing: "Confirm the transaction in your wallet…",
  confirming: "Waiting for it to land on-chain…",
  saving: "Saving to the marketplace…",
  done: "Listed.",
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function NewListingPage() {
  const router = useRouter();
  const { status, user } = useSession();
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: LISTING_CHAIN_ID });
  const { openConnectModal } = useConnectModal();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ListingCategory>("SHOUTOUT");
  const [pricingType, setPricingType] = useState<PricingType>("FIXED");
  const [price, setPrice] = useState("");
  const [slotsAvailable, setSlotsAvailable] = useState("1");
  const [turnaroundDays, setTurnaroundDays] = useState("2");
  const [endDate, setEndDate] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 48 * 3_600_000)),
  );

  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);

  const token = paymentTokens(LISTING_CHAIN_ID)[0];
  const contractAddress = auctionHouseAddress(LISTING_CHAIN_ID);

  if (status === "loading") {
    return <main className="mx-auto max-w-lg px-6 py-16 text-sm text-[var(--text-muted)]">Loading…</main>;
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-2 text-lg font-medium">List something</h1>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          Connect your wallet to create a listing — it's the account you'll get paid out to.
        </p>
        <button
          onClick={() => openConnectModal?.()}
          className="rounded-lg bg-[var(--spotlight-bg)] px-4 py-2 text-sm text-[var(--spotlight)]"
        >
          Connect wallet
        </button>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(price);
    if (!title.trim() || title.trim().length < 2) return setError("Title is too short.");
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) return setError("Enter a valid price.");
    if (!token || !contractAddress) return setError("Payment token isn't configured for this chain.");
    if (!address) return openConnectModal?.();

    const listingId = crypto.randomUUID();

    try {
      if (chainId !== LISTING_CHAIN_ID) {
        setStep("switching");
        if (!switchChainAsync) throw new Error("Switch your wallet to Robinhood Chain and try again.");
        await switchChainAsync({ chainId: LISTING_CHAIN_ID });
      }

      setStep("signing");
      const amount = parseUnits(priceNumber.toFixed(token.decimals), token.decimals);
      const hours = BigInt(durationHoursUntil(new Date(endDate)));
      const args = [listingId, token.address, token.symbol, hours, amount] as const;
      const request = { address: contractAddress, abi: auctionHouseAbi, args, account: address } as const;

      const hash =
        pricingType === "AUCTION"
          ? await writeContractAsync({ ...request, functionName: "startAuction" })
          : await writeContractAsync({ ...request, functionName: "startFixedPriceListing" });

      setStep("confirming");
      if (!publicClient) throw new Error("Could not reach Robinhood Chain.");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === "reverted") throw new Error("The transaction reverted.");

      setStep("saving");
      await createListing({
        id: listingId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        pricingType,
        price: priceNumber,
        currency: token.symbol,
        endDate: new Date(endDate).toISOString(),
        turnaroundDays: pricingType === "FIXED" ? Number(turnaroundDays) || undefined : undefined,
        slotsAvailable: pricingType === "FIXED" ? Number(slotsAvailable) || 1 : undefined,
        txHash: hash,
        chainId: LISTING_CHAIN_ID,
        contractAddress,
        tokenAddress: token.address,
        tokenName: token.symbol,
      });

      setStep("done");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong writing the listing. It may already be on-chain — check before retrying.",
      );
      setStep("form");
    }
  }

  const busy = step !== "form";

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-1 font-display text-xl italic">List something</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Settles on Robinhood Chain in USDG, via the same contract as the rest of the marketplace.
      </p>

      {!user || user.role !== "SUPERADMIN" ? (
        <div className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          Listing creation is limited to the platform operator for now, while the approval
          queue is being built. Submitting will fail with a 403 until that ships — this form
          is otherwise fully wired.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Pinned post on my Twitter, 24 hours"
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            disabled={busy}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            disabled={busy}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ListingCategory)}
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
            disabled={busy}
          >
            {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Pricing type</label>
          <div className="flex gap-2">
            {(["FIXED", "AUCTION"] as PricingType[]).map((pt) => (
              <button
                type="button"
                key={pt}
                disabled={busy}
                onClick={() => setPricingType(pt)}
                className={
                  "flex-1 rounded-lg border px-3 py-2 text-sm " +
                  (pricingType === pt
                    ? "border-[var(--spotlight)] bg-[var(--spotlight-bg)] text-[var(--spotlight)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]")
                }
              >
                {pt === "FIXED" ? "Fixed price" : "Auction"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">
              Price ({token?.symbol ?? "USDG"})
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="450"
              inputMode="decimal"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              disabled={busy}
            />
          </div>
          {pricingType === "FIXED" && (
            <div className="flex-1">
              <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Slots available</label>
              <input
                value={slotsAvailable}
                onChange={(e) => setSlotsAvailable(e.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
                disabled={busy}
              />
            </div>
          )}
        </div>

        {pricingType === "FIXED" ? (
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Turnaround (days)</label>
            <input
              value={turnaroundDays}
              onChange={(e) => setTurnaroundDays(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              disabled={busy}
            />
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-xs text-[var(--text-secondary)]">Auction ends</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              disabled={busy}
            />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg border border-[var(--spotlight-border)] bg-[var(--spotlight-bg)] px-4 py-2.5 text-sm text-[var(--spotlight)] disabled:opacity-60"
        >
          {busy ? STEP_LABEL[step] : "Submit"}
        </button>
      </form>
    </main>
  );
}
