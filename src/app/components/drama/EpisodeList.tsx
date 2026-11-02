'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { EpisodeItem } from '@/lib/types';

interface EpisodeListProps {
    episodes: EpisodeItem[];
    providerSlug: string;
    providerDramaId: string;
    isPremium: boolean;
    watchedEpisodes?: number[];
}

export function EpisodeList({
    episodes,
    providerSlug,
    providerDramaId,
    isPremium,
    watchedEpisodes = [],
}: EpisodeListProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {episodes.map((ep) => {
                const isDramaNova = providerSlug.toLowerCase() === 'dramanova';
                const isLocked = isDramaNova ? false : (ep.isLocked && !isPremium);
                const isWatched = watchedEpisodes.includes(ep.episodeNo);

                return (
                    <Link
                        key={ep.episodeId}
                        href={isLocked ? '#' : `/play/${providerSlug}/${providerDramaId}/${ep.episodeNo}`}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${isLocked
                                ? 'bg-slate-900/40 border-slate-800/50 text-slate-500 cursor-not-allowed'
                                : isWatched
                                    ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-500/50 hover:bg-slate-800 hover:text-white'
                            }`}
                        onClick={(e) => {
                            if (isLocked) e.preventDefault();
                        }}
                    >
                        {isLocked && <Lock size={12} />}
                        <span className="font-medium whitespace-nowrap">Ep {ep.episodeNo}</span>
                    </Link>
                );
            })}
        </div>
    );
}

export default EpisodeList;
