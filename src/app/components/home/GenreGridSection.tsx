'use client';

import Link from 'next/link';
import type { GenreData } from '@/lib/types';

interface GenreGridSectionProps {
    genres: GenreData[];
    animationDelay?: number;
}

export function GenreGridSection({ genres, animationDelay = 0 }: GenreGridSectionProps) {
    if (!genres || genres.length === 0) {
        return null;
    }

    return (
        <section
            className="mt-8 animate-slide-up"
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            <div className="px-4">
                {/* Header */}
                <h2 className="text-lg font-black tracking-tight text-white mb-4">
                    Jelajahi Genre
                </h2>

                {/* Genre Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {genres.map((genre) => (
                        <GenreCard key={genre.id} genre={genre} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function GenreCard({ genre }: { genre: GenreData }) {
    // Use name as slug (lowercase, replace spaces with hyphens)
    const slug = genre.name.toLowerCase().replace(/\s+/g, '-');
    return (
        <Link
            href={`/genres/${slug}`}
            className="group relative aspect-16/10 rounded-xl overflow-hidden bg-neutral-900 hover:scale-[1.02] transition-all duration-300"
        >
            {/* Background Gradient */}
            <div
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                style={{
                    background: `linear-gradient(135deg, ${genre.color} 0%, transparent 60%)`
                }}
            />

            {/* Poster Collage */}
            <div className="absolute inset-0 flex items-center justify-center gap-1 p-3">
                {genre.posterUrls.slice(0, 2).map((url, index) => (
                    <div
                        key={index}
                        className="w-10 h-14 rounded shadow-lg overflow-hidden opacity-60 group-hover:opacity-80 transition-opacity"
                        style={{ transform: `rotate(${index === 0 ? -5 : 5}deg)` }}
                    >
                        <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    </div>
                ))}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

            {/* Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">
                    {genre.name}
                </h3>
                <p className="text-xs text-neutral-400">
                    {genre.dramaCount} drama
                </p>
            </div>

            {/* Accent Border */}
            <div
                className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: genre.color }}
            />
        </Link>
    );
}

export default GenreGridSection;
