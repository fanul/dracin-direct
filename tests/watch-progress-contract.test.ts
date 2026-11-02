/**
 * Tests for Watch Progress Identifier Contract
 *
 * Validates episode/drama identifier resolution and persistence behavior in
 * src/lib/db/watch-history.ts.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockEpisodeSingle = vi.fn();
const mockDramaSingle = vi.fn();
const mockUpdateLimit = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockFrom = vi.fn();

const createLookupChain = (singleMock: ReturnType<typeof vi.fn>) => {
  const chain: {
    eq: ReturnType<typeof vi.fn>;
    single: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(() => chain),
    single: singleMock,
  };
  return chain;
};

const createUpdateChain = () => {
  const afterSelect: {
    limit: ReturnType<typeof vi.fn>;
  } = {
    limit: mockUpdateLimit,
  };

  const chain: {
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  } = {
    eq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    select: vi.fn(() => afterSelect),
  };

  return chain;
};

vi.mock('@/lib/db/client', () => ({
  getSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

describe('Watch Progress Identifier Contract', () => {
  beforeEach(() => {
    mockEpisodeSingle.mockReset();
    mockDramaSingle.mockReset();
    mockUpdateLimit.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockFrom.mockReset();

    mockEpisodeSingle.mockResolvedValue({ data: null, error: null });
    mockDramaSingle.mockResolvedValue({ data: null, error: null });
    mockUpdateLimit.mockResolvedValue({ data: [{ id: 'watch-1' }], error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdate.mockImplementation(() => createUpdateChain());

    mockFrom.mockImplementation((table: string) => {
      if (table === 'episodes') {
        return {
          select: vi.fn(() => createLookupChain(mockEpisodeSingle)),
        };
      }
      if (table === 'dramas') {
        return {
          select: vi.fn(() => createLookupChain(mockDramaSingle)),
        };
      }
      if (table === 'watch_history') {
        return {
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      throw new Error(`Unexpected table mock: ${table}`);
    });
  });

  describe('resolveEpisodeId', () => {
    it('passes UUID episode id directly without episode lookup query', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      const episodeUuid = '123e4567-e89b-12d3-a456-426614174000';

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: episodeUuid,
        progressSeconds: 100,
        isCompleted: false,
      });

      expect(mockEpisodeSingle).not.toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ episode_id: episodeUuid })
      );
    });

    it('resolves numeric episode number to episode UUID', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      const resolvedEpisodeUuid = '123e4567-e89b-12d3-a456-426614174003';
      mockEpisodeSingle.mockResolvedValueOnce({ data: { id: resolvedEpisodeUuid }, error: null });

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: '15',
        progressSeconds: 90,
        isCompleted: false,
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ episode_id: resolvedEpisodeUuid })
      );
    });

    it('falls back from provider_episode_id to slug resolution', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      const resolvedEpisodeUuid = '123e4567-e89b-12d3-a456-426614174003';
      mockEpisodeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // provider_episode_id
        .mockResolvedValueOnce({ data: { id: resolvedEpisodeUuid }, error: null }); // slug

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: 'episode-15-the-reveal',
        progressSeconds: 45,
        isCompleted: false,
      });

      expect(mockEpisodeSingle).toHaveBeenCalledTimes(2);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ episode_id: resolvedEpisodeUuid })
      );
    });
  });

  describe('drama identifier resolution', () => {
    it('resolves provider-scoped drama id before persistence', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      const resolvedDramaUuid = '123e4567-e89b-12d3-a456-426614174011';
      mockDramaSingle.mockResolvedValueOnce({ data: { id: resolvedDramaUuid }, error: null });

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: 'reelshort:rs-001',
        episodeId: '123e4567-e89b-12d3-a456-426614174003',
        progressSeconds: 60,
        isCompleted: false,
      });

      expect(mockDramaSingle).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ drama_id: resolvedDramaUuid })
      );
    });
  });

  describe('persistence strategy', () => {
    it('uses update-first and skips insert when update affects row', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      mockUpdateLimit.mockResolvedValueOnce({ data: [{ id: 'watch-1' }], error: null });

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: '123e4567-e89b-12d3-a456-426614174003',
        progressSeconds: 120,
        isCompleted: false,
      });

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('falls back to insert when update affects no rows', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      mockUpdateLimit.mockResolvedValueOnce({ data: [], error: null });

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: '123e4567-e89b-12d3-a456-426614174003',
        progressSeconds: 120,
        isCompleted: false,
      });

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          drama_id: '123e4567-e89b-12d3-a456-426614174001',
        })
      );
    });

    it('throws when update query fails', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');
      mockUpdateLimit.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

      await expect(
        upsertWatchProgress({
          userId: '123e4567-e89b-12d3-a456-426614174002',
          dramaId: '123e4567-e89b-12d3-a456-426614174001',
          episodeId: '123e4567-e89b-12d3-a456-426614174003',
          progressSeconds: 100,
          isCompleted: false,
        })
      ).rejects.toThrow('Failed to save watch progress');
    });
  });

  describe('data transformation', () => {
    it('transforms payload to snake_case and adds last_watched_at', async () => {
      const { upsertWatchProgress } = await import('@/lib/db/watch-history');

      await upsertWatchProgress({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        dramaId: '123e4567-e89b-12d3-a456-426614174001',
        episodeId: '123e4567-e89b-12d3-a456-426614174003',
        progressSeconds: 150,
        isCompleted: true,
      });

      const payload = mockUpdate.mock.calls[0]?.[0];
      expect(payload).toMatchObject({
        user_id: '123e4567-e89b-12d3-a456-426614174002',
        drama_id: '123e4567-e89b-12d3-a456-426614174001',
        episode_id: '123e4567-e89b-12d3-a456-426614174003',
        progress_seconds: 150,
        is_completed: true,
      });
      expect(payload.last_watched_at).toBeDefined();
      expect(Number.isNaN(Date.parse(payload.last_watched_at))).toBe(false);
    });
  });
});
