'use client';

import { useState } from 'react';
import { Share2, Link, Check, Send } from 'lucide-react';

interface ShareButtonProps {
    title: string;
    url?: string;
    showText?: boolean;
}

export function ShareButton({ title, url, showText = false }: ShareButtonProps) {
    const [copied, setCopied] = useState(false);
    const [showNative, setShowNative] = useState(false);

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Tonton ${title} di DracinHub!`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or share failed
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }
    };

    const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

    return (
        <div className="relative">
            <button
                onClick={() => setShowNative(!showNative)}
                className={`flex items-center justify-center gap-2 rounded-2xl border transition-all duration-300 ${showText
                        ? 'px-4 py-3 bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                        : 'p-3.5 bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                aria-label="Share"
            >
                {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                {showText && <span className="text-sm font-bold">{copied ? 'Tersalin!' : 'Bagikan'}</span>}
            </button>

            {/* Share Menu */}
            {showNative && (
                <div className="absolute top-full right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-2 min-w-[160px] z-50">
                    {canNativeShare && (
                        <button
                            onClick={() => {
                                handleNativeShare();
                                setShowNative(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Send size={16} className="text-blue-400" />
                            Bagikan...
                        </button>
                    )}

                    <button
                        onClick={() => {
                            handleCopy();
                            setShowNative(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Link size={16} className="text-slate-400" />
                        {copied ? 'Tersalin!' : 'Salin Link'}
                    </button>
                </div>
            )}

            {/* Backdrop to close menu */}
            {showNative && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNative(false)}
                />
            )}
        </div>
    );
}

export default ShareButton;
