# MVP Readiness for 41 Active Providers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Menjadikan project stabil, testable, dan operasional untuk MVP dengan 41 provider aktif tanpa blocker kritis di adapter, watch-progress, build, dan tooling.

**Architecture:** Stabilization bertahap berbasis kontrak: (1) kunci adapter + data mapping, (2) rapikan kontrak watch-progress dan env defaults, (3) pastikan tooling build/lint siap CI, (4) tambah readiness probe untuk 41 provider. Semua perubahan dijalankan TDD kecil per task.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Vitest, Supabase, Upstash Redis.

---

### Task 1: Adapter Import Compatibility (Golden-5 Contract)

**Files:**
- Create: `src/lib/providers/adapters/reelshort.ts`
- Create: `src/lib/providers/adapters/goodshort.ts`
- Create: `src/lib/providers/adapters/flextv.ts`
- Test: `tests/adapter-contract.test.ts`

**Step 1: Run failing contract test**

Run: `npm run test -- tests/adapter-contract.test.ts`  
Expected: FAIL dengan error import file adapter tidak ditemukan.

**Step 2: Add compatibility shim files (minimal implementation)**

```ts
// src/lib/providers/adapters/reelshort.ts
export { ReelShortAdapter } from './all-providers';
```

```ts
// src/lib/providers/adapters/goodshort.ts
export { GoodShortAdapter } from './all-providers';
```

```ts
// src/lib/providers/adapters/flextv.ts
export { FlexTVAdapter } from './all-providers';
```

**Step 3: Re-run adapter contract**

Run: `npm run test -- tests/adapter-contract.test.ts`  
Expected: import error hilang; lanjut ke assertion behavior.

**Step 4: Commit**

```bash
git add src/lib/providers/adapters/reelshort.ts src/lib/providers/adapters/goodshort.ts src/lib/providers/adapters/flextv.ts
git commit -m "fix(adapters): restore golden-5 adapter import entrypoints"
```

### Task 2: Fix ReelShort Home Mapping and Episode ID Canonical Format

**Files:**
- Modify: `src/lib/providers/adapters/all-providers.ts`
- Modify: `src/lib/providers/adapters/generic.ts`
- Test: `tests/e2e-happy-path.test.ts`

**Step 1: Run failing E2E contract**

Run: `npm run test -- tests/e2e-happy-path.test.ts`  
Expected: FAIL pada `homeCards.length > 0` dan format `episodeId`.

**Step 2: Implement minimal mapping fixes**

```ts
// all-providers.ts (ReelShortAdapter.mapHome)
mapHome(response: unknown): DramaCard[] {
  const unwrapped = this.unwrapResponse(response);
  if (Array.isArray(unwrapped)) {
    return unwrapped.map(item => this.mapToDramaCard(item)).filter(Boolean) as DramaCard[];
  }
  return super.mapHome(response);
}
```

```ts
// generic.ts (mapEpisodes)
const rawEpisodeId = episodeId || `${episodeNo}`;
return {
  episodeId: `${this.slug}:${rawEpisodeId}`,
  providerEpisodeId: rawEpisodeId,
  // ...
};
```

**Step 3: Verify targeted tests pass**

Run: `npm run test -- tests/e2e-happy-path.test.ts`  
Expected: PASS.

**Step 4: Verify adapter contract regression**

Run: `npm run test -- tests/adapter-contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/providers/adapters/all-providers.ts src/lib/providers/adapters/generic.ts tests/e2e-happy-path.test.ts
git commit -m "fix(adapters): normalize reelshort home parsing and provider-prefixed episode IDs"
```

### Task 3: Align Watch Progress Tests with Current Persistence Strategy

**Files:**
- Modify: `tests/watch-progress-contract.test.ts`
- Modify: `src/lib/db/watch-history.ts` (only if behavior gaps ditemukan)
- Test: `tests/watch-progress-contract.test.ts`

**Step 1: Run current failing watch-progress tests**

Run: `npm run test -- tests/watch-progress-contract.test.ts`  
Expected: FAIL pada mock `.update is not a function`.

**Step 2: Update tests to assert behavior, not old implementation detail**

```ts
// Replace upsert-only mock with chainable update/select/limit + insert mock
const mockUpdate = vi.fn(() => createUpdateChain());
const mockInsert = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate, insert: mockInsert }));
```

```ts
// Assert behavior:
// - update path success => no insert
// - no updated rows => insert called
// - DB errors => throw "Failed to save watch progress"
```

**Step 3: Add one regression case for provider drama ID resolution**

```ts
it('resolves provider:dramaId before persisting', async () => {
  // drama lookup returns UUID, then save path uses resolved UUID
});
```

**Step 4: Re-run watch-progress tests**

Run: `npm run test -- tests/watch-progress-contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/watch-progress-contract.test.ts src/lib/db/watch-history.ts
git commit -m "test(watch-progress): align contract tests with update-first persistence behavior"
```

### Task 4: Tighten Watch Progress Validation Contract

**Files:**
- Modify: `src/lib/validation/schemas.ts`
- Modify: `tests/api-validation.test.ts`
- Test: `tests/api-validation.test.ts`

**Step 1: Add failing test for valid provider-scoped drama ID**

```ts
it('should accept provider-scoped dramaId', () => {
  const result = watchProgressRequestSchema.safeParse({
    userId: '123e4567-e89b-12d3-a456-426614174000',
    dramaId: 'reelshort:rs-001',
    episodeId: 'reelshort:ep-1',
    progressSeconds: 120,
  });
  expect(result.success).toBe(true);
});
```

