# lnocmarket

The creator marketplace build — kept in its own repo so it can't touch the
live auction site (`latenightonbase/house`) while this is in progress.

## Status

- **Marketplace browse page (`/`)** — reads listings from the live API at
  `api.lnoc.app`, filterable by category.
- **Create-listing flow (`/listings/new`)** — real form, writes a real
  on-chain transaction against the listings contract on Robinhood Chain
  (`startAuction` or `startFixedPriceListing`, ported from house's ABI),
  waits for confirmation, then POSTs the result to `/listings`. This will
  currently fail with a 403 for any wallet that isn't SUPERADMIN — that
  gate is still live on the API. Fully wired otherwise, so testing with the
  superadmin wallet should work end to end, on-chain tx included.
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

- Creator profile page
- Approval queue for new listings (create-listing currently 403s for
  anyone who isn't SUPERADMIN — see below)
- Bidding on auction listings (contract call exists, no UI yet)

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

## Correction from earlier

The browse page and mockups referred to prices in USDC. The real listings
contract settles in **USDG** (Robinhood Chain's stablecoin) — the browse
page already displays `listing.currency` dynamically from the API so it's
unaffected, but worth knowing before sharing anything externally.

## Review queue (`/review`)

Real, clickable version of the approval-queue mockup. Only renders content
for the SUPERADMIN wallet. Will show a clear error, not a silent failure,
if the `house` approval-queue branch hasn't been merged yet — the
`/listings/pending`, `/listings/:id/approve`, `/listings/:id/reject`
endpoints it calls don't exist on the live API until then.

## Correction

I'd earlier said creator profile pages "already exist" and could be reused
from house. That was wrong — that route only exists in house's legacy
Mongo-based app (apps/web), not the newer API (apps/api) this whole repo
is built against. Built it fresh instead, against the real `GET
/creators/:id` endpoint.

## Creator profile (`/creator/[id]`)

Public, no wallet needed. Shows the creator's name, verified badge, basic
stats (listings booked, bookings this month, reach), and their currently
active listings. Linked from every listing card's creator name/avatar on
the browse page.
