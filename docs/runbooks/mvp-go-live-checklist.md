# MVP Go-Live Checklist (41 Active Providers)

## 1) Preflight

- [ ] `api-endpoints.json` terbaru dan menunjukkan 41 provider aktif.
- [ ] Semua secret wajib sudah terpasang di environment target:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `UPSTASH_REDIS_REST_URL`/`KV_REST_API_URL`
  - `UPSTASH_REDIS_REST_TOKEN`/`KV_REST_API_TOKEN`
  - `CAPTAIN_API_TOKEN`

## 2) Database

- [ ] Jalankan `DB_SCHEMA.sql`.
- [ ] Jalankan `migrations/001_initial_schema_constraints.sql`.
- [ ] Verifikasi tabel inti (`providers`, `dramas`, `episodes`, `watch_history`, `subscriptions`) tersedia.

## 3) Data Sync

- [ ] `npx ts-node src/jobs/sync-providers.ts`
- [ ] `npx ts-node src/jobs/sync-home-dramas.ts`
- [ ] `npx ts-node src/jobs/sync-episodes.ts <provider> <dramaId>` (sampling beberapa provider)

## 4) Verification Gate

- [ ] `npm run test` pass.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.
- [ ] `npm run probe:providers` menghasilkan `reports/provider-probe-latest.json`.
- [ ] `npm run analyze:homepage` menghasilkan `reports/homepage-analysis-latest.json`.
- [ ] `GET /api/v1/home/diagnostics` mengembalikan summary probe + homepage analysis.

## 5) Functional Smoke

- [ ] `GET /api/v1/home`
- [ ] `GET /api/v1/search?q=love`
- [ ] `GET /api/v1/dramas/{id}`
- [ ] `GET /api/v1/dramas/{id}/episodes`
- [ ] `GET /api/v1/playback?provider=...&drama=...&episode=...`
- [ ] `POST /api/v1/watch/progress`

## 6) Release Decision

- [ ] Tidak ada blocker severity tinggi di test/build/probe.
- [ ] Ada fallback/disable plan untuk provider yang tidak stabil.
- [ ] Monitoring log dan error alerts aktif.
- [ ] Health gate provider diterapkan:
  - `healthy >= 80`
  - `degraded 50-79`
  - `unavailable < 50`
- [ ] Homepage quality gate terpenuhi:
  - `duplicateRatio <= 0.10`
  - `missingCoverRatio <= 0.20`
