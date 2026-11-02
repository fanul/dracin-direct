'use client';

import { X, Filter, RotateCcw } from 'lucide-react';
import { AVAILABLE_PROVIDERS, AVAILABLE_GENRES } from '@/hooks/useSearch';
import type { SearchFilters } from '@/hooks/useSearch';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    filters: SearchFilters;
    onToggleProvider: (provider: string) => void;
    onToggleGenre: (genre: string) => void;
    onReset: () => void;
    onApply: () => void;
}

export function FilterSidebar({
    isOpen,
    onClose,
    filters,
    onToggleProvider,
    onToggleGenre,
    onReset,
    onApply,
}: FilterSidebarProps) {
    const activeFilterCount = filters.providers.length + filters.genres.length;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-neutral-900 z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                    <div className="flex items-center space-x-2">
                        <Filter size={18} className="text-red-500" />
                        <h2 className="font-bold text-lg">Filter Pencarian</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-140px)]">
                    {/* Provider Section */}
                    <div>
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
                            Provider
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={filters.providers.length === 0}
                                    onChange={() => {
                                        // Uncheck all providers to select "all"
                                        if (filters.providers.length > 0) {
                                            AVAILABLE_PROVIDERS.forEach((p) => {
                                                if (filters.providers.includes(p.slug)) {
                                                    onToggleProvider(p.slug);
                                                }
                                            });
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-red-600 focus:ring-red-600/30"
                                />
                                <span className="text-sm group-hover:text-white transition-colors">
                                    Semua Provider
                                </span>
                            </label>

                            {AVAILABLE_PROVIDERS.map((provider) => (
                                <label
                                    key={provider.slug}
                                    className="flex items-center space-x-3 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters.providers.includes(provider.slug)}
                                        onChange={() => onToggleProvider(provider.slug)}
                                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-red-600 focus:ring-red-600/30"
                                    />
                                    <span className="text-sm group-hover:text-white transition-colors">
                                        {provider.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Genre Section */}
                    <div>
                        <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-3">
                            Genre
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_GENRES.map((genre) => (
                                <label
                                    key={genre}
                                    className="flex items-center space-x-2 cursor-pointer group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={filters.genres.includes(genre)}
                                        onChange={() => onToggleGenre(genre)}
                                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-red-600 focus:ring-red-600/30"
                                    />
                                    <span className="text-sm group-hover:text-white transition-colors">
                                        {genre}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800 bg-neutral-900">
                    <div className="flex space-x-3">
                        <button
                            onClick={onReset}
                            disabled={activeFilterCount === 0}
                            className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-neutral-800 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-700 transition-colors"
                        >
                            <RotateCcw size={16} />
                            <span>Reset</span>
                        </button>
                        <button
                            onClick={onApply}
                            className="flex-1 py-3 px-4 bg-red-600 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                        >
                            Terapkan
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
