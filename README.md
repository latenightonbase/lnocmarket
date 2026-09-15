# lnocmarket

The creator marketplace build — kept in its own repo so it can't touch the
live auction site (`latenightonbase/house`) while this is in progress.

## Status

- Marketplace browse page (`/`) — scaffolded, reads listings from the
  existing live API at `api.lnoc.app`, filterable by category.
- Read-only. Nothing here writes to the production database or contracts.
- Not yet confirmed against the real `/listings` response shape — types in
  `src/lib/api.ts` are inferred from the `house` repo's Prisma schema and
  may need adjusting once tested against the live endpoint.

## Not yet built

- Create-listing flow (the form we sketched)
- Creator profile page
- Approval queue for new listings
- Wallet-signed on-chain listing/bid flow

## Local dev

```bash
npm install
npm run dev
```

Runs on port 3010. Set `API_ORIGIN` in `.env.local` to point at a local API
instance instead of production, if needed.
