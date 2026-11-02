PRD Final: dracinhub — Multi-Provider Short Drama Streaming Platform (API-Based)
0) Metadata

Nama produk: dracinhub

Dokumen: PRD Final v2.0

Fokus: Platform agregator short movie/drama multi-provider dengan arsitektur serverless + caching berlapis 

PRD

Sumber konten: Captain Drama API Gateway (multi-provider) 

PRD

Katalog provider: api-endpoints.json (generatedAt 2026-02-24) 

api-endpoints

1) Ringkasan Eksekutif

dracinhub adalah platform streaming terpusat yang mengagregasi konten short movie/drama dari 41 provider aktif melalui gateway Captain Drama API. Produk menggunakan arsitektur serverless (Next.js/Nuxt + Edge Functions + ISR) dan caching berlapis (Supabase PostgreSQL sebagai SSOT UI + Upstash Redis sebagai cache & rate limiter) agar UI cepat dan tidak membebani API sumber di tengah batas rate limit yang ketat (3.000 req/menit; 1.000.000 req/hari). 

PRD

2) Tujuan, Non-Tujuan
Goals (MVP)

Menyajikan pengalaman nonton drama episodic (detail drama → daftar episode → play episode → next episode).

Mengagregasi konten dari banyak provider dengan struktur API berbeda melalui Provider Catalog + Adapter Layer.

Menjamin UX cepat dan hemat quota dengan Supabase-driven catalog + ISR + caching + outbound throttle. 

PRD

Search lintas provider dengan edge cache (Redis) dan TTL 24 jam. 

PRD

Non-Goals (MVP)

Upload konten user (creator studio).

Social feature penuh (komentar realtime, DM, follow graph).

Write-back like/comment ke provider (opsional fase lanjut).

3) Scope Produk (MVP)
In Scope

Home / For You / Popular (katalog dari Supabase, hasil sinkronisasi cron) 

PRD

Search lintas provider (Redis edge cache → fallback call API → simpan 24 jam) 

PRD

Detail drama + daftar episode (ISR; stale-while-revalidate) 

PRD

Smart video player + stream proxy (ambil stream URL real-time via serverless function agar token tidak bocor) 

PRD

Continue watching (watch history/progress) 

PRD

Monetisasi internal (subscription/tier dracinhub tidak bergantung VIP provider) 

PRD

Out of Scope

Komentar/UGC.

Iklan/monetisasi advanced (mediation, SSAI).

Integrasi pembayaran detail (dibahas di dokumen terpisah).

4) Pengguna & UX Principles
Persona

Viewer kasual: buka → pilih drama → binge episode.

Power viewer: search intens + lanjutkan tontonan.

Admin/Ops: memantau provider health + menonaktifkan provider.

UX Principles (dari rancangan Anda)

Responsive tapi bukan mobile-first. 

PRD

Prioritas layout desktop/tablet: multi-column grid, slider horizontal lebar, sidebar navigasi kaya. 

PRD

Graceful degradation di smartphone (stacking rapi tanpa hilang fitur inti). 

PRD

5) Integrasi API: Captain Drama Gateway (Hard Requirements)
5.1 Auth & Base

Semua request ke gateway:

Host: https://captain.sapimu.au

Header wajib: Authorization: Bearer <TOKEN>

Format provider: https://captain.sapimu.au/{provider-slug} 

API_DOCUMENTATION

5.2 Cakupan provider

Total provider: 42

Aktif: 41

Maintenance: 1

Last verified: 2026-02-24 

API_DOCUMENTATION

5.3 Single Source of Truth: api-endpoints.json

Katalog JSON dipakai sebagai “machine source of truth”: berisi struktur vip, provider, baseUrl, endpoints[], pathParams[], sampleUrl. 

API_DOCUMENTATION

 

api-endpoints

5.4 Prinsip implementasi dari API docs

Wajib ada:

simpan metadata provider dari api-endpoints.json

wrapper request terpusat (timeout/retry/error normalization)

validasi path param

logging per provider+endpoint (observability/throttling)

re-scrape/sync docs berkala 

API_DOCUMENTATION

6) Functional Requirements
6.1 Unified Catalog (Supabase-driven)

FR-CAT-01 Home/For You/Popular ditampilkan dari tabel Supabase yang disinkronkan background, bukan request langsung ke API. 

PRD


FR-CAT-02 Cron ingestion jalan tiap 1–2 jam untuk menarik metadata terbaru dan upsert ke Supabase. 

PRD

6.2 Search Lintas Provider

FR-SRCH-01 Search dicek ke Redis dulu. Bila cache miss, backend query API, gabungkan hasil, simpan ke Redis selama 24 jam. 

PRD

6.3 Drama Detail & Episode List

FR-DETAIL-01 Halaman detail drama + daftar episode di-render via ISR (statis, SWR). 

PRD


FR-DETAIL-02 Platform menyatukan variasi struktur provider (drama/book/series) menjadi model internal “Drama” + “Episode”.

6.4 Playback (Smart Player + Stream Proxy)

FR-PLAY-01 Saat tombol Play ditekan, backend mengambil stream URL real-time (contoh endpoint bervariasi: /play/:id/:ep, /stream, dll) dan mengembalikannya ke player melalui serverless function agar token tidak terlihat di client. 

PRD


FR-PLAY-02 Next episode autoplay + “Continue Watching”.

6.5 Watch Progress / Continue Watching

