import { afterEach, describe, expect, it } from 'vitest';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DownloadManager, safeSegment } from '@/lib/downloads/manager';

const roots: string[] = [];
async function root() { const value = await mkdtemp(path.join(tmpdir(), 'dracin-download-')); roots.push(value); return value; }
afterEach(async () => Promise.all(roots.splice(0).map((value) => rm(value, { recursive: true, force: true }))));

const job = { provider: 'dramabox', dramaId: 'show-1', episodeId: 'ep-1', episodeNo: 1 };

async function waitFor(manager: DownloadManager, status: string) {
  for (let i = 0; i < 100; i++) {
    const item = manager.list().jobs[0];
    if (item?.status === status) return item;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${status}`);
}

describe('download manager', () => {
  it('rejects traversal at every path segment', () => {
    for (const value of ['', '.', '..', '../secret', 'a/b', 'a\\b', '%2e%2e']) expect(() => safeSegment(value)).toThrow();
    expect(safeSegment('Drama: 你好 #1')).toBe('Drama_你好_1');
  });

  it('downloads an MP4 through a .part file, reports progress, then persists state', async () => {
    const dir = await root();
    const manager = new DownloadManager({
      root: dir,
      resolve: async () => 'https://media.test/video.mp4',
      fetch: async () => new Response('video-data', { headers: { 'content-length': '10' } }),
    });
    await manager.ready();
    await manager.enqueue(job);
    const complete = await waitFor(manager, 'completed');
    expect(complete.bytesDownloaded).toBe(10);
    expect(complete.progress).toBe(100);
    expect(await readFile(path.join(dir, 'dramabox', 'show-1', '1.mp4'), 'utf8')).toBe('video-data');
    expect(JSON.parse(await readFile(path.join(dir, '.downloads.json'), 'utf8')).jobs[0].status).toBe('completed');
  });

  it('remuxes HLS with ffmpeg into an atomic MP4', async () => {
    const dir = await root();
    const ffmpeg = path.join(dir, 'ffmpeg');
    await writeFile(ffmpeg, '#!/bin/sh\nprintf hls-video > "$6"\n'); await chmod(ffmpeg, 0o755);
    const manager = new DownloadManager({ root: dir, ffmpeg, resolve: async () => 'https://media.test/master.m3u8' });
    await manager.ready(); await manager.enqueue(job);
    expect((await waitFor(manager, 'completed')).progress).toBe(100);
    expect(await readFile(path.join(dir, 'dramabox', 'show-1', '1.mp4'), 'utf8')).toBe('hls-video');
    await manager.idle();
  });

  it('restores interrupted jobs as queued and enforces concurrency settings', async () => {
    const dir = await root();
    await writeFile(path.join(dir, '.downloads.json'), JSON.stringify({ maxConcurrency: 2, jobs: [{ ...job, key: 'dramabox/show-1/1', status: 'downloading', bytesDownloaded: 4, progress: 20, createdAt: 'x', updatedAt: 'x' }] }));
    const manager = new DownloadManager({ root: dir, autoStart: false, resolve: async () => '', fetch });
    await manager.ready();
    expect(manager.list().jobs[0].status).toBe('queued');
    expect(manager.list().maxConcurrency).toBe(2);
    await expect(manager.setMaxConcurrency(0)).rejects.toThrow();
    await expect(manager.setMaxConcurrency(11)).rejects.toThrow();
    expect((await manager.setMaxConcurrency(5)).maxConcurrency).toBe(5);
  });

  it('cancels queued work and retries failed work', async () => {
    const dir = await root();
    let fail = true;
    const manager = new DownloadManager({ root: dir, autoStart: false, resolve: async () => { if (fail) throw new Error('no stream'); return 'https://media.test/a.mp4'; }, fetch: async () => new Response('ok') });
    await manager.ready();
    const queued = await manager.enqueue(job);
    expect((await manager.cancel(queued.key)).status).toBe('cancelled');
    await manager.retry(queued.key);
    manager.start();
    await waitFor(manager, 'failed');
    fail = false;
    await manager.retry(queued.key);
    expect((await waitFor(manager, 'completed')).status).toBe('completed');
    await manager.idle();
  });
});

describe('local media response', () => {
  it('serves byte ranges and rejects malformed ranges', async () => {
    const { mediaResponse } = await import('@/lib/downloads/media');
    const dir = await root();
    const file = path.join(dir, 'clip.mp4');
    await writeFile(file, '0123456789');
    const partial = await mediaResponse(file, 'bytes=2-5');
    expect(partial.status).toBe(206);
    expect(partial.headers.get('content-range')).toBe('bytes 2-5/10');
    expect(await partial.text()).toBe('2345');
    expect((await mediaResponse(file, 'bytes=20-30')).status).toBe(416);
  });
});
