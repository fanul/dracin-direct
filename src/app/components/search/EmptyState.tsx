'use client';

import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
    query: string;
    onResetFilters?: () => void;
    hasFilters?: boolean;
    activeProviders?: string[];
    activeGenres?: string[];
}

export function EmptyState({
    query,
    onResetFilters,
    hasFilters,
    activeProviders = [],
    activeGenres = [],
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Icon */}
            <div className="w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center mb-6">
                <SearchX size={40} className="text-neutral-600" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black mb-2">
                Tidak ada hasil untuk "{query}"
            </h3>

            {/* Description */}
            <p className="text-neutral-500 text-sm max-w-sm mb-6">
                Coba kata kunci lain atau ubah filter untuk menemukan drama yang kamu cari
            </p>

            {/* Suggestions */}
            <div className="space-y-2 mb-6">
                <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Tips pencarian:
                </p>
                <ul className="text-sm text-neutral-500 space-y-1">
                    <li>• Periksa ejaan kata kunci</li>
                    <li>• Coba gunakan kata kunci yang lebih umum</li>
                    <li>• Gunakan nama genre atau provider</li>
                </ul>
            </div>

            {(activeProviders.length > 0 || activeGenres.length > 0) && (
                <div className="mb-6 w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-left text-xs text-neutral-400">
                    <p className="font-bold text-neutral-300 mb-1">Filter aktif:</p>
                    {activeProviders.length > 0 && (
                        <p>Provider: {activeProviders.join(', ')}</p>
                    )}
                    {activeGenres.length > 0 && (
                        <p>Genre: {activeGenres.join(', ')}</p>
                    )}
                </div>
            )}

            {/* Reset button */}
            {hasFilters && onResetFilters && (
                <button
                    onClick={onResetFilters}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-600 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                    <RotateCcw size={16} />
                    <span>Reset Filter</span>
                </button>
            )}
        </div>
    );
}
