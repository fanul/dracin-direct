'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getDramaDetail,
  getDramaEpisodes,
  getWatchProgressForDrama,
  getWatchedEpisodes,
} from '../lib/api-client';
import type {
  DramaDetail,
  DramaCard,
  EpisodeItem,
  WatchProgressForDrama,
} from '../lib/types';

export interface DramaDetailState {
  drama: DramaDetail | null;
  episodes: EpisodeItem[];
  relatedDramas: DramaCard[];
  continueProgress: WatchProgressForDrama | null;
  watchedEpisodes: number[];
  isInWatchlist: boolean;
  viewMode: 'grid' | 'list';
  loading: boolean;
  error: string | null;
}

export function useDramaDetail(
  id: string,
  userId: string = 'guest'
) {
  const [state, setState] = useState<DramaDetailState>({
    drama: null,
    episodes: [],
    relatedDramas: [],
    continueProgress: null,
    watchedEpisodes: [],
    isInWatchlist: false,
    viewMode: 'grid',
    loading: true,
    error: null,
  });

  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setIsInWatchlist = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isInWatchlist: value }));
  }, []);

  const dismissContinueBanner = useCallback(() => {
    setState((prev) => ({ ...prev, continueProgress: null }));
  }, []);

  const refreshWatchProgress = useCallback(async () => {
    if (!id || userId === 'guest') return;

    try {
      const [progress, watched] = await Promise.all([
        getWatchProgressForDrama(userId, id),
        getWatchedEpisodes(userId, id),
      ]);

      setState((prev) => ({
        ...prev,
        continueProgress: progress,
        watchedEpisodes: watched,
      }));
    } catch (err) {
      console.error('Failed to refresh watch progress:', err);
    }
  }, [id, userId]);

  useEffect(() => {
    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Load drama detail and episodes in parallel
        const [detailResult, episodesData] = await Promise.all([
          getDramaDetail(id),
          getDramaEpisodes(id),
        ]);

        if (!detailResult) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'Drama tidak ditemukan',
          }));
          return;
        }

        const { drama, related } = detailResult;

        // Load watch progress if user is logged in
        let progress: WatchProgressForDrama | null = null;
        let watched: number[] = [];

        if (userId !== 'guest') {
          try {
            [progress, watched] = await Promise.all([
              getWatchProgressForDrama(userId, id),
              getWatchedEpisodes(userId, id),
            ]);
          } catch (err) {
            console.error('Failed to load watch progress:', err);
          }
        }

        // TODO: Load watchlist status
        // const watchlistStatus = await getWatchlistStatus(userId, id);

        setState((prev) => ({
          ...prev,
          drama,
          episodes: episodesData,
          relatedDramas: related,
          continueProgress: progress,
          watchedEpisodes: watched,
          // isInWatchlist: watchlistStatus,
          loading: false,
        }));
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load',
        }));
      }
    }

    load();
  }, [id, userId]);

  return {
    ...state,
    setViewMode,
    setIsInWatchlist,
    dismissContinueBanner,
    refreshWatchProgress,
  };
}

export default useDramaDetail;
