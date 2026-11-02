/**
 * Adapter Contract Tests for Golden-5 Providers
 * 
 * These tests validate that each adapter correctly maps provider API responses
 * to normalized types. Tests use deterministic fixtures and assert against
 * expected normalized output.
 * 
 * Tests MUST FAIL if adapter returns empty placeholder arrays for valid fixture input.
 */

import { describe, it, expect } from 'vitest';
import { ReelShortAdapter } from '../src/lib/providers/adapters/reelshort';
import { GoodShortAdapter } from '../src/lib/providers/adapters/goodshort';
import { FlexTVAdapter } from '../src/lib/providers/adapters/flextv';
import { CashDramaAdapter } from '../src/lib/providers/adapters/cashdrama';
import { ShortMaxAdapter } from '../src/lib/providers/adapters/shortmax';
import { NetShortAdapter } from '../src/lib/providers/adapters/all-providers';
import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse } from '../src/lib/types';

// ============================================================================
// Test Fixtures - Deterministic mock data representing real API responses
// ============================================================================

const reelShortFixtures = {
    home: [
        { _id: 'rs-001', title: 'Love in the City', cover: 'https://example.com/cover1.jpg', episodeCount: 80, rating: 4.5, tags: ['romance', 'drama'] },
        { _id: 'rs-002', title: 'Boss Romance', cover: 'https://example.com/cover2.jpg', episodeCount: 60, rating: 4.2, tags: ['romance'] },
    ],
    search: [
        { _id: 'rs-001', title: 'Love in the City', cover: 'https://example.com/cover1.jpg', episodeCount: 80, rating: 4.5, tags: ['romance', 'drama'] },
    ],
    detail: { _id: 'rs-001', title: 'Love in the City', cover: 'https://example.com/cover1.jpg', episodeCount: 80, rating: 4.5, tags: ['romance', 'drama'] },
    episodes: [
        { chapterId: 'ch-001', title: 'Episode 1', sequence: 1 },
        { chapterId: 'ch-002', title: 'Episode 2', sequence: 2 },
        { chapterId: 'ch-003', title: 'Episode 3', sequence: 3 },
    ],
    playback: { videoUrl: 'https://cdn.example.com/video.mp4' },
};

const goodShortFixtures = {
    home: {
        data: [
            { _id: 'gs-001', title: 'Secret Love', cover: 'https://example.com/gs-cover1.jpg', episodeCount: 100, rating: 4.8, tags: ['romance'] },
            { _id: 'gs-002', title: 'The Billionaire', cover: 'https://example.com/gs-cover2.jpg', episodeCount: 75, rating: 4.3, tags: ['drama'] },
        ],
    },
    search: {
        results: [
            { _id: 'gs-001', title: 'Secret Love', cover: 'https://example.com/gs-cover1.jpg', episodeCount: 100, rating: 4.8, tags: ['romance'] },
        ],
    },
    detail: { _id: 'gs-001', title: 'Secret Love', cover: 'https://example.com/gs-cover1.jpg', episodeCount: 100, rating: 4.8, tags: ['romance'], synopsis: 'A secret love story' },
    episodes: {
        chapters: [
            { chapterId: 'gs-ch-001', title: 'Chapter 1', sequence: 1, isLocked: false },
            { chapterId: 'gs-ch-002', title: 'Chapter 2', sequence: 2, isLocked: true },
        ],
    },
    playback: { videoUrl: 'https://cdn.example.com/gs-video.mp4', expiresAt: '2026-02-24T15:00:00Z' },
};

