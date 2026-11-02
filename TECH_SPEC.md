# dracinhub — Engineering Design Spec (v1)

**Scope:** Implement the PRD Final v2.0 as a production-ready system with:
- Multi-provider integration via Captain Drama API gateway (`https://captain.sapimu.au`)
- Provider catalog-driven endpoint resolution (`api-endpoints.json`)
- Canonical data model + adapter layer
- Serverless-friendly caching + rate limiting + observability

## 1) System Components

### 1.1 Frontend (Next.js / Nuxt)
- Pages:
  - Home (For You / Popular / Trending blocks) — reads from Supabase only
  - Drama detail (ISR) — reads from Supabase (drama + episodes)
  - Player route — calls BFF playback endpoint
  - Search — calls BFF search endpoint (Redis cached)

### 1.2 BFF / Serverless API (Edge/Functions)
Endpoints (internal):
- `GET /v1/home`
- `GET /v1/dramas/{id}`
- `GET /v1/dramas/{id}/episodes`
- `GET /v1/search?q=...`
- `GET /v1/playback?provider=...&drama=...&episode=...`
- `POST /v1/watch/progress`

Responsibilities:
- AuthN/AuthZ (user session)
- Entitlement check (subscription tier)
- Provider endpoint resolver
- Adapter mapping to canonical responses
- Cache orchestration (Redis + Supabase)
- Rate limiting + circuit breaking
- Observability: logs + metrics tags

### 1.3 Data Stores
- **Supabase Postgres**
  - Canonical metadata cache: providers, dramas, episodes
  - User tables: users, subscriptions, watch_history
- **Upstash Redis**
  - Search cache (TTL 24h)
  - Playback URL cache (TTL 60–120s)
  - Rate limiter state (token bucket)

## 2) Provider Catalog & Endpoint Resolution

### 2.1 Provider Catalog
Source of truth: `api-endpoints.json`
- Contains providers with: slug, vip group, status, endpoints[{
  name, method, path, pathParams, sampleUrl
}]

### 2.2 Resolver Algorithm
Input: `provider_slug`, `intent` (home/search/detail/episodes/playback/subtitle/unlock), and parameters.

1. Load provider record (cache in memory/Redis with TTL, refresh periodically).
2. Filter endpoints by intent mapping rules (see §2.3).
3. Pick “best” endpoint for intent:
   - Prefer explicit endpoint names if present
   - Else choose by path pattern priority:
     - playback: /play > /stream > /video > /episode
     - episodes: /episodes > /chapters
     - detail: /(drama|dramas|series|book)/:id
     - home: /(foryou|home|homepage|feed)
4. Validate required path params exist and are non-empty.
5. Build final URL: `https://captain.sapimu.au/{provider_slug}{path}` replacing params.
6. Apply request wrapper (timeouts, retries, backoff, error normalization).

### 2.3 Intent Mapping Rules (Regex-based)
- home: `/(foryou|home|homepage|feed)`
- search: `/search`
- detail: `/(drama|dramas|series|book)/:`
- episodes: `/(episodes|chapters)`
- playback:
  - primary: `/(play|stream|video)`
  - fallback: `/episode/:slug` if provider uses “episode detail” as playback
- subtitle: `/subtitle`
- unlock: `POST /unlock`

## 3) Provider Adapter Layer

### 3.1 Canonical Types (BFF output)
- `DramaCard` (home/search tiles)
- `DramaDetail` (detail page)
- `EpisodeItem` (episode list)
- `PlaybackResponse` (stream URL + metadata)

### 3.2 Adapter Contract
Each provider adapter implements:
- `mapHome(response) -> DramaCard[]`
- `mapSearch(response) -> DramaCard[]`
- `mapDramaDetail(response) -> DramaDetail`
- `mapEpisodes(response) -> EpisodeItem[]`
- `mapPlayback(response) -> PlaybackResponse`

Implementation notes:
- Adapters may be “thin” if provider responses are already close to canonical.
- If provider uses multiple steps (e.g., chapters then video), the adapter may orchestrate 2 calls, but **only** inside `playback` flow (not on catalog browsing).

## 4) Caching Strategy

### 4.1 Supabase as SSOT for Browsing
- Home blocks read from `dramas` table (pre-ingested).
- Detail reads `dramas` + `episodes`.
- ISR caches HTML output for detail pages; SWR triggers refresh.

### 4.2 Redis Cache (Edge)
- Search cache:
  - Key: `search:v1:{
      normalized_query_hash
  }`
  - TTL: 24h
  - Value: canonical `DramaCard[]` + pagination token (if any)
- Playback cache:
  - Key: `playback:v1:{provider}:{dramaProviderId}:{episodeKey}`
  - TTL: 60–120s (signed URLs frequently expire)
  - Value: stream url + expires_at + headers if needed

### 4.3 Cache Invalidation
- Dramas/Episodes:
  - Upsert on ingestion; `updated_at` changes
  - ISR revalidate by time (e.g., 6–24h) + on-demand revalidate for popular titles
- Search:
  - TTL-based
  - Optional manual purge in admin

## 5) Rate Limiting, Retries, Circuit Breaker

### 5.1 Rate Limiting
- Global outbound limiter: token bucket ~45 req/s (per your PRD).
- Optional per-provider limiter (to prevent one provider dominating).

### 5.2 Retries
- Idempotent GET only:
  - max 2 retries
  - exponential backoff with jitter
  - stop retry on 4xx (except 429)
- On 429:
  - honor `Retry-After` if present
  - else backoff 1–2s and retry once

### 5.3 Circuit Breaker
Per provider:
- Open if error rate > threshold in sliding window (e.g., 50 requests).
- Cooldown 1–5 minutes.
- While open: serve cached content or skip provider in feed/search merge.

## 6) Observability
Log fields:
- request_id, user_id (hashed), provider_slug, endpoint_name, path, method
- latency_ms, status_code
- cache_hit (redis/supabase)
- limiter_action (allow/delay/deny)
- error_class (timeout, rate_limited, upstream_5xx, mapping_error)

Dashboards:
- Provider health (p95 latency, error rate)
- Cache hit ratio (search/playback)
- Outbound quota usage (minute/day)

## 7) Ingestion Jobs (Cron)

### 7.1 Job Types
- Provider catalog sync: daily (or when file updated)
- Home ingestion per provider: every 1–2 hours (staggered + prioritized)
- Episodes ingestion:
  - daily for popular dramas
  - on-demand when user opens a drama detail not yet cached

### 7.2 Safety
- Skip providers with status != active
- Respect global limiter
- Persist last_synced_at per provider + per drama

## 8) Security
- Captain API bearer token stored in secret manager and only used server-side.
- Prevent SSRF: only allow host `https://captain.sapimu.au`.
- Validate provider_slug against catalog.

## 9) Contract Tests
For each provider adapter:
- Home endpoint returns non-empty list OR gracefully returns empty.
- Detail endpoint returns title + cover.
- Episode list returns ordered episode numbers/chapter ids.
- Playback returns valid URL.
- Mapping validation: required canonical fields present.
