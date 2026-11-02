import { getPlaybackUrl } from '@/lib/services/playback';
import { DownloadManager } from './manager';

const globalDownloads = globalThis as typeof globalThis & { __downloads?: DownloadManager };
export const downloads = globalDownloads.__downloads ||= new DownloadManager({
  resolve: async (job) => (await getPlaybackUrl(job.provider, job.dramaId, job.episodeId, `download-${Date.now()}`)).streamUrl,
});
