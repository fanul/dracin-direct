'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlaySquare, User } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: typeof Home;
    iconActive: typeof Home;
}

const navItems: NavItem[] = [
    {
        href: '/',
        label: 'Beranda',
        icon: Home,
        iconActive: Home,
    },
    {
        href: '/search',
        label: 'Cari',
        icon: Search,
        iconActive: Search,
    },
    {
        href: '/history',
        label: 'Riwayat',
        icon: PlaySquare,
        iconActive: PlaySquare,
    },
    {
        href: '/profile',
        label: 'Profil',
        icon: User,
        iconActive: User,
    },
];

/**
 * BottomNav Component
 * 
 * Mobile-first bottom navigation bar with:
 * - 4 tabs: Beranda, Cari, Riwayat, Profil
 * - Active state with filled icons
 * - Hide on scroll down, show on scroll up
 * - Safe area padding for iPhone notch
 * - Accessible with ARIA labels
 */
export default function BottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Determine if we're on a page that should hide the bottom nav
    const isHiddenPage =
        !pathname ||
        pathname.startsWith('/play/') ||
        pathname === '/login' ||
        pathname === '/signup';

    // Handle scroll behavior: hide on scroll down, show on scroll up
    useEffect(() => {
        if (isHiddenPage) return;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false); // Scrolling down
            } else {
                setIsVisible(true); // Scrolling up
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY, isHiddenPage]);

    // Don't render on certain pages
    if (isHiddenPage) return null;

    return (
        <nav
            aria-label="Navigasi utama"
            className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out
        ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            style={{
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <div className="bg-neutral-950/95 backdrop-blur-md border-t border-white/10">
                <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname?.startsWith(item.href.split('?')[0]);

                        const Icon = isActive ? item.iconActive : item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200
                  ${isActive
                                        ? 'text-red-500'
                                        : 'text-gray-400 hover:text-gray-200'
                                    }`}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={item.label}
                            >
                                <Icon
                                    size={22}
                                    className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                                    fill={isActive ? 'currentColor' : 'none'}
                                    strokeWidth={isActive ? 1.5 : 2}
                                />
                                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-red-500' : ''}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
