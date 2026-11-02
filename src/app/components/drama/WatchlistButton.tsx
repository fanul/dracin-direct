'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';

interface WatchlistButtonProps {
    dramaId: string;
    isInWatchlist: boolean;
    onToggle?: (isInWatchlist: boolean) => void;
    showText?: boolean;
}

export function WatchlistButton({
    dramaId,
    isInWatchlist,
    onToggle,
    showText = false,
}: WatchlistButtonProps) {
    const [isSaved, setIsSaved] = useState(isInWatchlist);
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);

        try {
            // TODO: Implement API call to add/remove from watchlist
            // const response = await fetch('/api/v1/watchlist', {
            //   method: isSaved ? 'DELETE' : 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ dramaId }),
            // });

            // Simulate API call for now
            await new Promise(resolve => setTimeout(resolve, 300));

            const newState = !isSaved;
            setIsSaved(newState);
            onToggle?.(newState);
        } catch (error) {
            console.error('Failed to update watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center justify-center gap-2 rounded-2xl border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${showText
                    ? isSaved
                        ? 'px-4 py-3 bg-red-600 border-red-600 text-white hover:bg-red-700'
                        : 'px-4 py-3 bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : isSaved
                        ? 'p-3.5 bg-red-600/20 border-red-600/50 text-red-500 hover:bg-red-600/30'
                        : 'p-3.5 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
            aria-label={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
        >
            {loading ? (
                <Loader2 size={20} className="animate-spin" />
            ) : isSaved ? (
                <BookmarkCheck size={20} />
            ) : (
                <Bookmark size={20} />
            )}

            {showText && (
                <span className="text-sm font-bold">
                    {loading ? 'Menyimpan...' : isSaved ? 'Tersimpan' : 'Simpan'}
                </span>
            )}
        </button>
    );
}

export default WatchlistButton;
