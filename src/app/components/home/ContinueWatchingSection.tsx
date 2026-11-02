'use client';

import { ChevronRight } from 'lucide-react';
import { ContinueWatchingCard } from './DramaCard';
import type { ContinueWatchingItem } from '@/lib/types';

interface ContinueWatchingSectionProps {
    items: ContinueWatchingItem[];
    onViewAll?: () => void;
    onContinue?: (providerSlug: string, dramaId: string, episodeNumber: number) => void;
    onRemove?: (dramaId: string) => void;
}

export function ContinueWatchingSection({
    items,
    onViewAll,
    onContinue,
    onRemove,
}: ContinueWatchingSectionProps) {
    // Don't render if no items
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <section className="mt-8 pt-6 border-t border-white/5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black tracking-tight text-white">
                        Lanjutkan Menonton
                    </h2>
                    {onViewAll && items.length > 5 && (
                        <button
                            onClick={onViewAll}
                            className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors"
                        >
                            <span>Lihat Semua</span>
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>

                {/* Cards */}
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {items.map((item) => (
                        <div key={item.dramaId} className="snap-start">
                            <ContinueWatchingCard
                                item={item}
                                onContinue={onContinue}
                                onRemove={onRemove}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default ContinueWatchingSection;
