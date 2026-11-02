'use client';

import { useState, useCallback, useEffect, useRef, RefObject } from 'react';

interface UsePlaybackOptions {
    videoRef: RefObject<HTMLVideoElement | null>;
    onProgress?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onNextEpisode?: () => void;
}

interface PlaybackState {
    currentTime: number;
    duration: number;
    volume: number;
    isPlaying: boolean;
    isFullscreen: boolean;
    isMuted: boolean;
    playbackSpeed: number;
    showSubtitles: boolean;
    isBuffering: boolean;
    buffered: number;
}

interface UIState {
    isEpisodeDrawerOpen: boolean;
    isSettingsOpen: boolean;
    isAutoPlayEnabled: boolean;
    nextEpisodeCountdown: number | null;
    showControls: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const AUTOPLAY_COUNTDOWN = 5;

export function usePlayback({ videoRef, onProgress, onEnded, onNextEpisode }: UsePlaybackOptions) {
    // Playback state
    const [playback, setPlayback] = useState<PlaybackState>({
        currentTime: 0,
        duration: 0,
        volume: 1,
        isPlaying: false,
        isFullscreen: false,
        isMuted: false,
        playbackSpeed: 1,
        showSubtitles: true,
        isBuffering: false,
        buffered: 0,
    });

    // UI state
    const [ui, setUI] = useState<UIState>({
        isEpisodeDrawerOpen: false,
        isSettingsOpen: false,
        isAutoPlayEnabled: true,
        nextEpisodeCountdown: null,
        showControls: true,
    });

    // Refs for timers and intervals
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownValueRef = useRef<number | null>(null);
    const hideControlsDelay = 3000;

    // Load auto-play preference from localStorage
    useEffect(() => {
        const savedAutoPlay = localStorage.getItem('dracinhub_autoplay');
        if (savedAutoPlay !== null) {
            setUI(prev => ({ ...prev, isAutoPlayEnabled: savedAutoPlay === 'true' }));
        }
    }, []);

    // Save auto-play preference
    const setAutoPlayEnabled = useCallback((enabled: boolean) => {
        localStorage.setItem('dracinhub_autoplay', String(enabled));
        setUI(prev => ({ ...prev, isAutoPlayEnabled: enabled }));
    }, []);

    // Toggle play/pause
    const togglePlay = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (video.paused) {
                await video.play();
            } else {
                video.pause();
            }
        } catch (error) {
            console.error('Playback failed:', error);
        }
    }, [videoRef]);

    // Seek to time
    const seek = useCallback((time: number) => {
        const video = videoRef.current;
        if (!video) return;

        const newTime = Math.max(0, Math.min(time, video.duration || 0));
        video.currentTime = newTime;
    }, [videoRef]);

    // Seek relative (forward/backward)
    const seekRelative = useCallback((delta: number) => {
        const video = videoRef.current;
        if (!video) return;

        seek(video.currentTime + delta);
    }, [videoRef, seek]);

    // Set volume
    const setVolume = useCallback((volume: number) => {
        const video = videoRef.current;
        if (!video) return;

        const newVolume = Math.max(0, Math.min(1, volume));
        video.volume = newVolume;
        if (newVolume > 0 && video.muted) {
            video.muted = false;
        }
    }, [videoRef]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
    }, [videoRef]);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(async () => {
        const video = videoRef.current;
        if (!video) return;

        try {
            if (!document.fullscreenElement) {
                await video.requestFullscreen();
                setPlayback(prev => ({ ...prev, isFullscreen: true }));
            } else {
                await document.exitFullscreen();
                setPlayback(prev => ({ ...prev, isFullscreen: false }));
            }
        } catch {
            // Fullscreen not supported
        }
    }, [videoRef]);

    // Cycle through playback speeds
    const cyclePlaybackSpeed = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const currentIndex = PLAYBACK_SPEEDS.indexOf(playback.playbackSpeed);
        const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
        const newSpeed = PLAYBACK_SPEEDS[nextIndex];

        video.playbackRate = newSpeed;
        setPlayback(prev => ({ ...prev, playbackSpeed: newSpeed }));
    }, [videoRef, playback.playbackSpeed]);

    // Set specific playback speed
    const setPlaybackSpeed = useCallback((speed: number) => {
        const video = videoRef.current;
        if (!video) return;

        video.playbackRate = speed;
        setPlayback(prev => ({ ...prev, playbackSpeed: speed }));
    }, [videoRef]);

    // Toggle subtitles
    const toggleSubtitles = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        // Toggle text tracks
        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = playback.showSubtitles ? 'disabled' : 'showing';
        }

        setPlayback(prev => ({ ...prev, showSubtitles: !prev.showSubtitles }));
    }, [videoRef, playback.showSubtitles]);

    // Toggle episode drawer
    const toggleEpisodeDrawer = useCallback(() => {
        setUI(prev => ({ ...prev, isEpisodeDrawerOpen: !prev.isEpisodeDrawerOpen }));
    }, []);

    // Toggle settings
    const toggleSettings = useCallback(() => {
        setUI(prev => ({ ...prev, isSettingsOpen: !prev.isSettingsOpen }));
    }, []);

    // Show/hide controls
    const showControlsTemporarily = useCallback(() => {
        setUI(prev => ({ ...prev, showControls: true }));

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        controlsTimeoutRef.current = setTimeout(() => {
            if (!ui.isEpisodeDrawerOpen && !ui.isSettingsOpen) {
                setUI(prev => ({ ...prev, showControls: false }));
            }
        }, hideControlsDelay);
    }, [ui.isEpisodeDrawerOpen, ui.isSettingsOpen]);

    // Start next episode countdown
    const startNextEpisodeCountdown = useCallback(() => {
        if (!ui.isAutoPlayEnabled || ui.nextEpisodeCountdown !== null) return;

        // Initialize countdown value in ref
        countdownValueRef.current = AUTOPLAY_COUNTDOWN;
        setUI(prev => ({ ...prev, nextEpisodeCountdown: AUTOPLAY_COUNTDOWN }));

        countdownIntervalRef.current = setInterval(() => {
            const currentValue = countdownValueRef.current;
            
            if (currentValue === null || currentValue <= 1) {
                // Clear interval
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                }
                
                // Update state and call next episode
                setUI(prev => ({ ...prev, nextEpisodeCountdown: null }));
                countdownValueRef.current = null;
                
                if (currentValue !== null && onNextEpisode) {
                    onNextEpisode();
                }
            } else {
                // Decrement countdown
                countdownValueRef.current = currentValue - 1;
                setUI(prev => ({ ...prev, nextEpisodeCountdown: currentValue - 1 }));
            }
        }, 1000);
    }, [ui.isAutoPlayEnabled, ui.nextEpisodeCountdown, onNextEpisode]);

    // Cancel next episode countdown
    const cancelNextEpisodeCountdown = useCallback(() => {
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
        }
        setUI(prev => ({ ...prev, nextEpisodeCountdown: null }));
        countdownValueRef.current = null;
    }, []);

    // Video event handlers (memoized to prevent memory leaks)
    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        const current = video.currentTime;
        const duration = video.duration || 0;

        setPlayback(prev => ({
            ...prev,
            currentTime: current,
            duration: duration,
            buffered: video.buffered.length > 0
                ? video.buffered.end(video.buffered.length - 1)
                : 0,
        }));

        onProgress?.(current, duration);

        // Start countdown when video is near end (>90% and last 10 seconds)
        if (duration > 0 && current / duration > 0.9 && duration - current < 10) {
            startNextEpisodeCountdown();
        }
    }, [onProgress, startNextEpisodeCountdown]);

    const handlePlay = useCallback(() => {
        setPlayback(prev => ({ ...prev, isPlaying: true }));
    }, []);

    const handlePause = useCallback(() => {
        setPlayback(prev => ({ ...prev, isPlaying: false }));
    }, []);

    const handleVolumeChange = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        setPlayback(prev => ({
            ...prev,
            volume: video.volume,
            isMuted: video.muted,
        }));
    }, []);

    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;

        setPlayback(prev => ({
            ...prev,
            duration: video.duration || 0,
        }));
    }, []);

    const handleWaiting = useCallback(() => {
        setPlayback(prev => ({ ...prev, isBuffering: true }));
    }, []);

    const handleCanPlay = useCallback(() => {
        setPlayback(prev => ({ ...prev, isBuffering: false }));
    }, []);

    const handleEnded = useCallback(() => {
        onEnded?.();
        if (ui.isAutoPlayEnabled) {
            startNextEpisodeCountdown();
        }
    }, [onEnded, ui.isAutoPlayEnabled, startNextEpisodeCountdown]);

    const handleFullscreenChange = useCallback(() => {
        setPlayback(prev => ({
            ...prev,
            isFullscreen: !!document.fullscreenElement,
        }));
    }, []);

    // Attach event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Use stable references for event handlers
        const onTimeUpdate = () => handleTimeUpdate();
        const onPlay = () => handlePlay();
        const onPause = () => handlePause();
        const onVolumeChange = () => handleVolumeChange();
        const onLoadedMetadata = () => handleLoadedMetadata();
        const onWaiting = () => handleWaiting();
        const onCanPlay = () => handleCanPlay();
        const onEnded = () => handleEnded();
        const onFullscreenChange = () => handleFullscreenChange();

        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('volumechange', onVolumeChange);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('ended', onEnded);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('volumechange', onVolumeChange);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
            video.removeEventListener('ended', onEnded);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [videoRef]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, []);

    // Format time as MM:SS or HH:MM:SS
    const formatTime = useCallback((seconds: number): string => {
        if (!isFinite(seconds) || seconds < 0) return '0:00';

        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        // State from playback
        ...playback,
        // State from ui
        ...ui,

        // Actions
        togglePlay,
        seek,
        seekRelative,
        setVolume,
        toggleMute,
        toggleFullscreen,
        cyclePlaybackSpeed,
        setPlaybackSpeed,
        toggleSubtitles,
        toggleEpisodeDrawer,
        toggleSettings,
        showControlsTemporarily,
        setAutoPlayEnabled,
        cancelNextEpisodeCountdown,

        // Utilities
        formatTime,
        PLAYBACK_SPEEDS,
        AUTOPLAY_COUNTDOWN,
    };
}

export type PlaybackHookReturn = ReturnType<typeof usePlayback>;