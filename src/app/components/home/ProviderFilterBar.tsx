'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { ProviderInfo } from '@/lib/types';

interface ProviderFilterBarProps {
    providers: ProviderInfo[];
    activeProvider: string | 'all';
    onProviderChange: (provider: string | 'all') => void;
    maxVisible?: number;
}

export function ProviderFilterBar({
    providers,
    activeProvider,
    onProviderChange,
    maxVisible = 6,
}: ProviderFilterBarProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sort providers by content count (popularity)
    const sortedProviders = [...providers].sort((a, b) => b.contentCount - a.contentCount);

    // Visible providers (top N)
    const visibleProviders = sortedProviders.slice(0, maxVisible);

    // More providers (dropdown)
    const moreProviders = sortedProviders.slice(maxVisible);

    // Filter more providers by search
    const filteredMoreProviders = moreProviders.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProviderClick = (slug: string | 'all') => {
        onProviderChange(slug);
        setShowDropdown(false);
    };

    return (
        <div className="sticky top-[64px] z-30 bg-neutral-950/95 backdrop-blur-xl border-b border-white/5">
            <div className="px-4 py-3">
                <p className="text-[11px] text-neutral-500 mb-2">
                    Menampilkan provider populer. Gunakan <span className="text-neutral-300 font-semibold">Lainnya</span> untuk melihat semua.
                </p>
                <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide snap-x">
                    {/* All Tab */}
                    <button
                        onClick={() => handleProviderClick('all')}
                        className={`
              shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-start
              ${activeProvider === 'all'
                                ? 'bg-red-600 text-white'
                                : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                            }
            `}
                    >
                        Semua
                    </button>

                    {/* Visible Provider Tabs */}
                    {visibleProviders.map((provider) => (
                        <button
                            key={provider.slug}
                            onClick={() => handleProviderClick(provider.slug)}
                            className={`
                shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-start whitespace-nowrap
                ${activeProvider === provider.slug
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                }
              `}
                        >
                            {provider.name}
                            {provider.isNew && (
                                <span className="ml-1.5 text-[8px] bg-red-500 text-white px-1 rounded">NEW</span>
                            )}
                        </button>
                    ))}

                    {/* More Dropdown */}
                    {moreProviders.length > 0 && (
                        <div className="relative shrink-0" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className={`
                  flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 snap-start
                  ${showDropdown
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                                    }
                `}
                            >
                                <span>Lainnya</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                                <span className="text-xs opacity-70">({moreProviders.length})</span>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <>
                                    <button
                                        type="button"
                                        aria-label="Tutup daftar provider"
                                        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40"
                                        onClick={() => setShowDropdown(false)}
                                    />
                                    <div className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-neutral-900 rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                                    {/* Search Input */}
                                    <div className="p-3 border-b border-white/5">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                                            <input
                                                type="text"
                                                placeholder="Cari provider..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-neutral-800 text-sm text-white placeholder-neutral-500 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Provider List */}
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {filteredMoreProviders.length > 0 ? (
                                            filteredMoreProviders.map((provider) => (
                                                <button
                                                    key={provider.slug}
                                                    onClick={() => handleProviderClick(provider.slug)}
                                                    className={`
                            w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors
                            ${activeProvider === provider.slug
                                                            ? 'bg-red-600/20 text-red-500'
                                                            : 'text-neutral-300 hover:bg-white/5'
                                                        }
                          `}
                                                >
                                                    <span className="font-medium">{provider.name}</span>
                                                    <span className="text-xs text-neutral-500">{provider.contentCount} drama</span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-6 text-center text-neutral-500 text-sm">
                                                Tidak ada provider ditemukan
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProviderFilterBar;
