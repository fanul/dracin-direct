'use client';

import Link from 'next/link';
import { Play, X, Clock } from 'lucide-react';

interface ContinueBannerProps {
    progress: {
        dramaId: string;
        dramaTitle: string;
        episodeId: string;
        episodeNo: number;
        episodeTitle?: string;
        progressSeconds: number;
        durationMs: number;
        coverUrl: string;
        providerSlug: string;
        providerDramaId: string;
    };
    onDismiss?: () => void;
}

function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ContinueBanner({ progress, onDismiss }: ContinueBannerProps) {
    const percentComplete = Math.min(
        100,
        Math.round((progress.progressSeconds * 1000) / progress.durationMs * 100)
    );

    return (
        <div className="relative bg-linear-to-r from-red-900/40 via-slate-900 to-slate-950 border-y border-red-500/20">
            <div className="flex items-center gap-4 p-4">
                {/* Poster */}
                <Link
                    href={`/play/${progress.providerSlug}/${progress.providerDramaId}/${progress.episodeNo}`}
                    className="shrink-0"
                >
                    <div className="relative w-16 h-20 rounded-lg overflow-hidden ring-2 ring-red-500/30">
                        <img
                            src={progress.coverUrl}
                            alt={progress.dramaTitle}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play size={20} fill="white" className="text-white" />
                        </div>
                    </div>
                </Link>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-red-400 font-bold mb-1 flex items-center gap-1">
                        <Clock size={12} />
                        Lanjutkan Menonton
                    </p>

                    <h4 className="text-sm font-bold text-white truncate mb-0.5">
                        {progress.episodeTitle || `Episode ${progress.episodeNo}`}
                    </h4>

                    <p className="text-xs text-slate-400 truncate">
                        {progress.dramaTitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-linear-to-r from-red-600 to-red-400 rounded-full transition-all"
                                style={{ width: `${percentComplete}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                            {percentComplete}%
                        </span>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1">
                        Tersisa {formatTime(progress.durationMs - progress.progressSeconds * 1000)}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Link
                        href={`/play/${progress.providerSlug}/${progress.providerDramaId}/${progress.episodeNo}`}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                    >
                        <Play size={14} fill="white" />
                        Lanjutkan
                    </Link>

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors self-end"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContinueBanner;
