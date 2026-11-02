import { describe, expect, it } from 'vitest';

describe('home diagnostics api', () => {
  it('returns latest provider probe and homepage analysis summaries', async () => {
    const { GET } = await import('@/app/api/v1/home/diagnostics/route');

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.error).toBeNull();
    expect(payload.data).toBeDefined();
    expect(payload.data.providerProbeSummary).toBeDefined();
    expect(payload.data.homepageAnalysisSummary).toBeDefined();
  });
});
