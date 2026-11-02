'use client';

import { useState, useRef, useEffect } from 'react';

interface GenreFilterTabsProps {
    genres: string[];
    activeGenre: string;
    onGenreChange: (genre: string) => void;
}

export function GenreFilterTabs({ genres, activeGenre, onGenreChange }: GenreFilterTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [genres]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const allGenres = ['all', ...genres];

    return (
        <div className="relative">
            {/* Left Arrow */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-neutral-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                    aria-label="Scroll left"
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Tabs */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto scrollbar-hide px-1 py-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {allGenres.map((genre) => (
                    <button
                        key={genre}
                        onClick={() => onGenreChange(genre)}
                        className={`
              px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
              ${activeGenre === genre
                                ? 'bg-red-600 text-white'
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                            }
            `}
                    >
                        {genre === 'all' ? 'Semua' : genre}
                    </button>
                ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-neutral-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg"
                    aria-label="Scroll right"
                >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default GenreFilterTabs;
