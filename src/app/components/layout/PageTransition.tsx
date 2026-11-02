'use client';

import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * PageTransition Component
 * 
 * Provides smooth fade transitions between pages using CSS animations.
 * Uses the existing animation classes from globals.css.
 */
export default function PageTransition({
    children,
    className = '',
}: PageTransitionProps) {
    return (
        <div className={`animate-fade-in ${className}`}>
            {children}
        </div>
    );
}

/**
 * FadeIn Component
 * 
 * Simple fade-in animation wrapper with configurable delay.
 */
export function FadeIn({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <div
            className={`animate-fade-in ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/**
 * SlideUp Component
 * 
 * Slide-up animation wrapper with configurable delay.
 */
export function SlideUp({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <div
            className={`animate-slide-up ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}

/**
 * StaggerContainer Component
 * 
 * Container that staggers the animation of its children.
 */
export function StaggerContainer({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

/**
 * StaggerItem Component
 * 
 * Child item for StaggerContainer.
 */
export function StaggerItem({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    return (
        <div
            className={`animate-slide-up ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
