'use client';

import Link from 'next/link';
import { ExternalLink, Film, Star, TrendingUp } from 'lucide-react';

interface ProviderCardProps {
    provider: {
        slug: string;
        name: string;
        logoUrl?: string;
        contentCount?: number;
        rating?: number;
        description?: string;
    };
}

// Provider logo placeholder with first letter
function ProviderLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
    if (logoUrl) {
        return (
            <img
                src={logoUrl}
                alt={name}
                className="w-12 h-12 rounded-xl object-contain bg-white p-1"
            />
        );
    }

    return (
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center">
            <span className="text-xl font-black text-white">{name.charAt(0).toUpperCase()}</span>
        </div>
    );
}

export function ProviderCard({ provider }: ProviderCardProps) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start gap-4">
                {/* Logo */}
                <ProviderLogo name={provider.name} logoUrl={provider.logoUrl} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{provider.name}</h4>
                        <Link
                            href={`/search?provider=${provider.slug}`}
                            className="text-slate-500 hover:text-red-500 transition-colors"
                        >
                            <ExternalLink size={14} />
                        </Link>
                    </div>

                    {provider.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                            {provider.description}
                        </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4">
                        {provider.contentCount !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Film size={12} />
                                <span>{provider.contentCount.toLocaleString('id-ID')} Drama</span>
                            </div>
                        )}

                        {provider.rating && (
                            <div className="flex items-center gap-1 text-xs text-amber-500">
                                <Star size={12} fill="currentColor" />
                                <span>{provider.rating.toFixed(1)}</span>
                            </div>
                        )}

                        <div className="flex items-center gap-1 text-xs text-green-500">
                            <TrendingUp size={12} />
                            <span>Official Partner</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProviderCard;
