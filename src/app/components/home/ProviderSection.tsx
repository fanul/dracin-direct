'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { DramaCard } from './DramaCard';
import type { ProviderSectionData } from '@/lib/types';

interface ProviderSectionProps {
    section: ProviderSectionData;
    defaultExpanded?: boolean;
    onViewAll?: (providerSlug: string) => void;
    animationDelay?: number;
}

export function ProviderSection({
    section,
    defaultExpanded = true,
    onViewAll,
    animationDelay = 0,
}: ProviderSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const { provider, dramas, totalCount } = section;

    if (!dramas || dramas.length === 0) {
        return null;
    }

    return (
        <section
            className="mt-8 pt-6 border-t border-white/5 animate-slide-up"
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <div className="px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center space-x-3 group"
                    >
                        {/* Provider Logo/Icon */}
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
                            <span className="text-sm font-black text-red-500">
                                {provider.name.charAt(0)}
                            </span>
                        </div>

                        <div className="text-left">
                            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 group-hover:text-neutral-200 transition-colors">
                                {provider.name}
                                <ChevronDown
                                    size={18}
                                    className={`text-neutral-500 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}
                                />
                            </h2>
                            <p className="text-xs text-neutral-500">
                                {totalCount} drama tersedia
                            </p>
                        </div>
                    </button>

                    {onViewAll && (
                        <button
                            onClick={() => onViewAll(provider.slug)}
                            className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <span>Lihat Semua</span>
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>

                {/* Cards (collapsible) */}
                <div
                    className={`
            overflow-hidden transition-all duration-500 ease-in-out
            ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
          `}
                >
                    <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {dramas.map((drama) => (
                            <div key={drama.id} className="snap-start">
                                <DramaCard
                                    drama={drama}
                                    showProviderBadge={false} // Hide provider badge since section is already grouped by provider
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// Component for multiple provider sections
interface ProviderSectionsProps {
    sections: ProviderSectionData[];
    expandedCount?: number;
}

export function ProviderSections({ sections, expandedCount = 3 }: ProviderSectionsProps) {
    if (!sections || sections.length === 0) {
        return null;
    }

    return (
        <>
            {sections.map((section, index) => (
                <ProviderSection
                    key={section.provider.slug}
                    section={section}
                    defaultExpanded={index < expandedCount}
                    animationDelay={index * 100}
                />
            ))}
        </>
    );
}

export default ProviderSection;
