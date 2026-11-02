'use client';

import { X, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import type { PlaybackHookReturn } from '@/hooks/usePlayback';

interface PlaybackSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    playback: PlaybackHookReturn;
}

type SettingsTab = 'playback' | 'quality' | 'subtitles';

export function PlaybackSettings({ isOpen, onClose, playback }: PlaybackSettingsProps) {
    const [activeTab, setActiveTab] = useState<SettingsTab>('playback');

    if (!isOpen) return null;

    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const qualityOptions = ['Auto', '1080p', '720p', '480p', '360p'];

    return (
        <div className="absolute inset-0 z-[170] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl w-full max-w-sm mx-4 shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Pengaturan</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Close settings"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    {[
                        { id: 'playback' as const, label: 'Pemutaran' },
                        { id: 'quality' as const, label: 'Kualitas' },
                        { id: 'subtitles' as const, label: 'Subtitle' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                ? 'text-red-400'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'playback' && (
                        <div className="space-y-6">
                            {/* Playback Speed */}
                            <div>
                                <label className="text-sm text-slate-400 block mb-3">Kecepatan Pemutaran</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {speedOptions.map((speed) => (
                                        <button
                                            key={speed}
                                            onClick={() => playback.setPlaybackSpeed(speed)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${playback.playbackSpeed === speed
                                                ? 'bg-red-600 text-white'
                                                : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {speed}x
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto-play toggle */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-white font-medium">Putar Otomatis</p>
                                    <p className="text-sm text-slate-400">Lanjut ke episode berikutnya</p>
                                </div>
                                <button
                                    onClick={() => playback.setAutoPlayEnabled(!playback.isAutoPlayEnabled)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${playback.isAutoPlayEnabled ? 'bg-red-600' : 'bg-zinc-700'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${playback.isAutoPlayEnabled ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'quality' && (
                        <div className="space-y-2">
                            <p className="text-sm text-slate-400 mb-3">Pilih Kualitas Video</p>
                            {qualityOptions.map((quality) => (
                                <button
                                    key={quality}
                                    onClick={() => { }}
                                    className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors group"
                                >
                                    <span className="text-white font-medium">{quality}</span>
                                    {quality === 'Auto' && (
                                        <span className="text-xs text-slate-500">Direkomendasikan</span>
                                    )}
                                    <Check
                                        size={18}
                                        className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'subtitles' && (
                        <div className="space-y-6">
                            {/* Subtitle toggle */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-white font-medium">Tampilkan Subtitle</p>
                                    <p className="text-sm text-slate-400">Subtitle bahasa Indonesia</p>
                                </div>
                                <button
                                    onClick={() => playback.toggleSubtitles()}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${playback.showSubtitles ? 'bg-red-600' : 'bg-zinc-700'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${playback.showSubtitles ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Subtitle language (placeholder) */}
                            <div>
                                <label className="text-sm text-slate-400 block mb-3">Bahasa Subtitle</label>
                                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                                    <span className="text-white">Bahasa Indonesia</span>
                                    <ChevronDown size={18} className="text-slate-400" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}