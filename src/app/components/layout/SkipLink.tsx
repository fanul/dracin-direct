'use client';

/**
 * SkipLink Component
 * 
 * Accessibility feature that allows keyboard users to skip navigation
 * and jump directly to main content.
 */
export default function SkipLink() {
    return (
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] 
                 focus:px-4 focus:py-2 focus:bg-red-600 focus:text-white focus:rounded-lg
                 focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50
                 transition-all duration-200"
        >
            Lompat ke konten utama
        </a>
    );
}
