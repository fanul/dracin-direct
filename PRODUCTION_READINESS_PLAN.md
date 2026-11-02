# Production Readiness Plan - dracinhub

**Document Version**: 1.4  
**Last Updated**: 2026-02-26  
**Status**: MVP Stabilized for 41 Active Providers

---

## Executive Summary

Platform MVP telah selesai dengan 37 file implementasi. Dokumen ini merinci langkah-langkah untuk membuat platform production-ready dengan fokus pada: deployment, testing, monitoring, security, dan scalability.

### Verification Snapshot (2026-02-26)

- [x] `npm run test` -> PASS (`288/288`)
- [x] `npm run lint` -> PASS (`tsc --noEmit`)
- [x] `npm run build` -> PASS (Next.js 16 production build)
- [x] `npm run probe:providers` -> PASS (artifact generated)
- [x] `npm run analyze:homepage` -> PASS (artifact generated)
- [x] `GET /api/v1/home/diagnostics` tersedia untuk summary operasional
- [x] Adapter compatibility entrypoints restored (`reelshort`, `goodshort`, `flextv`)
- [x] Watch-progress contract tests aligned with update-first persistence strategy
- [x] Watch-progress validation tightened (`dramaId` must be UUID or `provider:id`)
- [x] Default rate-limit env values aligned with test contract (`45/10`)

### Remaining External Actions

- [ ] Jalankan ingestion ke environment production Supabase.
- [ ] Review hasil `reports/provider-probe-latest.json` dan `reports/homepage-analysis-latest.json` dari environment yang punya akses jaringan ke Captain API.
- [ ] Konfigurasikan deployment secrets di Vercel/host target.
- [ ] Tetapkan policy aktivasi provider berdasarkan health score:
  - `healthy >= 80`
  - `degraded 50-79`
  - `unavailable < 50`

---

## Phase 1: Pre-Production Setup (Week 1)

### 1.1 Environment Configuration
- [x] **Production Environment Variables** (in-repo: centralized validation)
  - Implemented centralized env validation in `src/lib/config/env.ts`
  - Fail-fast preflight check for required secrets
  - Server-only secrets validated on server paths
  - Clear error messages for missing/invalid env vars
  ```bash
  # Supabase Production
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=eyJ...
  
  # Upstash Redis Production
  UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
  UPSTASH_REDIS_REST_TOKEN=AZ...
  
  # Captain API Production Token
  CAPTAIN_API_TOKEN=xxx...
  
  # Vercel/Deployment
  VERCEL_TOKEN=xxx...
  ```
  - [ ] **External Action**: Configure actual values in Vercel dashboard

- [x] **Database Migration Scripts** (in-repo: versioned migrations)
  - Created `migrations/001_initial_schema_constraints.sql`
  - Adds unique constraint for episode upsert conflict target
  - Adds partial indexes for watch_history NULL handling
  - Migration log table for tracking applied migrations
  - [ ] **External Action**: Run migrations on production Supabase
  - [ ] **External Action**: Verify tables: providers, dramas, episodes, users, subscriptions, watch_history

- [ ] **Secret Management**
  - Gunakan Vercel Environment Variables untuk production
  - Atau gunakan AWS Secrets Manager / HashiCorp Vault untuk enterprise
  - Jangan commit secrets ke repository

### 1.2 Initial Data Population
- [ ] **Run Ingestion Jobs**
  ```bash
  # 1. Sync providers
  npx ts-node src/jobs/sync-providers.ts
  
  # 2. Sync home dramas (untuk 5 golden providers)
  npx ts-node src/jobs/sync-home-dramas.ts
  
  # 3. Verify data
  # Check Supabase dashboard - tabel providers dan dramas harus terisi
  ```

