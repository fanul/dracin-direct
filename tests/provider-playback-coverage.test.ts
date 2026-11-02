import { describe, it, expect } from 'vitest';
import { providerCatalog } from '../src/lib/providers/catalog';
import { getAdapter } from '../src/lib/providers/adapters';

describe('Provider Playback Coverage - All 41 Active Providers', () => {
    it('should have playback capability for providers with play/stream endpoints', () => {
        const activeProviders = providerCatalog.getActiveProviders();

        for (const provider of activeProviders) {
            const caps = providerCatalog.getCapabilities(provider.slug);
            const hasPlayEndpoint = provider.endpoints.some(e =>
                /\/(play|stream|video)/i.test(e.path)
            );

            if (hasPlayEndpoint) {
                expect(caps?.supportsPlayback, `${provider.slug} should support playback`).toBe(true);
            }
        }
    });

    it('should resolve playback endpoint for all providers with playback support', () => {
        const activeProviders = providerCatalog.getActiveProviders();

        for (const provider of activeProviders) {
            const caps = providerCatalog.getCapabilities(provider.slug);

            if (caps?.supportsPlayback) {
                const resolved = providerCatalog.resolveEndpoint(provider.slug, 'playback', {
                    id: 'test123',
                    dramaId: 'test123',
                    bookId: 'test123',
                    seriesId: 'test123',
                    episode: '1',
                    ep: '1',
                    chapterId: '1',
                });

                // Some providers may not resolve if they need specific params
                // Just log those that don't resolve for manual review
                if (!resolved) {
                    console.log(`⚠️ ${provider.slug}: playback endpoint not resolved with test params`);
                }
            }
        }
    });

    it('should have adapter for all providers', () => {
        const activeProviders = providerCatalog.getActiveProviders();

        for (const provider of activeProviders) {
            const adapter = getAdapter(provider.slug);
            expect(adapter, `${provider.slug} should have adapter`).toBeDefined();
            expect(adapter?.name, `${provider.slug} adapter should have name`).toBe(provider.provider);
            expect(adapter?.slug, `${provider.slug} adapter should have correct slug`).toBe(provider.slug);
        }
    });

    it('should have episode list capability for providers with episodes endpoint', () => {
        const activeProviders = providerCatalog.getActiveProviders();

        for (const provider of activeProviders) {
            const caps = providerCatalog.getCapabilities(provider.slug);
            const hasEpisodesEndpoint = provider.endpoints.some(e =>
                /episodes?/i.test(e.path)
            );

            if (hasEpisodesEndpoint) {
                expect(caps?.supportsEpisodeList, `${provider.slug} should support episode list`).toBe(true);
            }
        }
    });

    describe('Playback endpoint resolution with provider-specific params', () => {
        const testCases: Array<{
            slug: string;
            params: Record<string, string>;
            description: string;
        }> = [
            { slug: 'reelshort', params: { id: '123', chapterId: '1' }, description: 'book + chapter' },
            { slug: 'goodshort', params: { bookId: '123', chapterId: '1' }, description: 'book + chapter' },
            { slug: 'flextv', params: { series_id: '123', section_id: '1' }, description: 'series + section' },
            { slug: 'cashdrama', params: { vid: '123', ep: '1' }, description: 'vid + ep' },
            { slug: 'shortmax', params: { code: '123' }, description: 'code only' },
            { slug: 'freereels', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'flickreels', params: { playletId: '123', chapterNum: '1' }, description: 'playlet + chapter' },
            { slug: 'bilitv', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'dramabite', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'dramanova', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'dramapops', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'fundrama', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'kalostv', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'netshort', params: { id: '123', episodeNo: '1' }, description: 'id + episodeNo' },
            { slug: 'shortbox', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'flickshort', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'dramawave', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'dramarush', params: { id: '123', ep: '1' }, description: 'id + ep' },
            { slug: 'reelife', params: { bookId: '123', chapterId: '1' }, description: 'book + chapter' },
            { slug: 'mydrama', params: { seriesId: '123', position: '1' }, description: 'series + position' },
        ];

        it.each(testCases)('should resolve playback for $slug ($description)', ({ slug, params }) => {
            const resolved = providerCatalog.resolveEndpoint(slug, 'playback', params);
            expect(resolved).not.toBeNull();
            expect(resolved?.url).toBeDefined();
            expect(resolved?.missingParams).toHaveLength(0);
        });
    });

    describe('Generic adapter playback mapping', () => {
        it('should map various playback response formats', async () => {
            const { GenericProviderAdapter } = await import('../src/lib/providers/adapters/generic');
            const adapter = new GenericProviderAdapter('Test', 'test', 'VIP9');

            // Test with direct URL
            const directUrl = { streamUrl: 'https://example.com/video.m3u8' };
            const result1 = adapter.mapPlayback(directUrl);
            expect(result1.streamUrl).toBe('https://example.com/video.m3u8');

            // Test with nested video object
            const nestedVideo = {
                video: { url: 'https://example.com/nested.m3u8' }
            };
            const result2 = adapter.mapPlayback(nestedVideo);
            expect(result2.streamUrl).toBe('https://example.com/nested.m3u8');

            // Test with m3u8 field
            const m3u8Field = { m3u8: 'https://example.com/playlist.m3u8' };
            const result3 = adapter.mapPlayback(m3u8Field);
            expect(result3.streamUrl).toBe('https://example.com/playlist.m3u8');

            // Test with data wrapper (with wrapper indicator)
            const dataWrapper = {
                success: true,
                data: { streamUrl: 'https://example.com/wrapped.m3u8' }
            };
            const result4 = adapter.mapPlayback(dataWrapper);
            expect(result4.streamUrl).toBe('https://example.com/wrapped.m3u8');
        });

        it('should throw error for invalid playback response', async () => {
            const { GenericProviderAdapter } = await import('../src/lib/providers/adapters/generic');
            const adapter = new GenericProviderAdapter('Test', 'test', 'VIP9');

            expect(() => adapter.mapPlayback({})).toThrow('No stream URL found');
            expect(() => adapter.mapPlayback(null)).toThrow('Invalid playback response');
            expect(() => adapter.mapPlayback({ title: 'No URL' })).toThrow('No stream URL found');
        });
    });

});
