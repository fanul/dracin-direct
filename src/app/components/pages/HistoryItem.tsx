'use client';

import Image from 'next/image';
import Link from 'next/link';

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

interface HistoryItemProps {
    item: HistoryItemData;
    isEditMode: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
}

export function HistoryItem({ item, isEditMode, isSelected, onSelect }: HistoryItemProps) {
    const progressText = item.totalEpisodes > 0
        ? `Ep ${item.episodeNumber}/${item.totalEpisodes}`
        : `Ep ${item.episodeNumber}`;

    return (
        <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-xl">
            {/* Checkbox in edit mode */}
            {isEditMode && (
                <button
                    onClick={() => onSelect(item.id)}
                    className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${isSelected
                            ? 'bg-red-600 border-red-600'
                            : 'border-neutral-500 hover:border-neutral-400'
                        }
          `}
                >
                    {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
            )}

            {/* Thumbnail */}
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-neutral-700 flex-shrink-0 relative">
                {item.thumbnailUrl ? (
                    <Image
                        src={item.thumbnailUrl}
                        alt={item.dramaTitle}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900/50">
                    <div
                        className="h-full bg-red-600"
                        style={{ width: `${item.progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{item.dramaTitle}</h3>
                <p className="text-xs text-neutral-400 mt-1">{progressText}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                    {Math.round(item.progressPercent)}% selesai
                </p>
            </div>

            {/* Play Button */}
            {!isEditMode && (
                <Link
                    href={`/play/${item.providerSlug}/${item.providerDramaId}/${item.episodeNumber}`}
                    className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors flex-shrink-0"
                    aria-label={`Lanjutkan ${item.dramaTitle}`}
                >
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </Link>
            )}
        </div>
    );
}

export default HistoryItem;
