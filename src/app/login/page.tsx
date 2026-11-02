'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginAction } from '../actions/auth';
import { Suspense } from 'react';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const message = searchParams.get('message');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await loginAction(email, password);

            if (!result.success) {
                setError(result.error || 'Login failed');
                setIsLoading(false);
            }
            // On success, the action will redirect
        } catch (err) {
            setError('An unexpected error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 selection:bg-red-500/30">
            <div className="w-full max-w-md animate-fade-in">
                <div className="flex items-center justify-center space-x-3 mb-12">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                        <Lock fill="white" size={20} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-white">Masuk</h1>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-green-600/20 border border-green-600/40 rounded-xl text-green-400 text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900/40 backdrop-blur-xl p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent pointer-events-none"></div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            Email
                        </label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                                className="w-full bg-neutral-950/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                            Password
                        </label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="w-full bg-neutral-950/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-12 text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-fade-in flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black hover:bg-neutral-200 disabled:bg-white/50 disabled:text-neutral-500 font-bold py-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                                <span>Memproses...</span>
                            </div>
                        ) : 'Masuk ke Akun'}
                    </button>
                </form>

                <div className="mt-8 text-center flex flex-col items-center space-y-4">
                    <p className="text-neutral-500 text-sm font-medium">
                        Belum punya akun?{' '}
                        <Link href="/signup" className="text-white hover:text-neutral-300 font-bold transition-colors underline decoration-white/30 underline-offset-4">
                            Daftar Sekarang
                        </Link>
                    </p>
                    <Link href="/" className="flex items-center space-x-2 text-neutral-500 hover:text-white transition-colors text-sm font-medium group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Kembali ke Beranda</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 p-6 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
