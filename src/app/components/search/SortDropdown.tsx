'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SortOption } from '@/hooks/useSearch';

interface SortDropdownProps {
    value: SortOption;
    onChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Relevansi' },
    { value: 'newest', label: 'Terbaru' },
    { value: 'rating', label: 'Rating Tertinggi' },
    { value: 'popular', label: 'Paling Populer' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedLabel = sortOptions.find((opt) => opt.value === value)?.label || 'Urutkan';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-bold hover:bg-neutral-800 transition-colors"
            >
                <span className="text-neutral-400">Urutkan:</span>
                <span>{selectedLabel}</span>
                <ChevronDown
                    size={16}
                    className={`text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden z-20">
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-left transition-colors ${value === option.value
                                ? 'bg-red-600/10 text-red-500'
                                : 'hover:bg-neutral-800'
                                }`}
                        >
                            <span>{option.label}</span>
                            {value === option.value && <Check size={16} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
