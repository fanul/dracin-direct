import type { DramaCard, DramaDetail, EpisodeItem, PlaybackResponse, WatchProgress } from './types';

const API_BASE = '/api/v1';

async function fetchAPI<T>(url: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.error) {
      return { data: null, error: result.error.message };
    }

    return { data: result.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function getHomeDramas(): Promise<DramaCard[]> {
  const { data, error } = await fetchAPI<DramaCard[]>(`${API_BASE}/home`);
  if (error) throw new Error(error);
  return data || [];
}

export interface DramaDetailWithRelated {
  drama: DramaDetail;
  related: DramaCard[];
}

export async function getDramaDetail(id: string): Promise<DramaDetailWithRelated | null> {
  const { data, error } = await fetchAPI<DramaDetailWithRelated>(`${API_BASE}/dramas/${id}`);
  if (error) throw new Error(error);
  return data;
}

export async function getRelatedDramas(id: string): Promise<DramaCard[]> {
  const result = await getDramaDetail(id);
  return result?.related || [];
}

export async function getDramaEpisodes(id: string): Promise<EpisodeItem[]> {
  const { data, error } = await fetchAPI<EpisodeItem[]>(`${API_BASE}/dramas/${id}/episodes`);
  if (error) throw new Error(error);
  return data || [];
}

export async function searchDramas(query: string): Promise<DramaCard[]> {
  const { data, error } = await fetchAPI<DramaCard[]>(
    `${API_BASE}/search?q=${encodeURIComponent(query)}`
  );
  if (error) throw new Error(error);
  return data || [];
}

export async function getPlaybackUrl(
  provider: string,
  drama: string,
  episode: string,
  userId: string = 'guest'
): Promise<PlaybackResponse | null> {
  const { data } = await fetchAPI<PlaybackResponse>(
    `${API_BASE}/playback?provider=${provider}&drama=${drama}&episode=${episode}&userId=${userId}`
  );
  return data;
}

export async function saveWatchProgress(
  userId: string,
  dramaId: string,
  episodeId: string,
  progressSeconds: number,
  isCompleted: boolean
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/watch/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dramaId,
        episodeId,
        progressSeconds,
        isCompleted,
      }),
    });
    const result = await response.json();
    return !result.error;
  } catch {
    return false;
  }
}

export interface WatchProgressForDrama {
  episodeId: string;
  episodeNo: number;
  episodeTitle?: string;
  progressSeconds: number;
  durationMs: number;
  coverUrl: string;
  lastWatchedAt: string;
}

export async function getWatchProgressForDrama(
  userId: string,
  dramaId: string
): Promise<WatchProgressForDrama | null> {
  const { data, error } = await fetchAPI<WatchProgressForDrama>(
    `${API_BASE}/watch/progress?userId=${userId}&dramaId=${dramaId}`
  );
  if (error) return null;
  return data;
}

export async function getWatchedEpisodes(userId: string, dramaId: string): Promise<number[]> {
  const { data, error } = await fetchAPI<number[]>(
    `${API_BASE}/watch/progress/episodes?userId=${userId}&dramaId=${dramaId}`
  );
  if (error) return [];
  return data || [];
}
