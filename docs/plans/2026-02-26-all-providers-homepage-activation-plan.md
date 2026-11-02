# All Providers Activation + Homepage Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mengaktifkan semua provider aktif dengan mekanisme health-gate dan menghasilkan analisa homepage yang bisa dipakai sebagai gate MVP.

**Architecture:** Aktivasi provider dijalankan berbasis skor health dari probe (`home/search/playback` + kualitas payload), lalu homepage composer mengutamakan provider healthy. Analisa homepage dijalankan sebagai artefak terpisah agar quality/performance bisa diukur per release, bukan asumsi manual.

**Tech Stack:** Next.js 16 App Router, TypeScript, Vitest, Supabase, Upstash Redis, Node.js scripts.

---

### Task 1: Add Provider Health Model

**Files:**
- Create: `src/lib/providers/health.ts`
- Modify: `src/lib/types/index.ts`
- Test: `tests/provider-health-model.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { classifyProviderHealth } from '@/lib/providers/health';

describe('provider health model', () => {
  it('classifies as healthy when score >= 80', () => {
    expect(classifyProviderHealth(82)).toBe('healthy');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/provider-health-model.test.ts`  
Expected: FAIL (`module not found` / function belum ada).

**Step 3: Write minimal implementation**

```ts
export type ProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable';

export function classifyProviderHealth(score: number): ProviderHealthStatus {
  if (score >= 80) return 'healthy';
  if (score >= 50) return 'degraded';
  return 'unavailable';
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- tests/provider-health-model.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/providers/health.ts src/lib/types/index.ts tests/provider-health-model.test.ts
git commit -m "feat(provider-health): add provider health status model"
```

### Task 2: Extend Probe to Emit Health Score Per Provider

**Files:**
- Modify: `scripts/probe-providers.mjs`
- Modify: `package.json`
- Test: `reports/provider-probe-latest.json`

**Step 1: Write failing expectation**

Run: `npm run probe:providers && rg -n "\"healthScore\"" reports/provider-probe-latest.json`  
Expected: FAIL (field `healthScore` belum ada).

**Step 2: Implement score computation**

```js
function computeProviderScore(rows) {
  const total = rows.length || 1;
  const ok = rows.filter(r => r.ok).length;
  const skipped = rows.filter(r => r.skipped).length;
  const successRatio = ok / total;
  const skipPenalty = skipped * 0.05;
  return Math.max(0, Math.round((successRatio - skipPenalty) * 100));
}
```

```js
const providerSummary = activeProviders.map((p) => {
  const rows = probes.filter((x) => x.provider === p.slug);
  const score = computeProviderScore(rows);
  return { provider: p.slug, healthScore: score, healthStatus: classify(score) };
});
```

**Step 3: Re-run probe**

Run: `npm run probe:providers`  
Expected: PASS + report berisi `providerSummary[].healthScore`.

**Step 4: Validate artifact**

Run: `node -e "const r=require('./reports/provider-probe-latest.json'); console.log(r.providerSummary?.length)"`  
Expected: `41`.

**Step 5: Commit**

```bash
git add scripts/probe-providers.mjs package.json reports/provider-probe-latest.json
git commit -m "feat(ops): add provider health score summary to probe report"
```

### Task 3: Add Homepage Analysis Script

**Files:**
- Create: `scripts/analyze-homepage.mjs`
- Modify: `package.json`
- Create: `reports/homepage-analysis-latest.json`
- Test: `reports/homepage-analysis-latest.json`

**Step 1: Write failing expectation**

Run: `test -f reports/homepage-analysis-latest.json`  
Expected: FAIL.

**Step 2: Implement analyzer script**

```js
const sections = data.providerSections ?? [];
const allCards = sections.flatMap((s) => s.dramas ?? []);
const duplicateRatio = allCards.length === 0 ? 0 :
  1 - (new Set(allCards.map((d) => d.id)).size / allCards.length);
```

```js
const summary = {
  providerSectionCount: sections.length,
  nonEmptySectionCount: sections.filter((s) => (s.dramas ?? []).length > 0).length,
  duplicateRatio,
  missingCoverRatio: allCards.length === 0 ? 0 : allCards.filter((d) => !d.coverUrl).length / allCards.length,
};
```

**Step 3: Add command**

```json
"analyze:homepage": "node scripts/analyze-homepage.mjs"
```

**Step 4: Run analyzer**

Run: `npm run analyze:homepage`  
Expected: PASS + `reports/homepage-analysis-latest.json` dibuat.

**Step 5: Commit**

```bash
git add scripts/analyze-homepage.mjs package.json reports/homepage-analysis-latest.json
git commit -m "feat(homepage): add homepage quality analysis report script"
```

### Task 4: Add Health Gate in Provider Aggregator

**Files:**
- Modify: `src/lib/services/provider-aggregator.ts`
- Modify: `src/lib/providers/health.ts`
- Test: `tests/provider-health-gating.test.ts`

**Step 1: Write failing test**

```ts
it('skips unavailable providers when health gate enabled', async () => {
  // mock health status unavailable
  // expect fetchHomeFromProviders to skip provider
});
```

**Step 2: Run test to verify fail**

Run: `npm run test -- tests/provider-health-gating.test.ts`  
Expected: FAIL.

**Step 3: Add minimal gate**

```ts
if (opts.healthGate?.enabled && opts.healthGate.unavailableSlugs?.has(provider.slug)) {
  return {
    provider: provider.slug,
    providerName: provider.provider,
    dramas: [],
    success: false,
    error: 'provider_unavailable_by_health_gate',
    latencyMs: 0,
  };
}
```

**Step 4: Re-run test**

