# All Providers Activation + Homepage Analysis Design

**Date:** 2026-02-26  
**Scope:** Aktivasi 41 provider aktif dengan mekanisme health-gated rollout, plus analisa homepage terukur (latency, completeness, cache, section quality).

---

## Context Snapshot

- Catalog memuat 42 provider (41 active, 1 maintenance).
- Jalur home sudah fan-out ke 41 provider via `fetchHomeFromProviders`.
- Homepage menampilkan section campuran (DB + dynamic provider fetch).
- Sudah ada probe provider, tetapi belum khusus mengukur kualitas data homepage per section/provider.

---

## Objectives

1. Semua provider aktif masuk pipeline aktivasi yang aman (no blind enable).
2. Homepage punya analisa kualitas data yang repeatable (bukan observasi manual).
3. Deployment MVP memiliki gate jelas: provider health + homepage quality pass.

## Non-Objectives

- Redesign UI homepage total.
- Re-arsitektur database besar di luar domain provider/home.

---

## Approaches

### A) Direct Enable All Providers (Fast, High Risk)
- Aktifkan semua provider tanpa gate health.
- Risiko section kosong/error meningkat tinggi.

### B) Health-Gated Progressive Activation (Recommended)
- Tambah scoring provider (endpoint reachability + payload quality + adapter mapping success).
- Homepage hanya menonjolkan provider healthy; unready provider tetap tercatat.
- Risiko production regression paling rendah.

### C) Manual Curated Provider List (Stable, Low Scale)
- Admin maintain whitelist manual.
- Stabil, tapi tidak scalable untuk 41 provider.

---

## Recommended Design

Gunakan **Approach B** dengan tiga lapisan:

1. **Provider Health Layer**
- Probe intents penting (`home`, `search`, `playback`) + payload quality.
- Simpan skor/status (healthy/degraded/unavailable) sebagai artefak report dan DB snapshot opsional.

2. **Homepage Quality Analysis Layer**
- Analisa per section: coverage provider, count drama valid, duplicate ratio, missing fields ratio.
- Analisa performa: latency `GET /api/v1/home`, cache hit/miss, stale fallback usage.

3. **Activation Gate**
- Provider dianggap “active-for-homepage” jika skor minimum terpenuhi.
- Provider gagal tetap tampil di metadata provider list, tapi tidak diprioritaskan section utama.

---

## Validation Criteria

- Provider activation report tersedia per run (`reports/provider-probe-latest.json` + homepage analysis report).
- Homepage quality report menunjukkan:
  - section coverage >= target,
  - duplicate ratio <= target,
  - missing essential fields <= target.
- Test suite untuk provider coverage dan homepage contract tetap hijau.