FR-PROG-01 Simpan progress menonton ke watch_history (progress_seconds, is_completed, updated_at). 

PRD


FR-PROG-02 Update progress periodik (mis. setiap 10 detik) sesuai alur user Anda. 

PRD

6.6 Monetisasi Internal

FR-MON-01 Akses premium diatur oleh skema dracinhub (Supabase) dan tidak terikat VIP provider. 

PRD


FR-MON-02 Saat Play, serverless function mengecek entitlement user via tabel subscriptions sebelum memanggil API provider. 

PRD

6.7 Provider Layer (Adapter + Capability)

FR-PRV-01 Sistem harus mendukung multi-provider yang struktur endpoint-nya berbeda, dengan membaca api-endpoints.json sebagai katalog. 

API_DOCUMENTATION


FR-PRV-02 Implementasikan “Provider Adapter Interface” untuk menormalkan respons provider menjadi Canonical Model internal.
FR-PRV-03 Simpan capability matrix per provider (mis. ada search/tab/ranking/unlock/subtitle atau tidak) agar aggregator tidak “if-else spaghetti”.

7) Non-Functional Requirements
7.1 Performance

Home render cepat karena SSOT Supabase (tanpa hit API saat browsing). 

PRD

Detail drama cepat karena ISR. 

PRD

7.2 Rate Limit & Reliability

Gunakan outbound throttle via Upstash (token bucket) 45 req/detik, delay 1–2 detik untuk mencegah 429. 

PRD

Wajib wrapper request + logging per provider+endpoint. 

API_DOCUMENTATION

7.3 Security

Token Bearer tidak pernah dikirim ke client; stream diproxy via serverless. 

PRD

8) Architecture (Target)

Frontend/Backend: Next.js / Nuxt di Vercel/Netlify, dukung ISR + Edge Functions. 

PRD


Database/Auth: Supabase Postgres (user profiles, subscriptions, watch history, cached catalog). 

PRD


Cache & Rate limiter: Upstash Redis (edge cache search + outbound throttle). 

PRD

Prinsip runtime

Semua browsing UI → Supabase (0 req ke API).

Search cache miss + Play → serverless outbound ke Captain API (dikontrol rate limiter).

9) Canonical Data Model (Final)
9.1 Tabel yang sudah ada (dari rancangan Anda)

users (profil user) 

PRD

subscriptions (tier monetisasi internal) 

PRD

providers (referensi api-endpoints.json: slug, vip_level, status) 

PRD

dramas (cache metadata utama) 

PRD

watch_history (continue watching) 

PRD

9.2 Tambahan yang diputuskan di PRD Final (untuk menyempurnakan multi-provider)

Ini penambahan requirement agar adapter/canonical berjalan rapi.

episodes (cache episode list per drama)

id (UUID), drama_id (FK), provider_episode_id/episode_no/chapter_id, title, duration_ms, is_locked, last_synced_at

provider_capabilities (atau JSONB di providers)

supports_home, supports_search, supports_tabs, supports_ranking, supports_unlock, supports_subtitle, playback_type (play/stream/video), dll.

playback_cache (opsional, Redis-only)

key: provider+episode, ttl 60–120 detik (mengurangi repeat call saat refresh/autoplay)

10) Key User Flows (MVP)

Flow menonton (sesuai rancangan Anda):

User buka dracinhub → UI dari Supabase (0 req API) 

PRD

User search → Redis check → cache miss call API search → simpan 24 jam 

PRD

User buka drama detail → ISR (0 req API) 

PRD

User Play Episode → cek subscription → call Captain endpoint play/episode → return stream URL → update watch history 

PRD

11) Internal API (BFF) — Kontrak untuk Frontend

(Frontend tidak boleh tahu struktur provider.)

GET /v1/home → blok konten dari Supabase (cached)

GET /v1/dramas/{id} → detail drama (ISR cache)

GET /v1/dramas/{id}/episodes → episode list (Supabase)

GET /v1/playback?provider=...&drama=...&episode=...

serverless: cek entitlement → resolve endpoint via catalog → call Captain API → return stream URL

GET /v1/search?q=... → Redis cache → fallback API

POST /v1/watch/progress → upsert watch_history

12) Observability & Ops

Log per request: provider_slug, endpoint_path, latency, status code, rate limiter decision (allowed/delayed). Ini mengikuti rekomendasi “logging per provider+endpoint” dari API docs. 

API_DOCUMENTATION

Dashboard minimal:

error rate per provider

cache hit ratio (search)

total outbound request / menit & / hari (untuk menjaga limit)

13) Acceptance Criteria (MVP)

Home/ForYou/Popular load dari Supabase tanpa memanggil Captain API. 

PRD

Search: cache hit/miss berjalan, TTL 24 jam untuk query baru. 

PRD

Detail drama: halaman dan episode list served via ISR/SWR. 

PRD

Playback: token tidak terlihat di client (stream via serverless). 

PRD

Watch history tersimpan dan “Continue watching” bisa muncul. 

PRD

Outbound throttle aktif (45 req/detik) dan mencegah 429. 

PRD

14) Milestones (High-Level)

M1: Provider catalog ingestion + tables (providers, dramas) + home UI

M2: Search (Redis edge cache) + throttling middleware

M3: Drama detail + episode list + ISR

M4: Playback proxy + entitlement check + watch progress

M5: Admin minimal + monitoring & logs
