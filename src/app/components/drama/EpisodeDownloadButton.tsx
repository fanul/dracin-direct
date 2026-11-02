'use client';
import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import type { EpisodeItem } from '@/lib/types';

type Job = { key: string; episodeNo: number; provider: string; dramaId: string; status: string; progress: number };
export function EpisodeDownloadButton({ episode, provider, dramaId, dramaTitle }: { episode: EpisodeItem; provider: string; dramaId: string; dramaTitle?: string }) {
  const [job, setJob] = useState<Job>();
  useEffect(() => {
    let live = true;
    const poll = async () => {
      try { const state = await fetch('/api/v1/downloads', { cache: 'no-store' }).then((r) => r.json()); if (live) setJob(state.jobs?.find((item: Job) => item.provider === provider && item.dramaId === dramaId && item.episodeNo === episode.episodeNo)); } catch { /* status is best effort */ }
    };
    void poll(); const timer = setInterval(poll, 1500); return () => { live = false; clearInterval(timer); };
  }, [provider, dramaId, episode.episodeNo]);
  if (job?.status === 'completed') return <span className="text-[10px] font-bold text-green-400">Downloaded</span>;
  if (job && ['queued', 'downloading'].includes(job.status)) return <span className="text-[10px] text-amber-400">{job.status === 'queued' ? 'Queued' : `${job.progress}%`}</span>;
  return <button type="button" aria-label={`Download episode ${episode.episodeNo}`} className="text-slate-400 hover:text-white" onClick={async (event) => { event.preventDefault(); event.stopPropagation(); await fetch('/api/v1/downloads', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ provider, dramaId, dramaTitle, episodeId: episode.providerEpisodeId || episode.chapterId || episode.episodeId, episodeNo: episode.episodeNo }) }); }}><Download size={14} /></button>;
}
