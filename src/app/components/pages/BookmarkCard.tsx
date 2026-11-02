'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Bookmark {
    id: string;
    title: string;
    slug: string;
    providerName: string;
    providerSlug: string;
    totalEpisodes: number;
    posterUrl: string;
    rating: number;
}

interface BookmarkCardProps {
    bookmark: Bookmark;
    isEditMode: boolean;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onRemove: (e: React.MouseEvent) => void;
}

export function BookmarkCard({
    bookmark,
    isEditMode,
    isSelected,
    onSelect,
    onRemove,
}: BookmarkCardProps) {
    const handleCardClick = (e: React.MouseEvent) => {
        if (isEditMode) {
            e.preventDefault();
            onSelect(bookmark.id);
        }
    };

    const handleRemoveClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove(e);
    };

    return (
        <Link
            href={`/dramas/${bookmark.id}`}
            onClick={handleCardClick}
            className={`
        block bg-neutral-800 rounded-xl overflow-hidden transition-transform
        ${isEditMode ? 'cursor-pointer' : 'hover:scale-[1.02]'}
      `}
        >
            {/* Poster */}
            <div className="aspect-[3/4] relative bg-neutral-700">
                {bookmark.posterUrl ? (
                    <Image
                        src={bookmark.posterUrl}
                        alt={bookmark.title}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h1v-2h-1zm-2-2H7v4h6v-4zm2 0h1V9h-1v2zm1-4V5h-1v2h1zM5 5v2H4V5h1zm0 4H4v2h1V9zm-1 4h1v2H4v-2z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}

                {/* Edit mode checkbox */}
                {isEditMode && (
                    <div className="absolute top-2 left-2">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelect(bookmark.id);
                            }}
                            className={`
                w-7 h-7 rounded-full border-2 flex items-center justify-center bg-neutral-900/80
                ${isSelected
                                    ? 'bg-red-600 border-red-600'
                                    : 'border-white hover:border-neutral-300'
                                }
              `}
                        >
                            {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    </div>
                )}

                {/* Saved badge */}
                {!isEditMode && (
                    <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Tersimpan
                        </span>
                    </div>
                )}

                {/* Remove button in normal mode */}
                {!isEditMode && (
                    <button
                        onClick={handleRemoveClick}
                        className="absolute top-2 right-2 w-8 h-8 bg-neutral-900/80 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label="Hapus bookmark"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                {/* Rating */}
                <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {bookmark.rating.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <h3 className="text-sm font-bold text-white truncate">{bookmark.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-neutral-700 text-neutral-300 text-xs rounded">
                        {bookmark.providerName}
                    </span>
                    <span className="text-xs text-neutral-400">{bookmark.totalEpisodes} Eps</span>
                </div>
            </div>
        </Link>
    );
}

export default BookmarkCard;
