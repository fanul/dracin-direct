'use client';

import { ChevronRight } from 'lucide-react';
import { DramaCard } from './DramaCard';
import type { DramaCard as DramaCardType, DramaWithRank } from '@/lib/types';

interface HorizontalDramaSectionProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    dramas: (DramaCardType | DramaWithRank)[];
    showProviderBadge?: boolean;
    showRank?: boolean;
    showNewBadge?: boolean;
    animationDelay?: number;
    emptyState?: React.ReactNode;
}

export function HorizontalDramaSection({
    title,
    subtitle,
    actionLabel,
    onAction,
    dramas,
    showProviderBadge = true,
    showRank = false,
    showNewBadge = false,
    animationDelay = 0,
    emptyState,
}: HorizontalDramaSectionProps) {
    if (!dramas || dramas.length === 0) {
        if (emptyState) {
            return <span className="contents">{emptyState}</span>;
        }
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
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                            {title}
                        </h2>
                        {subtitle && (
                            <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <span>{actionLabel}</span>
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>

                {/* Cards */}
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {dramas.map((drama, index) => (
                        <div
                            key={drama.id}
                            className="snap-start"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <DramaCard
                                drama={drama}
                                showProviderBadge={showProviderBadge}
                                showRank={showRank}
                                showNewBadge={showNewBadge || (drama as DramaWithRank).rank !== undefined}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HorizontalDramaSection;
