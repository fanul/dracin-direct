# dracinhubv2

Multi-provider short drama aggregator (Next.js + Supabase + Upstash) with 41 active providers from `api-endpoints.json`.

## Current MVP Verification Status

Verified on 2026-03-11:

- `npm run test` -> PASS (`401/401`)
- `npm run lint` -> PASS (`tsc --noEmit`)
- `npm run build` -> PASS (Next.js 16 production build)
- `node scripts/verify-tier-a-providers.mjs` -> 4/8 providers verified

## Tier A Launch Status

**Launch-Eligible Providers (4/8):**
- reelshort, goodshort, flextv, cashdrama

**Blocked Providers (4/8):**
- shortmax, netshort, dramanova, dramapops

**Launch Mode:** Set `LAUNCH_MODE_ENABLED=true` to enable Tier A only mode.
