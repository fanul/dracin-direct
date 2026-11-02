import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawn } from 'node:child_process';

export type DownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed' | 'cancelled';
export interface DownloadRequest { provider: string; dramaId: string; dramaTitle?: string; episodeId: string; episodeNo: number }
export interface DownloadJob extends DownloadRequest { key: string; status: DownloadStatus; bytesDownloaded: number; totalBytes?: number; progress: number; file?: string; error?: string; retryCount?: number; retryAt?: number; createdAt: string; updatedAt: string }
type State = { maxConcurrency: number; jobs: DownloadJob[] };
type Options = { root?: string; resolve: (job: DownloadRequest) => Promise<string>; fetch?: typeof fetch; autoStart?: boolean; ffmpeg?: string; retryDelayMs?: number };

export function safeSegment(value: string): string {
  let decoded: string;
  try { decoded = decodeURIComponent(value).trim(); } catch { throw new Error('Invalid path segment'); }
  if (!decoded || decoded === '.' || decoded === '..' || decoded.includes('/') || decoded.includes('\\') || decoded.includes('\0')) throw new Error('Invalid path segment');
  const safe = decoded.replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^\.+|\.+$/g, '').replace(/_+/g, '_');
  if (!safe || safe === '.' || safe === '..') throw new Error('Invalid path segment');
  return safe;
}

