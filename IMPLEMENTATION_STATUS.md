# dracinhub API Implementation Status

## Project Structure
- Next.js 14 App Router
- TypeScript
- Supabase (Database)
- Upstash Redis (Cache & Rate Limiting)

## Completed Implementation

### Core Libraries (src/lib/)
✅ Types & Canonical DTO
✅ Captain HTTP Client (timeout, retry, 429 handling)
✅ Upstash Rate Limiter (45 req/s global + provider)
✅ Redis Cache Manager (search & playback keys)
✅ Structured Logger (observability fields)

### Provider Layer (src/lib/providers/)
✅ Provider Catalog Loader (api-endpoints.json)
✅ Capability Matrix (provider_capability_matrix.csv)
✅ Resolver (intent -> endpoint mapping)
✅ 5 Adapter Skeletons (ReelShort full, others stub)

### Database Layer (src/lib/db/)
✅ Supabase Client
✅ Dramas Queries (home, detail, episodes)
✅ Watch History Queries
✅ Subscriptions/Entitlement Queries

### BFF Endpoints (src/app/api/v1/)
✅ GET /v1/home - Browse home content (Supabase)
✅ GET /v1/dramas/{id} - Drama detail (Supabase)
✅ GET /v1/dramas/{id}/episodes - Episode list (Supabase)
✅ GET /v1/search - Cross-provider search (Redis 24h cache)
✅ GET /v1/playback - Stream URL with entitlement
✅ POST /v1/watch/progress - Save watch progress

### Services (src/lib/services/)
✅ Search Aggregation (multi-provider)
✅ Playback Resolution (entitlement + proxy)

### Jobs (src/jobs/)
✅ sync-providers.ts - Sync catalog to DB
✅ sync-home-dramas.ts - Ingest home feeds
✅ sync-episodes.ts - Ingest episode lists

## Environment Variables Required
Copy `.env.example` to `.env.local`:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- CAPTAIN_API_TOKEN

## Next Steps for Production
1. Run `npm install` to install dependencies
2. Configure environment variables
3. Run database migrations (DB_SCHEMA.sql in Supabase)
4. Execute ingestion jobs to populate initial data
5. Start Next.js dev server: `npm run dev`

## Testing Checklist
- [ ] Home endpoint returns dramas
- [ ] Drama detail endpoint returns details
- [ ] Episodes endpoint returns list
- [ ] Search endpoint caches results
- [ ] Playback endpoint checks entitlement
- [ ] Watch progress saves to DB
- [ ] Rate limiter blocks excessive requests

## API Contract
All endpoints return:
```json
{
  "data": T | null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2024-...",
    "cache": "hit|miss",
    "pagination": {...}
  },
  "error": null | { "code": "...", "message": "..." }
}
```

## Tier A Launch Readiness (2026-03-11)

### Launch Eligible Providers
Verified and launch-ready:
- **reelshort** - All intents verified (home, search, detail, episodes, playback)
- **goodshort** - All intents verified
- **flextv** - All intents verified
- **cashdrama** - All intents verified

### Blocked Providers
Requires investigation before launch:
- **shortmax** - Missing detail/episodes endpoints
- **netshort** - Missing detail endpoint, playback issues
- **dramanova** - HTTP errors on search/detail
- **dramapops** - HTTP errors across multiple endpoints

### Launch Infrastructure
- ✅ Cache-first policy for home route (limits fan-out to 8 providers)
- ✅ Request budget with cooldown for failing providers
- ✅ Playback compatibility gate (HLS/MP4 only)
- ✅ UX guardrails for unverified providers
- ✅ Free-tier ops guardrails (25s timeout, 1024MB memory)

### Environment Variables for Launch
Set `LAUNCH_MODE_ENABLED=true` to enable:
- Tier A only fan-out (8 providers max)
- Extended cache TTLs
- Strict playback gating
- Conservative sync budgets
