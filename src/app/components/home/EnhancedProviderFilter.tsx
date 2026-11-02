'use client';

import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import type { ProviderInfo } from '@/lib/types';

interface ProviderNavBarProps {
  providers: ProviderInfo[];
  featuredCount?: number;
}

export function EnhancedProviderFilter({
  providers,
  featuredCount = 5,
}: ProviderNavBarProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sort by content count (popularity) and pick top N
  const sortedProviders = [...providers].sort((a, b) => b.contentCount - a.contentCount);
  const featuredProviders = sortedProviders.slice(0, featuredCount);
  const moreProviders = sortedProviders.slice(featuredCount);

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', checkScrollPosition);
      return () => scrollEl.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Navigate to provider page
  const navigateToProvider = (slug: string) => {
    router.push(`/providers/${slug}`);
    setShowDropdown(false);
  };

  return (
    <div className="sticky top-[64px] z-30 bg-neutral-950/95 backdrop-blur-xl border-b border-white/5">
      <div className="px-4 py-3">
        <div className="relative">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-neutral-900/90 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shadow-lg"
              aria-label="Scroll left"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Navigation buttons */}
          <div
            ref={scrollRef}
            className="flex items-center space-x-2 overflow-x-auto scrollbar-hide snap-x"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* All Providers button */}
            <button
              onClick={() => router.push('/providers')}
              className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all duration-200 snap-start whitespace-nowrap"
            >
              Semua
            </button>

            {/* Featured Provider buttons */}
            {featuredProviders.map((provider) => (
              <button
                key={provider.slug}
                onClick={() => navigateToProvider(provider.slug)}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white transition-all duration-200 snap-start whitespace-nowrap"
              >
                {provider.name}
              </button>
            ))}

            {/* More dropdown */}
            {moreProviders.length > 0 && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-start ${
                    showDropdown
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>Lainnya</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <>
                    <button
                      type="button"
                      aria-label="Tutup menu"
                      className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute top-full right-0 mt-2 w-56 bg-neutral-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50 max-h-72 overflow-y-auto">
                      {moreProviders.map((provider) => (
                        <button
                          key={provider.slug}
                          onClick={() => navigateToProvider(provider.slug)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-neutral-300 hover:bg-white/5 transition-colors"
                        >
                          <span className="font-medium">{provider.name}</span>
                          <span className="text-xs text-neutral-500">{provider.contentCount}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-neutral-900/90 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-neutral-800 transition-colors shadow-lg"
              aria-label="Scroll right"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EnhancedProviderFilter;