- [ ] **Provider Priority Setup**
  - Golden Providers (5): ReelShort, GoodShort, FlexTV, CashDrama, ShortMax
  - Batch A (8): HiShort, MicroDrama, MeloShort, StardustTV, SnackShort, Velolo, FreeReels, FlickReels
  - Batch B (10): remaining VIP5-VIP7
  - Batch C (10): remaining VIP8-VIP9
  - Batch D (8): edge cases

---

## Phase 2: Testing & Quality Assurance (Week 1-2)

### 2.1 Unit Testing
```typescript
// tests/unit/captain-client.test.ts
// tests/unit/resolver.test.ts
// tests/unit/rate-limiter.test.ts
// tests/unit/adapters/reelshort.test.ts
```

- [ ] **HTTP Client Tests**
  - Timeout handling (10s default)
  - Retry logic (max 2 retries)
  - 429 rate limit handling
  - Error normalization

- [ ] **Provider Resolver Tests**
  - Intent mapping accuracy
  - Path parameter extraction
  - Endpoint selection priority

- [x] **Adapter Tests** (per provider) - Golden-5 providers implemented ✅
  - Map home response
  - Map search response
  - Map detail response
  - Map episodes response
  - Map playback response
  - Tests: `tests/adapter-contract.test.ts` (68 tests)

#### 2.1.1 Critical Path Tests (Implemented ✅)
```typescript
// tests/env-validation.test.ts (19 tests)
// tests/api-validation.test.ts (63 tests)
// tests/watch-progress-contract.test.ts (10 tests)
// tests/migration-compatibility.test.ts (35 tests)
// tests/adapter-contract.test.ts (68 tests) - NEW
// tests/e2e-happy-path.test.ts (11 tests) - NEW
```

- [x] **Environment Validation Tests** (19 tests)
  - Preflight check for missing required env vars
  - Preflight check for invalid env var formats
  - Server-only env access prevention on client
  - Optional env var defaults

- [x] **API Input Validation Tests** (63 tests)
  - Search query validation (length, whitespace)
  - Playback request validation (provider, drama, episode)
  - Watch progress validation (UUID, progress bounds 0-86400)
  - validateSearchParams and validateRequestBody helpers

- [x] **Watch-Progress Contract Tests** (10 tests)
  - UUID passthrough for episode IDs
  - Episode number resolution to UUID
  - Provider episode ID resolution
  - Slug/chapter_id resolution
  - Data transformation (camelCase to snake_case)
  - Conflict target verification (user_id, drama_id, episode_id)

- [x] **Migration Compatibility Tests** (35 tests)
  - Episode unique constraint artifact (idx_episodes_drama_no_unique)
  - Watch history partial indexes
  - Migration log table structure
  - DB schema required tables and columns

- [x] **Adapter Contract Tests** (68 tests) - NEW ✅
  - Golden-5 provider mapping validation
  - Deterministic fixtures for home/search/detail/episodes/playback
  - Tests fail if adapter returns empty placeholder arrays for valid input
  - Edge case handling (null, empty arrays)

- [x] **E2E Happy Path Tests** (11 tests) - NEW ✅
  - Home → Detail → Episodes → Playback journey
  - Watch progress contract validation
  - Provider health checks
  - Data transformation contract validation

### 2.2 Integration Testing
```typescript
// tests/integration/api/home.test.ts
// tests/integration/api/search.test.ts
// tests/integration/api/playback.test.ts
```

- [ ] **API Endpoint Tests**
  - GET /v1/home → returns DramaCard[]
  - GET /v1/dramas/{id} → returns DramaDetail
  - GET /v1/dramas/{id}/episodes → returns EpisodeItem[]
  - GET /v1/search?q=love → returns cached results
  - GET /v1/playback → checks entitlement, returns stream URL
  - POST /v1/watch/progress → saves progress

- [ ] **Database Integration**
  - Supabase connection pooling
  - Query performance (< 200ms p95)
  - RLS policies verification

- [ ] **Cache Integration**
  - Redis connection
  - TTL enforcement (search 24h, playback 90s)
  - Cache invalidation