Run: `npm run test -- tests/provider-health-gating.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/services/provider-aggregator.ts src/lib/providers/health.ts tests/provider-health-gating.test.ts
git commit -m "feat(provider-activation): add health gate for home provider fetch"
```

### Task 5: Integrate Health Gate into `/api/v1/home`

**Files:**
- Modify: `src/app/api/v1/home/route.ts`
- Create: `src/lib/homepage/quality.ts`
- Test: `tests/home-api-health-gate.test.ts`

**Step 1: Write failing test**

```ts
it('returns provider list including degraded/unavailable metadata', async () => {
  // expect home response meta/provider info include health status
});
```

**Step 2: Run test to verify fail**

Run: `npm run test -- tests/home-api-health-gate.test.ts`  
Expected: FAIL.

**Step 3: Implement minimal integration**

```ts
const healthReport = await getLatestProviderHealthReport();
const unavailable = new Set(healthReport.unavailableProviders);
const providerResultsPromise = fetchHomeFromProviders({
  maxProviders: 41,
  shuffle: true,
  requestId,
  healthGate: { enabled: true, unavailableSlugs: unavailable },
});
```

**Step 4: Re-run test**

Run: `npm run test -- tests/home-api-health-gate.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/v1/home/route.ts src/lib/homepage/quality.ts tests/home-api-health-gate.test.ts
git commit -m "feat(home-api): apply provider health gate to homepage aggregation"
```

### Task 6: Homepage Quality Contract Tests

**Files:**
- Create: `tests/homepage-analysis-contract.test.ts`
- Modify: `src/lib/homepage/quality.ts`

**Step 1: Write failing test**

```ts
it('computes duplicate ratio and missing cover ratio correctly', () => {
  // fixture with duplicates + empty cover
});
```

**Step 2: Run test to verify fail**

Run: `npm run test -- tests/homepage-analysis-contract.test.ts`  
Expected: FAIL.

**Step 3: Implement quality metrics function**

```ts
export function computeHomepageQuality(cards: DramaCard[]) {
  const total = cards.length;
  const unique = new Set(cards.map((c) => c.id)).size;
  const duplicateRatio = total === 0 ? 0 : 1 - unique / total;
  const missingCoverRatio = total === 0 ? 0 : cards.filter((c) => !c.coverUrl).length / total;
  return { total, unique, duplicateRatio, missingCoverRatio };
}
```

**Step 4: Re-run test**

Run: `npm run test -- tests/homepage-analysis-contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/homepage-analysis-contract.test.ts src/lib/homepage/quality.ts
git commit -m "test(homepage): add homepage quality contract metrics tests"
```

### Task 7: Add Homepage Diagnostics Endpoint (MVP Ops)

**Files:**
- Create: `src/app/api/v1/home/diagnostics/route.ts`
- Modify: `src/lib/types/index.ts`
- Test: `tests/home-diagnostics-api.test.ts`

**Step 1: Write failing API test**

```ts
it('returns latest provider probe + homepage analysis summaries', async () => {
  // call route handler and assert payload keys
});
```

**Step 2: Run test to verify fail**

Run: `npm run test -- tests/home-diagnostics-api.test.ts`  
Expected: FAIL.

**Step 3: Implement minimal route**

```ts
return NextResponse.json({
  data: { providerProbeSummary, homepageAnalysisSummary },
  meta: { requestId, timestamp: new Date().toISOString() },
  error: null,
});
```

**Step 4: Re-run test**

Run: `npm run test -- tests/home-diagnostics-api.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/v1/home/diagnostics/route.ts src/lib/types/index.ts tests/home-diagnostics-api.test.ts
git commit -m "feat(observability): add homepage diagnostics API for provider activation readiness"
```

### Task 8: Update Runbooks + Release Criteria

**Files:**
- Modify: `docs/runbooks/provider-probe.md`
- Modify: `docs/runbooks/mvp-go-live-checklist.md`
- Modify: `PRODUCTION_READINESS_PLAN.md`

**Step 1: Add explicit activation thresholds**

```md
- Healthy: score >= 80
- Degraded: 50-79
- Unavailable: < 50
- Homepage gate: duplicateRatio <= 0.1, missingCoverRatio <= 0.2
```

**Step 2: Add operator workflow**

```md
1) npm run probe:providers
2) npm run analyze:homepage
3) Verify diagnostics endpoint
4) Approve/rollback provider activation
```

**Step 3: Validate docs consistency**

Run: `rg -n "health|homepage|probe|analyze" docs PRODUCTION_READINESS_PLAN.md`  
Expected: semua istilah dan command sinkron.

**Step 4: Commit**

```bash
git add docs/runbooks/provider-probe.md docs/runbooks/mvp-go-live-checklist.md PRODUCTION_READINESS_PLAN.md
git commit -m "docs(ops): define provider activation thresholds and homepage quality gates"
```

### Task 9: Full Verification Gate

**Files:**
- Verify-only (no mandatory edits)

**Step 1: Run focused tests**

Run: `npm run test -- tests/provider-coverage.test.ts tests/provider-playback-coverage.test.ts tests/e2e-happy-path.test.ts`  
Expected: PASS.

**Step 2: Run full verification**

Run: `npm run verify`  
Expected: PASS.

**Step 3: Generate fresh artifacts**

Run:

```bash
npm run probe:providers
npm run analyze:homepage
```

Expected: kedua report terbaru tersedia di `reports/`.

**Step 4: Final commit**

```bash
git add reports/provider-probe-latest.json reports/homepage-analysis-latest.json
git commit -m "chore(release): refresh provider activation and homepage analysis artifacts"
```

---

**Execution notes:** gunakan `@superpowers:test-driven-development` untuk setiap perubahan behavior, `@superpowers:systematic-debugging` saat test gagal, dan `@superpowers:verification-before-completion` sebelum klaim selesai.

