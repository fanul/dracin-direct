'use client';

import { Play, SkipForward, X } from 'lucide-react';

interface NextEpisodeButtonProps {
    countdown: number | null;
    onCancel: () => void;
    onPlayNow: () => void;
    episodeTitle?: string;
    episodeNumber?: number;
}

export function NextEpisodeButton({
    countdown,
    onCancel,
    onPlayNow,
    episodeTitle,
    episodeNumber,
}: NextEpisodeButtonProps) {
    if (countdown === null) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-[180] animate-in fade-in duration-300">
            <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-white/10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Episode Selanjutnya</h3>
                        {episodeTitle && (
                            <p className="text-sm text-slate-400 mt-1">
                                Episode {episodeNumber}: {episodeTitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Cancel autoplay"
                    >
                        <X size={20} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Countdown */}
                <div className="flex items-center justify-center py-6">
                    <div className="relative">
                        {/* Circular progress */}
                        <svg className="w-24 h-24 transform -rotate-90">
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-zinc-700"
                            />
                            <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - countdown / 5)}`}
                                className="text-red-600 transition-all duration-1000 ease-linear"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* Count number */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">{countdown}</span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <p className="text-center text-slate-400 text-sm mb-6">
                    Memulai pemutaran otomatis dalam {countdown} detik...
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
                    >
                        Batalkan
                    </button>
                    <button
                        onClick={onPlayNow}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Play size={18} fill="white" />
                        Tonton Sekarang
                    </button>
                </div>
            </div>
        </div>
    );
}

interface UpNextPreviewProps {
    episodeNumber: number;
    episodeTitle?: string;
    thumbnailUrl?: string;
    onClick: () => void;
    isVisible: boolean;
}

export function UpNextPreview({
    episodeNumber,
    episodeTitle,
    thumbnailUrl,
    onClick,
    isVisible,
}: UpNextPreviewProps) {
    if (!isVisible) return null;

    return (
        <button
            onClick={onClick}
            className="absolute bottom-24 right-4 z-[155] bg-zinc-900/90 backdrop-blur-xl rounded-xl overflow-hidden border border-white/10 shadow-xl hover:scale-105 transition-transform duration-200 group"
        >
            <div className="flex items-center gap-3 p-3">
                {/* Thumbnail */}
                <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-zinc-800">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={`Episode ${episodeNumber}`}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <SkipForward size={16} className="text-slate-500" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} className="text-white" fill="white" />
                    </div>
                </div>

                {/* Info */}
                <div className="text-left">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Up Next</p>
                    <p className="text-sm font-semibold text-white line-clamp-1">
                        Episode {episodeNumber}
                    </p>
                    {episodeTitle && (
                        <p className="text-xs text-slate-400 line-clamp-1">{episodeTitle}</p>
                    )}
                </div>
            </div>
        </button>
    );
}