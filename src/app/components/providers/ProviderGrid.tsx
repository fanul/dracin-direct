'use client';

import { ProviderCard } from './ProviderCard';
import type { ProviderInfo } from '@/lib/types';

interface ProviderGridProps {
  providers: ProviderInfo[];
}

export function ProviderGrid({ providers }: ProviderGridProps) {
  if (providers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Tidak Ada Provider</h3>
        <p className="text-neutral-400">Belum ada provider yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {providers.map((provider, index) => (
        <ProviderCard key={provider.slug} provider={provider} index={index} />
      ))}
    </div>
  );
}
