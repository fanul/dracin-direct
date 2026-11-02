'use client';

import { HistoryItem } from './HistoryItem';

interface HistoryItemData {
    id: string;
    dramaId: string;
    dramaTitle: string;
    providerDramaId: string;
    providerSlug: string;
    episodeNumber: number;
    totalEpisodes: number;
    progressPercent: number;
    thumbnailUrl: string;
    watchedAt: string;
}

interface HistoryGroupProps {
    title: string;
    items: HistoryItemData[];
    isEditMode: boolean;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
}

export function HistoryGroup({
    title,
    items,
    isEditMode,
    selectedIds,
    onToggleSelect,
}: HistoryGroupProps) {
    if (items.length === 0) return null;

    return (
        <section className="mb-6">
            <h2 className="text-lg font-bold text-white mb-3 px-4">{title}</h2>
            <div className="space-y-2 px-4">
                {items.map((item) => (
                    <HistoryItem
                        key={item.id}
                        item={item}
                        isEditMode={isEditMode}
                        isSelected={selectedIds.includes(item.id)}
                        onSelect={onToggleSelect}
                    />
                ))}
            </div>
        </section>
    );
}

export default HistoryGroup;
