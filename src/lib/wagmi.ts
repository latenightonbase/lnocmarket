import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base, baseSepolia } from "wagmi/chains";
import { robinhood } from "@/lib/chains";

// Same chain set as `house` (Base is where AuctionHouse lives). WalletConnect/Reown
// project ID is a placeholder until a real one is set in the environment — wallets
// that don't need WalletConnect (MetaMask, Coinbase, browser extensions) still work
// without it.
export const config = getDefaultConfig({
  appName: "LNOC Marketplace",
  projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || "demo-project-id",
  chains: [base, baseSepolia, robinhood],
  ssr: true,
});
