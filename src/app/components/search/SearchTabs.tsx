'use client';

import { Layers, Tv, Building2, Tag } from 'lucide-react';
import type { SearchTab } from '@/hooks/useSearch';

interface SearchTabsProps {
    activeTab: SearchTab;
    onChange: (tab: SearchTab) => void;
    resultCount?: number;
}

const tabs: { id: SearchTab; label: string; icon: typeof Layers }[] = [
    { id: 'all', label: 'Semua', icon: Layers },
    { id: 'drama', label: 'Drama', icon: Tv },
    { id: 'provider', label: 'Provider', icon: Building2 },
    { id: 'genre', label: 'Genre', icon: Tag },
];

export function SearchTabs({ activeTab, onChange, resultCount }: SearchTabsProps) {
    return (
        <div className="border-b border-neutral-800">
            <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onChange(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors relative ${isActive
                                ? 'text-red-500'
                                : 'text-neutral-500 hover:text-neutral-300'
                                }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                            {isActive && resultCount !== undefined && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">
                                    {resultCount}
                                </span>
                            )}
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
