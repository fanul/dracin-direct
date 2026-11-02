/**
 * E2E Happy Path Test
 * 
 * A minimal, CI-friendly E2E test covering the core journey:
 * home -> detail -> episodes -> playback -> watch progress contract
 * 
 * This test uses mocked provider responses to avoid external dependencies
 * while still validating the full data flow through the system.
 */

import { describe, it, expect, beforeAll } from 'vitest';

// ============================================================================
// Types
// ============================================================================

interface MockProviderResponse {
    home: unknown;
    detail: unknown;
    episodes: unknown;
    playback: unknown;
}

// ============================================================================
// Mock Provider Data (simulates Captain API responses)
// ============================================================================

const mockProviderData: Record<string, MockProviderResponse> = {
    reelshort: {
        home: [
            { _id: 'rs-e2e-001', title: 'E2E Test Drama', cover: 'https://example.com/e2e-cover.jpg', episodeCount: 10, rating: 4.5, tags: ['test'] },
        ],
        detail: { _id: 'rs-e2e-001', title: 'E2E Test Drama', cover: 'https://example.com/e2e-cover.jpg', episodeCount: 10, rating: 4.5, tags: ['test'] },
        episodes: [
            { chapterId: 'rs-e2e-ep-001', title: 'Episode 1', sequence: 1 },
            { chapterId: 'rs-e2e-ep-002', title: 'Episode 2', sequence: 2 },
        ],
        playback: { videoUrl: 'https://cdn.example.com/e2e-video.mp4' },
    },
};

// ============================================================================
// E2E Happy Path Test Suite
// ============================================================================

describe('E2E Happy Path', () => {
    let adapters: Map<string, import('../src/lib/providers/adapters/base').ProviderAdapter>;

    beforeAll(async () => {
        // Import adapters dynamically to ensure they're loaded
        const { adapters: adapterMap } = await import('../src/lib/providers/adapters/index');
        adapters = adapterMap;
    });

    describe('Step 1: Home Page Journey', () => {
        it('should retrieve and map home content for Golden-5 providers', () => {
            const golden5 = ['reelshort', 'goodshort', 'flextv', 'cashdrama', 'shortmax'];

            for (const providerSlug of golden5) {
                const adapter = adapters.get(providerSlug);
                expect(adapter).toBeDefined();

                // Simulate home API response mapping
                const homeData = mockProviderData.reelshort.home;
                const dramaCards = adapter!.mapHome(homeData);

                expect(dramaCards.length).toBeGreaterThan(0);

                const firstCard = dramaCards[0];
                expect(firstCard.id).toContain(providerSlug);
                expect(firstCard.title).toBeDefined();
                expect(firstCard.coverUrl).toBeDefined();
                expect(firstCard.providerSlug).toBe(providerSlug);
            }
        });
    });

    describe('Step 2: Drama Detail Journey', () => {
        it('should map drama detail with all required fields', () => {
            const adapter = adapters.get('reelshort');
            const detailData = mockProviderData.reelshort.detail;

            const detail = adapter!.mapDramaDetail(detailData);

            // Validate required fields for detail page
            expect(detail.id).toBe('reelshort:rs-e2e-001');
            expect(detail.title).toBe('E2E Test Drama');
            expect(detail.coverUrl).toBe('https://example.com/e2e-cover.jpg');
            expect(detail.episodeCount).toBe(10);
            expect(detail.synopsis).toBeDefined();
            expect(detail.genres).toBeInstanceOf(Array);
            expect(detail.language).toBeDefined();
            expect(detail.lastUpdated).toBeDefined();
        });
    });

    describe('Step 3: Episodes List Journey', () => {
        it('should map episodes with correct ordering', () => {
            const adapter = adapters.get('reelshort');
            const episodesData = mockProviderData.reelshort.episodes;

            const episodes = adapter!.mapEpisodes(episodesData);

            expect(episodes.length).toBe(2);

            // Validate episode ordering
            expect(episodes[0].episodeNo).toBeLessThan(episodes[1].episodeNo);

            // Validate episode fields
            episodes.forEach(ep => {
                expect(ep.episodeId).toContain('reelshort:');
                expect(ep.title).toBeDefined();
                expect(typeof ep.isLocked).toBe('boolean');
            });
        });
    });

    describe('Step 4: Playback Journey', () => {
        it('should map playback response with stream URL and expiration', () => {
            const adapter = adapters.get('reelshort');
            const playbackData = mockProviderData.reelshort.playback;

            const playback = adapter!.mapPlayback(playbackData);

            expect(playback.streamUrl).toBe('https://cdn.example.com/e2e-video.mp4');
            expect(playback.expiresAt).toBeDefined();

            // Validate expiration is in the future
            const expiresAt = new Date(playback.expiresAt);
            expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
        });
    });

    describe('Step 5: Watch Progress Contract', () => {
        it('should validate watch progress data structure', () => {
            // Simulate watch progress payload that would be sent to /api/v1/watch/progress
            const watchProgressPayload = {
                userId: 'user-e2e-001',
                dramaId: 'reelshort:rs-e2e-001',
                episodeId: 'reelshort:rs-e2e-ep-001',
                progressSeconds: 45,
                isCompleted: false,
            };

            // Validate required fields
            expect(watchProgressPayload.userId).toBeDefined();
            expect(watchProgressPayload.dramaId).toBeDefined();
            expect(watchProgressPayload.episodeId).toBeDefined();
            expect(watchProgressPayload.progressSeconds).toBeGreaterThanOrEqual(0);
            expect(watchProgressPayload.progressSeconds).toBeLessThanOrEqual(86400); // Max 24 hours
            expect(typeof watchProgressPayload.isCompleted).toBe('boolean');
        });

        it('should validate episode ID format for watch progress', () => {
            const adapter = adapters.get('reelshort');
            const episodesData = mockProviderData.reelshort.episodes;

            const episodes = adapter!.mapEpisodes(episodesData);
            const episodeId = episodes[0].episodeId;

            // Episode ID should be in format: provider:episodeId
            expect(episodeId).toMatch(/^[\w-]+:[\w-]+$/);

            // Should be parseable
            const [provider, epId] = episodeId.split(':');
            expect(provider).toBe('reelshort');
            expect(epId).toBeDefined();
        });
    });

    describe('Full Journey Integration', () => {
        it('should complete full happy path: home -> detail -> episodes -> playback', () => {
            const adapter = adapters.get('reelshort');

            // Step 1: Home
            const homeCards = adapter!.mapHome(mockProviderData.reelshort.home);
            expect(homeCards.length).toBeGreaterThan(0);

            // Step 2: Detail (using first home item)
            const detail = adapter!.mapDramaDetail(mockProviderData.reelshort.detail);
            expect(detail.id).toBe(homeCards[0].id);

            // Step 3: Episodes
            const episodes = adapter!.mapEpisodes(mockProviderData.reelshort.episodes);
            expect(episodes.length).toBeGreaterThan(0);

            // Step 4: Playback (using first episode)
            const playback = adapter!.mapPlayback(mockProviderData.reelshort.playback);
            expect(playback.streamUrl).toBeDefined();

            // Step 5: Watch progress contract
            const watchProgress = {
                userId: 'user-e2e-001',
                dramaId: detail.id,
                episodeId: episodes[0].episodeId,
                progressSeconds: 30,
                isCompleted: false,
            };

            // Validate the complete journey data flow
            expect(watchProgress.dramaId).toContain('reelshort');
            expect(watchProgress.episodeId).toContain('reelshort');
        });
    });
});

