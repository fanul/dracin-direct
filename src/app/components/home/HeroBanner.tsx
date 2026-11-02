'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, Heart, Plus } from 'lucide-react';
import type { FeaturedDrama } from '@/lib/types';

interface HeroBannerProps {
    dramas: FeaturedDrama[];
    autoRotateInterval?: number;
}

export function HeroBanner({ dramas, autoRotateInterval = 5000 }: HeroBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentDrama = dramas[currentIndex];

    const goToSlide = useCallback((index: number) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setCurrentIndex(index);
        setTimeout(() => setIsTransitioning(false), 500);
    }, [isTransitioning]);

    const nextSlide = useCallback(() => {
        const nextIndex = (currentIndex + 1) % dramas.length;
        goToSlide(nextIndex);
    }, [currentIndex, dramas.length, goToSlide]);

    const prevSlide = useCallback(() => {
        const prevIndex = (currentIndex - 1 + dramas.length) % dramas.length;
        goToSlide(prevIndex);
    }, [currentIndex, dramas.length, goToSlide]);

    // Auto-rotate
    useEffect(() => {
        if (isPaused || dramas.length <= 1) return;

        const interval = setInterval(nextSlide, autoRotateInterval);
        return () => clearInterval(interval);
    }, [isPaused, autoRotateInterval, nextSlide, dramas.length]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    // Handle swipe gestures
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) nextSlide();
        if (isRightSwipe) prevSlide();
    };

    if (!currentDrama) return null;

    return (
        <div
            className="relative w-full overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div aria-live="polite" className="sr-only" role="status">
                Slide {currentIndex + 1} dari {dramas.length}: {currentDrama.title}
            </div>

            {/* Slides Container */}
            <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
                {dramas.map((drama, index) => (
                    <div
                        key={drama.id}
                        className="w-full shrink-0 relative aspect-[4/5] sm:aspect-16/10 md:aspect-video lg:aspect-21/9"
                    >
                        {/* Background Image */}
                        <img
                            src={drama.coverUrl}
                            alt={drama.title}
                            className="w-full h-full object-cover"
                            loading={index === 0 ? 'eager' : 'lazy'}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-black/20" />
                        <div className="absolute inset-0 bg-linear-to-r from-neutral-950/80 via-transparent to-transparent" />

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12">
                            <div className="max-w-2xl">
                                {/* Badges */}
                                <div className="flex items-center space-x-2 mb-3">
                                    {drama.isNew && (
                                        <span className="bg-red-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                            Baru
                                        </span>
                                    )}
                                    <span className="bg-white/10 backdrop-blur text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider text-white/80">
                                        #{index + 1} Hari Ini
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight tracking-tight text-white drop-shadow-lg">
                                    {drama.title}
                                </h1>

                                {/* Metadata */}
                                <div className="flex items-center space-x-3 text-sm text-neutral-300 mb-4">
                                    <span className="flex items-center">
                                        <span className="text-amber-400 mr-1">⭐</span>
                                        {drama.rating?.toFixed(1) || '4.5'}
                                    </span>
                                    <span>•</span>
                                    <span>{drama.episodeCount} Episodes</span>
                                    <span>•</span>
                                    <span className="text-red-500 font-semibold">{drama.providerName}</span>
                                </div>

                                {/* Synopsis (truncated) */}
                                <p className="text-neutral-400 text-sm mb-6 line-clamp-2 hidden sm:block max-w-xl">
                                    {drama.synopsis || 'Nonton drama seru ini sekarang!'}
                                </p>

                                {/* Tags */}
                                {drama.tags && drama.tags.length > 0 && (
                                    <div className="hidden sm:flex flex-wrap gap-2 mb-6">
                                        {drama.tags.slice(0, 3).map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs px-2 py-1 bg-white/10 rounded text-neutral-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center space-x-3">
                                    <Link
                                        href={`/dramas/${drama.id}`}
                                        className="flex items-center justify-center space-x-2 bg-white text-black py-3 px-6 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-105 hover:bg-neutral-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                    >
                                        <Play size={18} fill="black" />
                                        <span>Tonton Sekarang</span>
                                    </Link>

                                    <button
                                        type="button"
                                        aria-label="Sukai drama"
                                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    >
                                        <Heart size={20} />
                                    </button>

                                    <button
                                        type="button"
                                        aria-label="Tambah ke daftar"
                                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Dots */}
            {dramas.length > 1 && (
                <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-8 lg:bottom-12 lg:right-12 flex items-center space-x-2">
                    {dramas.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`
                transition-all duration-300 rounded-full
                ${index === currentIndex
                                    ? 'w-6 h-2 bg-red-600'
                                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                                }
              `}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}

            {dramas.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur px-2 py-1 rounded-md text-[11px] text-white/90 font-semibold">
                    {currentIndex + 1} / {dramas.length}
                </div>
            )}

            {/* Navigation Arrows (Desktop) */}
            {dramas.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur hidden lg:flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        aria-label="Previous slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 backdrop-blur hidden lg:flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                        aria-label="Next slide"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}

export default HeroBanner;
