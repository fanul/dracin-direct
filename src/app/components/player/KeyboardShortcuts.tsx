'use client';

import { useEffect, useCallback, useState } from 'react';
import { Keyboard, X, ChevronRight } from 'lucide-react';

interface KeyboardShortcutsProps {
    onTogglePlay: () => void;
    onSeekRelative: (seconds: number) => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    onToggleEpisodeDrawer: () => void;
    onNextEpisode: () => void;
    onVolumeChange: (delta: number) => void;
    isEnabled?: boolean;
}

export function useKeyboardShortcuts({
    onTogglePlay,
    onSeekRelative,
    onToggleMute,
    onToggleFullscreen,
    onToggleEpisodeDrawer,
    onNextEpisode,
    onVolumeChange,
    isEnabled = true,
}: KeyboardShortcutsProps) {
    useEffect(() => {
        if (!isEnabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement)?.isContentEditable
            ) {
                return;
            }

            switch (e.key) {
                case ' ':
                case 'k':
                case 'K':
                    e.preventDefault();
                    onTogglePlay();
                    break;

                case 'ArrowLeft':
                case 'j':
                case 'J':
                    e.preventDefault();
                    onSeekRelative(-10);
                    break;

                case 'ArrowRight':
                case 'l':
                case 'L':
                    e.preventDefault();
                    onSeekRelative(10);
                    break;

                case 'ArrowUp':
                    e.preventDefault();
                    onVolumeChange(0.1);
                    break;

                case 'ArrowDown':
                    e.preventDefault();
                    onVolumeChange(-0.1);
                    break;

                case 'f':
                case 'F':
                    e.preventDefault();
                    onToggleFullscreen();
                    break;

                case 'm':
                case 'M':
                    e.preventDefault();
                    onToggleMute();
                    break;

                case 'n':
                case 'N':
                    e.preventDefault();
                    onNextEpisode();
                    break;

                case 'e':
                case 'E':
                    e.preventDefault();
                    onToggleEpisodeDrawer();
                    break;

                case 'Escape':
                    // Let Escape propagate for closing overlays
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        isEnabled,
        onTogglePlay,
        onSeekRelative,
        onToggleMute,
        onToggleFullscreen,
        onToggleEpisodeDrawer,
        onNextEpisode,
        onVolumeChange,
    ]);
}

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    { key: 'Space / K', action: 'Putar / Jeda' },
    { key: '← / J', action: 'Mundur 10 detik' },
    { key: '→ / L', action: 'Maju 10 detik' },
    { key: '↑ / ↓', action: 'Volume naik / turun' },
    { key: 'F', action: 'Layar penuh' },
    { key: 'M', action: 'Bisukan' },
    { key: 'N', action: 'Episode berikutnya' },
    { key: 'E', action: 'Daftar episode' },
    { key: 'ESC', action: 'Tutup overlay' },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        // Hide hint after 5 seconds on first load
        const timer = setTimeout(() => {
            setShowHint(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    if (!isOpen && showHint) {
        return (
            <button
                onClick={() => setShowHint(false)}
                className="absolute bottom-4 left-4 z-[155] flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-md rounded-lg text-white/70 text-sm hover:bg-black/80 transition-colors"
            >
                <Keyboard size={16} />
                <span>Tekan ? untuk bantuan</span>
                <ChevronRight size={14} />
            </button>
        );
    }

    if (!isOpen) return null;

    return (
        <div
            className="absolute inset-0 z-[185] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl w-full max-w-md mx-4 shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600/20 rounded-lg">
                            <Keyboard size={20} className="text-red-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Pintasan Keyboard</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close shortcuts help"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-1">
                        {shortcuts.map((shortcut, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors"
                            >
                                <span className="text-slate-300">{shortcut.action}</span>
                                <kbd className="px-3 py-1.5 bg-zinc-800 rounded-lg text-sm font-mono text-white border border-zinc-700 min-w-[80px] text-center">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                    <p className="text-xs text-slate-500 text-center">
                        Pintasan ini berfungsi saat video diputar dan tidak sedang mengetik
                    </p>
                </div>
            </div>
        </div>
    );
}

// Hook to handle the '?' key for showing help
export function useKeyboardHelp() {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' || e.key === '/') {
                e.preventDefault();
                setIsHelpOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return { isHelpOpen, setIsHelpOpen };
}