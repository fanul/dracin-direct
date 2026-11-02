'use client';

import { X, Clock } from 'lucide-react';

interface RecentSearchesProps {
    searches: string[];
    onSelect: (query: string) => void;
    onRemove: (query: string) => void;
    onClearAll: () => void;
}

export function RecentSearches({
    searches,
    onSelect,
    onRemove,
    onClearAll,
}: RecentSearchesProps) {
    if (searches.length === 0) return null;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Clock size={14} className="text-neutral-500" />
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                        Pencarian Terbaru
                    </h3>
                </div>
                <button
                    onClick={onClearAll}
                    className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                    Hapus Semua
                </button>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2">
                {searches.map((search) => (
                    <div
                        key={search}
                        className="group flex items-center space-x-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                        <button
                            onClick={() => onSelect(search)}
                            className="text-xs font-bold text-neutral-300 group-hover:text-white"
                        >
                            {search}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(search);
                            }}
                            className="p-0.5 hover:bg-neutral-700 rounded-full transition-colors"
                        >
                            <X size={12} className="text-neutral-500" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
