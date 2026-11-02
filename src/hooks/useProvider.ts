'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DramaCard } from '../lib/types';

interface Provider {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    rating: number;
    dramaCount: number;
    episodeCount: number;
    websiteUrl: string;
    description: string;
}

interface ProviderState {
    provider: Provider | null;
    dramas: DramaCard[];
    genres: string[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    page: number;
}

function dedupeDramas(dramas: DramaCard[]): DramaCard[] {
    const seen = new Set<string>();
    const result: DramaCard[] = [];

    for (const drama of dramas) {
        const key = `${drama.providerSlug}:${drama.providerDramaId}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(drama);
    }

    return result;
}

export function useProvider(slug: string) {
    const [state, setState] = useState<ProviderState>({
        provider: null,
        dramas: [],
        genres: [],
        loading: true,
        error: null,
        hasMore: true,
        page: 1,
    });

    const [activeGenre, setActiveGenre] = useState('all');

    // Fetch provider data
    const fetchProvider = useCallback(async (page: number = 1, append: boolean = false) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '24',
            });

            if (activeGenre !== 'all') {
                params.append('genre', activeGenre);
            }

            const response = await fetch(`/api/v1/providers/${slug}?${params}`);
            const result = await response.json();

            if (result.error) {
                throw new Error(result.error.message || 'Failed to fetch provider');
            }

            setState(prev => ({
                provider: result.data.provider,
                dramas: dedupeDramas(append ? [...prev.dramas, ...result.data.dramas] : result.data.dramas),
                genres: result.data.genres || [],
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
    }, [slug, activeGenre]);

    // Initial fetch
    useEffect(() => {
        fetchProvider(1, false);
    }, [fetchProvider]);

    // Refetch when genre filter changes
    useEffect(() => {
        setState(prev => ({ ...prev, dramas: [], page: 1, hasMore: true }));
        fetchProvider(1, false);
    }, [activeGenre, fetchProvider]);

    const onGenreChange = useCallback((genre: string) => {
        setActiveGenre(genre);
    }, []);

    const loadMore = useCallback(() => {
        if (state.hasMore && !state.loading) {
            fetchProvider(state.page + 1, true);
        }
    }, [state.hasMore, state.loading, state.page, fetchProvider]);

    return {
        ...state,
        activeGenre,
        onGenreChange,
        loadMore,
        refresh: () => fetchProvider(1, false),
    };
}

export default useProvider;
