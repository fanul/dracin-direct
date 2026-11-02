'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { DramaCard } from '@/lib/types';

interface RelatedDramasProps {
    dramas: DramaCard[];
    title?: string;
    showSeeAll?: boolean;
    seeAllHref?: string;
}

export function RelatedDramas({
    dramas,
    title = 'Kamu Mungkin Suka',
    showSeeAll = true,
    seeAllHref = '/search',
}: RelatedDramasProps) {
    if (dramas.length === 0) return null;

    return (
        <div className="mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-4">
                <h3 className="text-lg font-black text-white">{title}</h3>
                {showSeeAll && (
                    <Link
                        href={seeAllHref}
                        className="text-xs font-bold text-red-500 flex items-center gap-0.5 hover:text-red-400 transition-colors"
                    >
                        Lihat Semua
                        <ChevronRight size={14} />
                    </Link>
                )}
            </div>

            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 px-4 pb-2">
                    {dramas.map((drama) => (
                        <Link
                            key={drama.id}
                            href={`/dramas/${drama.id}`}
                            className="shrink-0 w-28 group"
                        >
                            <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-2 ring-1 ring-white/10 shadow-lg">
                                {/* Cover Image */}
                                <img
                                    src={drama.coverUrl}
                                    alt={drama.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                                {/* Provider Badge */}
                                <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded border border-red-500/30">
                                    <span className="text-[9px] text-red-500 font-bold">
                                        {drama.providerName}
                                    </span>
                                </div>

                                {/* Premium Badge */}
                                {drama.isPremium && (
                                    <div className="absolute top-1.5 left-1.5 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded">
                                        VIP
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-neutral-100 group-hover:text-white transition-colors truncate">
                                {drama.title}
                            </h4>

                            {/* Episode Count */}
                            <p className="text-[10px] text-neutral-500 mt-0.5 font-medium">
                                {drama.episodeCount} Eps
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RelatedDramas;
