'use client';

import { useEffect, useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ProviderGrid } from '../components/providers';
import type { ProviderInfo } from '@/lib/types';

export default function ProvidersListingPage() {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/v1/home')
      .then(res => res.json())
      .then(result => {
        if (result.data?.providers) {
          setProviders(result.data.providers);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProviders = searchQuery
    ? providers.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : providers;

  return (
    <div className="min-h-screen bg-neutral-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-xl font-bold text-white">Semua Provider</h1>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Cari provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 text-white placeholder-neutral-500 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 border border-white/5"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-4">
        <p className="text-sm text-neutral-400">
          {filteredProviders.length} provider tersedia
        </p>
      </div>

      {/* Provider Grid */}
      <main className="px-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-neutral-800 rounded-t-2xl" />
                <div className="p-4 bg-neutral-900 rounded-b-2xl">
                  <div className="h-5 bg-neutral-800 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProviderGrid providers={filteredProviders} />
        )}
      </main>
    </div>
  );
}
