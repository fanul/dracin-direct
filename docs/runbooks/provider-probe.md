# Provider Probe Runbook

## Purpose

Verifikasi readiness endpoint untuk 41 provider aktif dengan probe ringan (`home`, `search`, `playback`) dan menghasilkan artefak laporan JSON.

## Prerequisites

- `CAPTAIN_API_TOKEN` tersedia di environment (`.env` / `.env.local`).
- `api-endpoints.json` terbaru.

## Command

```bash
npm run probe:providers
npm run analyze:homepage
```

## Output

- Ringkasan hasil di terminal.
- Artefak laporan: `reports/provider-probe-latest.json`.
- Artefak analisa homepage: `reports/homepage-analysis-latest.json`.

## How to Read Report

- `providerCount`: jumlah provider aktif yang diuji.
- `probeCount`: total probe (`providerCount x 3 intents`).
- `summary.ok`: request 2xx.
- `summary.failed`: request error/non-2xx.
- `summary.skipped`: probe dilewati (endpoint tidak ditemukan / token tidak tersedia).
- `byIntent`: metrik per intent (`home`, `search`, `playback`).
- `providerSummary[]`: skor health per provider (`healthScore`, `healthStatus`).
- `unavailableProviders[]`: provider yang diblok oleh health gate homepage.
- `probes[]`: detail per provider+intent (URL, status, latency, itemCount, error).

## Activation Thresholds

- `healthy`: `healthScore >= 80`
- `degraded`: `50 <= healthScore < 80`
- `unavailable`: `healthScore < 50`

Homepage quality gates (dari `homepage-analysis-latest.json`):
- `duplicateRatio <= 0.10`
- `missingCoverRatio <= 0.20`

## Operational Guidance

- Jika `failed` tinggi pada intent tertentu, review `probes[]` untuk pola endpoint/path param.
- Jika `skipped` tinggi karena `missing_CAPTAIN_API_TOKEN`, pastikan env sudah benar.
- Simpan snapshot report sebelum release untuk baseline observability.
- Gunakan endpoint `GET /api/v1/home/diagnostics` untuk melihat ringkasan probe + homepage analysis dari API.
