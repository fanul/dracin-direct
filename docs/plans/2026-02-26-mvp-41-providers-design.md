# MVP 41 Providers Stabilization Design

**Date:** 2026-02-26  
**Scope:** Menjadikan `dracinhubv2` benar-benar siap MVP untuk 41 provider aktif (dengan fokus stabilitas jalur Home, Search, Detail, Episodes, Playback, Watch Progress).

---

## Current Findings (Evidence-Based)

1. Test baseline belum hijau:
- `npm run verify` gagal (18 test fail, 1 suite fail).
- `tests/adapter-contract.test.ts` gagal import adapter file (`reelshort`, `goodshort`, `flextv`) karena path lama.
- `tests/e2e-happy-path.test.ts` gagal di mapping `home`/`episodes` (`reelshort`).
- `tests/watch-progress-contract.test.ts` mismatch dengan implementasi DB terbaru (`update/insert` vs mock `upsert` lama).
- `tests/env-validation.test.ts` mismatch default rate limit.

2. Tooling readiness belum production-safe:
- `npm run lint` gagal karena `next lint` tidak valid di Next.js 16.
- `npm run build` gagal offline karena `next/font/google` fetch `Inter` dari internet.

3. Kontrak input belum tegas untuk watch progress:
- `watchProgressRequestSchema` saat ini menerima `dramaId` string apapun, belum dibatasi ke format valid (UUID atau `provider:id`).

---

## Approaches

### Approach A: Test-Driven Stabilization First (Recommended)
- Mulai dari failure yang sudah nyata di test/build.
- Perbaiki kontrak adapter, watch progress, env config, dan tooling sampai `verify` hijau.
- Lanjutkan dengan probing readiness 41 provider.

Trade-off:
- Sedikit lebih lama di awal.
- Risiko regressions paling rendah.

### Approach B: Provider-Live First
- Langsung fokus probing 41 provider dan patch adapter berdasarkan API real.
- Test suite dirapikan belakangan.

Trade-off:
- Cepat dapat sinyal live provider.
- Risiko bug internal/CI masih tinggi.

### Approach C: UI-First MVP
- Prioritaskan jalur user (home/detail/play) dulu, abaikan kontrak internal sementara.

Trade-off:
- Demo cepat.
- Risiko technical debt dan crash saat traffic naik.

---

## Recommended Design

Gunakan **Approach A** dengan urutan:
1. Stabilkan kontrak internal (adapter imports, ID mapping, watch progress validation/persistence).
2. Stabilkan tooling (`lint`, `build` offline-safe, script execution).
3. Tambahkan readiness harness untuk 41 provider aktif (report terstruktur).
4. Tutup dengan smoke checks + release checklist MVP.

Ini membuat platform tidak hanya "jalan", tapi juga terukur dan bisa dioperasikan.

---

## Target Acceptance Criteria

1. `npm run test` lulus penuh.
2. `npm run build` lulus tanpa dependency internet runtime build.
3. Semua 41 provider aktif punya adapter yang loadable + kontrak mapping minimum.
4. Watch progress menerima ID valid, menolak ID invalid, dan persist konsisten.
5. Ada report readiness provider yang bisa dipakai untuk keputusan go-live.

