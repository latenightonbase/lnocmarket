import { parseAbi } from "viem";
import { robinhood } from "@/lib/chains";

export const erc20Abi = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
]);

/**
 * The real listings marketplace contract — Robinhood Chain, not Base.
 * Ported directly from house/apps/app/src/lib/contracts/auctionHouse.ts.
 * The Base "AuctionHouse" (packages/contracts) is a separate, older contract
 * that only runs the single daily auction — don't confuse the two.
 */
export const auctionHouseAbi = parseAbi([
  "struct Bidders { address bidder; uint256 bidAmount; string fid; }",
  "struct AuctionMeta { address caInUse; string tokenName; uint256 deadline; string auctionId; address auctionOwner; uint256 highestBid; address highestBidder; uint256 minBidAmount; }",

  "function startAuction(string _auctionId, address _token, string _tokenName, uint256 durationHours, uint256 _minBidAmount)",
  "function startFixedPriceListing(string _listingId, address _token, string _tokenName, uint256 durationHours, uint256 _price)",

  "function placeBid(string _auctionId, uint256 amount, string fid)",
  "function buyListing(string _listingId, string fid)",
  "function endAuction(string _auctionId)",

  "function getAuctionMeta(string _auctionId) view returns (AuctionMeta)",
  "function getBidders(string _auctionId) view returns (Bidders[])",
  "function getListingType(string _id) view returns (bool isFixedPrice, bool settled)",
  "function getActiveAuctionsByOwner(address _owner) view returns (AuctionMeta[])",

  "event AuctionStarted(string indexed auctionId, address owner, string tokenName, uint256 deadline, uint256 minBidAmount)",
  "event ListingStarted(string indexed listingId, address owner, string tokenName, uint256 deadline, uint256 price)",
]);

export const MAX_ACTIVE_LISTINGS = 3;

/** Official Robinhood Chain stable — Global Dollar. This, not USDC, is what listings settle in. */
export const USDG = {
  address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const,
  symbol: "USDG",
  decimals: 6,
};

function normalize(value: string | undefined): `0x${string}` | undefined {
  return value && /^0x[a-fA-F0-9]{40}$/.test(value) ? (value as `0x${string}`) : undefined;
}

const DEPLOYED_ROBINHOOD = "0xFfFABB522bB1Ff6F15F505a99c542f57e9378037" as const;

const ADDRESSES: Record<number, `0x${string}` | undefined> = {
  [robinhood.id]: normalize(process.env.NEXT_PUBLIC_AUCTION_HOUSE_ADDRESS_ROBINHOOD) ?? DEPLOYED_ROBINHOOD,
};

export interface PaymentToken {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
}

const TOKENS: Record<number, PaymentToken[]> = { [robinhood.id]: [USDG] };

export const LISTING_CHAIN_ID = robinhood.id;

export const CHAIN_LABELS: Record<number, string> = { [robinhood.id]: "Robinhood" };

export function auctionHouseAddress(chainId: number | undefined) {
  return chainId ? ADDRESSES[chainId] : undefined;
}

export function paymentTokens(chainId: number | undefined): PaymentToken[] {
  return (chainId && TOKENS[chainId]) || [];
}

/** The contract takes whole hours of duration, rounded up so a listing never closes early. */
export function durationHoursUntil(endDate: Date, from: Date = new Date()): number {
  const ms = endDate.getTime() - from.getTime();
  return Math.max(1, Math.ceil(ms / 3_600_000));
}
