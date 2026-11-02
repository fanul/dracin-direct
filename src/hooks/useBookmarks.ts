'use client';

import { useState, useEffect, useCallback } from 'react';

interface Bookmark {
    id: string;
    dramaId: string;
    title: string;
    slug: string;
    providerName: string;
    providerSlug: string;
    totalEpisodes: number;
    posterUrl: string;
    rating: number;
    createdAt: string;
}

interface BookmarksState {
    bookmarks: Bookmark[];
    loading: boolean;
    error: string | null;
}

export function useBookmarks() {
    const [state, setState] = useState<BookmarksState>({
        bookmarks: [],
        loading: true,
        error: null,
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Fetch bookmarks
    const fetchBookmarks = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/v1/bookmarks?userId=guest');
            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to fetch bookmarks');
            }

            const apiBookmarks = result.data?.bookmarks ?? [];
            const mappedBookmarks: Bookmark[] = apiBookmarks.map((item: any) => ({
                id: item.id,
                dramaId: item.id,
                title: item.title || '',
                slug: item.providerDramaId || item.id,
                providerName: item.providerName || item.providerSlug || '',
                providerSlug: item.providerSlug || '',
                totalEpisodes: item.episodeCount || 0,
                posterUrl: item.coverUrl || '',
                rating: Number(item.rating || 0),
                createdAt: '',
            }));

            setState({
                bookmarks: mappedBookmarks,
                loading: false,
                error: null,
            });
        } catch (err) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: err instanceof Error ? err.message : 'An error occurred',
            }));
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchBookmarks();
    }, [fetchBookmarks]);

    // Add bookmark
    const addBookmark = useCallback(async (dramaId: string) => {
        try {
            const response = await fetch('/api/v1/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'guest', dramaId }),
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to add bookmark');
            }

            await fetchBookmarks();
            return true;
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to add bookmark',
            }));
            return false;
        }
    }, [fetchBookmarks]);

    // Remove bookmark
    const removeBookmark = useCallback(async (dramaId: string) => {
        try {
            const response = await fetch(`/api/v1/bookmarks?userId=guest&dramaId=${encodeURIComponent(dramaId)}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to remove bookmark');
            }

            await fetchBookmarks();
            return true;
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to remove bookmark',
            }));
            return false;
        }
    }, [fetchBookmarks]);

    // Delete selected bookmarks
    const deleteSelected = useCallback(async () => {
        if (selectedIds.length === 0) return;

        try {
            // Delete bookmarks one by one
            await Promise.all(selectedIds.map(id => removeBookmark(id)));

            setSelectedIds([]);
            setIsEditMode(false);
            await fetchBookmarks();
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to delete',
            }));
        }
    }, [selectedIds, removeBookmark, fetchBookmarks]);

    // Clear all bookmarks
    const clearAll = useCallback(async () => {
        if (!confirm('Hapus semua bookmark?')) return;

        try {
            const response = await fetch('/api/v1/bookmarks?userId=guest&clearAll=true', {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to clear bookmarks');
            }

            await fetchBookmarks();
            setIsEditMode(false);
            setSelectedIds([]);
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to clear bookmarks',
            }));
        }
    }, [fetchBookmarks]);

    // Toggle edit mode
    const toggleEditMode = useCallback(() => {
        setIsEditMode(prev => !prev);
        setSelectedIds([]);
    }, []);

    // Toggle item selection
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(itemId => itemId !== id)
                : [...prev, id]
        );
    }, []);

    // Select all items
    const selectAll = useCallback(() => {
        const allIds = state.bookmarks.map(item => item.dramaId);
        setSelectedIds(allIds);
    }, [state.bookmarks]);

    // Check if drama is bookmarked
    const isBookmarked = useCallback((dramaId: string) => {
        return state.bookmarks.some(b => b.dramaId === dramaId);
    }, [state.bookmarks]);

    return {
        ...state,
        isEditMode,
        selectedIds,
        toggleEditMode,
        toggleSelect,
        selectAll,
        deleteSelected,
        clearAll,
        addBookmark,
        removeBookmark,
        isBookmarked,
        refresh: fetchBookmarks,
        totalCount: state.bookmarks.length,
    };
}

export default useBookmarks;
