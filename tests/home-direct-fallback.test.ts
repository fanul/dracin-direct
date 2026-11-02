import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home direct-provider fallback', () => {
  it('keeps direct providers available when database sections fail', () => {
    const source = readFileSync('src/app/api/v1/home/route.ts', 'utf8');
    expect(source).toContain('getForYouDramas(10).catch(() => [])');
    expect(source).toContain('fetchDramaBoxCatalog(1).catch(() => [])');
    expect(source).toContain('fetchShortMaxCatalog(1).catch(() => [])');
    expect(source).toContain('getActiveProviders().catch(() => [])');
  });
});
