'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DramaCard } from '@/lib/types';

const RECENT_SEARCHES_KEY = 'dracinhub_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export type SearchTab = 'all' | 'drama' | 'provider' | 'genre';
export type SortOption = 'relevance' | 'newest' | 'rating' | 'popular';

export interface SearchFilters {
    providers: string[];
    genres: string[];
}

export interface SearchState {
    query: string;
    results: DramaCard[];
    filteredResults: DramaCard[];
    filters: SearchFilters;
    sort: SortOption;
    activeTab: SearchTab;
    recentSearches: string[];
    suggestions: string[];
    isFilterOpen: boolean;
    page: number;
    hasMore: boolean;
    loading: boolean;
    searched: boolean;
}

interface UseSearchReturn extends SearchState {
    setQuery: (query: string) => void;
    setFilters: (filters: SearchFilters) => void;
    setSort: (sort: SortOption) => void;
    setActiveTab: (tab: SearchTab) => void;
    setIsFilterOpen: (open: boolean) => void;
    toggleProvider: (provider: string) => void;
    toggleGenre: (genre: string) => void;
    addToRecentSearches: (query: string) => void;
    clearRecentSearches: () => void;
    removeRecentSearch: (query: string) => void;
    loadMore: () => void;
    resetFilters: () => void;
    search: (query?: string) => Promise<void>;
}

// Popular suggestions for autocomplete
const POPULAR_SUGGESTIONS = [
    'CEO Billionaire',
    'CEO Revenge',
    'CEO Romance',
    'Balas Dendam',
    'Pewaris',
    'Vampir',
    'Istri',
    'Cinta Terlarang',
    'Pernikahan Kontrak',
    'Dokter',
    'Pengusaha',
    'Anak Hilang',
];

// Available genres
export const AVAILABLE_GENRES = [
    'Romance',
    'Action',
    'Comedy',
    'Thriller',
    'Drama',
    'Fantasy',
    'Horror',
    'Mystery',
];

// Available providers (will be populated from API)
export const AVAILABLE_PROVIDERS = [
    { slug: 'dramabox', name: 'DramaBox' },
    { slug: 'shortmax', name: 'ShortMax' },
    { slug: 'flextv', name: 'FlexTV' },
    { slug: 'goodshort', name: 'GoodShort' },
    { slug: 'netshort', name: 'NetShort' },
    { slug: 'reelshort', name: 'ReelShort' },
    { slug: 'cashdrama', name: 'CashDrama' },
];

