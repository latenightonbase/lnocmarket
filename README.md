# lnocmarket

The creator marketplace build — kept in its own repo so it can't touch the
live auction site (`latenightonbase/house`) while this is in progress.

## Status

- **Marketplace browse page (`/`)** — reads listings from the live API at
  `api.lnoc.app`, filterable by category.
- **Wallet auth** — real SIWE sign-in via RainbowKit/wagmi, talking to the
  same `/auth/*` endpoints and session cookie as the live site. A wallet
  already verified on lnoc.app works here too. Ported directly from
  `house/apps/app`'s auth pattern (same nonce/verify/logout flow, same
  `/backend` proxy so the cookie stays same-site).
- Read-only otherwise. Nothing here writes to the production database or
  contracts yet.
- Not yet confirmed against the real `/listings` response shape — types in
  `src/lib/api.ts` are inferred from the `house` repo's Prisma schema.

## Not yet built

- Create-listing flow (the form we sketched) — the header button is wired
  to show connect/sign-in state correctly but stays disabled until this
  exists
- Creator profile page
- Approval queue for new listings
- Wallet-signed on-chain listing/bid flow

## Known simplification vs. house

`house`'s wallet providers lazy-load on first interaction for performance.
This repo loads them immediately for simplicity during early development —
worth revisiting before this goes to production traffic.

## Local dev

```bash
npm install
npm run dev
```

Runs on port 3010. Copy `.env.example` to `.env.local` and fill in
`NEXT_PUBLIC_REOWN_PROJECT_ID` for full WalletConnect support (optional —
MetaMask/Coinbase/injected wallets work without it).
