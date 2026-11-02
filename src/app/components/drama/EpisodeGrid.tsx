'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { EpisodeItem } from '@/lib/types';

interface EpisodeGridProps {
    episodes: EpisodeItem[];
    providerSlug: string;
    providerDramaId: string;
    isPremium: boolean;
    watchedEpisodes?: number[];
}

export function EpisodeGrid({
    episodes,
    providerSlug,
    providerDramaId,
    isPremium,
    watchedEpisodes = [],
}: EpisodeGridProps) {
    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {episodes.map((ep) => {
                const isDramaNova = providerSlug.toLowerCase() === 'dramanova';
                const isLocked = isDramaNova ? false : (ep.isLocked && !isPremium);
                const isWatched = watchedEpisodes.includes(ep.episodeNo);

                return (
                    <Link
                        key={ep.episodeId}
                        href={isLocked ? '#' : `/play/${providerSlug}/${providerDramaId}/${ep.episodeNo}`}
                        className={`aspect-square flex flex-col items-center justify-center rounded-xl border transition-all ${isLocked
                                ? 'bg-slate-900/40 border-slate-800/50 text-slate-500 cursor-not-allowed'
                                : isWatched
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-500/50 hover:bg-slate-800 hover:text-white hover:-translate-y-0.5'
                            }`}
                        onClick={(e) => {
                            if (isLocked) e.preventDefault();
                        }}
                    >
                        {isLocked && <Lock size={14} className="mb-1" />}
                        <span className="text-sm font-bold">{ep.episodeNo}</span>
                    </Link>
                );
            })}
        </div>
    );
}

export default EpisodeGrid;
