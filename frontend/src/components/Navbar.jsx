import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Menu, Search, User as UserIcon, PlusSquare, Bell, LogOut, Shield, X, Image } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { fetchPrompts } from '../api/apiConfig';

const Navbar = ({ toggleSidebar }) => {
    const { user, logout } = useAuth();
    const [search, setSearch] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [recentPrompts, setRecentPrompts] = useState([]);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isAdmin = user?.email === 'shaikhmdaseel@gmail.com';

    // Load isJoined status from Firestore
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

    // Fetch recent prompts to show as notifications
    useEffect(() => {
        if (!isJoined) return;
        const loadNotifs = async () => {
            try {
                const result = await fetchPrompts({ pageSize: 5, shuffle: false });
                if (result && result.prompts) {
                    const sorted = [...result.prompts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
                    setRecentPrompts(sorted);
                }
            } catch (e) { /* silently fail */ }
        };
        loadNotifs();
    }, [isJoined]);

    // Close notification panel on outside click
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
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-[60] bg-background/80 backdrop-blur-xl px-10 h-14 flex items-center justify-between border-b border-white/[0.03] silent-transition">

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="absolute inset-0 bg-background z-[70] flex items-center px-6 gap-4 lg:hidden">
                    <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                        <X size={18} />
                    </button>
                    <form
                        onSubmit={(e) => { e.preventDefault(); setIsSearchOpen(false); navigate(`/?search=${search}`); }}
                        className="flex-1 flex items-center bg-card rounded-full px-4 py-2 border border-white/5"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search Home"
                            className="bg-transparent w-full outline-none text-[13px] tracking-tight placeholder:text-muted/30"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>
            )}

            {/* Left */}
            <div className="flex items-center gap-8">
                <button onClick={toggleSidebar} className="p-2 hover:bg-white/5 rounded-full silent-transition">
                    <Menu size={18} className="text-muted/60" />
                </button>
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-foreground rounded-full" />
                    <span className="text-foreground text-xs font-bold uppercase tracking-[0.4em] italic leading-none pt-1">The Hub</span>
                </Link>
            </div>

            {/* Center Search */}
            <form
                onSubmit={(e) => { e.preventDefault(); navigate(`/?search=${search}`); }}
                className="hidden lg:flex items-center flex-1 max-w-[600px] mx-10"
            >
                <div className="flex flex-1 items-center bg-white/[0.02] border border-white/[0.05] rounded-full px-6 py-2 overflow-hidden focus-within:border-white/20 silent-transition group">
                    <Search size={14} className="text-muted/30 group-focus-within:text-foreground" />
                    <input
                        type="text"
                        placeholder="Search Intelligence"
                        className="bg-transparent px-4 w-full outline-none text-foreground placeholder:text-muted/20 text-[13px] tracking-tight"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </form>

            {/* Right */}
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 lg:hidden hover:bg-white/5 rounded-full">
                    <Search size={18} className="text-muted/40" />
                </button>

                {user ? (
                    <div className="flex items-center gap-4">
                        {isJoined && (
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setNotifOpen(prev => !prev)}
                                    className={`relative p-2 rounded-full silent-transition ${notifOpen ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                >
                                    <Bell size={18} className="text-muted/60" />
                                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-foreground rounded-full border border-background" />
                                </button>

                                {notifOpen && (
                                    <div className="absolute right-0 mt-4 w-80 bg-card border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden z-[80] animate-fade-in py-2">
                                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 mb-2">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Intelligence Feed</p>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto no-scrollbar px-2">
                                            {recentPrompts.length === 0 ? (
                                                <div className="py-12 text-center opacity-20 uppercase text-[9px] font-bold tracking-[0.3em]">No Data</div>
                                            ) : (
                                                recentPrompts.map((prompt) => (
                                                    <button
                                                        key={prompt._id}
                                                        onClick={() => { setNotifOpen(false); navigate('/'); }}
                                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-white/5 rounded-2xl silent-transition text-left"
                                                    >
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 px-0.5 pt-0.5">
                                                            {prompt.image ? <img src={prompt.image} alt="" className="w-full h-full object-cover rounded-lg opacity-60" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Image size={10} /></div>}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-bold text-foreground/80 leading-tight line-clamp-1 mb-1">{prompt.title}</p>
                                                            <p className="text-[9px] text-muted/30 uppercase tracking-widest">{timeAgo(prompt.createdAt)}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="relative group">
                            <button className="w-8 h-8 rounded-full overflow-hidden border border-white/5 group-hover:border-white/20 silent-transition">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" />
                                ) : (
                                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white/40">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                )}
                            </button>
                            <div className="absolute right-0 mt-4 w-60 bg-card shadow-2xl rounded-[2rem] border border-white/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible silent-transition py-4 z-[70] transform group-hover:translate-y-0 translate-y-2">
                                <div className="px-6 pb-4 border-b border-white/5 mb-2">
                                    <p className="text-xs font-bold truncate tracking-tight">{user.displayName || user.email}</p>
                                    <p className="text-[10px] text-muted/30 mt-1 uppercase tracking-widest truncate">Authorized Node</p>
                                </div>
                                <div className="px-2">
                                    {isAdmin && (
                                        <Link to="/admin" className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted/60 hover:text-foreground">
                                            <Shield size={14} /> Terminal
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors">
                                        <LogOut size={14} /> De-authorise
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-neutral-200 silent-transition whitespace-nowrap">
                        Sign In
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
