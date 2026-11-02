'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/app/components/layout/PageHeader';
import { useHomeSectionData } from '@/hooks/useHome';
import { DramaCard } from '@/app/components/home/DramaCard';
import type { DramaCard as DramaCardType, DramaWithRank } from '@/lib/types';

type SectionKey = 'for-you' | 'trending' | 'new-releases';

function isValidSection(value: string): value is SectionKey {
  return value === 'for-you' || value === 'trending' || value === 'new-releases';
}

function sectionMeta(section: SectionKey): { title: string; subtitle: string } {
  switch (section) {
    case 'for-you':
      return {
        title: 'Untuk Kamu',
        subtitle: 'Semua rekomendasi personal yang tersedia saat ini.',
      };
    case 'trending':
      return {
        title: '🔥 Trending',
        subtitle: 'Semua drama paling populer minggu ini.',
      };
    case 'new-releases':
      return {
        title: 'Rilis Baru',
        subtitle: 'Semua drama terbaru dari berbagai provider.',
      };
    default:
      return {
        title: 'Lihat Semua',
        subtitle: 'Daftar lengkap drama.',
      };
  }
}

export default function HomeSeeAllSectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionParam = params.section as string;
  const [page, setPage] = useState(1);
  const limit = 24;

  if (!isValidSection(sectionParam)) {
    return (
      <main className="min-h-screen bg-neutral-950 pb-24">
        <PageHeader title="Halaman Tidak Ditemukan" />
        <div className="pt-16 px-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-sm text-neutral-300">Section tidak valid.</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
              onClick={() => router.push('/')}
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </main>
    );
  }

  const meta = sectionMeta(sectionParam);
  const { data, loading, error, refetch } = useHomeSectionData(sectionParam, page, limit);

  const dramas = useMemo<(DramaCardType | DramaWithRank)[]>(() => {
    if (!data) return [];
    return data.dramas;
  }, [data]);

  const uniqueDramas = useMemo(() => {
    const seen = new Set<string>();
    return dramas.filter((drama) => {
      if (seen.has(drama.id)) return false;
      seen.add(drama.id);
      return true;
    });
  }, [dramas]);

  const pagination = data?.pagination;

  return (
    <main className="min-h-screen bg-neutral-950 pb-24">
      <PageHeader title={meta.title} />

      <div className="pt-16 px-4">
        <div className="mb-4">
          <h1 className="text-2xl font-black tracking-tight text-white">{meta.title}</h1>
          <p className="mt-1 text-sm text-neutral-400">{meta.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] rounded-xl bg-neutral-800" />
                <div className="mt-2 h-4 w-3/4 rounded bg-neutral-800" />
                <div className="mt-1 h-3 w-1/2 rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-5 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              onClick={refetch}
            >
              Coba Lagi
            </button>
          </div>
        ) : uniqueDramas.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {uniqueDramas.map((drama) => (
                <DramaCard key={drama.id} drama={drama} showProviderBadge={true} />
              ))}
            </div>

            {pagination && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-neutral-400">
                  Halaman {pagination.page} • Total {pagination.total}
                </span>
                <button
                  type="button"
                  disabled={!pagination.hasMore}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <p className="text-sm text-neutral-300">Belum ada drama untuk section ini.</p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
              onClick={() => router.push('/')}
            >
              Kembali ke Beranda
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
