'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipForward,
    SkipBack,
    Subtitles,
} from 'lucide-react';
import type { PlaybackHookReturn } from '@/hooks/usePlayback';

interface CustomVideoControlsProps {
    playback: PlaybackHookReturn;
    onSeek: (time: number) => void;
    onTogglePlay: () => void;
    onToggleMute: () => void;
    onToggleFullscreen: () => void;
    onToggleSettings: () => void;
    onToggleEpisodeDrawer: () => void;
    onToggleSubtitles: () => void;
    onCyclePlaybackSpeed: () => void;
    onShowControlsTemporarily: () => void;
}

export function CustomVideoControls({
    playback,
    onSeek,
    onTogglePlay,
    onToggleMute,
    onToggleFullscreen,
    onToggleSettings,
    onToggleEpisodeDrawer,
    onToggleSubtitles,
    onCyclePlaybackSpeed,
    onShowControlsTemporarily,
}: CustomVideoControlsProps) {
    const progressRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState(0);

    const progress = playback.duration > 0
        ? (playback.currentTime / playback.duration) * 100
        : 0;

    const buffered = playback.duration > 0
        ? (playback.buffered / playback.duration) * 100
        : 0;

    // Calculate time from mouse position
    const calculateTimeFromPosition = useCallback((clientX: number): number => {
        if (!progressRef.current || !playback.duration) return 0;

        const rect = progressRef.current.getBoundingClientRect();
        const position = (clientX - rect.left) / rect.width;
        return Math.max(0, Math.min(1, position)) * playback.duration;
    }, [playback.duration]);

    // Handle progress bar click/drag
    const handleProgressMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const time = calculateTimeFromPosition(e.clientX);
        onSeek(time);
    };

    const handleProgressMouseMove = (e: React.MouseEvent) => {
        if (!progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setHoverPosition(position * 100);
        setHoverTime(calculateTimeFromPosition(e.clientX));

        if (isDragging) {
            onSeek(calculateTimeFromPosition(e.clientX));
        }
    };

    const handleProgressMouseLeave = () => {
        setHoverTime(null);
        setIsDragging(false);
    };

    const handleProgressMouseUp = () => {
        setIsDragging(false);
    };

    // Global mouse up handler for drag release
    useEffect(() => {
        if (!isDragging) return;

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    // Handle volume bar click
    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const volume = (e.clientX - rect.left) / rect.width;
        playback.setVolume(volume);
    };

    return (
        <div
            className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-300 z-[150] ${playback.showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onMouseMove={onShowControlsTemporarily}
            onClick={onShowControlsTemporarily}
        >
            {/* Center controls - Play/Pause */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlay();
                    }}
                    className={`w-20 h-20 rounded-full bg-black/40 hover:bg-red-600/80 backdrop-blur-md flex items-center justify-center transition-all duration-300 pointer-events-auto shadow-2xl border border-white/10 hover:scale-110 ${playback.isPlaying ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
                        }`}
                >
                    {playback.isPlaying ? (
                        <Pause size={32} className="text-white ml-0" />
                    ) : (
                        <Play size={32} className="text-white ml-2" fill="currentColor" />
                    )}
                </button>
            </div>

            {/* Bottom controls container */}
            <div className="p-4 space-y-3 px-6 pb-6">
                {/* Progress bar */}
                <div
                    ref={progressRef}
                    className="relative h-2 bg-white/20 rounded-full cursor-pointer group hover:h-2.5 transition-all duration-200"
                    onMouseDown={handleProgressMouseDown}
                    onMouseMove={handleProgressMouseMove}
                    onMouseLeave={handleProgressMouseLeave}
                    onMouseUp={handleProgressMouseUp}
                >
                    {/* Buffered progress */}
                    <div
                        className="absolute h-full bg-white/40 rounded-full"
                        style={{ width: `${buffered}%` }}
                    />

                    {/* Playback progress */}
                    <div
                        className="absolute h-full bg-red-600 rounded-full transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />

                    {/* Hover preview */}
                    {hoverTime !== null && !isDragging && (
                        <>
                            <div
                                className="absolute top-0 h-full w-0.5 bg-white/50"
                                style={{ left: `${hoverPosition}%` }}
                            />
                            <div
                                className="absolute -top-10 transform -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs text-white"
                                style={{ left: `${hoverPosition}%` }}
                            >
                                {playback.formatTime(hoverTime)}
                            </div>
                        </>
                    )}

                    {/* Seek handle */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
                    />
                </div>

                {/* Control buttons */}
                <div className="flex items-center justify-between pt-2">
                    {/* Left controls */}
                    <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePlay();
                            }}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors group"
                            aria-label={playback.isPlaying ? 'Pause' : 'Play'}
                        >
                            {playback.isPlaying ? (
                                <Pause size={24} className="text-white group-hover:text-red-400 transition-colors" fill="currentColor" />
                            ) : (
                                <Play size={24} className="text-white group-hover:text-red-400 transition-colors" fill="currentColor" />
                            )}
                        </button>

                        {/* Skip backward */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                playback.seekRelative(-10);
                            }}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
                            aria-label="Skip back 10s"
                        >
                            <SkipBack size={20} className="text-white" />
                        </button>

                        {/* Skip forward */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                playback.seekRelative(10);
                            }}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors hidden sm:block"
                            aria-label="Skip forward 10s"
                        >
                            <SkipForward size={20} className="text-white" />
                        </button>

                        {/* Volume control */}
                        <div className="flex items-center group relative -ml-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleMute();
                                }}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors z-10"
                                aria-label={playback.isMuted ? 'Unmute' : 'Mute'}
                            >
                                {playback.isMuted || playback.volume === 0 ? (
                                    <VolumeX size={20} className="text-red-400" />
                                ) : (
                                    <Volume2 size={20} className="text-white" />
                                )}
                            </button>

                            {/* Volume slider */}
                            <div
                                className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out origin-left flex items-center"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div
                                    className="h-1.5 w-full bg-white/30 rounded-full cursor-pointer mx-1 relative group/slider"
                                    onClick={handleVolumeClick}
                                >
                                    <div
                                        className="absolute h-full bg-white group-hover/slider:bg-red-500 rounded-full transition-colors"
                                        style={{ width: `${playback.isMuted ? 0 : playback.volume * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Time display */}
                        <div className="text-sm text-white/90 font-medium tabular-nums ml-2">
                            <span>{playback.formatTime(playback.currentTime)}</span>
                            <span className="text-white/40 mx-1.5">/</span>
                            <span className="text-white/60">{playback.formatTime(playback.duration)}</span>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1.5">
                        {/* Subtitles toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSubtitles();
                            }}
                            className={`p-2 rounded-full transition-colors relative group ${playback.showSubtitles ? 'text-white' : 'text-white/50 hover:text-white'
                                }`}
                            aria-label="Toggle subtitles"
                        >
                            <Subtitles size={20} />
                            {playback.showSubtitles && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
                            )}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Subtitles
                            </span>
                        </button>

                        {/* Playback speed */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCyclePlaybackSpeed();
                            }}
                            className="px-2 py-1.5 hover:bg-white/20 rounded-md transition-colors min-w-[48px] flex justify-center group relative"
                            aria-label="Change playback speed"
                        >
                            <span className="text-sm text-white font-medium">
                                {playback.playbackSpeed}x
                            </span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Speed
                            </span>
                        </button>

                        {/* Settings */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSettings();
                            }}
                            className={`p-2 rounded-full transition-colors group relative ${playback.isSettingsOpen ? 'bg-white/20 text-white' : 'hover:bg-white/20 text-white/90'
                                }`}
                            aria-label="Settings"
                        >
                            <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Settings
                            </span>
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFullscreen();
                            }}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors ml-1 group relative"
                            aria-label={playback.isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            {playback.isFullscreen ? (
                                <Minimize size={22} className="text-white" />
                            ) : (
                                <Maximize size={22} className="text-white" />
                            )}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                Fullscreen
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Buffering indicator */}
            {playback.isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}