### 2.3 E2E Testing
```typescript
// tests/e2e-happy-path.test.ts (11 tests) ✅
```

- [x] **User Journey Tests** (CI-friendly, mocked provider responses)
  1. Home page journey - retrieve and map content for Golden-5 providers
  2. Drama detail journey - map detail with all required fields
  3. Episodes list journey - map episodes with correct ordering
  4. Playback journey - map playback with stream URL and expiration
  5. Watch progress contract - validate data structure
  6. Full journey integration - home → detail → episodes → playback

- [ ] **Live E2E Tests** (requires external dependencies)
  1. Browse Home → click drama → view detail → select episode → play
  2. Search "CEO" → select result → view detail
  3. Play episode → pause → resume → verify progress saved
  4. Premium content → verify entitlement check → upgrade prompt

### 2.4 Load Testing
- [ ] **Rate Limiter Validation**
  ```bash
  # Test 45 req/s limit
  k6 run --vus 100 --duration 60s load-test.js
  ```

- [ ] **Concurrent Users**
  - 100 concurrent users browsing
  - 50 concurrent video plays
  - Monitor: response time, error rate, cache hit ratio

---

## Phase 3: Security Hardening (Week 2)

### 3.1 API Security
- [x] **CORS Configuration** (in-repo: implemented in next.config.ts)
  - Implemented in `next.config.ts` with production-safe defaults
  - Env-configurable via `CORS_ALLOWED_ORIGIN`
  - Allows GET, POST, OPTIONS methods
  - [ ] **External Action**: Set `CORS_ALLOWED_ORIGIN` in production to your domain

- [x] **Input Validation** (in-repo: Zod schemas implemented)
  - Implemented Zod schemas in `src/lib/validation/schemas.ts`
  - Search query validation with length limits
  - UUID format validation for drama IDs
  - Provider/episode path parameter validation
  - Watch progress request body validation
  - Proper 4xx responses for invalid input
  - [ ] **External Action**: Review and extend validation schemas as needed

- [x] **Token Security**
  - Captain API token: server-side only ✅
  - Supabase service role: server-side only ✅
  - Redis token: server-side only ✅
  - Enforced via `getServerEnv()` which throws on client-side access

### 3.2 Playback Security
- [x] **Stream URL Protection**
  - Proxy all playback through /v1/playback ✅
  - Short-lived URLs (60-120s expiration) ✅
  - No direct provider URLs to client ✅

- [ ] **Entforcement Verification**
  - Test: Free user accessing premium → 403 Forbidden
  - Test: Expired subscription → 403 Forbidden
  - Test: Valid subscription → 200 OK with stream URL

### 3.3 Rate Limiting & DDoS Protection
- [x] **Upstash Rate Limiter** ✅ Implemented
  - Global: 45 req/s
  - Per-provider: configurable
  - IP-based (future): add IP tracking

- [ ] **Vercel Edge Protection**
  - Enable Vercel DDoS protection
  - Configure rate limits at edge

---

## Phase 4: Monitoring & Observability (Week 2)

### 4.1 Logging Infrastructure
- [x] **Structured Logging** ✅ Implemented
  ```json
  {
    "level": "INFO",
    "timestamp": "2026-02-24T10:00:00Z",
    "message": "playback_completed",
    "requestId": "uuid",
    "provider": "reelshort",
    "latencyMs": 145,
    "statusCode": 200
  }
  ```

- [ ] **Log Aggregation**
  - Vercel Log Drains → Datadog/Logz.io
  - Or: Custom logging to Supabase

### 4.2 Metrics Dashboard
- [x] **Key Metrics** (in-repo: baseline documented)
  - Defined in `MONITORING_BASELINE.md`
  - Metric targets and alert thresholds documented
  - Logging schema reference included
  | Metric | Target | Alert Threshold |
  |--------|--------|-----------------|
  | P95 Latency (Home) | < 200ms | > 500ms |
  | P95 Latency (Search) | < 800ms | > 1500ms |
  | Playback Success Rate | > 97% | < 95% |
  | Cache Hit Ratio | > 75% | < 60% |
  | Error Rate | < 1% | > 5% |
  | Outbound Rate Limit | < 45 req/s | > 50 req/s |
  - [ ] **External Action**: Configure metrics dashboard in Vercel/Datadog

