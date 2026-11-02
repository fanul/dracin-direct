'use client';

import Link from 'next/link';
import { Star, PlayCircle } from 'lucide-react';
import type { DramaCard } from '@/lib/types';

interface SearchResultsProps {
    results: DramaCard[];
}

function formatDuration(episodeCount: number): string {
    if (episodeCount < 10) return `${episodeCount} Eps`;
    if (episodeCount < 100) return `${episodeCount} Eps`;
    return '100+ Eps';
}

function getProviderColor(slug: string): string {
    const colors: Record<string, string> = {
        dramabox: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        shortmax: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        flextv: 'bg-green-500/20 text-green-400 border-green-500/30',
        goodshort: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        netshort: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
        reelshort: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
        cashdrama: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[slug] || 'bg-neutral-700 text-neutral-300 border-neutral-600';
}

interface ResultCardProps {
    drama: DramaCard;
}

function ResultCard({ drama }: ResultCardProps) {
    return (
        <Link
            href={`/dramas/${drama.id}`}
            className="group block space-y-2"
        >
            {/* Thumbnail */}
            <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-neutral-900">
                <img
                    src={drama.coverUrl}
                    alt={drama.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <PlayCircle
                        size={40}
                        className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300"
                    />
                </div>

                {/* Rating Badge */}
                {drama.rating && drama.rating > 0 && (
                    <div className="absolute top-2 left-2 flex items-center space-x-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold">{drama.rating.toFixed(1)}</span>
                    </div>
                )}

                {/* Premium Badge */}
                {drama.isPremium && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-linear-to-r from-yellow-500 to-amber-500 rounded-lg">
                        <span className="text-[10px] font-black text-black">VIP</span>
                    </div>
                )}

                {/* Episode Count */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
                    <span className="text-[10px] font-bold">{formatDuration(drama.episodeCount)}</span>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
                {/* Provider Badge */}
                <div
                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${getProviderColor(
                        drama.providerSlug
                    )}`}
                >
                    {drama.providerName}
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold line-clamp-2 group-hover:text-red-400 transition-colors">
                    {drama.title}
                </h4>

                {/* Tags */}
                {drama.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {drama.tags.slice(0, 2).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] text-neutral-500 font-medium"
                            >
                                #{tag}
                            </span>
                        ))}
                        {drama.tags.length > 2 && (
                            <span className="text-[10px] text-neutral-600">
                                +{drama.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}

export function SearchResults({ results }: SearchResultsProps) {
    if (results.length === 0) return null;

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((drama) => (
                <ResultCard key={drama.id} drama={drama} />
            ))}
        </div>
    );
}