const flexTVFixtures = {
    home: {
        tabs: [
            {
                name: 'Trending', series: [
                    { id: 'ftv-001', title: 'Mystery Love', cover: 'https://example.com/ftv-cover1.jpg', episodeCount: 50, rating: 4.6, tags: ['mystery', 'romance'] },
                ]
            },
            {
                name: 'New', series: [
                    { id: 'ftv-002', title: 'Action Hero', cover: 'https://example.com/ftv-cover2.jpg', episodeCount: 40, rating: 4.1, genres: ['action'] },
                ]
            },
        ],
    },
    search: {
        data: [
            { id: 'ftv-001', title: 'Mystery Love', cover: 'https://example.com/ftv-cover1.jpg', episodeCount: 50, rating: 4.6, tags: ['mystery', 'romance'] },
        ],
    },
    detail: { id: 'ftv-001', title: 'Mystery Love', cover: 'https://example.com/ftv-cover1.jpg', episodeCount: 50, rating: 4.6, tags: ['mystery', 'romance'], synopsis: 'A mysterious love story' },
    episodes: {
        episodes: [
            { id: 'ftv-ep-001', title: 'Episode 1', sequence: 1, isLocked: false, duration: 120000 },
            { id: 'ftv-ep-002', title: 'Episode 2', sequence: 2, isLocked: false, duration: 115000 },
        ],
    },
    playback: { playUrl: 'https://cdn.example.com/ftv-video.mp4', expireTime: '2026-02-24T15:00:00Z' },
};

const cashDramaFixtures = {
    home: {
        blocks: [
            {
                name: 'Popular', dramas: [
                    { vid: 'cd-001', title: 'CEO\'s Secret', cover: 'https://example.com/cd-cover1.jpg', episodeCount: 90, rating: 4.7, tags: ['romance', 'ceo'] },
                ]
            },
            {
                name: 'New', dramas: [
                    { vid: 'cd-002', title: 'Revenge', cover: 'https://example.com/cd-cover2.jpg', episodeCount: 65, rating: 4.4, genres: ['drama', 'revenge'] },
                ]
            },
        ],
    },
    search: {
        data: [
            { vid: 'cd-001', title: 'CEO\'s Secret', cover: 'https://example.com/cd-cover1.jpg', episodeCount: 90, rating: 4.7, tags: ['romance', 'ceo'] },
        ],
    },
    detail: { vid: 'cd-001', title: 'CEO\'s Secret', cover: 'https://example.com/cd-cover1.jpg', episodeCount: 90, rating: 4.7, tags: ['romance', 'ceo'], synopsis: 'A CEO hides a secret' },
    episodes: {
        episodes: [
            { ep: 1, title: 'Episode 1', isLocked: false, duration: 90000 },
            { ep: 2, title: 'Episode 2', isLocked: true, duration: 95000 },
            { ep: 3, title: 'Episode 3', isLocked: true, duration: 88000 },
        ],
    },
    playback: { videoUrl: 'https://cdn.example.com/cd-video.mp4' },
};

const shortMaxFixtures = {
    home: {
        feed: [
            { code: 'sm-001', title: 'Werewolf Romance', cover: 'https://example.com/sm-cover1.jpg', episodeCount: 70, rating: 4.9, tags: ['fantasy', 'romance'] },
            { code: 'sm-002', title: 'Urban Legend', cover: 'https://example.com/sm-cover2.jpg', episodeCount: 55, rating: 4.2, genres: ['urban', 'fantasy'] },
        ],
    },
    search: {
        results: [
            { code: 'sm-001', title: 'Werewolf Romance', cover: 'https://example.com/sm-cover1.jpg', episodeCount: 70, rating: 4.9, tags: ['fantasy', 'romance'] },
        ],
    },
    detail: { code: 'sm-001', title: 'Werewolf Romance', cover: 'https://example.com/sm-cover1.jpg', episodeCount: 70, rating: 4.9, tags: ['fantasy', 'romance'], synopsis: 'A werewolf finds love' },
    episodes: {
        data: [
            { code: 'sm-ep-001', title: 'Episode 1', episodeNo: 1, isLocked: false, duration: 100000 },
            { code: 'sm-ep-002', title: 'Episode 2', episodeNo: 2, isLocked: false, duration: 105000 },
        ],
    },
    playback: { streamUrl: 'https://cdn.example.com/sm-video.mp4', expiresAt: '2026-02-24T15:00:00Z' },
};

// ============================================================================
// Helper assertions
// ============================================================================

