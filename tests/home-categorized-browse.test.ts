import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('categorized direct-provider browsing', () => {
  it('renders provider sections and uses upstream categories', () => {
    const home = readFileSync('src/app/page.tsx', 'utf8');
    const provider = readFileSync('src/lib/providers/dramabox.ts', 'utf8');
    expect(home).toContain('<ProviderSections sections={data.providerSections}');
    for (const endpoint of ['recommended', 'dubindo', 'trending', 'terbaru', 'homepage', 'vip']) {
      expect(provider).toContain(`/api/dramabox/${endpoint}`.replace('dramabox/homepage', 'shortmax/homepage').replace('dramabox/vip', 'shortmax/vip'));
    }
    expect(provider).toContain("'Dub Indonesia'");
    expect(provider).toContain("'VIP & Dub'");
  });
});
