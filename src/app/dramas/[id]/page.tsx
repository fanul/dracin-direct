'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Play, TrendingUp, Star, Clock, Film } from 'lucide-react';
import { useDramaDetail } from '@/hooks/useDrama';
import {
  EpisodeGrid,
  EpisodeList,
  ContinueBanner,
  RelatedDramas,
  ProviderCard,
  ShareButton,
  WatchlistButton,
  ViewToggle,
} from '@/app/components/drama';
import { PageHeader } from '@/app/components/layout';

export default function DramaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const {
    drama,
    episodes,
    relatedDramas,
    continueProgress,
    watchedEpisodes,
    isInWatchlist,
    viewMode,
    loading,
    error,
    setViewMode,
    setIsInWatchlist,
    dismissContinueBanner,
  } = useDramaDetail(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !drama) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg mb-4">{error || 'Drama tidak ditemukan'}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-red-600 rounded-lg text-sm font-bold"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const firstEpisode = episodes[0];
  const canContinue = continueProgress && continueProgress.episodeNo > 0;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Header - Transparent for hero visibility */}
      <PageHeader
        title={drama.title}
        transparent
        onBack={() => router.push('/')}
      />

      {/* Hero Section */}
      <div className="relative w-full aspect-4/5 bg-slate-900">
        <img
          src={drama.coverUrl}
          className="w-full h-full object-cover"
          alt={drama.title}
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {drama.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[9px] font-black px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-black mb-3 leading-tight text-white">
            {drama.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center text-green-500">
              <TrendingUp size={14} className="mr-1" />
              {drama.rating?.toFixed(1) || '4.5'}
            </span>

            <span className="flex items-center">
              <Film size={14} className="mr-1" />
              {drama.episodeCount} Episode
            </span>

            <span className="flex items-center text-red-500">
              <Star size={14} className="mr-1" />
              {drama.providerName}
            </span>

            {drama.language && (
              <span className="flex items-center">
                <Clock size={14} className="mr-1" />
                {drama.language}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Continue Watching Banner */}
      {canContinue && continueProgress && (
        <ContinueBanner
          progress={{
            dramaId: id,
            dramaTitle: drama.title,
            episodeId: continueProgress.episodeId,
            episodeNo: continueProgress.episodeNo,
            episodeTitle: continueProgress.episodeTitle,
            progressSeconds: continueProgress.progressSeconds,
            durationMs: continueProgress.durationMs,
            coverUrl: continueProgress.coverUrl || drama.coverUrl,
            providerSlug: drama.providerSlug,
            providerDramaId: drama.providerDramaId,
          }}
          onDismiss={dismissContinueBanner}
        />
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-900">
        {firstEpisode && (
          <Link
            href={`/play/${drama.providerSlug}/${drama.providerDramaId}/${canContinue ? continueProgress.episodeNo : firstEpisode.episodeNo}`}
            className="flex-1 bg-red-600 hover:bg-red-700 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-white transition-colors"
          >
            <Play size={20} fill="white" />
            <span>{canContinue ? 'Lanjutkan Menonton' : 'Mulai Menonton'}</span>
          </Link>
        )}

        <WatchlistButton
          dramaId={id}
          isInWatchlist={isInWatchlist}
          onToggle={setIsInWatchlist}
        />

        <ShareButton title={drama.title} />
      </div>

      {/* Provider Card */}
      <div className="px-4 py-4">
        <ProviderCard
          provider={{
            slug: drama.providerSlug,
            name: drama.providerName,
            contentCount: drama.episodeCount,
            rating: drama.rating,
          }}
        />
      </div>

      {/* Synopsis */}
      <div className="p-6">
        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">
          Sinopsis
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {drama.synopsis || 'Tidak ada sinopsis tersedia.'}
        </p>

        {/* Genres */}
        {drama.genres && drama.genres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {drama.genres.map((genre) => (
              <Link
                key={genre}
                href={`/search?genre=${encodeURIComponent(genre)}`}
                className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              >
                {genre}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Episodes Section */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-white">Episode</h3>
            <span className="text-xs text-slate-500">
              Total: {episodes.length} Episode
            </span>
          </div>

          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>

        {episodes.length > 0 ? (
          viewMode === 'grid' ? (
            <EpisodeGrid
              episodes={episodes}
              providerSlug={drama.providerSlug}
              providerDramaId={drama.providerDramaId}
              isPremium={drama.isPremium}
              watchedEpisodes={watchedEpisodes}
            />
          ) : (
            <EpisodeList
              episodes={episodes}
              providerSlug={drama.providerSlug}
              providerDramaId={drama.providerDramaId}
              isPremium={drama.isPremium}
              watchedEpisodes={watchedEpisodes}
            />
          )
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Film size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada episode tersedia</p>
          </div>
        )}
      </div>

      {/* Related Dramas */}
      <RelatedDramas dramas={relatedDramas} />

      {/* Bottom Spacing */}
      <div className="h-8" />
    </div>
  );
}
