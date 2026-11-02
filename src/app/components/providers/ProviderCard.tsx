'use client';

import Link from 'next/link';
import { ArrowRight, Film, Star } from 'lucide-react';
import type { ProviderInfo } from '@/lib/types';

interface ProviderCardProps {
  provider: ProviderInfo;
  index?: number;
}

export function ProviderCard({ provider, index = 0 }: ProviderCardProps) {
  // Generate gradient based on provider name
  const gradients = [
    'from-red-600 to-orange-600',
    'from-blue-600 to-cyan-600',
    'from-green-600 to-emerald-600',
    'from-purple-600 to-pink-600',
    'from-yellow-600 to-orange-600',
    'from-indigo-600 to-purple-600',
  ];
  const gradient = gradients[index % gradients.length];

  return (
    <Link
      href={`/providers/${provider.slug}`}
      className="group relative overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-600/5"
    >
      {/* Gradient Header */}
      <div className={`h-24 bg-gradient-to-r ${gradient} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        
        {/* Provider Initial */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <span className="text-xl font-bold text-white">
            {provider.name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">
              {provider.name}
            </h3>
            {provider.isNew && (
              <span className="inline-block mt-1 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">
                BARU
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm text-neutral-400">
          <div className="flex items-center gap-1">
            <Film size={14} />
            <span>{provider.contentCount.toLocaleString()} drama</span>
          </div>
          {provider.logoUrl && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-yellow-500" />
              <span>VIP</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 flex items-center text-sm text-red-400 font-medium">
          <span>Jelajahi</span>
          <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