function assertValidDramaCard(card: DramaCard, expectedProviderSlug: string) {
    expect(card).toBeDefined();
    expect(card.id).toMatch(new RegExp(`^${expectedProviderSlug}:`));
    expect(card.providerSlug).toBe(expectedProviderSlug);
    expect(card.providerDramaId).toBeDefined();
    expect(card.title).toBeDefined();
    expect(card.title.length).toBeGreaterThan(0);
    expect(card.coverUrl).toBeDefined();
    expect(card.episodeCount).toBeGreaterThanOrEqual(0);
    expect(card.providerName).toBeDefined();
    expect(card.vipLevel).toBeDefined();
}

function assertValidDramaDetail(detail: DramaDetail, expectedProviderSlug: string) {
    assertValidDramaCard(detail, expectedProviderSlug);
    expect(detail.synopsis).toBeDefined();
    expect(detail.genres).toBeInstanceOf(Array);
    expect(detail.language).toBeDefined();
    expect(detail.lastUpdated).toBeDefined();
}

function assertValidEpisodeItem(episode: EpisodeItem, expectedProviderSlug: string) {
    expect(episode).toBeDefined();
    expect(episode.episodeId).toMatch(new RegExp(`^${expectedProviderSlug}:`));
    expect(episode.episodeNo).toBeGreaterThanOrEqual(0);
    expect(episode.title).toBeDefined();
    expect(episode.durationMs).toBeGreaterThanOrEqual(0);
    expect(typeof episode.isLocked).toBe('boolean');
}

function assertValidPlaybackResponse(playback: PlaybackResponse) {
    expect(playback).toBeDefined();
    expect(playback.streamUrl).toBeDefined();
    expect(playback.streamUrl.length).toBeGreaterThan(0);
    expect(playback.expiresAt).toBeDefined();
}

// ============================================================================
// ReelShort Adapter Tests
// ============================================================================

