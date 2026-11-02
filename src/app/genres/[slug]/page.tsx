'use client';

import { useParams } from 'next/navigation';
import PageHeader from '../../components/layout/PageHeader';
import { DramaCard } from '../../components/home/DramaCard';
import { useGenre } from '../../../hooks/useGenre';
import { useState } from 'react';

export default function GenrePage() {
    const params = useParams();
    const slug = params.slug as string;
    const {
        genre,
        dramas,
        loading,
        error,
        hasMore,
        filters,
        setSortBy,
        setProvider,
        loadMore,
    } = useGenre(slug);

    const [showFilters, setShowFilters] = useState(false);

    const sortOptions = [
        { value: 'popular', label: 'Populer' },
        { value: 'newest', label: 'Terbaru' },
        { value: 'rating', label: 'Rating' },
    ];

    const providerOptions = [
        { value: '', label: 'Semua Provider' },
        { value: 'dramabox', label: 'DramaBox' },
        { value: 'shortmax', label: 'ShortMax' },
        { value: 'goodshort', label: 'GoodShort' },
        { value: 'reelshort', label: 'ReelShort' },
        { value: 'flextv', label: 'FlexTV' },
        { value: 'cashdrama', label: 'CashDrama' },
    ];

    return (
        <main className="min-h-screen bg-neutral-950 pb-24">
            {/* Header */}
            <PageHeader
                title={genre?.name || 'Genre'}
                action={
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-neutral-800 rounded-lg text-sm font-bold text-white hover:bg-neutral-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                    </button>
                }
            />

            {/* Filter Panel */}
            {showFilters && (
                <div className="px-4 py-3 bg-neutral-900 border-b border-neutral-800 animate-in slide-in-from-top-2">
                    <div className="space-y-3">
                        {/* Sort By */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-1.5 block">Urutkan</label>
                            <div className="flex gap-2 flex-wrap">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value as 'popular' | 'newest' | 'rating')}
                                        className={`
                      px-3 py-1.5 rounded-full text-xs font-bold transition-colors
                      ${filters.sortBy === option.value
                                                ? 'bg-red-600 text-white'
                                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                            }
                    `}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Provider Filter */}
                        <div>
                            <label className="text-xs text-neutral-400 mb-1.5 block">Provider</label>
                            <select
                                value={filters.provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="w-full px-3 py-2 bg-neutral-800 text-white text-sm rounded-lg border border-neutral-700 focus:border-red-600 focus:outline-none"
                            >
                                {providerOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="px-4 pt-4">
                {/* Drama Count */}
                {!loading && genre && (
                    <p className="text-sm text-neutral-400 mb-4">
                        {genre.dramaCount} Drama {genre.name}
                    </p>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-red-400 underline"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Drama Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dramas.map((drama) => (
                        <DramaCard key={drama.id} drama={drama} />
                    ))}

                    {/* Loading Skeleton */}
                    {loading && (
                        Array.from({ length: 8 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="animate-pulse">
                                <div className="aspect-[3/4] bg-neutral-800 rounded-xl" />
                                <div className="mt-2 h-4 bg-neutral-800 rounded w-3/4" />
                                <div className="mt-1 h-3 bg-neutral-800 rounded w-1/2" />
                            </div>
                        ))
                    )}
                </div>

                {/* Empty State */}
                {!loading && !error && dramas.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Tidak Ada Drama</h3>
                        <p className="text-neutral-400 text-sm max-w-xs">
                            Belum ada drama dalam genre ini. Coba genre lain atau ubah filter.
                        </p>
                    </div>
                )}

                {/* Load More */}
                {hasMore && !loading && dramas.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={loadMore}
                            className="px-6 py-3 bg-neutral-800 text-white font-bold rounded-full hover:bg-neutral-700 transition-colors flex items-center gap-2"
                        >
                            Muat Lebih
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
