'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, Search, User, Crown } from 'lucide-react';
import { useHomeData } from '@/hooks/useHome';
import {
  HeroBanner,
  EnhancedProviderFilter,
  ContinueWatchingSection,
  HorizontalDramaSection,
  NewReleasesSection,
  GenreGridSection,
} from '@/app/components/home';

// Loading State Component
function HomeLoadingState() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="aspect-3/4 sm:aspect-video bg-neutral-900 animate-pulse" />

      {/* Section Skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-4">
          <div className="h-6 w-32 bg-neutral-800 rounded animate-pulse mb-4" />
          <div className="flex space-x-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="w-32 shrink-0">
                <div className="aspect-2/3 bg-neutral-800 rounded-xl animate-pulse" />
                <div className="h-4 w-24 bg-neutral-800 rounded mt-2 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Error State Component
interface HomeErrorStateProps {
  error: string;
  onRetry: () => void;
}

function HomeErrorState({ error, onRetry }: HomeErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <span className="text-red-500 text-2xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Gagal Memuat Data</h2>
      <p className="text-red-400 max-w-md text-sm">{error}</p>
      <button
        onClick={onRetry}
        className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useHomeData();
  const [isPremium] = useState(false);

  // Get featured providers (top 6 by content count)
  const featuredProviders = data?.providers
    ? [...data.providers].sort((a, b) => b.contentCount - a.contentCount).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-neutral-950 selection:bg-red-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/40 backdrop-blur-xl p-4 flex items-center justify-between border-b border-white/5 transition-all duration-300">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Play fill="white" size={16} />
          </div>
          <span className="text-lg font-black tracking-tighter">dracinhub</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/search" className="text-slate-400 hover:text-white transition-colors">
            <Search size={20} />
          </Link>
          <Crown className={isPremium ? 'text-amber-500' : 'text-slate-500'} size={20} />
          <Link href="/profile" className="text-slate-400 hover:text-white transition-colors">
            <User size={20} />
          </Link>
        </div>
      </header>

      {/* Provider Navigation Bar */}
      {data?.providers && (
        <EnhancedProviderFilter providers={data.providers} featuredCount={5} />
      )}

      {/* Main Content */}
      <main className="pb-20">
        {loading ? (
          <HomeLoadingState />
        ) : error ? (
          <HomeErrorState error={error} onRetry={refetch} />
        ) : data ? (
          <>
            {/* Hero Banner */}
            {data.featured.length > 0 && <HeroBanner dramas={data.featured} />}

            {/* Continue Watching */}
            {data.continueWatching && data.continueWatching.length > 0 ? (
              <ContinueWatchingSection
                items={data.continueWatching}
                onViewAll={() => router.push('/history')}
                onContinue={(providerSlug, dramaId, episodeNumber) => {
                  router.push(`/play/${providerSlug}/${dramaId}/${episodeNumber}`);
                }}
              />
            ) : (
              <section className="mt-6 px-4 animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <h2 className="text-lg font-black tracking-tight text-white">Lanjutkan Menonton</h2>
                  <p className="mt-1 text-sm text-neutral-400">
                    Belum ada riwayat tontonan. Mulai jelajahi drama untuk membangun rekomendasi personal.
                  </p>
                  <div className="mt-4">
                    <Link
                      href="/search"
                      className="inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-500 transition-colors"
                    >
                      Cari Drama
                    </Link>
                  </div>
                </div>
              </section>
            )}

            {/* For You Section */}
            {data.forYou.length > 0 && (
              <HorizontalDramaSection
                title="Untuk Kamu"
                subtitle="Rekomendasi personal berdasarkan tontonanmu"
                dramas={data.forYou}
                actionLabel="Lihat Semua"
                onAction={() => router.push('/home/see-all/for-you')}
                animationDelay={100}
              />
            )}

            {/* Trending Global */}
            {data.trending.length > 0 && (
              <HorizontalDramaSection
                title="🔥 Trending"
                subtitle="Paling populer minggu ini"
                dramas={data.trending}
                showRank={true}
                showProviderBadge={true}
                actionLabel="Lihat Semua"
                onAction={() => router.push('/home/see-all/trending')}
                animationDelay={200}
              />
            )}

            {/* Featured Providers Section */}
            {featuredProviders.length > 0 && (
              <section className="mt-8 px-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white">Provider Populer</h2>
                    <p className="text-sm text-neutral-400">Jelajahi drama dari provider terbaik</p>
                  </div>
                  <button
                    onClick={() => router.push('/providers')}
                    className="text-sm text-red-400 hover:text-red-300 font-medium"
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {featuredProviders.map((provider) => (
                    <button
                      key={provider.slug}
                      onClick={() => router.push(`/providers/${provider.slug}`)}
                      className="group relative overflow-hidden rounded-xl bg-neutral-900 border border-white/5 p-4 text-left hover:border-white/10 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center mb-3">
                          <span className="text-lg font-bold text-red-400">
                            {provider.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white text-sm truncate">{provider.name}</h3>
                        <p className="text-xs text-neutral-500 mt-1">{provider.contentCount} drama</p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* New Releases */}
            {data.newReleases.length > 0 && (
              <NewReleasesSection
                groups={data.newReleases}
                onViewAll={() => router.push('/home/see-all/new-releases')}
                animationDelay={400}
              />
            )}

            {/* Genre Grid */}
            {data.genres.length > 0 && (
              <GenreGridSection genres={data.genres} animationDelay={500} />
            )}

            {/* Footer spacer */}
            <div className="h-20" />
          </>
        ) : null}
      </main>
    </div>
  );
}
