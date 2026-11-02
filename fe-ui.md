import React, { useState, useEffect } from 'react';
import { 
  Play, Search, Home, TrendingUp, Clock, Bookmark, 
  Settings, ChevronRight, ChevronLeft, X, 
  User, Crown, Info, List, Monitor, Share2, 
  CheckCircle2, FastForward, Heart, Download
} from 'lucide-react';

/**
 * MOCK DATA - Berdasarkan PRD (Representasi cache Supabase)
 */
const MOCK_DRAMAS = [
  {
    id: 'd1',
    title: 'Pewaris Triliuner yang Tersembunyi',
    provider: 'DramaBox',
    slug: 'drama-box',
    rating: 4.8,
    episodes: 88,
    category: 'Trending',
    thumbnail: 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=800&auto=format&fit=crop',
    description: 'Setelah 10 tahun hidup miskin, Lin Feng menemukan bahwa dia adalah satu-satunya pewaris kekaisaran triliun dolar.',
    tags: ['Romance', 'Revenge', 'Billionaire']
  },
  {
    id: 'd2',
    title: 'Kelahiran Kembali Istri CEO',
    provider: 'ShortMax',
    slug: 'short-max',
    rating: 4.5,
    episodes: 102,
    category: 'Populer',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    description: 'Dikhianati dan dibunuh, dia terbangun 5 tahun di masa lalu untuk membalas dendam.',
    tags: ['Drama', 'Thriller', 'Rebirth']
  },
  {
    id: 'd3',
    title: 'Kultivasi di Kota Modern',
    provider: 'GoodShort',
    slug: 'good-short',
    rating: 4.9,
    episodes: 150,
    category: 'Untuk Kamu',
    thumbnail: 'https://images.unsplash.com/photo-1535016120720-40c646bebbbb?q=80&w=800&auto=format&fit=crop',
    description: 'Seorang grandmaster abadi turun ke Bumi untuk melindungi putrinya yang lama hilang.',
    tags: ['Action', 'Fantasy', 'Family']
  },
  {
    id: 'd4',
    title: 'Bos Saya adalah Vampir',
    provider: 'FlexTV',
    slug: 'flex-tv',
    rating: 4.2,
    episodes: 60,
    category: 'Trending',
    thumbnail: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800&auto=format&fit=crop',
    description: 'Lembur kerja menjadi mengerikan saat Sarah tahu kenapa bosnya hanya rapat setelah gelap.',
    tags: ['Supernatural', 'Romance', 'Comedy']
  }
];

const MOCK_EPISODES = Array.from({ length: 15 }, (_, i) => ({
  id: `ep-${i + 1}`,
  number: i + 1,
  title: `Episode ${i + 1}`,
  duration: '01:45',
  isLocked: i > 2, 
  thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&auto=format&fit=crop'
}));

