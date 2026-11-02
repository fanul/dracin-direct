'use client';

import { ReactNode } from 'react';

interface MainLayoutProps {
    children: ReactNode;
    className?: string;
    withHeader?: boolean;
    withBottomNav?: boolean;
    fullWidth?: boolean;
}

/**
 * MainLayout Component
 * 
 * Standardized main layout wrapper with:
 * - Max-width container (responsive)
 * - Horizontal padding
 * - Top padding for header (if withHeader)
 * - Bottom padding for bottom nav (if withBottomNav)
 * - Main content area with id for skip link
 */
export default function MainLayout({
    children,
    className = '',
    withHeader = true,
    withBottomNav = true,
    fullWidth = false,
}: MainLayoutProps) {
    return (
        <main
            id="main-content"
            className={`
        ${fullWidth ? 'w-full' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'}
        ${withHeader ? 'pt-14' : ''}
        ${withBottomNav ? 'pb-24' : ''}
        ${className}
      `}
        >
            {children}
        </main>
    );
}

/**
 * ContentContainer Component
 * 
 * A narrower container for focused content (forms, etc.)
 */
export function ContentContainer({
    children,
    className = '',
    size = 'default',
}: {
    children: ReactNode;
    className?: string;
    size?: 'small' | 'default' | 'large';
}) {
    const sizeClasses = {
        small: 'max-w-md',
        default: 'max-w-2xl',
        large: 'max-w-4xl',
    };

    return (
        <div className={`mx-auto ${sizeClasses[size]} ${className}`}>
            {children}
        </div>
    );
}

/**
 * PageWrapper Component
 * 
 * Full page wrapper with background and min-height
 */
export function PageWrapper({
    children,
    className = '',
    background = 'neutral-950',
}: {
    children: ReactNode;
    className?: string;
    background?: string;
}) {
    return (
        <div className={`min-h-screen bg-${background} ${className}`}>
            {children}
        </div>
    );
}