- [ ] **Provider Health Dashboard**
  - Error rate per provider
  - P95 latency per provider
  - Availability status
  - Last successful sync
  - [ ] **External Action**: Set up provider health monitoring

### 4.3 Alerting
- [x] **Critical Alerts** (in-repo: thresholds documented)
  - Defined in `MONITORING_BASELINE.md`
  - Provider down > 5 minutes
  - Playback success rate < 90%
  - Database connection errors
  - Redis connection errors
  - Rate limit exceeded > 10%
  - [ ] **External Action**: Configure alerting in monitoring platform

- [x] **Warning Alerts** (in-repo: thresholds documented)
  - Defined in `MONITORING_BASELINE.md`
  - P95 latency > target
  - Cache hit ratio dropping
  - Provider error rate > 5%
  - [ ] **External Action**: Configure alerting in monitoring platform

---

## Phase 5: Deployment Strategy (Week 3)

### 5.1 Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Or with GitHub integration (recommended)
# Connect repository di Vercel dashboard
# Auto-deploy on push to main
```

- [ ] **Environment Setup**
  - Add all environment variables di Vercel dashboard
  - Verify build settings
  - Configure custom domain (opsional)

### 5.2 Database Migration
```sql
-- Run in production Supabase
-- 1. Create tables
\i DB_SCHEMA.sql

-- 2. Set up RLS policies
-- (already in schema)

-- 3. Create indexes
CREATE INDEX idx_dramas_popularity ON dramas(popularity_score DESC);
CREATE INDEX idx_episodes_drama ON episodes(drama_id, episode_no);
```

### 5.3 Cron Jobs Setup
- [x] **Vercel Cron** (in-repo: vercel.json created)
  - Created `vercel.json` with cron definitions
  - `/api/cron/sync-providers` - every 6 hours
  - `/api/cron/sync-dramas` - every 2 hours
  - Cron endpoints verify `CRON_SECRET` for security
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/sync-providers",
        "schedule": "0 */6 * * *"
      },
      {
        "path": "/api/cron/sync-dramas",
        "schedule": "0 */2 * * *"
      }
    ]
  }
  ```
  - [ ] **External Action**: Set `CRON_SECRET` in Vercel environment variables
  - [ ] **External Action**: Verify cron jobs are running in Vercel dashboard

- [ ] **Alternative: GitHub Actions**
  ```yaml
  # .github/workflows/sync.yml
  on:
    schedule:
      - cron: '0 */2 * * *'
  ```

---

## Phase 6: Performance Optimization (Week 3)

### 6.1 Frontend Optimization
- [ ] **Image Optimization**
  - Use Next.js Image component
  - Implement lazy loading
  - Use WebP format

- [ ] **Code Splitting**
  - Dynamic imports for player
  - Route-based code splitting

- [ ] **Caching**
  - ISR for static pages
  - SWR for data fetching
  - Service Worker for offline support

### 6.2 Backend Optimization
- [ ] **Database**
  - Connection pooling (Supabase default: 10)
  - Query optimization
  - Add missing indexes

- [ ] **Redis**
  - Cache warming for popular content
  - Cache invalidation strategy

- [ ] **API Response Compression**
  - Enable gzip/brotli
  - Minimize JSON payload

---

## Phase 7: Scaling Preparation (Week 4)

### 7.1 Horizontal Scaling
- [x] **Stateless Architecture** ✅
  - No server-side state
  - All state in Supabase/Redis

- [ ] **Edge Deployment**
  - Vercel Edge Functions for API
  - Global CDN for assets

### 7.2 Database Scaling
- [ ] **Read Replicas** (Supabase Pro)
  - Scale read queries
  - Distribute load