export default function App() {
  const [view, setView] = useState('home'); // home, search, explore, detail, play, profile
  const [selectedDrama, setSelectedDrama] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Efek inisialisasi history dari storage
  useEffect(() => {
    const saved = localStorage.getItem('dracinhub_history');
    if (saved) setWatchHistory(JSON.parse(saved));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setView('search');
    setTimeout(() => setIsLoading(false), 600);
  };

  const navigateToDetail = (drama) => {
    setSelectedDrama(drama);
    setView('detail');
    window.scrollTo(0, 0);
  };

  const startPlayback = (episode) => {
    if (episode.isLocked && !isPremium) {
      // Simuasi pengecekan entitlement PRD FR-MON-02
      return; 
    }
    setSelectedEpisode(episode);
    setView('play');
    
    // Simpan history (PRD FR-PROG-01)
    const entry = {
      dramaId: selectedDrama.id,
      dramaTitle: selectedDrama.title,
      episodeNum: episode.number,
      timestamp: Date.now()
    };
    const newHistory = [entry, ...watchHistory.filter(h => h.dramaId !== selectedDrama.id)].slice(0, 5);
    setWatchHistory(newHistory);
    localStorage.setItem('dracinhub_history', JSON.stringify(newHistory));
  };

  // Komponen Navigasi Bawah (Mobile First)
  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around z-50 px-4 md:max-w-md md:mx-auto md:rounded-t-3xl md:border-x">
      <button onClick={() => setView('home')} className={`flex flex-col items-center space-y-1 ${view === 'home' ? 'text-red-500' : 'text-slate-500'}`}>
        <Home size={22} variant={view === 'home' ? 'bold' : 'outline'} />
        <span className="text-[10px] font-bold">Home</span>
      </button>
      <button onClick={() => setView('explore')} className={`flex flex-col items-center space-y-1 ${view === 'explore' ? 'text-red-500' : 'text-slate-500'}`}>
        <TrendingUp size={22} />
        <span className="text-[10px] font-bold">Trending</span>
      </button>
      <button onClick={() => setView('search')} className={`flex flex-col items-center space-y-1 ${view === 'search' ? 'text-red-500' : 'text-slate-500'}`}>
        <Search size={22} />
        <span className="text-[10px] font-bold">Search</span>
      </button>
      <button onClick={() => setView('profile')} className={`flex flex-col items-center space-y-1 ${view === 'profile' ? 'text-red-500' : 'text-slate-500'}`}>
        <User size={22} />
        <span className="text-[10px] font-bold">Profile</span>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans md:flex md:justify-center">
      
      {/* Container utama dengan batasan lebar di Desktop agar tetap terasa mobile */}
      <div className="w-full md:max-w-md bg-slate-950 min-h-screen relative pb-20 shadow-2xl">
        
        {/* HEADER (Sticky) */}
        {view !== 'play' && view !== 'detail' && (
          <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-900">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
                <Play fill="white" size={16} />
              </div>
              <span className="text-lg font-black tracking-tighter">dracinhub</span>
            </div>
            <button className="relative">
              <Crown className={isPremium ? 'text-amber-500' : 'text-slate-500'} size={20} />
              {!isPremium && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />}
            </button>
          </header>
        )}

        {/* HOME VIEW */}
        {view === 'home' && (
          <div className="animate-in fade-in duration-500">
            {/* FEATURED HERO (Vertical Focus) */}
            <div 
              className="relative w-full aspect-[3/4] overflow-hidden cursor-pointer"
              onClick={() => navigateToDetail(MOCK_DRAMAS[0])}
            >
              <img src={MOCK_DRAMAS[0].thumbnail} className="w-full h-full object-cover" alt="Featured" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">Baru</span>
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#1 Hari Ini</span>
                </div>
                <h1 className="text-3xl font-black mb-4 leading-tight">{MOCK_DRAMAS[0].title}</h1>
                <div className="flex items-center space-x-3">
                  <button className="flex-1 flex items-center justify-center space-x-2 bg-white text-black py-3 rounded-xl font-bold text-sm">
                    <Play size={18} fill="black" />
                    <span>Tonton Sekarang</span>
                  </button>
                  <button className="w-12 h-12 flex items-center justify-center bg-slate-800/50 backdrop-blur-md rounded-xl border border-white/10">
                    <Bookmark size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* CONTINUE WATCHING */}
            {watchHistory.length > 0 && (
              <section className="px-4 mt-8">
                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Lanjutkan Menonton</h2>
                <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                  {watchHistory.map((item, idx) => (
                    <div key={idx} className="flex-shrink-0 w-40 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                      <div className="p-3">
                        <h4 className="font-bold text-xs truncate mb-1">{item.dramaTitle}</h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Eps {item.episodeNum}</span>
                          <span className="text-red-500 font-bold">60%</span>
                        </div>
                        <div className="mt-2 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 w-[60%]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* HORIZONTAL CATEGORIES */}
            {['Trending', 'Populer', 'Untuk Kamu'].map((cat) => (
              <section key={cat} className="mt-8 px-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black">{cat}</h2>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                  {MOCK_DRAMAS.map((drama) => (
                    <div 
                      key={drama.id}
                      onClick={() => navigateToDetail(drama)}
                      className="flex-shrink-0 w-32 cursor-pointer"
                    >
                      <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative">
                        <img src={drama.thumbnail} className="w-full h-full object-cover" alt={drama.title} />
                        <div className="absolute top-1.5 right-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] font-bold text-red-500 border border-red-500/30">
                          {drama.provider}
                        </div>
                      </div>
                      <h3 className="text-[11px] font-bold truncate">{drama.title}</h3>
                      <p className="text-[9px] text-slate-500 mt-0.5">{drama.episodes} Eps</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* SEARCH VIEW */}
        {view === 'search' && (
          <div className="p-4 animate-in slide-in-from-bottom-4 duration-300">
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Cari drama, genre, atau provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-600/30 text-sm"
                />
              </div>
            </form>

            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Pencarian Populer</h3>
              <div className="flex flex-wrap gap-2">
                {['CEO', 'Balas Dendam', 'Pewaris', 'Vampir', 'Istri'].map(tag => (
                  <button key={tag} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-800">
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-20 flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-bold uppercase">Mencari di 41 Provider...</p>
              </div>
            ) : searchQuery && (
              <div className="mt-8 grid grid-cols-2 gap-4">
                {MOCK_DRAMAS.map(drama => (
                   <div key={drama.id} onClick={() => navigateToDetail(drama)} className="space-y-2">
                      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-900">
                        <img src={drama.thumbnail} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-[11px] font-bold truncate">{drama.title}</h4>
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAIL VIEW (Full Mobile Experience) */}
        {view === 'detail' && selectedDrama && (
          <div className="animate-in slide-in-from-right-8 duration-300">
            {/* BACK BUTTON FLOAT */}
            <button 
              onClick={() => setView('home')}
              className="fixed top-4 left-4 z-50 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white"
            >
              <ChevronLeft size={20} />
            </button>

            {/* HERO DETAIL */}
            <div className="relative w-full aspect-[4/5] bg-slate-900">
              <img src={selectedDrama.thumbnail} className="w-full h-full object-cover" alt="Detail Poster" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-4">
                   {selectedDrama.tags.map(tag => (
                     <span key={tag} className="text-[9px] font-black px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded uppercase">
                       {tag}
                     </span>
                   ))}
                </div>
                <h1 className="text-3xl font-black mb-3 leading-tight">{selectedDrama.title}</h1>
                <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                  <span className="flex items-center text-green-500"><TrendingUp size={14} className="mr-1" /> {selectedDrama.rating}</span>
                  <span>{selectedDrama.episodes} Episode</span>
                  <span className="text-red-500">{selectedDrama.provider}</span>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center space-x-3 p-4 border-b border-slate-900">
              <button 
                onClick={() => startPlayback(MOCK_EPISODES[0])}
                className="flex-1 bg-red-600 py-3.5 rounded-2xl flex items-center justify-center space-x-2 font-black shadow-xl shadow-red-600/20"
              >
                <Play size={20} fill="white" />
                <span>Mulai Menonton</span>
              </button>
              <button className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
                <Share2 size={20} />
              </button>
              <button className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
                <Download size={20} />
              </button>
            </div>

            {/* SYNOPSIS */}
            <div className="p-6">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Sinopsis</h3>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {selectedDrama.description}
              </p>
            </div>

            {/* EPISODES GRID */}
            <div className="px-4 pb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black">Episode</h3>
                <span className="text-xs text-slate-500">Urutan: Terbaru</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {MOCK_EPISODES.map(ep => (
                  <button 
                    key={ep.id}
                    onClick={() => startPlayback(ep)}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all
                    ${ep.isLocked && !isPremium ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 border-slate-700 active:scale-95'}`}
                  >
                    <span className={`text-sm font-black ${ep.isLocked && !isPremium ? 'text-slate-600' : 'text-white'}`}>{ep.number}</span>
                    {ep.isLocked && !isPremium && (
                      <div className="absolute top-1 right-1">
                        <Crown size={10} className="text-amber-500" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLAYER VIEW */}
        {view === 'play' && selectedEpisode && (
          <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-300">
            {/* CLOSE/BACK */}
            <button 
              onClick={() => setView('detail')}
              className="absolute top-6 left-6 z-10 p-2 bg-white/10 backdrop-blur-md rounded-full"
            >
              <X size={20} />
            </button>

            {/* PLAYER AREA */}
            <div className="h-full flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Simulated vertical video player */}
                <div className="w-full h-full max-h-[85vh] aspect-[9/16] bg-slate-950 shadow-2xl overflow-hidden relative group">
                   <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                        <Play size={32} fill="white" className="ml-1" />
                      </div>
                      <p className="text-[10px] text-slate-600 font-mono">PROXY: CAPTAIN-GATEWAY-1</p>
                   </div>
                   
                   {/* Player Overlays */}
                   <div className="absolute right-4 bottom-24 flex flex-col space-y-6 items-center">
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-black/40 backdrop-blur-md rounded-full mb-1">
                          <Heart size={24} className="text-white" />
                        </div>
                        <span className="text-[10px] font-bold">12K</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-black/40 backdrop-blur-md rounded-full mb-1">
                          <Bookmark size={24} className="text-white" />
                        </div>
                        <span className="text-[10px] font-bold">Save</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="p-3 bg-black/40 backdrop-blur-md rounded-full mb-1">
                          <Share2 size={24} className="text-white" />
                        </div>
                        <span className="text-[10px] font-bold">Share</span>
                      </div>
                   </div>

                   {/* Bottom Progress & Title */}
                   <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/60 to-transparent">
                      <h2 className="text-lg font-black text-white mb-1">{selectedDrama.title}</h2>
                      <p className="text-xs text-slate-400 mb-4">Episode {selectedEpisode.number} • {selectedDrama.provider}</p>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 w-1/3" />
                        </div>
                        <span className="text-[10px] font-bold text-white">00:45 / 01:45</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* MINI EPISODE SELECTOR */}
              <div className="h-32 bg-slate-900/50 backdrop-blur-xl border-t border-slate-800 p-4 overflow-x-auto">
                 <div className="flex space-x-3">
                   {MOCK_EPISODES.map(ep => (
                      <button 
                        key={ep.id}
                        onClick={() => startPlayback(ep)}
                        className={`flex-shrink-0 w-24 h-full rounded-lg relative overflow-hidden border
                        ${selectedEpisode.id === ep.id ? 'border-red-600 ring-2 ring-red-600/20' : 'border-slate-800 opacity-60'}`}
                      >
                        <img src={ep.thumbnail} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-xs font-black">Eps {ep.number}</span>
                        </div>
                      </button>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="p-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-slate-800 p-1">
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <User size={40} className="text-slate-700" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black italic">Pengguna Tamu</h2>
                <p className="text-xs text-slate-500 font-bold tracking-widest mt-1 uppercase">Tier: {isPremium ? 'PRO MEMBER' : 'FREE USER'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setIsPremium(!isPremium)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all
                ${isPremium ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-600/10 border-red-600/20'}`}
              >
                <div className="flex items-center space-x-3">
                  <Crown size={20} className={isPremium ? 'text-amber-500' : 'text-red-500'} />
                  <span className="text-sm font-bold">{isPremium ? 'Premium Aktif' : 'Langganan Premium'}</span>
                </div>
                <ChevronRight size={18} />
              </button>

              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 divide-y divide-slate-800">
                <button className="w-full p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Bookmark size={20} />
                    <span className="text-sm font-medium">Daftar Tontonan</span>
                  </div>
                  <span className="text-[10px] font-black bg-slate-800 px-2 py-0.5 rounded">12</span>
                </button>
                <button className="w-full p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Clock size={20} />
                    <span className="text-sm font-medium">Riwayat</span>
                  </div>
                  <ChevronRight size={18} />
                </button>
                <button className="w-full p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Monitor size={20} />
                    <span className="text-sm font-medium">Pengaturan Provider</span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <button className="w-full mt-10 py-4 text-red-500 text-sm font-black border border-red-500/20 rounded-2xl">
              KELUAR AKUN
            </button>
          </div>
        )}

        {/* BOTTOM NAV BAR */}
        {view !== 'play' && <BottomNav />}

        {/* RATE LIMIT NOTIFIER (PRD NFR 7.2) */}
        <div className="fixed top-20 right-4 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
           <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-mono text-slate-500 tracking-tight">API STATUS: 45 req/s (OK)</span>
           </div>
        </div>

      </div>
    </div>
  );
}
