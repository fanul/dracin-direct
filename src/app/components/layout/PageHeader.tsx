'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void;
    action?: ReactNode;
    className?: string;
    transparent?: boolean;
}

/**
 * PageHeader Component
 * 
 * Standardized page header with:
 * - Back button (optional)
 * - Centered title
 * - Optional action button on the right
 * - Sticky positioning with scroll-based styling
 * - Hide on scroll down, show on scroll up
 */
export default function PageHeader({
    title,
    showBackButton = true,
    onBack,
    action,
    className = '',
    transparent = false,
}: PageHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);

    // Handle scroll behavior: hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Update scrolled state for background blur
            setIsScrolled(currentScrollY > 10);

            // Hide/show based on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false); // Scrolling down
            } else {
                setIsVisible(true); // Scrolling up
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    // Determine background styles based on scroll state
    const bgStyles = transparent && !isScrolled
        ? 'bg-transparent'
        : 'bg-neutral-950/95 backdrop-blur-md border-b border-white/10';

    return (
        <header
            aria-label="Header halaman"
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
        ${bgStyles}
        ${className}`}
            style={{
                paddingTop: 'env(safe-area-inset-top)',
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
                {/* Left: Back Button */}
                <div className="w-10">
                    {showBackButton && (
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 text-white hover:text-neutral-300 transition-colors rounded-full hover:bg-white/10"
                            aria-label="Kembali"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Center: Title */}
                <h1 className="flex-1 text-center text-base font-black truncate px-2">
                    {title}
                </h1>

                {/* Right: Action */}
                <div className="w-10 flex justify-end">
                    {action || <div className="w-10" />}
                </div>
            </div>
        </header>
    );
}

/**
 * PageHeaderAction Component
 * 
 * Pre-styled action button for PageHeader
 */
export function PageHeaderAction({
    icon: Icon,
    onClick,
    label,
    badge,
}: {
    icon: typeof MoreVertical;
    onClick?: () => void;
    label: string;
    badge?: number;
}) {
    return (
        <button
            onClick={onClick}
            className="relative p-2 -mr-2 text-white hover:text-neutral-300 transition-colors rounded-full hover:bg-white/10"
            aria-label={label}
        >
            <Icon size={20} />
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </button>
    );
}