**Step 2: Make schema strict but MVP-friendly**

```ts
const providerScopedId = /^[a-z0-9-]+:[\w-]+$/;
dramaId: z.string().refine(
  v => z.string().uuid().safeParse(v).success || providerScopedId.test(v),
  { message: 'Drama ID must be UUID or provider-scoped ID (provider:id)' }
)
```

**Step 3: Keep invalid ID rejection test**

```ts
expect(watchProgressRequestSchema.safeParse({ dramaId: 'not-valid-id', ... }).success).toBe(false);
```

**Step 4: Re-run validation tests**

Run: `npm run test -- tests/api-validation.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/validation/schemas.ts tests/api-validation.test.ts
git commit -m "fix(validation): enforce watch-progress dramaId as uuid or provider-scoped id"
```

### Task 5: Restore Env Default Consistency for Rate Limits

**Files:**
- Modify: `src/lib/config/env.ts`
- Test: `tests/env-validation.test.ts`

**Step 1: Run env validation tests**

Run: `npm run test -- tests/env-validation.test.ts`  
Expected: FAIL di default rate limit values.

**Step 2: Apply minimal default alignment**

```ts
RATE_LIMIT_GLOBAL_RPM: z.string().transform(Number).default('45'),
RATE_LIMIT_PROVIDER_RPM: z.string().transform(Number).default('10'),
```

**Step 3: Re-run env tests**

Run: `npm run test -- tests/env-validation.test.ts`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/lib/config/env.ts
git commit -m "fix(env): align default rate-limit values with validation contract"
```

### Task 6: Make Lint and Build Commands Operational on Next.js 16

**Files:**
- Modify: `package.json`
- Create: `.eslintrc.json`
- Modify: `src/app/layout.tsx`
- Test: `npm run lint`, `npm run build`

**Step 1: Confirm current failures**

Run: `npm run lint`  
Expected: FAIL (`next lint` invalid).  

Run: `npm run build`  
Expected: FAIL on fetching Google Font `Inter` when offline.

**Step 2: Implement minimal tooling fixes**

```json
// package.json
"scripts": {
  "lint": "eslint . --max-warnings=0"
}
```

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"]
}
```

```tsx
// layout.tsx
// remove next/font/google Inter dependency and use CSS/system stack class
<body className="bg-neutral-950 text-slate-100 antialiased">
```

**Step 3: Install missing lint dependencies**

Run: `npm install -D eslint eslint-config-next`  
Expected: selesai tanpa error.

**Step 4: Verify lint and build**

Run: `npm run lint && npm run build`  
Expected: PASS.

**Step 5: Commit**

```bash
git add package.json package-lock.json .eslintrc.json src/app/layout.tsx
git commit -m "chore(tooling): fix lint command and remove google-font build dependency"
```

### Task 7: Add 41-Provider Readiness Probe and Report Artifact

**Files:**
- Modify: `scripts/probe-providers.mjs`
- Modify: `package.json`
- Create: `reports/.gitkeep`
- Create: `docs/runbooks/provider-probe.md`

**Step 1: Add failing smoke expectation (report file must be generated)**

```bash
test -f reports/provider-probe-latest.json
# Expected: FAIL (before script update)
```

**Step 2: Implement catalog-driven probe**

```js
// iterate active providers from api-endpoints.json
// probe home/search/playback candidates with timeout + auth
// write JSON report: provider, intent, endpoint, status, latencyMs, error
```

**Step 3: Add package script**

```json
"probe:providers": "node scripts/probe-providers.mjs"
```

**Step 4: Run probe and validate artifact**

Run: `npm run probe:providers`  
Expected: report `reports/provider-probe-latest.json` dibuat.

**Step 5: Commit**

```bash
git add scripts/probe-providers.mjs package.json package-lock.json reports/.gitkeep docs/runbooks/provider-probe.md
git commit -m "feat(ops): add 41-provider readiness probe with JSON report artifact"
```

### Task 8: Full Verification Gate + MVP Release Docs

**Files:**
- Modify: `README.md`
- Modify: `PRODUCTION_READINESS_PLAN.md`
- Create: `docs/runbooks/mvp-go-live-checklist.md`

**Step 1: Run full verification suite**

Run: `npm run verify`  
Expected: PASS (`test` + `build`).

**Step 2: Run focused provider coverage**

Run: `npm run test -- tests/provider-coverage.test.ts tests/provider-playback-coverage.test.ts`  
Expected: PASS dan tetap 41 provider aktif.

**Step 3: Update docs dengan status aktual dan command operasional**

```md
- Status readiness berbasis hasil `verify` + `probe:providers`
- Langkah go-live, rollback, dan fallback provider
```

**Step 4: Commit**

```bash
git add README.md PRODUCTION_READINESS_PLAN.md docs/runbooks/mvp-go-live-checklist.md
git commit -m "docs(mvp): finalize go-live checklist and verified readiness workflow for 41 providers"
```

### Final Gate (Must Pass Before Merge)

Run all:

```bash
npm run test
npm run build
npm run lint
npm run probe:providers
```

Expected:
- Semua test pass.
- Build pass.
- Lint pass.
- Probe report tersedia dan menunjukkan coverage 41 provider aktif.

---

**Execution notes:** gunakan `@superpowers:test-driven-development` untuk tiap task coding dan `@superpowers:verification-before-completion` sebelum klaim selesai.

