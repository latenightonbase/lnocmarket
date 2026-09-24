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

## Bidding and buying (`/listings/[id]`)

Real listing detail page. Auction listings: enter a bid, it checks/sets
USDG allowance, calls `placeBid` on-chain, then records it via `POST
/listings/:id/bid` (also shows bid history from `GET
/listings/:id/bidders`). Fixed-price listings: "Buy now" does the same
allowance/approve dance, then `buyListing`, then `POST
/listings/:id/book`. Same approve-then-act pattern house's own listing
page uses. Every listing card now links here.

## Linked accounts (evidence layer, part 1)

Creator profile shows connected platforms. Two tiers, same code:
- **Today, live**: platform names only (YouTube, X, etc.) - what
  `GET /creators/:id` already returns
- **Once merged**: real per-platform follower counts, from a new small
  branch in house (`creator-social-breakdown`) that adds this to the same
  endpoint - purely additive, no schema change, safe to review
  independently of the approval-queue branch

Still not built: booking track record, dispute count, and delivery-proof
links from the original evidence-layer mockup - those need real
dispute-tracking and proof-upload systems that don't exist yet.

## Connect accounts (`/account`)

Real screen: shows the 4 platforms, "Connect" buttons that hit the real
OAuth start endpoints (`/backend/socials/:platform/start`), already-linked
accounts shown with their real follower counts from `GET /auth/me`.

**Blocked on an env var, not code.** The API's SIWE domain check only
trusts a hardcoded list of origins (`lnoc.app`, `www.lnoc.app`, one
specific Vercel URL) - `lnocmarket.vercel.app` isn't on it. Sign-in itself
may currently be rejected until `APP_ORIGINS` on the live API includes
this domain. This affects ALL authenticated actions here (create listing,
bid, review queue, connect accounts), not just this page - it's a
pre-existing gap this build exposed, not something new.

Also fixed: the /backend proxy was silently dropping the `Location`
header on redirects, which would have broken OAuth's redirect to
YouTube/X/etc. regardless of the origin issue above.

## Design pass

Replaced the generic dark-SaaS default (rounded cards, purple accent,
pill filters - the templated look, not a choice) with something grounded
in LNOC's actual brand:
- Background matches lnoc.app's real theme color (#050208), not an
  arbitrary dark grey
- Gold "spotlight" accent (attention is the product) instead of generic
  purple; a separate red "live" color used only for active-auction
  urgency, never reused elsewhere
- Fraunces (display serif, italic for headings) + JetBrains Mono (prices,
  bids - treated like scoreboard numbers) instead of default system fonts
- Auction listings get a visibly different treatment (live indicator,
  colored top border) from fixed-price ones, instead of identical cards
- Category filters are underlined tabs, not the generic pill-button row
- Removed tracked-out ALL-CAPS section labels (a templated-AI tell) in
  favor of the display font doing that work instead

Fonts load via a normal Google Fonts stylesheet link rather than
next/font's build-time fetch - my sandbox can't reach fonts.googleapis.com
either, so I switched to something I could actually verify compiles
without network access, rather than push something untested.

## Featured billboard (homepage)

Added the "big featured listing" treatment lnoc.app itself already uses
for its live auction - the marketplace grid had nothing like it, which is
why it read as flat even after the color/type pass. Picks the
soonest-ending live auction (falls back to highest-priced listing if none),
shown big above the grid: creator, title, description, large mono price,
countdown, one clear CTA. Only shows on the unfiltered view - once
someone's browsing a specific category the grid is the point, not a
billboard. The featured listing is excluded from the grid below it so it
doesn't appear twice.

## Full redesign to match lnoc.app exactly

Corrected course after the first design pass missed the mark - rebuilt to
match a real screenshot of lnoc.app:
- Persistent left sidebar nav (logo, tagline, nav links, wallet connect at
  bottom) instead of a plain top header - matches lnoc.app's actual layout
- Color swap: magenta primary (was gold - wrong), violet for secondary
  labels, red still reserved for live-only. Background matches lnoc.app's
  real near-black-purple more precisely
- Fonts: Space Grotesk (bold, uppercase headlines/numbers) instead of an
  italic serif - the reference uses bold geometric sans, not elegant
  serif. Permanent Marker for just the logo wordmark, matching the
  brush-style lettering in the reference
- Billboard rebuilt as the real two-tier structure from the screenshot:
  an outer "spotlight is open" banner, inner detail card with live tag,
  two stat boxes, digital-clock-style countdown digits, big CTA button
- Note: my local preview screenshots can't load Google Fonts (same
  sandbox network restriction as before) so I can't personally confirm
  the logo font renders correctly - the Next.js build itself succeeded
  cleanly, and real browsers (yours, Vercel's) have normal internet
  access, but this one detail needs your eyes to confirm