describe('ReelShortAdapter', () => {
    const adapter = new ReelShortAdapter();

    describe('mapHome', () => {
        it('should map home response to DramaCard[]', () => {
            const result = adapter.mapHome(reelShortFixtures.home);

            expect(result.length).toBe(2);
            result.forEach(card => assertValidDramaCard(card, 'reelshort'));
            expect(result[0].title).toBe('Love in the City');
            expect(result[0].episodeCount).toBe(80);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapHome(reelShortFixtures.home);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapSearch', () => {
        it('should map search response to DramaCard[]', () => {
            const result = adapter.mapSearch(reelShortFixtures.search);

            expect(result.length).toBe(1);
            assertValidDramaCard(result[0], 'reelshort');
            expect(result[0].title).toBe('Love in the City');
        });
    });

    describe('mapDramaDetail', () => {
        it('should map drama detail response to DramaDetail', () => {
            const result = adapter.mapDramaDetail(reelShortFixtures.detail);

            assertValidDramaDetail(result, 'reelshort');
            expect(result.title).toBe('Love in the City');
            expect(result.providerDramaId).toBe('rs-001');
        });
    });

    describe('mapEpisodes', () => {
        it('should map episodes response to EpisodeItem[]', () => {
            const result = adapter.mapEpisodes(reelShortFixtures.episodes);

            expect(result.length).toBe(3);
            result.forEach(ep => assertValidEpisodeItem(ep, 'reelshort'));
            expect(result[0].title).toBe('Episode 1');
            expect(result[0].episodeNo).toBe(1);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapEpisodes(reelShortFixtures.episodes);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapPlayback', () => {
        it('should map playback response to PlaybackResponse', () => {
            const result = adapter.mapPlayback(reelShortFixtures.playback);

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/video.mp4');
        });
    });
});

// ============================================================================
// GoodShort Adapter Tests
// ============================================================================

describe('GoodShortAdapter', () => {
    const adapter = new GoodShortAdapter();

    describe('mapHome', () => {
        it('should map home response with data wrapper to DramaCard[]', () => {
            const result = adapter.mapHome(goodShortFixtures.home);

            expect(result.length).toBe(2);
            result.forEach(card => assertValidDramaCard(card, 'goodshort'));
            expect(result[0].title).toBe('Secret Love');
            expect(result[0].episodeCount).toBe(100);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapHome(goodShortFixtures.home);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapSearch', () => {
        it('should map search response with results wrapper to DramaCard[]', () => {
            const result = adapter.mapSearch(goodShortFixtures.search);

            expect(result.length).toBe(1);
            assertValidDramaCard(result[0], 'goodshort');
            expect(result[0].title).toBe('Secret Love');
        });
    });

    describe('mapDramaDetail', () => {
        it('should map drama detail response to DramaDetail', () => {
            const result = adapter.mapDramaDetail(goodShortFixtures.detail);

            assertValidDramaDetail(result, 'goodshort');
            expect(result.title).toBe('Secret Love');
            expect(result.synopsis).toBe('A secret love story');
        });
    });

    describe('mapEpisodes', () => {
        it('should map episodes response with chapters wrapper to EpisodeItem[]', () => {
            const result = adapter.mapEpisodes(goodShortFixtures.episodes);

            expect(result.length).toBe(2);
            result.forEach(ep => assertValidEpisodeItem(ep, 'goodshort'));
            expect(result[0].isLocked).toBe(false);
            expect(result[1].isLocked).toBe(true);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapEpisodes(goodShortFixtures.episodes);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapPlayback', () => {
        it('should map playback response to PlaybackResponse', () => {
            const result = adapter.mapPlayback(goodShortFixtures.playback);

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/gs-video.mp4');
        });
    });
});

// ============================================================================
// FlexTV Adapter Tests
// ============================================================================

describe('FlexTVAdapter', () => {
    const adapter = new FlexTVAdapter();

    describe('mapHome', () => {
        it('should map home response with tabs structure to DramaCard[]', () => {
            const result = adapter.mapHome(flexTVFixtures.home);

            expect(result.length).toBe(2);
            result.forEach(card => assertValidDramaCard(card, 'flextv'));
            expect(result[0].title).toBe('Mystery Love');
            expect(result[1].title).toBe('Action Hero');
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapHome(flexTVFixtures.home);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapSearch', () => {
        it('should map search response to DramaCard[]', () => {
            const result = adapter.mapSearch(flexTVFixtures.search);

            expect(result.length).toBe(1);
            assertValidDramaCard(result[0], 'flextv');
            expect(result[0].title).toBe('Mystery Love');
        });
    });

    describe('mapDramaDetail', () => {
        it('should map drama detail response to DramaDetail', () => {
            const result = adapter.mapDramaDetail(flexTVFixtures.detail);

            assertValidDramaDetail(result, 'flextv');
            expect(result.title).toBe('Mystery Love');
            expect(result.synopsis).toBe('A mysterious love story');
        });
    });

    describe('mapEpisodes', () => {
        it('should map episodes response to EpisodeItem[]', () => {
            const result = adapter.mapEpisodes(flexTVFixtures.episodes);

            expect(result.length).toBe(2);
            result.forEach(ep => assertValidEpisodeItem(ep, 'flextv'));
            expect(result[0].durationMs).toBe(120000);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapEpisodes(flexTVFixtures.episodes);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapPlayback', () => {
        it('should map playback response to PlaybackResponse', () => {
            const result = adapter.mapPlayback(flexTVFixtures.playback);

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/ftv-video.mp4');
        });
    });
});

// ============================================================================
// CashDrama Adapter Tests
// ============================================================================

describe('CashDramaAdapter', () => {
    const adapter = new CashDramaAdapter();

    describe('mapHome', () => {
        it('should map home response with blocks structure to DramaCard[]', () => {
            const result = adapter.mapHome(cashDramaFixtures.home);

            expect(result.length).toBe(2);
            result.forEach(card => assertValidDramaCard(card, 'cashdrama'));
            expect(result[0].title).toBe('CEO\'s Secret');
            expect(result[1].title).toBe('Revenge');
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapHome(cashDramaFixtures.home);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapSearch', () => {
        it('should map search response to DramaCard[]', () => {
            const result = adapter.mapSearch(cashDramaFixtures.search);

            expect(result.length).toBe(1);
            assertValidDramaCard(result[0], 'cashdrama');
            expect(result[0].title).toBe('CEO\'s Secret');
        });
    });

    describe('mapDramaDetail', () => {
        it('should map drama detail response to DramaDetail', () => {
            const result = adapter.mapDramaDetail(cashDramaFixtures.detail);

            assertValidDramaDetail(result, 'cashdrama');
            expect(result.title).toBe('CEO\'s Secret');
            expect(result.synopsis).toBe('A CEO hides a secret');
        });
    });

    describe('mapEpisodes', () => {
        it('should map episodes response to EpisodeItem[]', () => {
            const result = adapter.mapEpisodes(cashDramaFixtures.episodes);

            expect(result.length).toBe(3);
            result.forEach(ep => assertValidEpisodeItem(ep, 'cashdrama'));
            expect(result[0].episodeNo).toBe(1);
            expect(result[0].isLocked).toBe(false);
            expect(result[1].isLocked).toBe(true);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapEpisodes(cashDramaFixtures.episodes);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapPlayback', () => {
        it('should map playback response to PlaybackResponse', () => {
            const result = adapter.mapPlayback(cashDramaFixtures.playback);

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/cd-video.mp4');
        });
    });
});

// ============================================================================
// ShortMax Adapter Tests
// ============================================================================

describe('ShortMaxAdapter', () => {
    const adapter = new ShortMaxAdapter();

    describe('mapHome', () => {
        it('should map home response with feed wrapper to DramaCard[]', () => {
            const result = adapter.mapHome(shortMaxFixtures.home);

            expect(result.length).toBe(2);
            result.forEach(card => assertValidDramaCard(card, 'shortmax'));
            expect(result[0].title).toBe('Werewolf Romance');
            expect(result[0].episodeCount).toBe(70);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapHome(shortMaxFixtures.home);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapSearch', () => {
        it('should map search response to DramaCard[]', () => {
            const result = adapter.mapSearch(shortMaxFixtures.search);

            expect(result.length).toBe(1);
            assertValidDramaCard(result[0], 'shortmax');
            expect(result[0].title).toBe('Werewolf Romance');
        });
    });

    describe('mapDramaDetail', () => {
        it('should map drama detail response to DramaDetail', () => {
            const result = adapter.mapDramaDetail(shortMaxFixtures.detail);

            assertValidDramaDetail(result, 'shortmax');
            expect(result.title).toBe('Werewolf Romance');
            expect(result.synopsis).toBe('A werewolf finds love');
        });
    });

    describe('mapEpisodes', () => {
        it('should map episodes response to EpisodeItem[]', () => {
            const result = adapter.mapEpisodes(shortMaxFixtures.episodes);

            expect(result.length).toBe(2);
            result.forEach(ep => assertValidEpisodeItem(ep, 'shortmax'));
            expect(result[0].episodeNo).toBe(1);
            expect(result[0].durationMs).toBe(100000);
        });

        it('should fail if empty array returned for valid input', () => {
            const result = adapter.mapEpisodes(shortMaxFixtures.episodes);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('mapPlayback', () => {
        it('should map playback response to PlaybackResponse', () => {
            const result = adapter.mapPlayback(shortMaxFixtures.playback);

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/sm-video.mp4');
        });
    });
});

describe('NetShortAdapter', () => {
    const adapter = new NetShortAdapter();

    describe('mapDramaDetail', () => {
        it('should map detail response with labels and totalEpisodes', () => {
            const result = adapter.mapDramaDetail({
                code: 200,
                data: {
                    id: '2021762099104944130',
                    title: 'Dunia Game Ini, Aku yang Berkuasa',
                    cover: 'https://cdn.example.com/netshort-cover.webp',
                    description: 'Sinopsis netshort',
                    labels: ['Fantasy', 'Subtitle'],
                    totalEpisodes: 75,
                },
            });

            assertValidDramaDetail(result, 'netshort');
            expect(result.episodeCount).toBe(75);
            expect(result.tags).toContain('Subtitle');
        });
    });

    describe('mapEpisodes', () => {
        it('should map embedded episodes response', () => {
            const result = adapter.mapEpisodes({
                code: 200,
                data: {
                    episodes: [
                        { episodeNo: 1, episodeId: 'ep-1', cover: 'https://cdn.example.com/ep1.webp', isLocked: false },
                        { episodeNo: 2, episodeId: 'ep-2', cover: 'https://cdn.example.com/ep2.webp', isLocked: true },
                    ],
                },
            });

            expect(result).toHaveLength(2);
            assertValidEpisodeItem(result[0], 'netshort');
            expect(result[0].providerEpisodeId).toBe('ep-1');
            expect(result[1].isLocked).toBe(true);
        });
    });

    describe('mapPlayback', () => {
        it('should map videos array response to PlaybackResponse', () => {
            const result = adapter.mapPlayback({
                code: 200,
                data: {
                    episodeId: '2025422871068672015',
                    videos: [{ url: 'https://cdn.example.com/netshort-video.mp4' }],
                    subtitles: [
                        {
                            language: 'id_ID',
                            format: 'webvtt',
                            url: 'https://cdn.example.com/netshort-subtitle.vtt',
                        },
                    ],
                },
            });

            assertValidPlaybackResponse(result);
            expect(result.streamUrl).toBe('https://cdn.example.com/netshort-video.mp4');
            expect(result.subtitles).toHaveLength(1);
            expect(result.subtitles?.[0]).toMatchObject({
                src: 'https://cdn.example.com/netshort-subtitle.vtt',
                srclang: 'id_ID',
            });
        });
    });
});

// ============================================================================
// Adapter Registry Tests
// ============================================================================

describe('Adapter Registry', () => {
    it('should have all Golden-5 adapters registered', async () => {
        const { adapters } = await import('../src/lib/providers/adapters/index');

        expect(adapters.has('reelshort')).toBe(true);
        expect(adapters.has('goodshort')).toBe(true);
        expect(adapters.has('flextv')).toBe(true);
        expect(adapters.has('cashdrama')).toBe(true);
        expect(adapters.has('shortmax')).toBe(true);
    });

    it('should return correct adapter instances', async () => {
        const { getAdapter } = await import('../src/lib/providers/adapters/index');

        expect(getAdapter('reelshort')).toBeInstanceOf(ReelShortAdapter);
        expect(getAdapter('goodshort')).toBeInstanceOf(GoodShortAdapter);
        expect(getAdapter('flextv')).toBeInstanceOf(FlexTVAdapter);
        expect(getAdapter('cashdrama')).toBeInstanceOf(CashDramaAdapter);
        expect(getAdapter('shortmax')).toBeInstanceOf(ShortMaxAdapter);
    });

    it('should return undefined for unknown provider', async () => {
        const { getAdapter } = await import('../src/lib/providers/adapters/index');

        expect(getAdapter('unknown-provider')).toBeUndefined();
    });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe('Adapter Edge Cases', () => {
    const adapters = [
        { name: 'ReelShort', instance: new ReelShortAdapter() },
        { name: 'GoodShort', instance: new GoodShortAdapter() },
        { name: 'FlexTV', instance: new FlexTVAdapter() },
        { name: 'CashDrama', instance: new CashDramaAdapter() },
        { name: 'ShortMax', instance: new ShortMaxAdapter() },
    ];

    describe.each(adapters)('$name adapter edge cases', ({ instance }) => {
        it('should handle empty array input for home', () => {
            const result = instance.mapHome([]);
            expect(result).toEqual([]);
        });

        it('should handle empty array input for search', () => {
            const result = instance.mapSearch([]);
            expect(result).toEqual([]);
        });

        it('should handle empty array input for episodes', () => {
            const result = instance.mapEpisodes([]);
            expect(result).toEqual([]);
        });

        it('should handle null-like input gracefully for home', () => {
            const result = instance.mapHome(null);
            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle null-like input gracefully for search', () => {
            const result = instance.mapSearch(null);
            expect(Array.isArray(result)).toBe(true);
        });

        it('should handle null-like input gracefully for episodes', () => {
            const result = instance.mapEpisodes(null);
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
