'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '../../components/layout/PageHeader';
import { ProviderHeader } from '../../components/pages/ProviderHeader';
import { GenreFilterTabs } from '../../components/pages/GenreFilterTabs';
import { DramaCard } from '../../components/home/DramaCard';
import { useProvider } from '../../../hooks/useProvider';

type TabType = 'all' | 'trending' | 'new';

export default function ProviderPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const {
        provider,
        dramas,
        genres,
        loading,
        error,
        hasMore,
        activeGenre,
        onGenreChange,
        loadMore,
    } = useProvider(slug);

    // Filter dramas based on active tab
    const filteredDramas = (() => {
        switch (activeTab) {
            case 'trending':
                return [...dramas].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            case 'new':
                return [...dramas].sort((a, b) => {
                    // Sort by ID (newer IDs are typically larger)
                    const idA = parseInt(a.providerDramaId) || 0;
                    const idB = parseInt(b.providerDramaId) || 0;
                    return idB - idA;
                });
            default:
                return dramas;
        }
    })();

    const tabs: { id: TabType; label: string }[] = [
        { id: 'all', label: 'Semua' },
        { id: 'trending', label: 'Trending' },
        { id: 'new', label: 'Terbaru' },
    ];

    return (
        <main className="min-h-screen bg-neutral-950 pb-24">
            {/* Header */}
            <PageHeader
                title={provider?.name || 'Provider'}
                action={
                    <button
                        onClick={() => alert('Menu coming soon')}
                        className="p-2 text-white hover:text-neutral-300 transition-colors"
                        aria-label="Menu"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                }
            />

            {/* Content */}
            <div className="pt-16">
                {/* Provider Header */}
                {provider && <ProviderHeader provider={provider} />}

                {/* Error */}
                {error && (
                    <div className="mx-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-center">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm text-red-400 underline"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && !provider && (
                    <div className="flex flex-col items-center py-12 animate-pulse">
                        <div className="w-20 h-20 bg-neutral-800 rounded-2xl mb-4" />
                        <div className="w-32 h-6 bg-neutral-800 rounded mb-2" />
                        <div className="w-48 h-4 bg-neutral-800 rounded" />
                    </div>
                )}

                {/* Tabs Navigation */}
                {!loading && provider && (
                    <div className="px-4 mt-4">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                        activeTab === tab.id
                                            ? 'bg-red-600 text-white'
                                            : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Genre Filter Tabs */}
                {!loading && genres.length > 0 && activeTab === 'all' && (
                    <div className="px-4 mt-4">
                        <GenreFilterTabs
                            genres={genres}
                            activeGenre={activeGenre}
                            onGenreChange={onGenreChange}
                        />
                    </div>
                )}

                {/* Drama Grid */}
                <div className="px-4 mt-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredDramas.map((drama) => (
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
                    {!loading && !error && filteredDramas.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Tidak Ada Drama</h3>
                            <p className="text-neutral-400 text-sm max-w-xs">
                                Belum ada drama dari provider ini. Coba filter genre lain.
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
            </div>
        </main>
    );
}
