'use client';

import { useEffect, useState } from 'react';
import { PlayCircle, PauseCircle } from 'lucide-react';

interface AutoPlayToggleProps {
    isEnabled: boolean;
    onToggle: () => void;
    className?: string;
}

export function AutoPlayToggle({ isEnabled, onToggle, className = '' }: AutoPlayToggleProps) {
    const [showLabel, setShowLabel] = useState(true);

    useEffect(() => {
        // Hide label after 3 seconds on mobile
        const timer = setTimeout(() => {
            if (window.innerWidth < 768) {
                setShowLabel(false);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${isEnabled
                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                : 'bg-zinc-800/50 text-slate-400 hover:bg-zinc-800'
                } ${className}`}
            aria-label={isEnabled ? 'Disable autoplay' : 'Enable autoplay'}
            title={isEnabled ? 'Autoplay aktif' : 'Autoplay nonaktif'}
        >
            {isEnabled ? (
                <PlayCircle size={18} className="shrink-0" />
            ) : (
                <PauseCircle size={18} className="shrink-0" />
            )}
            {showLabel && (
                <span className="text-sm font-medium whitespace-nowrap">
                    Autoplay {isEnabled ? 'On' : 'Off'}
                </span>
            )}
        </button>
    );
}

interface BingeModeIndicatorProps {
    isActive: boolean;
    episodesRemaining: number;
}

export function BingeModeIndicator({ isActive, episodesRemaining }: BingeModeIndicatorProps) {
    if (!isActive) return null;

    return (
        <div className="absolute top-4 right-4 z-[155] flex items-center gap-2 px-3 py-1.5 bg-red-600/90 backdrop-blur-sm rounded-full text-white text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <PlayCircle size={14} fill="white" />
            <span>Binge Mode</span>
            {episodesRemaining > 0 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                    {episodesRemaining} tersisa
                </span>
            )}
        </div>
    );
}