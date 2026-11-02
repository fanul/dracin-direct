'use client';

import { Lightbulb, Search, Film } from 'lucide-react';
import type { DramaCard } from '@/lib/types';

interface AutocompleteDropdownProps {
    query: string;
    suggestions: string[];
    results: DramaCard[];
    onSelect: (query: string) => void;
    onSelectDrama: (drama: DramaCard) => void;
    isVisible: boolean;
}

export function AutocompleteDropdown({
    query,
    suggestions,
    results,
    onSelect,
    onSelectDrama,
    isVisible,
}: AutocompleteDropdownProps) {
    if (!isVisible || (!query.trim() && suggestions.length === 0)) return null;

    const hasContent = suggestions.length > 0 || results.length > 0;
    if (!hasContent) return null;

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl z-30">
            {/* Current query */}
            <div className="flex items-center space-x-3 p-4 border-b border-neutral-800">
                <Search size={16} className="text-neutral-500" />
                <span className="text-sm font-medium">{query}</span>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="p-2">
                    <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-bold text-neutral-500 uppercase">
                        <Lightbulb size={12} />
                        <span>Suggestions</span>
                    </div>
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => onSelect(suggestion)}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-left"
                        >
                            <Lightbulb size={14} className="text-yellow-500" />
                            <span className="text-sm font-medium">{suggestion}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Drama results preview */}
            {results.length > 0 && (
                <div className="p-2 border-t border-neutral-800">
                    <div className="flex items-center space-x-2 px-2 py-1.5 text-xs font-bold text-neutral-500 uppercase">
                        <Film size={12} />
                        <span>Drama</span>
                    </div>
                    {results.slice(0, 3).map((drama) => (
                        <button
                            key={drama.id}
                            onClick={() => onSelectDrama(drama)}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-left"
                        >
                            <div className="w-10 h-14 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                                <img
                                    src={drama.coverUrl}
                                    alt={drama.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{drama.title}</p>
                                <p className="text-xs text-neutral-500">{drama.providerName}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Provider count hint */}
            {results.length > 0 && (
                <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/50">
                    <p className="text-xs text-neutral-500">
                        Tekan Enter untuk lihat semua hasil
                    </p>
                </div>
            )}
        </div>
    );
}
