'use client';

import { useState, useRef, useCallback } from 'react';
import { SkipBack, SkipForward, Play, Pause } from 'lucide-react';

interface GestureOverlayProps {
    onDoubleTapLeft: () => void;
    onDoubleTapRight: () => void;
    onSingleTap: () => void;
    isPlaying: boolean;
}

interface FeedbackState {
    type: 'rewind' | 'forward' | 'play' | 'pause' | null;
    visible: boolean;
}

export function GestureOverlay({
    onDoubleTapLeft,
    onDoubleTapRight,
    onSingleTap,
    isPlaying,
}: GestureOverlayProps) {
    const [feedback, setFeedback] = useState<FeedbackState>({ type: null, visible: false });
    const lastTapTime = useRef<number>(0);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);
    const tapPosition = useRef<'left' | 'center' | 'right'>('center');

    const showFeedback = useCallback((type: FeedbackState['type']) => {
        setFeedback({ type, visible: true });

        if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
        }

        tapTimeout.current = setTimeout(() => {
            setFeedback(prev => ({ ...prev, visible: false }));
        }, 600);
    }, []);

    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        // Determine tap position
        if (x < width * 0.33) {
            tapPosition.current = 'left';
        } else if (x > width * 0.67) {
            tapPosition.current = 'right';
        } else {
            tapPosition.current = 'center';
        }

        const currentTime = Date.now();
        const timeDiff = currentTime - lastTapTime.current;

        if (timeDiff < 300 && timeDiff > 0) {
            // Double tap detected
            if (tapTimeout.current) {
                clearTimeout(tapTimeout.current);
            }

            if (tapPosition.current === 'left') {
                onDoubleTapLeft();
                showFeedback('rewind');
            } else if (tapPosition.current === 'right') {
                onDoubleTapRight();
                showFeedback('forward');
            }

            lastTapTime.current = 0;
        } else {
            // Single tap (delayed to check for double tap)
            lastTapTime.current = currentTime;

            tapTimeout.current = setTimeout(() => {
                if (tapPosition.current === 'center') {
                    onSingleTap();
                    showFeedback(isPlaying ? 'pause' : 'play');
                }
            }, 300);
        }
    };

    const getFeedbackIcon = () => {
        switch (feedback.type) {
            case 'rewind':
                return <SkipBack size={48} className="text-white" />;
            case 'forward':
                return <SkipForward size={48} className="text-white" />;
            case 'play':
                return <Play size={48} className="text-white ml-2" fill="white" />;
            case 'pause':
                return <Pause size={48} className="text-white" />;
            default:
                return null;
        }
    };

    const getFeedbackText = () => {
        switch (feedback.type) {
            case 'rewind':
                return '-10 detik';
            case 'forward':
                return '+10 detik';
            case 'play':
                return 'Putar';
            case 'pause':
                return 'Jeda';
            default:
                return '';
        }
    };

    return (
        <div className="absolute inset-0 z-[140]" onClick={handleTap}>
            {/* Touch zones (visible only on hover for debugging) */}
            <div className="absolute inset-0 flex pointer-events-none opacity-0 hover:opacity-10 transition-opacity">
                <div className="w-1/3 border-r border-white/20" />
                <div className="w-1/3 border-r border-white/20" />
                <div className="w-1/3" />
            </div>

            {/* Feedback overlay */}
            {feedback.visible && feedback.type && (
                <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${feedback.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                        }`}
                >
                    <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 flex flex-col items-center animate-in zoom-in-50 duration-200">
                        {getFeedbackIcon()}
                        <span className="text-white font-semibold mt-2 text-lg">
                            {getFeedbackText()}
                        </span>
                    </div>
                </div>
            )}

            {/* Double tap hint areas (faint indicators) */}
            <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-4 opacity-0 hover:opacity-30 transition-opacity pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <SkipBack size={24} className="text-white" />
                </div>
            </div>

            <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-4 opacity-0 hover:opacity-30 transition-opacity pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <SkipForward size={24} className="text-white" />
                </div>
            </div>
        </div>
    );
}

// Mobile-optimized version with touch events
export function GestureOverlayMobile({
    onDoubleTapLeft,
    onDoubleTapRight,
    onSingleTap,
    isPlaying,
}: GestureOverlayProps) {
    const [feedback, setFeedback] = useState<FeedbackState>({ type: null, visible: false });
    const lastTapTime = useRef<number>(0);
    const touchStartX = useRef<number>(0);

    const showFeedback = useCallback((type: FeedbackState['type']) => {
        setFeedback({ type, visible: true });
        setTimeout(() => {
            setFeedback(prev => ({ ...prev, visible: false }));
        }, 800);
    }, []);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEndX = e.changedTouches[0].clientX;
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeX = touchEndX - rect.left;
        const width = rect.width;

        // Determine position
        let position: 'left' | 'center' | 'right';
        if (relativeX < width * 0.33) {
            position = 'left';
        } else if (relativeX > width * 0.67) {
            position = 'right';
        } else {
            position = 'center';
        }

        const currentTime = Date.now();
        const timeDiff = currentTime - lastTapTime.current;

        if (timeDiff < 300 && timeDiff > 0) {
            // Double tap
            e.preventDefault();
            if (position === 'left') {
                onDoubleTapLeft();
                showFeedback('rewind');
            } else if (position === 'right') {
                onDoubleTapRight();
                showFeedback('forward');
            }
            lastTapTime.current = 0;
        } else {
            // Single tap (check for double tap)
            lastTapTime.current = currentTime;
            setTimeout(() => {
                if (lastTapTime.current === currentTime) {
                    // No double tap occurred
                    if (position === 'center') {
                        onSingleTap();
                    }
                }
            }, 300);
        }
    };

    const getFeedbackIcon = () => {
        switch (feedback.type) {
            case 'rewind':
                return <SkipBack size={56} className="text-white" />;
            case 'forward':
                return <SkipForward size={56} className="text-white" />;
            default:
                return null;
        }
    };

    const getFeedbackText = () => {
        switch (feedback.type) {
            case 'rewind':
                return '-10 detik';
            case 'forward':
                return '+10 detik';
            default:
                return '';
        }
    };

    return (
        <div
            className="absolute inset-0 z-[140] touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Feedback overlay */}
            {feedback.visible && feedback.type && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/70 backdrop-blur-lg rounded-3xl p-8 flex flex-col items-center animate-in zoom-in-50 duration-200">
                        {getFeedbackIcon()}
                        <span className="text-white font-bold mt-3 text-xl">
                            {getFeedbackText()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}