'use client';

import Link from 'next/link';

export function EmptyBookmarks() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {/* Illustration */}
            <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-white mb-2">
                Belum Ada Bookmark
            </h2>

            {/* Description */}
            <p className="text-neutral-400 text-sm mb-8 max-w-xs">
                Simpan drama favoritmu untuk menontonnya nanti. Bookmark akan muncul di sini.
            </p>

            {/* CTA Button */}
            <Link
                href="/search"
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors"
            >
                Jelajahi Drama
            </Link>

            {/* Quick Links */}
            <div className="mt-8 flex items-center gap-4 text-sm">
                <Link href="/" className="text-neutral-400 hover:text-white transition-colors">
                    Beranda
                </Link>
                <span className="text-neutral-600">•</span>
                <Link href="/search" className="text-neutral-400 hover:text-white transition-colors">
                    Pencarian
                </Link>
            </div>
        </div>
    );
}

export default EmptyBookmarks;
