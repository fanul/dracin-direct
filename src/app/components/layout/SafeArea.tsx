'use client';

import { ReactNode } from 'react';

interface SafeAreaProps {
    children: ReactNode;
    className?: string;
    top?: boolean;
    bottom?: boolean;
    left?: boolean;
    right?: boolean;
}

/**
 * SafeArea Component
 * 
 * Provides safe area insets for devices with notches (iPhone X+, etc.)
 * Uses CSS env() variables for safe-area-inset-*
 */
export default function SafeArea({
    children,
    className = '',
    top = false,
    bottom = false,
    left = false,
    right = false,
}: SafeAreaProps) {
    const safeAreaStyles: React.CSSProperties = {
        paddingTop: top ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: bottom ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: left ? 'env(safe-area-inset-left)' : undefined,
        paddingRight: right ? 'env(safe-area-inset-right)' : undefined,
    };

    return (
        <div style={safeAreaStyles} className={className}>
            {children}
        </div>
    );
}

/**
 * SafeAreaInset Component
 * 
 * Creates a spacer element that respects safe area insets.
 * Useful for fixed headers/footers that need extra padding on notched devices.
 */
export function SafeAreaInset({
    position,
    className = '',
}: {
    position: 'top' | 'bottom' | 'left' | 'right';
    className?: string;
}) {
    const positionStyles: Record<string, React.CSSProperties> = {
        top: { height: 'env(safe-area-inset-top)' },
        bottom: { height: 'env(safe-area-inset-bottom)' },
        left: { width: 'env(safe-area-inset-left)' },
        right: { width: 'env(safe-area-inset-right)' },
    };

    const isHorizontal = position === 'left' || position === 'right';

    return (
        <div
            style={positionStyles[position]}
            className={`${isHorizontal ? 'inline-block' : 'block'} ${className}`}
            aria-hidden="true"
        />
    );
}
