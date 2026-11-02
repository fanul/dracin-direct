'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DramaCard } from '../lib/types';

interface Genre {
    id: string;
    name: string;
    slug: string;
    description: string;
    dramaCount: number;
}

interface GenreState {
    genre: Genre | null;
    dramas: DramaCard[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
}

export function useGenre(slug: string) {
    const [state, setState] = useState<GenreState>({
        genre: null,
        dramas: [],
        loading: true,
        error: null,
        hasMore: true,
        page: 1,
    });

    const [filters, setFilters] = useState({
        sortBy: 'popular' as 'popular' | 'newest' | 'rating',
        provider: '',
    });

    // Fetch genre data
    const fetchGenre = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '24',
                sortBy: filters.sortBy,
            });

            if (filters.provider) {
                params.append('provider', filters.provider);
            }

            const response = await fetch(`/api/v1/genres/${slug}?${params}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to fetch genre');
            }

            setState(prev => ({
                genre: result.data.genre,
                dramas: append ? [...prev.dramas, ...result.data.dramas] : result.data.dramas,
                loading: false,
                error: null,
                hasMore: result.data.pagination.hasMore,
                page: page,
            }));
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : 'An error occurred',
            }));
        }
    }, [slug, filters]);

    // Initial fetch
    useEffect(() => {
        fetchGenre(1, false);
    }, [fetchGenre]);

    // Refetch when filters change
    useEffect(() => {
        setState(prev => ({ ...prev, dramas: [], page: 1, hasMore: true }));
        fetchGenre(1, false);
    }, [filters.sortBy, filters.provider, fetchGenre]);

    const setSortBy = useCallback((sortBy: 'popular' | 'newest' | 'rating') => {
        setFilters(prev => ({ ...prev, sortBy }));
    }, []);

    const setProvider = useCallback((provider: string) => {
        setFilters(prev => ({ ...prev, provider }));
    }, []);

    const loadMore = useCallback(() => {
        if (state.hasMore && !state.loading) {
            fetchGenre(state.page + 1, true);
        }
    }, [state.hasMore, state.loading, state.page, fetchGenre]);

    return {
        ...state,
        filters,
        setSortBy,
        setProvider,
        loadMore,
        refresh: () => fetchGenre(1, false),
    };
}

export default useGenre;
