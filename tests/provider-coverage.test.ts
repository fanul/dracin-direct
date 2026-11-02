import { describe, it, expect } from 'vitest';
import { providerCatalog } from '../src/lib/providers/catalog';
import { getAdapter, getAllAdapterSlugs, getActiveProviderCount } from '../src/lib/providers/adapters';
import { GenericProviderAdapter } from '../src/lib/providers/adapters/generic';

describe('Provider Coverage - All 41 Active Providers', () => {
    it('should have 41 active providers in catalog', () => {
        const activeProviders = providerCatalog.getActiveProviders();
        expect(activeProviders.length).toBe(41);
    });

    it('should not include dramabox (maintenance provider)', () => {
        const dramabox = providerCatalog.getProvider('dramabox');
        expect(dramabox).toBeUndefined();
    });

    it('should have adapters for all 41 active providers', () => {
        const adapterSlugs = getAllAdapterSlugs();
        expect(adapterSlugs.length).toBe(41);
    });

    it('should have correct provider count', () => {
        expect(getActiveProviderCount()).toBe(41);
    });

    it('should have VIP distribution matching expected', () => {
        const providers = providerCatalog.getActiveProviders();
        const vipCounts: Record<string, number> = {};

        for (const p of providers) {
            vipCounts[p.vip] = (vipCounts[p.vip] || 0) + 1;
        }

        expect(vipCounts['VIP1']).toBe(6);
        expect(vipCounts['VIP2']).toBe(3);
        expect(vipCounts['VIP3']).toBe(3);
        expect(vipCounts['VIP5']).toBe(7);
        expect(vipCounts['VIP6']).toBe(4);
        expect(vipCounts['VIP7']).toBe(4);
        expect(vipCounts['VIP8']).toBe(4);
        expect(vipCounts['VIP9']).toBe(10);
    });

    describe('All provider slugs should be registered', () => {
        const expectedSlugs = [
            'bilitv', 'cashdrama', 'dotdrama', 'dramabite', 'dramadash',
            'dramanova', 'dramanow', 'dramapops', 'dramarush', 'dramawave',
            'dreamshort', 'flextv', 'flickreels', 'flickshort', 'freereels',
            'fundrama', 'goodshort', 'hishort', 'idrama', 'kalostv',
            'melolo', 'meloshort', 'microdrama', 'minutedrama', 'mydrama',
            'netshort', 'radreels', 'rapidtv', 'reelife', 'reelshort',
            'shortbox', 'shorten', 'shortmax', 'shortsky', 'shotshort',
            'snackshort', 'sodareels', 'stardusttv', 'starshort', 'velolo', 'vigloo'
        ].sort();

        it.each(expectedSlugs)('should have adapter for %s', (slug) => {
            const adapter = getAdapter(slug);
            expect(adapter).toBeDefined();
        });
    });

    describe('Generic adapter functionality', () => {
        it('should create generic adapter with correct properties', () => {
            const adapter = new GenericProviderAdapter('Test Provider', 'testprovider', 'VIP9');
            expect(adapter.name).toBe('Test Provider');
            expect(adapter.slug).toBe('testprovider');
        });

        it('should map home response with various patterns', () => {
            const adapter = new GenericProviderAdapter('Test', 'test', 'VIP9');

            // Test with direct array
            const directArray = [
                { id: '1', title: 'Drama 1', coverUrl: 'http://example.com/1.jpg' },
                { id: '2', title: 'Drama 2', coverUrl: 'http://example.com/2.jpg' }
            ];
            expect(adapter.mapHome(directArray).length).toBe(2);

            // Test with data wrapper
            const dataWrapper = { data: { list: directArray } };
            expect(adapter.mapHome(dataWrapper).length).toBe(2);

            // Test with results wrapper
            const resultsWrapper = { results: directArray };
            expect(adapter.mapHome(resultsWrapper).length).toBe(2);
        });

        it('should handle missing fields gracefully', () => {
            const adapter = new GenericProviderAdapter('Test', 'test', 'VIP9');

            const incompleteData = [
                { id: '1' }, // Missing title, coverUrl
                { id: '2', title: 'Has Title' }
            ];

            const result = adapter.mapHome(incompleteData);
            expect(result.length).toBe(2);
            expect(result[0].title).toBe('Untitled');
            expect(result[0].coverUrl).toBe('');
        });

        it('should extract episode numbers correctly', () => {
            const adapter = new GenericProviderAdapter('Test', 'test', 'VIP9');

            const episodesData = {
                episodes: [
                    { id: 'ep1', title: 'Episode 1', episodeNo: 1 },
                    { id: 'ep2', episodeNumber: 2 },
                    { id: 'ep3', number: 3 },
                    { id: 'ep4' } // Will use index + 1
                ]
            };

            const result = adapter.mapEpisodes(episodesData);
            expect(result.length).toBe(4);
            expect(result[0].episodeNo).toBe(1);
            expect(result[1].episodeNo).toBe(2);
            expect(result[2].episodeNo).toBe(3);
            expect(result[3].episodeNo).toBe(4);
        });
    });

    describe('Provider capabilities', () => {
        it('should derive capabilities from endpoints for all providers', () => {
            const providers = providerCatalog.getActiveProviders();

            for (const provider of providers) {
                const capabilities = providerCatalog.getCapabilities(provider.slug);
                expect(capabilities).toBeDefined();
                expect(capabilities?.playbackType).toBeDefined();
            }
        });

        it('should identify providers with home support', () => {
            // Providers with explicit home/feed/popular/ranking endpoints (based on actual catalog data)
            const providersWithHome = [
                'hishort', 'stardusttv', 'snackshort', 'freereels',
                'cashdrama', 'shotshort', 'sodareels', 'radreels',
                'shortsky', 'flickshort', 'dramawave', 'dramarush',
                'reelife', 'vigloo', 'dreamshort', 'shortbox',
                'goodshort', 'bilitv', 'dramabite', 'dramanova', 'dramapops',
                'kalostv', 'shortmax', 'reelshort'
            ];

            for (const slug of providersWithHome) {
                const caps = providerCatalog.getCapabilities(slug);
                expect(caps?.supportsHome, `${slug} should support home`).toBe(true);
            }
        });

        it('should identify providers with search support', () => {
            const providers = providerCatalog.getActiveProviders();
            const providersWithSearch = providers.filter(p =>
                p.endpoints.some(e => /search/i.test(e.path))
            );

            expect(providersWithSearch.length).toBeGreaterThan(30);

            for (const provider of providersWithSearch) {
                const caps = providerCatalog.getCapabilities(provider.slug);
                expect(caps?.supportsSearch, `${provider.slug} should support search`).toBe(true);
            }
        });
    });

    describe('Endpoint resolution', () => {
        it('should resolve home endpoint for providers with home capability', () => {
            const resolved = providerCatalog.resolveEndpoint('reelshort', 'home');
            expect(resolved).not.toBeNull();
            expect(resolved?.url).toContain('/foryou');
        });

        it('should resolve search endpoint with query params', () => {
            const resolved = providerCatalog.resolveEndpoint('reelshort', 'search', { q: 'test' });
            expect(resolved).not.toBeNull();
            expect(resolved?.missingParams).toHaveLength(0);
        });

        it('should identify missing params', () => {
            const resolved = providerCatalog.resolveEndpoint('reelshort', 'detail', {});
            expect(resolved?.missingParams.length).toBeGreaterThan(0);
        });

        it('should return null for inactive providers', () => {
            const resolved = providerCatalog.resolveEndpoint('dramabox', 'home');
            expect(resolved).toBeNull();
        });
    });
});
