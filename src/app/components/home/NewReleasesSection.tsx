'use client';

import { ChevronRight } from 'lucide-react';
import { DramaCard } from './DramaCard';
import type { NewReleaseGroup } from '@/lib/types';

interface NewReleasesSectionProps {
    groups: NewReleaseGroup[];
    onViewAll?: () => void;
    animationDelay?: number;
}

export function NewReleasesSection({
    groups,
    onViewAll,
    animationDelay = 0,
}: NewReleasesSectionProps) {
    // Filter out empty groups
    const validGroups = groups?.filter(group => group.dramas && group.dramas.length > 0) || [];

    if (validGroups.length === 0) {
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
                    <h2 className="text-xl font-black tracking-tight text-white">
                        Rilis Baru
                    </h2>
                    {onViewAll && (
                        <button
                            onClick={onViewAll}
                            className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <span>Lihat Semua</span>
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>

                {/* Groups */}
                <div className="space-y-6">
                    {validGroups.map((group) => (
                        <div key={group.period}>
                            {/* Group Label */}
                            <h3 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
                                {group.label}
                                {group.period === 'today' && (
                                    <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">
                                        BARU
                                    </span>
                                )}
                            </h3>

                            {/* Drama Cards */}
                            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                {group.dramas.map((drama) => (
                                    <div key={drama.id} className="snap-start">
                                        <DramaCard
                                            drama={drama}
                                            showNewBadge={group.period === 'today'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default NewReleasesSection;