export function useSearch(): UseSearchReturn {
    const [query, setQueryState] = useState('');
    const [results, setResults] = useState<DramaCard[]>([]);
    const [filteredResults, setFilteredResults] = useState<DramaCard[]>([]);
    const [filters, setFiltersState] = useState<SearchFilters>({
        providers: [],
        genres: [],
    });
    const [sort, setSort] = useState<SortOption>('relevance');
    const [activeTab, setActiveTab] = useState<SearchTab>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const abortControllerRef = useRef<AbortController | null>(null);

    // Load recent searches from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
                }
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Update suggestions based on query
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        const queryLower = query.toLowerCase();
        const filtered = POPULAR_SUGGESTIONS.filter(
            (s) => s.toLowerCase().includes(queryLower) && s.toLowerCase() !== queryLower
        ).slice(0, 5);

        setSuggestions(filtered);
    }, [query]);

    // Apply filters and sorting whenever results, filters, sort, or tab changes
    useEffect(() => {
        let filtered = [...results];

        // Apply tab filter
        if (activeTab === 'drama') {
            // Already filtered by search
        } else if (activeTab === 'provider') {
            // Group by provider - for now just show all with provider info
        } else if (activeTab === 'genre') {
            // Filter by genre tags
            if (filters.genres.length > 0) {
                filtered = filtered.filter((drama) =>
                    filters.genres.some((g) =>
                        drama.tags.some((tag) => tag.toLowerCase() === g.toLowerCase())
                    )
                );
            }
        }

        // Apply provider filter
        if (filters.providers.length > 0) {
            filtered = filtered.filter((drama) =>
                filters.providers.includes(drama.providerSlug)
            );
        }

        // Apply genre filter from sidebar
        if (filters.genres.length > 0 && activeTab !== 'genre') {
            filtered = filtered.filter((drama) =>
                filters.genres.some((g) =>
                    drama.tags.some((tag) => tag.toLowerCase() === g.toLowerCase())
                )
            );
        }

        // Apply sorting
        switch (sort) {
            case 'rating':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'newest':
                // Assume higher ID means newer (UUID v7) or use other heuristics
                filtered.sort((a, b) => b.id.localeCompare(a.id));
                break;
            case 'popular':
                // Sort by episode count as a proxy for popularity
                filtered.sort((a, b) => b.episodeCount - a.episodeCount);
                break;
            case 'relevance':
            default:
                // Keep original order from API
                break;
        }

        setFilteredResults(filtered);
    }, [results, filters, sort, activeTab]);

    const addToRecentSearches = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setRecentSearches((prev) => {
            const newSearches = [
                searchQuery,
                ...prev.filter((s) => s !== searchQuery),
            ].slice(0, MAX_RECENT_SEARCHES);

            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
            } catch {
                // Ignore localStorage errors
            }

            return newSearches;
        });
    }, []);

    const clearRecentSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    const removeRecentSearch = useCallback((searchQuery: string) => {
        setRecentSearches((prev) => {
            const newSearches = prev.filter((s) => s !== searchQuery);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newSearches));
            } catch {
                // Ignore localStorage errors
            }
            return newSearches;
        });
    }, []);

    const toggleProvider = useCallback((provider: string) => {
        setFiltersState((prev) => ({
            ...prev,
            providers: prev.providers.includes(provider)
                ? prev.providers.filter((p) => p !== provider)
                : [...prev.providers, provider],
        }));
    }, []);

    const toggleGenre = useCallback((genre: string) => {
        setFiltersState((prev) => ({
            ...prev,
            genres: prev.genres.includes(genre)
                ? prev.genres.filter((g) => g !== genre)
                : [...prev.genres, genre],
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFiltersState({ providers: [], genres: [] });
        setSort('relevance');
    }, []);

    const search = useCallback(
        async (searchQuery?: string) => {
            const q = searchQuery ?? query;
            if (!q.trim()) return;

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            setLoading(true);
            setSearched(true);
            setPage(1);
            setHasMore(true);

            try {
                const params = new URLSearchParams();
                params.append('q', q);
                params.append('page', '1');
                params.append('limit', '24');

                if (filters.providers.length > 0) {
                    params.append('providers', filters.providers.join(','));
                }

                if (filters.genres.length > 0) {
                    params.append('genres', filters.genres.join(','));
                }

                params.append('sort', sort);

                const response = await fetch(`/api/v1/search?${params.toString()}`, {
                    signal: abortControllerRef.current.signal,
                });

                const data = await response.json();

                if (data.error) {
                    throw new Error(data.error.message);
                }

                setResults(data.data || []);
                setHasMore((data.data || []).length === 24);

                // Add to recent searches
                addToRecentSearches(q);
            } catch (error) {
                if (error instanceof Error && error.name !== 'AbortError') {
                    console.error('Search failed:', error);
                    setResults([]);
                }
            } finally {
                setLoading(false);
            }
        },
        [query, filters, sort, addToRecentSearches]
    );

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        const nextPage = page + 1;
        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('q', query);
            params.append('page', nextPage.toString());
            params.append('limit', '24');

            if (filters.providers.length > 0) {
                params.append('providers', filters.providers.join(','));
            }

            if (filters.genres.length > 0) {
                params.append('genres', filters.genres.join(','));
            }

            params.append('sort', sort);

            const response = await fetch(`/api/v1/search?${params.toString()}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const newResults = data.data || [];
            setResults((prev) => [...prev, ...newResults]);
            setPage(nextPage);
            setHasMore(newResults.length === 24);
        } catch (error) {
            console.error('Load more failed:', error);
        } finally {
            setLoading(false);
        }
    }, [query, filters, sort, page, hasMore, loading]);

    const setQuery = useCallback((newQuery: string) => {
        setQueryState(newQuery);
    }, []);

    const setFilters = useCallback((newFilters: SearchFilters) => {
        setFiltersState(newFilters);
    }, []);

    return {
        query,
        results,
        filteredResults,
        filters,
        sort,
        activeTab,
        recentSearches,
        suggestions,
        isFilterOpen,
        page,
        hasMore,
        loading,
        searched,
        setQuery,
        setFilters,
        setSort,
        setActiveTab,
        setIsFilterOpen,
        toggleProvider,
        toggleGenre,
        addToRecentSearches,
        clearRecentSearches,
        removeRecentSearch,
        loadMore,
        resetFilters,
        search,
    };
}