- [ ] **Connection Pooling** (PgBouncer)
  - Handle 1000+ concurrent connections

### 7.3 Provider Scaling
- [ ] **Batch Onboarding**
  - Week 1: Golden 5 ✅ (Adapters implemented with real mapping logic)
  - Week 2: Batch A (8 providers)
  - Week 3: Batch B (10 providers)
  - Week 4: Batch C+D (18 providers)

---

## Phase 8: Post-Launch (Ongoing)

### 8.1 Monitoring & Maintenance
- [ ] **Daily Checks**
  - Error logs review
  - Provider health check
  - Cache hit ratio
  - Outbound quota usage

- [ ] **Weekly Tasks**
  - Performance review
  - Provider sync verification
  - Security audit

### 8.2 Feature Iteration
- [ ] **Q2 Roadmap**
  - Continue Watching UI
  - Watch History full implementation
  - Subscription management
  - Admin dashboard

- [ ] **Q3 Roadmap**
  - Recommendation engine
  - Personalization
  - Analytics dashboard
  - Mobile app (React Native)

---

## Critical Checklist for Go-Live

### Must Have (Blocker)
- [ ] Production database migrated
- [x] Environment variables configured (validation in-repo)
- [x] Rate limiter active
- [x] Basic monitoring setup (baseline documented in-repo)
- [x] Golden 5 providers tested (adapters implemented with contract tests)
- [x] E2E happy path passing (11 tests)

### Should Have (Important)
- [x] Critical path test suite passing (206 tests: env validation, API validation, watch-progress contract, migration compatibility, adapter contract, E2E happy path)
- [ ] Performance benchmarks met
- [ ] Logging aggregation setup
- [ ] Alerting configured (thresholds documented in-repo)
- [ ] Documentation complete

### Nice to Have (Future)
- [ ] Full 41 providers
- [ ] Advanced analytics
- [ ] A/B testing setup
- [ ] Feature flags

---

## Rollback Plan

### Scenario 1: Critical Bug in Production
```bash
# Rollback to previous deployment
vercel --rollback

# Or via Vercel dashboard
# Deployments → Previous Version → Promote
```

### Scenario 2: Database Issue
```sql
-- Restore from backup
-- Supabase dashboard → Database → Backups
```

### Scenario 3: Provider Outage
- [ ] Feature flag to disable provider
- [ ] Fallback to cached content
- [ ] Manual provider disable in DB

---

## Contact & Support

**Development Team**: techprocreative  
**Repository**: https://github.com/techprocreative/dracinhubv2  
**Documentation**: See README.md, API_DOCUMENTATION.md

---

## Appendix

### A. Quick Commands
```bash
# Development
npm run dev

# Testing
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:e2e            # E2E happy path tests
npm run test:adapters       # Adapter contract tests
npm run verify              # Test + Build verification

# Build
npm run build

# Deploy
vercel --prod

# Database
npx ts-node src/jobs/sync-providers.ts
npx ts-node src/jobs/sync-home-dramas.ts
```

### B. Test Infrastructure
- **Framework**: Vitest 2.1.0
- **Config**: `vitest.config.ts`
- **Test Files**: `tests/**/*.test.ts`
- **Run Command**: `npm test`
- **Coverage**: `npm run test:coverage`
- **Total Tests**: 206 (passing)

### C. Test Files Summary
| File | Tests | Description |
|------|-------|-------------|
| `tests/env-validation.test.ts` | 19 | Environment variable validation |
| `tests/api-validation.test.ts` | 63 | API input validation |
| `tests/watch-progress-contract.test.ts` | 10 | Watch progress data contract |
| `tests/migration-compatibility.test.ts` | 35 | Database migration artifacts |
| `tests/adapter-contract.test.ts` | 68 | Golden-5 adapter mapping tests |
| `tests/e2e-happy-path.test.ts` | 11 | E2E journey tests |
