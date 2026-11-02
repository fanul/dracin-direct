'use client';

import { ChevronRight } from 'lucide-react';
import { DramaCard } from './DramaCard';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import type { ProviderSectionData } from '@/lib/types';

interface LazyProviderSectionProps {
  section: ProviderSectionData;
  index: number;
  onViewAll?: (providerSlug: string) => void;
}

export function LazyProviderSection({
  section,
  index,
  onViewAll,
}: LazyProviderSectionProps) {
  const { ref } = useIntersectionObserver<HTMLElement>({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true,
  });

  const { provider, dramas, totalCount } = section;


  return (
    <section
      ref={ref}
      className="mt-8 pt-6 border-t border-white/5 animate-slide-up min-h-[200px]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Provider Logo/Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/30 to-red-900/30 flex items-center justify-center border border-red-500/20">
              <span className="text-lg font-black text-red-500">
                {provider.name.charAt(0)}
              </span>
            </div>

            <div className="text-left">
              <h2 className="text-xl font-black tracking-tight text-white">
                {provider.name}
              </h2>
              <p className="text-xs text-neutral-500">
                {totalCount} drama tersedia
              </p>
            </div>
          </div>

          {onViewAll && (
            <button
              onClick={() => onViewAll(provider.slug)}
              className="flex items-center text-sm text-neutral-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Cards */}
        {dramas.length > 0 ? (
          <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {dramas.map((drama) => (
              <div key={drama.id} className="snap-start">
                <DramaCard
                  drama={drama}
                  showProviderBadge={false}
                  variant="default"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-400">
            Belum ada drama untuk provider ini.
          </div>
        )}
      </div>
    </section>
  );
}

export default LazyProviderSection;
