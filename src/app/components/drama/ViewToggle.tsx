'use client';

import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
    viewMode: 'grid' | 'list';
    onChange: (mode: 'grid' | 'list') => void;
}

export function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
    return (
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
                onClick={() => onChange('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'grid'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
            >
                <LayoutGrid size={14} />
                Grid
            </button>

            <button
                onClick={() => onChange('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${viewMode === 'list'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
            >
                <List size={14} />
                List
            </button>
        </div>
    );
}

export default ViewToggle;
