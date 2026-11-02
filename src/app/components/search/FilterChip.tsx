'use client';

import { X } from 'lucide-react';
import type { SearchFilters } from '@/hooks/useSearch';
import { AVAILABLE_PROVIDERS, AVAILABLE_GENRES } from '@/hooks/useSearch';

interface FilterChipProps {
    filters: SearchFilters;
    onRemoveProvider: (provider: string) => void;
    onRemoveGenre: (genre: string) => void;
    onClearAll: () => void;
}

export function FilterChip({
    filters,
    onRemoveProvider,
    onRemoveGenre,
    onClearAll,
}: FilterChipProps) {
    const activeFiltersCount = filters.providers.length + filters.genres.length;

    if (activeFiltersCount === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Provider chips */}
            {filters.providers.map((providerSlug) => {
                const provider = AVAILABLE_PROVIDERS.find((p) => p.slug === providerSlug);
                if (!provider) return null;

                return (
                    <div
                        key={providerSlug}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full"
                    >
                        <span className="text-xs font-bold text-red-400">
                            {provider.name}
                        </span>
                        <button
                            onClick={() => onRemoveProvider(providerSlug)}
                            className="p-0.5 hover:bg-red-500/20 rounded-full transition-colors"
                        >
                            <X size={12} className="text-red-400" />
                        </button>
                    </div>
                );
            })}

            {/* Genre chips */}
            {filters.genres.map((genre) => (
                <div
                    key={genre}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full"
                >
                    <span className="text-xs font-bold text-neutral-300">{genre}</span>
                    <button
                        onClick={() => onRemoveGenre(genre)}
                        className="p-0.5 hover:bg-neutral-700 rounded-full transition-colors"
                    >
                        <X size={12} className="text-neutral-500" />
                    </button>
                </div>
            ))}

            {/* Clear all */}
            <button
                onClick={onClearAll}
                className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-2"
            >
                Hapus Semua
            </button>
        </div>
    );
}
