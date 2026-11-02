'use client';

import Image from 'next/image';

interface Provider {
    id: string;
    name: string;
    slug: string;
    logoUrl: string;
    rating: number;
    dramaCount: number;
    episodeCount: number;
    websiteUrl: string;
    description: string;
}

interface ProviderHeaderProps {
    provider: Provider;
}

export function ProviderHeader({ provider }: ProviderHeaderProps) {
    const handleWebsiteClick = () => {
        window.open(provider.websiteUrl, '_blank', 'noopener,noreferrer');
    };

    const handleShare = async () => {
        const shareData = {
            title: `${provider.name} - DracinHub`,
            text: `Check out ${provider.name} on DracinHub!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled share
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const handleFollow = () => {
        // TODO: Implement follow functionality
        alert('Fitur Follow akan segera hadir!');
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    return (
        <div className="flex flex-col items-center text-center py-8 px-4">
            {/* Provider Logo */}
            <div className="w-20 h-20 rounded-2xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center">
                {provider.logoUrl ? (
                    <Image
                        src={provider.logoUrl}
                        alt={provider.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-3xl font-bold text-neutral-400">
                        {provider.name.charAt(0)}
                    </span>
                )}
            </div>

            {/* Provider Name */}
            <h1 className="text-2xl font-bold text-white mb-2">{provider.name}</h1>

            {/* Stats */}
            <div className="flex items-center gap-3 text-sm text-neutral-400 mb-4">
                <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {provider.rating.toFixed(1)}
                </span>
                <span>•</span>
                <span>{formatNumber(provider.dramaCount)} Drama</span>
                <span>•</span>
                <span>{formatNumber(provider.episodeCount)} Episodes</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleWebsiteClick}
                    className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-full hover:bg-red-700 transition-colors"
                >
                    Website
                </button>
                <button
                    onClick={handleShare}
                    className="px-5 py-2 bg-neutral-700 text-white text-sm font-bold rounded-full hover:bg-neutral-600 transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                </button>
                <button
                    onClick={handleFollow}
                    className="px-5 py-2 border border-neutral-600 text-white text-sm font-bold rounded-full hover:bg-neutral-800 transition-colors"
                >
                    Follow
                </button>
            </div>

            {/* Description */}
            {provider.description && (
                <p className="mt-4 text-sm text-neutral-400 max-w-md line-clamp-2">
                    {provider.description}
                </p>
            )}
        </div>
    );
}

export default ProviderHeader;
