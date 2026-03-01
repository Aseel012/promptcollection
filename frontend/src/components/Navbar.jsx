import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, Bell, LogOut, Shield, X, Image, Home, LayoutGrid } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchPrompts } from '../api/apiConfig';

const Navbar = () => {
    const { user, logout } = useAuth();
    const [search, setSearch] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [recentPrompts, setRecentPrompts] = useState([]);
    const notifRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isAdmin = user?.email === 'shaikhmdaseel@gmail.com';

    useEffect(() => {
        if (!user) { setIsJoined(false); return; }
        const fetchJoined = async () => {
            try {
                const docRef = doc(db, "users", user.email);
                const snap = await getDoc(docRef);
                if (snap.exists()) setIsJoined(snap.data().isJoined || false);
            } catch (e) { /* silently fail */ }
        };
        fetchJoined();
    }, [user]);

    useEffect(() => {
        if (!isJoined) return;
        const loadNotifs = async () => {
            try {
                const result = await fetchPrompts({ pageSize: 5 });
                if (result && result.prompts) {
                    setRecentPrompts(result.prompts.slice(0, 5));
                }
            } catch (e) { /* silently fail */ }
        };
        loadNotifs();
    }, [isJoined]);

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const timeAgo = (dateStr) => {
        const diff = (Date.now() - new Date(dateStr)) / 1000;
        if (diff < 60) return 'now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        return `${Math.floor(diff / 3600)}h`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[100] bg-black/60 backdrop-blur-3xl px-6 md:px-12 h-20 flex items-center justify-between border-b border-white/5 transition-all duration-700">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-0 group">
                <span className="text-white text-sm font-bold tracking-tight">Prompt</span>
                <span className="text-accent text-sm font-bold tracking-tight">Collection</span>
            </Link>

            <div className="flex items-center gap-1 bg-neutral-900/40 p-1 rounded-full border border-white/5 mx-2 md:mx-4">
                <Link
                    to="/"
                    className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${location.pathname === '/' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/30 hover:text-white'}`}
                >
                    Home
                </Link>
                <Link
                    to="/categories"
                    className={`px-3 md:px-5 py-1.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${location.pathname === '/categories' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-white/30 hover:text-white'}`}
                >
                    Categories
                </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
                {/* Search Bar (Desktop) */}
                <form
                    onSubmit={(e) => { e.preventDefault(); navigate(`/?search=${search}`); }}
                    className="hidden lg:flex items-center bg-white/[0.03] border border-white/5 rounded-full px-4 py-2.5 focus-within:border-accent/40 silent-transition group w-48 xl:w-64"
                >
                    <Search size={14} className="text-white/20 group-focus-within:text-accent" />
                    <input
                        type="text"
                        placeholder="Search Intelligence..."
                        className="bg-transparent px-3 w-full outline-none text-white placeholder:text-white/10 text-[11px] font-medium tracking-tight"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </form>

                <button onClick={() => setIsSearchOpen(true)} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors">
                    <Search size={20} />
                </button>

                {user ? (
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className={`relative p-2.5 rounded-full border border-white/5 silent-transition ${notifOpen ? 'bg-white/10 border-white/20' : 'hover:bg-white/5'}`}
                            >
                                <Bell size={18} className={recentPrompts.length > 0 ? "text-accent" : "text-white/30"} />
                                {recentPrompts.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-black animate-pulse" />
                                )}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 mt-6 w-80 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden z-[110] animate-slide-up py-2">
                                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Recent Updates</p>
                                        <span className="text-[10px] font-bold text-accent px-2 py-0.5 bg-accent/10 rounded-full">{recentPrompts.length}</span>
                                    </div>
                                    <div className="max-h-[350px] overflow-y-auto no-scrollbar px-2 mt-2">
                                        {recentPrompts.length > 0 ? recentPrompts.map((p) => (
                                            <button key={p.id} onClick={() => { setNotifOpen(false); navigate(`/`); }} className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl transition-colors text-left group">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black border border-white/5 flex-shrink-0">
                                                    {p.image ? (
                                                        <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white/10">No Img</div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-white/80 line-clamp-1 group-hover:text-white transition-colors">{p.title}</p>
                                                    <p className="text-[9px] text-white/20 uppercase tracking-widest mt-1 font-medium">{timeAgo(p.created_at)} ago</p>
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="py-10 text-center">
                                                <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">No new signals</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="relative group">
                            <button className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-accent/40 silent-transition ring-offset-2 ring-offset-black group-hover:ring-2 ring-accent/20">
                                {user.photoURL ? <img src={user.photoURL} alt="" /> : <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[10px] font-black text-white/60">{user.email[0].toUpperCase()}</div>}
                            </button>
                            <div className="absolute right-0 mt-4 w-60 bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-4 group-hover:translate-y-0 silent-transition py-4 z-[100] border-t-white/20">
                                <div className="px-6 pb-4 border-b border-white/5">
                                    <p className="text-xs font-black truncate text-white">{user.displayName || user.email.split('@')[0]}</p>
                                    <p className="text-[9px] text-accent font-black uppercase tracking-widest mt-1.5 opacity-80">Authenticated Session</p>
                                </div>
                                <div className="px-3 mt-3 space-y-1">
                                    {isAdmin && (
                                        <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all hover:translate-x-1">
                                            <Shield size={14} className="text-accent/60" /> Terminal Access
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all hover:translate-x-1">
                                        <LogOut size={14} /> Terminate Session
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="px-5 md:px-8 py-2 md:py-3 bg-white text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-accent hover:text-white silent-transition shadow-xl shadow-white/5">
                        Sign In
                    </Link>
                )}
            </div>

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="fixed inset-0 bg-black z-[120] flex flex-col p-6 animate-fade-in lg:hidden">
                    <div className="flex items-center justify-between mb-8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Search Database</span>
                        <button onClick={() => setIsSearchOpen(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                    </div>
                    <form
                        onSubmit={(e) => { e.preventDefault(); setIsSearchOpen(false); navigate(`/?search=${search}`); }}
                        className="flex items-center bg-neutral-900 rounded-[2rem] px-6 py-4 border border-white/10"
                    >
                        <Search size={18} className="text-accent" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Enter keywords..."
                            className="bg-transparent w-full outline-none text-white text-lg font-bold ml-4 placeholder:text-white/5"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