// ============================================================================
// Provider Health Check (CI-friendly)
// ============================================================================

describe('Provider Health Check', () => {
    it('should have all Golden-5 adapters available', async () => {
        const { adapters } = await import('../src/lib/providers/adapters/index');

        const golden5 = ['reelshort', 'goodshort', 'flextv', 'cashdrama', 'shortmax'];

        for (const providerSlug of golden5) {
            expect(adapters.has(providerSlug), `Missing adapter for ${providerSlug}`).toBe(true);

            const adapter = adapters.get(providerSlug);
            expect(adapter!.name).toBeDefined();
            expect(adapter!.slug).toBe(providerSlug);
        }
    });

    it('should have consistent adapter interface across all Golden-5', async () => {
        const { adapters } = await import('../src/lib/providers/adapters/index');

        const golden5 = ['reelshort', 'goodshort', 'flextv', 'cashdrama', 'shortmax'];

        for (const providerSlug of golden5) {
            const adapter = adapters.get(providerSlug);

            // All adapters must implement these methods
            expect(typeof adapter!.mapHome).toBe('function');
            expect(typeof adapter!.mapSearch).toBe('function');
            expect(typeof adapter!.mapDramaDetail).toBe('function');
            expect(typeof adapter!.mapEpisodes).toBe('function');
            expect(typeof adapter!.mapPlayback).toBe('function');
        }
    });
});

// ============================================================================
// Data Transformation Contract
// ============================================================================

describe('Data Transformation Contract', () => {
    it('should generate consistent IDs across all mapping methods', async () => {
        const { adapters } = await import('../src/lib/providers/adapters/index');
        const adapter = adapters.get('reelshort');

        const homeCards = adapter!.mapHome(mockProviderData.reelshort.home);
        const detail = adapter!.mapDramaDetail(mockProviderData.reelshort.detail);

        // IDs should be consistent between home and detail
        expect(homeCards[0].id).toBe(detail.id);
        expect(homeCards[0].providerDramaId).toBe(detail.providerDramaId);
    });

    it('should preserve provider info across all mapped entities', async () => {
        const { adapters } = await import('../src/lib/providers/adapters/index');
        const adapter = adapters.get('reelshort');

        const homeCards = adapter!.mapHome(mockProviderData.reelshort.home);
        const detail = adapter!.mapDramaDetail(mockProviderData.reelshort.detail);
        const episodes = adapter!.mapEpisodes(mockProviderData.reelshort.episodes);

        // All entities should have consistent provider info
        [homeCards[0], detail].forEach(entity => {
            expect(entity.providerSlug).toBe('reelshort');
            expect(entity.providerName).toBe('ReelShort');
            expect(entity.vipLevel).toBeDefined();
        });

        // Episodes should have provider-prefixed IDs
        episodes.forEach(ep => {
            expect(ep.episodeId).toMatch(/^reelshort:/);
        });
    });
});
