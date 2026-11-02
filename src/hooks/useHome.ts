'use client';

import { useState, useEffect } from 'react';
import type { HomeResponseData, HomeSectionResponse, DramaCard } from '@/lib/types';

interface UseHomeDataReturn {
  data: HomeResponseData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHomeData(): UseHomeDataReturn {
  const [data, setData] = useState<HomeResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/home');
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Legacy hook for backward compatibility
interface UseHomeDramasReturn {
  dramas: DramaCard[];
  loading: boolean;
  error: string | null;
}

export function useHomeDramas(): UseHomeDramasReturn {
  const { data, loading, error } = useHomeData();

  // Flatten all dramas for legacy usage
  const allDramas = data
    ? [
      ...data.featured,
      ...data.trending,
      ...data.forYou,
      ...data.providerSections.flatMap((s) => s.dramas),
    ]
    : [];

  // Remove duplicates by id
  const uniqueDramas = allDramas.filter(
    (drama, index, self) => index === self.findIndex((d) => d.id === drama.id)
  );

  return {
    dramas: uniqueDramas,
    loading,
    error,
  };
}

export default useHomeData;

interface UseHomeSectionDataReturn {
  data: HomeSectionResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useHomeSectionData(
  section: 'for-you' | 'trending' | 'new-releases',
  page: number,
  limit: number = 24
): UseHomeSectionDataReturn {
  const [data, setData] = useState<HomeSectionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/home/sections?section=${encodeURIComponent(section)}&page=${page}&limit=${limit}`
      );
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load section data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [section, page, limit]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