export class DownloadManager {
  readonly root: string;
  private state: State = { maxConcurrency: 5, jobs: [] };
  private active = new Map<string, AbortController>();
  private initialized: Promise<void>;
  private fetcher: typeof fetch;
  private autoStart: boolean;
  private started = false;
  private persistQueue = Promise.resolve();
  constructor(private options: Options) {
    this.root = path.resolve(options.root || process.env.DRACIN_DOWNLOAD_ROOT || '/Dracin');
    this.fetcher = options.fetch || fetch;
    this.autoStart = options.autoStart !== false;
    this.initialized = this.load();
  }
  ready() { return this.initialized; }
  async idle() { while (this.active.size) await new Promise((resolve) => setTimeout(resolve, 5)); await this.persistQueue; }
  list() { return structuredClone(this.state); }
  async setMaxConcurrency(value: number) {
    if (!Number.isInteger(value) || value < 1 || value > 10) throw new Error('maxConcurrency must be an integer from 1 to 10');
    this.state.maxConcurrency = value; await this.persist(); if (this.started || this.autoStart) this.start(); return this.list();
  }
  async enqueue(request: DownloadRequest) {
    const provider = safeSegment(request.provider), dramaId = safeSegment(request.dramaId), episodeId = safeSegment(request.episodeId);
    if (!Number.isInteger(request.episodeNo) || request.episodeNo < 1) throw new Error('Invalid episode number');
    const key = `${provider}/${dramaId}/${request.episodeNo}`;
    const existing = this.state.jobs.find((item) => item.key === key);
    if (existing && !['failed', 'cancelled'].includes(existing.status)) return structuredClone(existing);
    const now = new Date().toISOString();
    const item: DownloadJob = { provider, dramaId, dramaTitle: request.dramaTitle ? safeSegment(request.dramaTitle) : undefined, episodeId, episodeNo: request.episodeNo, key, status: 'queued', bytesDownloaded: 0, progress: 0, createdAt: existing?.createdAt || now, updatedAt: now };
    if (existing) Object.assign(existing, item); else this.state.jobs.push(item);
    await this.persist(); if (this.autoStart) this.start(); return structuredClone(item);
  }
  async enqueueAll(requests: DownloadRequest[]) { return Promise.all(requests.map((item) => this.enqueue(item))); }
  async cancel(key: string) {
    const job = this.find(key); this.active.get(key)?.abort(); job.status = 'cancelled'; job.updatedAt = new Date().toISOString(); await this.persist(); return structuredClone(job);
  }
  async retry(key: string) {
    const job = this.find(key); if (!['failed', 'cancelled'].includes(job.status)) throw new Error('Only failed or cancelled downloads can be retried');
    Object.assign(job, { status: 'queued', bytesDownloaded: 0, progress: 0, error: undefined, updatedAt: new Date().toISOString() });
    await this.persist(); if (this.started || this.autoStart) this.start(); return structuredClone(job);
  }
  start() { this.started = true; void this.ready().then(() => this.pump()); }
  local(provider: string, dramaId: string, episodeNo: number) {
    const key = `${safeSegment(provider)}/${safeSegment(dramaId)}/${episodeNo}`;
    const job = this.state.jobs.find((item) => item.key === key && item.status === 'completed');
    return job?.file;
  }
  private find(key: string) { const job = this.state.jobs.find((item) => item.key === key); if (!job) throw new Error('Download not found'); return job; }
  private async load() {
    await mkdir(this.root, { recursive: true });
    try {
      const saved = JSON.parse(await readFile(path.join(this.root, '.downloads.json'), 'utf8')) as State;
      this.state = { maxConcurrency: saved.maxConcurrency >= 1 && saved.maxConcurrency <= 10 ? saved.maxConcurrency : 5, jobs: Array.isArray(saved.jobs) ? saved.jobs : [] };
      for (const job of this.state.jobs) if (job.status === 'downloading') job.status = 'queued';
      await this.persist();
    } catch { await this.persist(); }
    if (this.autoStart) { this.started = true; this.pump(); }
  }
  private async persist() {
    this.persistQueue = this.persistQueue.then(async () => {
      await mkdir(this.root, { recursive: true });
      const target = path.join(this.root, '.downloads.json'), temp = `${target}.part`;
      await writeFile(temp, JSON.stringify(this.state, null, 2)); await rename(temp, target);
    });
    await this.persistQueue;
  }
  private pump() {
    while (this.active.size < this.state.maxConcurrency) {
      const now = Date.now();
      const job = this.state.jobs.find((item) => item.status === 'queued' && (!item.retryAt || item.retryAt <= now));
      if (!job) {
        const retryAt = Math.min(...this.state.jobs.filter((item) => item.status === 'queued' && item.retryAt && item.retryAt > now).map((item) => item.retryAt!));
        if (Number.isFinite(retryAt)) setTimeout(() => this.pump(), Math.max(1, retryAt - now));
        break;
      }
      const controller = new AbortController(); this.active.set(job.key, controller); job.status = 'downloading';
      void this.download(job, controller.signal).finally(() => { this.active.delete(job.key); if (this.started) this.pump(); });
    }
  }
  private async download(job: DownloadJob, signal: AbortSignal) {
    let part = '';
    try {
      await this.persist();
      const url = await this.options.resolve(job);
      if (/\.m3u8(?:\?|$)/i.test(url)) {
        const directory = path.join(this.root, job.provider, job.dramaTitle ? `${job.dramaId}_${safeSegment(job.dramaTitle)}` : job.dramaId); await mkdir(directory, { recursive: true });
        const target = path.join(directory, `${job.episodeNo}.mp4`); part = `${target}.part`;
        await new Promise<void>((resolve, reject) => {
          const child = spawn(this.options.ffmpeg || 'ffmpeg', ['-y', '-i', url, '-c', 'copy', part], { stdio: 'ignore' });
          const abort = () => child.kill('SIGTERM'); signal.addEventListener('abort', abort, { once: true });
          child.once('error', reject); child.once('exit', (code) => { signal.removeEventListener('abort', abort); code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)); });
        });
        if (job.status === 'cancelled') { await rm(part, { force: true }); return; }
        await rename(part, target); Object.assign(job, { status: 'completed', progress: 100, file: target, updatedAt: new Date().toISOString() }); return;
      }
      const parsed = new URL(url); const ext = /\.(mp4|m4v|mov|webm)$/i.exec(parsed.pathname)?.[1]?.toLowerCase() || 'mp4';
      const directory = path.join(this.root, job.provider, job.dramaTitle ? `${job.dramaId}_${safeSegment(job.dramaTitle)}` : job.dramaId); await mkdir(directory, { recursive: true });
      const target = path.join(directory, `${job.episodeNo}.${ext}`); part = `${target}.part`;
      const response = await this.fetcher(url, { signal }); if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
      job.totalBytes = Number(response.headers.get('content-length')) || undefined;
      let lastPersisted = 0;
      const progress = new TransformStream<Uint8Array, Uint8Array>({ transform: (chunk, controller) => {
        job.bytesDownloaded += chunk.byteLength;
        job.progress = job.totalBytes ? Math.min(99, Math.round(job.bytesDownloaded / job.totalBytes * 100)) : 0;
        job.updatedAt = new Date().toISOString();
        if (job.bytesDownloaded - lastPersisted >= 1024 * 1024) { lastPersisted = job.bytesDownloaded; void this.persist(); }
        controller.enqueue(chunk);
      } });
      await pipeline(Readable.fromWeb(response.body.pipeThrough(progress) as never), createWriteStream(part));
      if (job.status === 'cancelled') { await rm(part, { force: true }); return; }
      await rename(part, target); Object.assign(job, { status: 'completed', progress: 100, file: target, updatedAt: new Date().toISOString() });
    } catch (error) {
      if (part) await rm(part, { force: true });
      const message = error instanceof Error ? error.message : 'Download failed';
      const transient = /RATE_LIMITED|HTTP 429|HTTP 5\d\d|SANSEKAI_UPSTREAM_429|SANSEKAI_UPSTREAM_5\d\d/i.test(message);
      if (job.status !== 'cancelled' && transient) {
        const retryCount = (job.retryCount || 0) + 1;
        Object.assign(job, { status: 'queued', retryCount, retryAt: Date.now() + (this.options.retryDelayMs ?? Math.min(60_000, 2 ** Math.min(retryCount, 6) * 1000)), error: message, updatedAt: new Date().toISOString() });
      } else if (job.status !== 'cancelled') Object.assign(job, { status: 'failed', error: message, updatedAt: new Date().toISOString() });
    } finally { await this.persist(); }
  }
}
