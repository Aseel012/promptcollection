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
        <nav className="fixed top-0 left-0 right-0 z-[60] bg-background px-6 h-14 flex items-center justify-between border-b border-border shadow-md">

            {/* Mobile Search Overlay */}
            {isSearchOpen && (
                <div className="absolute inset-0 bg-background z-[70] flex items-center px-4 gap-4 lg:hidden">
                    <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-cardHighlight rounded-md">
                        <X size={20} />
                    </button>
                    <form
                        onSubmit={(e) => { e.preventDefault(); setIsSearchOpen(false); navigate(`/?search=${search}`); }}
                        className="flex-1 flex items-center bg-card rounded-md px-3 py-1.5 border border-border"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search prompts..."
                            className="bg-transparent w-full outline-none text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </form>
                </div>
            )}

            {/* Left */}
            <div className="flex items-center gap-6">
                <button onClick={toggleSidebar} className="p-1.5 hover:bg-cardHighlight rounded-md transition-colors">
                    <Menu size={18} />
                </button>
                <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                    <span className="text-foreground">Promptcollection</span>
                </Link>
            </div>

            <form
                onSubmit={(e) => { e.preventDefault(); navigate(`/?search=${search}`); }}
                className="hidden lg:flex items-center flex-1 max-w-[640px] mx-10"
            >
                <div className="flex flex-1 items-center bg-card border border-border rounded-md overflow-hidden focus-within:border-foreground/20 transition-all shadow-sm">
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        className="bg-transparent px-4 py-1.5 w-full outline-none text-foreground placeholder:text-muted/50 text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="bg-cardHighlight border-l border-border px-4 py-1.5 hover:bg-white/5 transition-colors">
                        <Search size={16} className="text-muted" />
                    </button>
                </div>
            </form>

            {/* Right */}
            <div className="flex items-center gap-1 md:gap-2">
                <button onClick={() => setIsSearchOpen(true)} className="p-2 lg:hidden hover:bg-zinc-800 rounded-full transition-colors">
                    <Search size={20} />
                </button>

                {user ? (
                    <>
                        {isAdmin && (
                            <Link to="/admin" className="p-2 hover:bg-zinc-800 rounded-full transition-colors hidden sm:block">
                                <PlusSquare size={20} />
                            </Link>
                        )}

                        {/* Bell — only when joined, with notification dropdown */}
                        {isJoined && (
                            <div className="relative hidden md:block" ref={notifRef}>
                                <button
                                    onClick={() => setNotifOpen(prev => !prev)}
                                    className={`relative p-2 rounded-full transition-colors ${notifOpen ? 'bg-zinc-700' : 'hover:bg-zinc-800'}`}
                                >
                                    <Bell size={20} />
                                    {/* Red dot badge */}
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-[#0f0f0f]" />
                                </button>

                                {/* Notification Panel */}
                                {notifOpen && (
                                    <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-[80] animate-fade-in">
                                        {/* Panel Header */}
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                                            <h3 className="text-base font-semibold">Notifications</h3>
                                            <button
                                                onClick={() => setNotifOpen(false)}
                                                className="p-1 hover:bg-zinc-700 rounded-full transition-colors"
                                            >
                                                <X size={16} className="text-zinc-400" />
                                            </button>
                                        </div>

                                        {/* Notification Items */}
                                        <div className="max-h-[480px] overflow-y-auto">
                                            {recentPrompts.length === 0 ? (
                                                <div className="px-5 py-12 text-center">
                                                    <Bell size={36} className="text-zinc-700 mx-auto mb-3" />
                                                    <p className="text-zinc-500 text-sm">No new notifications</p>
                                                </div>
                                            ) : (
                                                recentPrompts.map((prompt, i) => (
                                                    <button
                                                        key={prompt._id}
                                                        onClick={() => {
                                                            setNotifOpen(false);
                                                            navigate('/');
                                                        }}
                                                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="w-16 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-800">
                                                            {prompt.image ? (
                                                                <img src={prompt.image} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <Image size={16} className="text-zinc-600" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm text-white leading-snug line-clamp-2">
                                                                <span className="font-semibold">Promptcollection</span>
                                                                {' '}added a new prompt:{' '}
                                                                <span className="text-zinc-300">{prompt.title}</span>
                                                            </p>
                                                            <p className="text-xs text-zinc-500 mt-1">{timeAgo(prompt.createdAt)}</p>
                                                        </div>

                                                        {/* Unread dot (first 3 are "new") */}
                                                        {i < 3 && (
                                                            <span className="mt-1.5 w-2 h-2 flex-shrink-0 bg-blue-500 rounded-full" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="px-5 py-3 border-t border-white/5">
                                            <p className="text-xs text-zinc-500 text-center">
                                                You're a <span className="text-red-500 font-medium">Hub Member</span> · Notifications enabled
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Avatar + dropdown */}
                        <div className="relative group ml-1 md:ml-2">
                            <button className="w-8 h-8 rounded-full overflow-hidden border border-zinc-700 ring-offset-2 ring-offset-[#0f0f0f] focus:ring-2 ring-white transition-all">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="" />
                                ) : (
                                    <div className="w-full h-full bg-blue-600 flex items-center justify-center text-xs font-semibold text-white">
                                        {user.email[0].toUpperCase()}
                                    </div>
                                )}
                            </button>
                            <div className="absolute right-0 mt-3 w-56 md:w-64 bg-card shadow-2xl rounded-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 z-[70] transform group-hover:translate-y-0 translate-y-1">
                                <div className="px-4 md:px-5 py-4 border-b border-white/5">
                                    <p className="text-sm font-semibold truncate">{user.displayName || user.email}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5 truncate">@{user.email.split('@')[0]}</p>
                                    {isJoined && (
                                        <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-red-400 bg-red-600/10 px-2.5 py-1 rounded-full">
                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                            Hub Member
                                        </span>
                                    )}
                                </div>
                                <div className="py-2">
                                    {isAdmin && (
                                        <Link to="/admin" className="w-full flex items-center gap-3 px-4 md:px-5 py-2.5 hover:bg-white/5 text-sm text-zinc-300">
                                            <Shield size={16} /> Admin Dashboard
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 md:px-5 py-2.5 hover:bg-white/5 text-sm text-red-400">
                                        <LogOut size={16} /> Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <Link to="/login" className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-md hover:bg-cardHighlight transition-all text-foreground text-xs font-semibold whitespace-nowrap bg-card">
                        <UserIcon size={14} />
                        <span className="hidden xs:block">Sign in</span>
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
