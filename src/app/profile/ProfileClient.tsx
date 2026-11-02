'use client';

import { useRouter } from 'next/navigation';
import { User, Crown, Bookmark, Clock, ChevronRight, LogOut } from 'lucide-react';
import { useState, useTransition } from 'react';
import { logoutAction } from '../actions/auth';
import { PageHeader } from '@/app/components/layout';

interface ProfileClientProps {
    user: {
        id: string;
        email: string | null;
        displayName: string | null;
        avatarUrl: string | null;
    };
}

export default function ProfileClient({ user }: ProfileClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isPremium = false;

    const handleLogout = () => {
        startTransition(async () => {
            await logoutAction();
        });
    };

    const displayName = user.displayName || user.email?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen bg-neutral-950 p-6 selection:bg-red-500/30 animate-fade-in">
            <PageHeader
                title="Profil"
                action={
                    <button
                        onClick={handleLogout}
                        disabled={isPending}
                        className="text-neutral-400 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all duration-300 disabled:opacity-50"
                        title="Logout"
                        aria-label="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                }
            />

            <div className="flex flex-col items-center text-center space-y-5 mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-amber-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative w-28 h-28 rounded-3xl bg-linear-to-br from-red-600 to-neutral-800 p-1 shadow-2xl">
                        <div className="w-full h-full bg-neutral-950 rounded-[22px] flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={displayName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <User size={48} className="text-neutral-600 group-hover:text-neutral-400 transition-colors duration-300" />
                            )}
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-black tracking-tight">{displayName}</h2>
                    <div className="flex items-center justify-center mt-2 space-x-1">
                        {isPremium && <Crown size={14} className="text-amber-500" />}
                        <p className={`text-[10px] font-black tracking-widest uppercase ${isPremium ? 'text-amber-500' : 'text-neutral-500'}`}>
                            {isPremium ? 'PRO MEMBER' : 'FREE TIER'}
                        </p>
                    </div>
                    {user.email && (
                        <p className="text-sm text-neutral-400 mt-1 font-medium">{user.email}</p>
                    )}
                </div>
            </div>

            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div
                    className={`w-full p-5 rounded-2xl flex items-center justify-between border cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg
                        ${isPremium
                            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'bg-red-600/10 border-red-600/30 hover:bg-red-600/20 hover:border-red-600/50 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]'}`}
                >
                    <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-xl ${isPremium ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
                            <Crown size={24} className={isPremium ? 'text-amber-500' : 'text-red-500'} />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[15px] font-black tracking-tight text-white mb-0.5">
                                {isPremium ? 'Premium Aktif' : 'Langganan Premium'}
                            </span>
                            <span className={`text-[11px] font-medium ${isPremium ? 'text-amber-500/80' : 'text-red-500/80'}`}>
                                {isPremium ? 'Kelola langganan Anda' : 'Nikmati tayangan tanpa iklan'}
                            </span>
                        </div>
                    </div>
                    <ChevronRight size={20} className={isPremium ? 'text-amber-500/50' : 'text-red-500/50'} />
                </div>

                <div className="bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 divide-y divide-white/5 overflow-hidden shadow-xl">
                    <button className="w-full p-5 flex items-center justify-between transition-colors hover:bg-white/5 group">
                        <div className="flex items-center space-x-4 text-neutral-300 group-hover:text-white transition-colors duration-300">
                            <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
                                <Bookmark size={20} />
                            </div>
                            <span className="text-[15px] font-bold tracking-tight">Daftar Tontonan</span>
                        </div>
                        <span className="text-[11px] font-black bg-neutral-800 text-white px-2.5 py-1 rounded-md shadow-inner group-hover:bg-neutral-700 transition-colors">0</span>
                    </button>

                    <button className="w-full p-5 flex items-center justify-between transition-colors hover:bg-white/5 group">
                        <div className="flex items-center space-x-4 text-neutral-300 group-hover:text-white transition-colors duration-300">
                            <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
                                <Clock size={20} />
                            </div>
                            <span className="text-[15px] font-bold tracking-tight">Riwayat</span>
                        </div>
                        <ChevronRight size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
}
