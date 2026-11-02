'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryItem {
    id: string;
    dramaId: string;
    dramaTitle: string;
    providerDramaId: string;
    providerSlug: string;
    episodeNumber: number;
    totalEpisodes: number;
    progressPercent: number;
    thumbnailUrl: string;
    watchedAt: string;
}

interface GroupedHistory {
    today: HistoryItem[];
    yesterday: HistoryItem[];
    lastWeek: HistoryItem[];
    lastMonth: HistoryItem[];
    older: HistoryItem[];
}

interface HistoryState {
    history: GroupedHistory;
    loading: boolean;
    error: string | null;
}

export function useHistory() {
    const [state, setState] = useState<HistoryState>({
        history: {
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: [],
        },
        loading: true,
        error: null,
    });

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Fetch history
    const fetchHistory = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await fetch('/api/v1/history?userId=guest');
            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to fetch history');
            }

            const mapItem = (item: any): HistoryItem => ({
                id: item.id,
                dramaId: item.dramaId,
                dramaTitle: item.dramaTitle || '',
                providerDramaId: item.providerDramaId || item.dramaId,
                providerSlug: item.providerSlug || '',
                episodeNumber: item.episodeNo || 0,
                totalEpisodes: item.totalEpisodes || 0,
                progressPercent: item.progressPercent || 0,
                thumbnailUrl: item.coverUrl || '',
                watchedAt: item.lastWatchedAt || '',
            });

            const grouped = result.data?.history || {
                today: [],
                yesterday: [],
                lastWeek: [],
                lastMonth: [],
                older: [],
            };

            setState({
                history: {
                    today: grouped.today.map(mapItem),
                    yesterday: grouped.yesterday.map(mapItem),
                    lastWeek: grouped.lastWeek.map(mapItem),
                    lastMonth: grouped.lastMonth.map(mapItem),
                    older: grouped.older.map(mapItem),
                },
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
        fetchHistory();
    }, [fetchHistory]);

    // Delete selected items
    const deleteSelected = useCallback(async () => {
        if (selectedIds.length === 0) return;

        try {
            await Promise.all(selectedIds.map((id) =>
                fetch(`/api/v1/history?userId=guest&historyId=${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                })
            ));

            // Refresh history
            await fetchHistory();
            setSelectedIds([]);
            setIsEditMode(false);
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to delete',
            }));
        }
    }, [selectedIds, fetchHistory]);

    // Clear all history
    const clearAll = useCallback(async () => {
        if (!confirm('Hapus semua riwayat tontonan?')) return;

        try {
            const response = await fetch('/api/v1/history?userId=guest&clearAll=true', {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error?.message || 'Failed to clear history');
            }

            await fetchHistory();
            setIsEditMode(false);
        } catch (err) {
            setState(prev => ({
                ...prev,
                error: err instanceof Error ? err.message : 'Failed to clear history',
            }));
        }
    }, [fetchHistory]);

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
        const allIds = [
            ...state.history.today,
            ...state.history.yesterday,
            ...state.history.lastWeek,
            ...state.history.lastMonth,
            ...state.history.older,
        ].map(item => item.id);

        setSelectedIds(allIds);
    }, [state.history]);

    // Get total count
    const getTotalCount = useCallback(() => {
        return (
            state.history.today.length +
            state.history.yesterday.length +
            state.history.lastWeek.length +
            state.history.lastMonth.length +
            state.history.older.length
        );
    }, [state.history]);

    return {
        ...state,
        isEditMode,
        selectedIds,
        toggleEditMode,
        toggleSelect,
        selectAll,
        deleteSelected,
        clearAll,
        refresh: fetchHistory,
        totalCount: getTotalCount(),
    };
}

export default useHistory;
