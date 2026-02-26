import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Check, X, ChevronLeft, ThumbsUp, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Masonry from 'react-masonry-css';
import { API_ENDPOINTS } from '../api/apiConfig';

const Home = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [prompts, setPrompts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [engines, setEngines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [activeChip, setActiveChip] = useState("All");
    const [likedPrompts, setLikedPrompts] = useState([]);
    const [recentPrompts, setRecentPrompts] = useState([]);
    const [isJoined, setIsJoined] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [showJoinedToast, setShowJoinedToast] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const params = new URLSearchParams(location.search);
            const searchQuery = params.get('search') || '';
            const urlCategory = params.get('category') || params.get('chip');

            // Sync activeChip with URL if needed
            if (urlCategory && activeChip === "All") {
                setActiveChip(urlCategory);
            }

            let queryParams = new URLSearchParams();
            queryParams.append('pageNumber', pageNumber);

            if (searchQuery) queryParams.append('keyword', searchQuery);

            if (activeChip !== "All" && activeChip !== "Recent" && activeChip !== "Liked") {
                queryParams.append('category', activeChip);
            } else if (activeChip === "Recent") {
                if (recentPrompts.length > 0) queryParams.append('ids', recentPrompts.join(','));
            } else if (activeChip === "Liked") {
                if (likedPrompts.length > 0) queryParams.append('ids', likedPrompts.join(','));
            }

            try {
                const [promptRes, catRes, engRes] = await Promise.all([
                    fetch(`${API_ENDPOINTS.PROMPTS}?${queryParams.toString()}`),
                    fetch(API_ENDPOINTS.CATEGORIES),
                    fetch(API_ENDPOINTS.ENGINES),
                ]);
                const promptData = await promptRes.json();

                if (promptData && promptData.prompts) {
                    if (pageNumber === 1) {
                        setPrompts(promptData.prompts);
                        localStorage.setItem('cache_prompts', JSON.stringify(promptData.prompts));
                    } else {
                        setPrompts(prev => [...prev, ...promptData.prompts]);
                    }
                    setTotalPages(promptData.pages);
                }

                const catData = await catRes.json();
                if (Array.isArray(catData)) {
                    setCategories(catData);
                    localStorage.setItem('cache_categories', JSON.stringify(catData));
                }

                const engData = await engRes.json();
                if (Array.isArray(engData)) {
                    setEngines(engData);
                    localStorage.setItem('cache_engines', JSON.stringify(engData));
                }
            } catch (error) {
                console.error("Connection error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [pageNumber, activeChip, location.search, likedPrompts.length, recentPrompts.length]);

    useEffect(() => {
        const storedRecent = JSON.parse(localStorage.getItem('recent_prompts') || '[]');
        setRecentPrompts(storedRecent);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const chip = params.get('chip') || params.get('category');
        if (chip) setActiveChip(chip);
    }, [location.search]);

    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                const docRef = doc(db, "users", user.email);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setLikedPrompts(docSnap.data().likes || []);
                    setIsJoined(docSnap.data().isJoined || false);
                }
            };
            fetchUserData();
        }
    }, [user]);

    // Lock body scroll when watch page is open
    useEffect(() => {
        if (selectedPrompt) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedPrompt]);

    const handleLike = async (id) => {
        if (!user) { alert("Please sign in to like prompts!"); return; }
        const userRef = doc(db, "users", user.email);
        const isLiked = likedPrompts.includes(id);
        try {
            if (isLiked) {
                await updateDoc(userRef, { likes: arrayRemove(id) });
                setLikedPrompts(prev => prev.filter(p => p !== id));
            } else {
                await setDoc(userRef, { likes: arrayUnion(id) }, { merge: true });
                setLikedPrompts(prev => [id, ...prev]);
            }
        } catch (error) {
            console.error("Error updating likes:", error);
        }
    };

    const handleJoinHub = async () => {
        if (!user) { alert("Please sign in to Join Hub!"); return; }
        const userRef = doc(db, "users", user.email);
        const newJoinedState = !isJoined;
        try {
            await setDoc(userRef, { isJoined: newJoinedState }, { merge: true });
            setIsJoined(newJoinedState);
            setShowJoinedToast(true);
            setTimeout(() => setShowJoinedToast(false), 3000);
        } catch (error) {
            console.error("Error joining hub:", error);
        }
    };

    const watchContainerRef = useRef(null);

    const handleSelectPrompt = (prompt) => {
        setSelectedPrompt(prompt);
        const updatedRecent = [prompt._id, ...recentPrompts.filter(id => id !== prompt._id)].slice(0, 50);
        setRecentPrompts(updatedRecent);
        localStorage.setItem('recent_prompts', JSON.stringify(updatedRecent));
        if (watchContainerRef.current) {
            watchContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleClosePrompt = () => {
        setSelectedPrompt(null);
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleChipClick = (name) => {
        setActiveChip(name);
        setPageNumber(1);
        window.history.pushState({}, '', `?chip=${name}`);
    };

    // Build chip engine names from DB engines + fallback static
    const engineNames = engines.length > 0 ? engines.map(e => e.name) : ["Midjourney", "DALL-E 3", "Stable Diffusion XL", "Leonardo AI", "Freepik", "Gemini"];

    const filteredPrompts = prompts; // Backend handles filtering now


    const breakpointColumnsObj = {
        default: 5,
        1536: 4,
        1280: 3,
        1024: 2,
        640: 1
    };

    return (
        <div className="bg-[#0f0f0f] min-h-screen text-white">

            {/* Join Hub Notification */}
            {showJoinedToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                    <Check size={18} className="text-green-600" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                        {isJoined ? 'Welcome to the Prompt Hub!' : 'You left the Hub.'}
                    </span>
                </div>
            )}

            {/* YouTube Style Chips */}
            <div className="sticky top-14 z-30 bg-[#0f0f0f]/95 backdrop-blur-md py-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-6 border-b border-white/5 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 min-w-max pb-1">
                    <button onClick={() => { setActiveChip("All"); window.history.pushState({}, '', '/'); }} className={`yt-chip ${activeChip === "All" ? 'yt-chip-active' : ''}`}>All</button>
                    <button onClick={() => handleChipClick("Recent")} className={`yt-chip ${activeChip === "Recent" ? 'yt-chip-active' : ''}`}>Recent</button>
                    {user && <button onClick={() => handleChipClick("Liked")} className={`yt-chip ${activeChip === "Liked" ? 'yt-chip-active' : ''}`}>Liked</button>}
                    <div className="w-px h-6 bg-white/10 mx-2 self-center" />
                    {categories.map((cat) => (
                        <button key={cat._id} onClick={() => handleChipClick(cat.name)} className={`yt-chip ${activeChip === cat.name ? 'yt-chip-active' : ''}`}>{cat.name}</button>
                    ))}
                    <div className="w-px h-6 bg-white/10 mx-2 self-center" />
                    {engineNames.map((model) => (
                        <button key={model} onClick={() => handleChipClick(model)} className={`yt-chip ${activeChip === model ? 'yt-chip-active' : ''}`}>{model}</button>
                    ))}
                </div>
            </div>


            <div className="w-full">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 gap-x-4 px-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="animate-pulse flex flex-col gap-3">
                                <div className="bg-zinc-800 aspect-video rounded-xl w-full" />
                                <div className="flex gap-3">
                                    <div className="w-9 h-9 bg-zinc-800 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-zinc-800 rounded w-full" />
                                        <div className="h-3 bg-zinc-800 rounded w-2/3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 text-center px-4">
                        <AlertCircle size={64} className="text-zinc-700 mb-6" />
                        <h2 className="text-xl font-semibold mb-2">Nothing found</h2>
                        <p className="text-zinc-500 max-w-md mx-auto text-sm">No prompts match this filter. Try something else.</p>
                        <button onClick={() => { setActiveChip("All"); window.history.pushState({}, '', '/'); }} className="mt-6 px-6 py-2 bg-white text-black text-sm font-semibold rounded-full hover:bg-zinc-200 transition-colors">Back to All</button>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                    >
                        {filteredPrompts.map((item) => (
                            <div key={item._id} onClick={() => handleSelectPrompt(item)} className="mb-8 cursor-pointer group px-2">
                                <div className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 mb-3">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-medium text-white uppercase">
                                        {item.aiModel}
                                    </div>
                                    {likedPrompts.includes(item._id) && (
                                        <div className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full shadow-lg">
                                            <Heart size={12} fill="white" className="text-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 px-1">
                                    <div className="w-8 h-8 flex-shrink-0 bg-red-600 rounded-full flex items-center justify-center font-semibold text-white text-[11px] uppercase ring-1 ring-white/10">
                                        {item.category?.[0] || 'P'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-[14px] font-semibold text-white line-clamp-2 leading-snug mb-0.5">{item.title}</h3>
                                        <div className="text-[12px] text-zinc-500">
                                            <span className="hover:text-zinc-300 transition-colors">{item.category}</span>
                                            <span className="mx-1">•</span>
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Masonry>
                )}

                {/* Pagination Controls */}
                {!loading && pageNumber < totalPages && (
                    <div className="flex justify-center py-10">
                        <button
                            onClick={() => setPageNumber(prev => prev + 1)}
                            className="px-8 py-3 bg-zinc-900 border border-white/10 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                        >
                            Load More Prompts
                        </button>
                    </div>
                )}
            </div>

            {/* ===== YouTube-Style Watch Page Overlay ===== */}
            {selectedPrompt && (
                <div
                    ref={watchContainerRef}
                    className="fixed inset-0 z-[100] bg-[#0f0f0f] overflow-y-auto"
                    style={{ top: '56px' }}
                >
                    {/* Mobile Back Header */}
                    <div className="lg:hidden sticky top-0 bg-[#0f0f0f] z-20 flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <button onClick={handleClosePrompt} className="p-1 hover:text-zinc-300 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <span className="font-black uppercase tracking-tighter truncate px-4 text-sm">
                            Promptcollection<span className="text-red-600">.</span>
                        </span>
                        <div className="w-6" />
                    </div>

                    {/* Desktop Close Button */}
                    <button
                        onClick={handleClosePrompt}
                        className="hidden lg:flex fixed top-20 right-6 z-[110] items-center gap-2 px-4 py-2 bg-zinc-900/80 hover:bg-red-600 rounded-full text-sm text-white transition-all border border-white/10 backdrop-blur-sm"
                    >
                        <X size={16} />
                        <span>Close</span>
                    </button>

                    {/* Watch Page Content — scrolls naturally */}
                    <div className="max-w-[1500px] mx-auto flex flex-col lg:flex-row gap-8 lg:px-8 pt-4 pb-20">

                        {/* Left: Main Content (image + info) */}
                        <div className="flex-1 min-w-0">
                            {/* Image — NOT sticky, scrolls with page like YouTube */}
                            <div className="bg-black lg:rounded-2xl overflow-hidden border-b lg:border border-white/5 flex items-center justify-center shadow-2xl">
                                <img
                                    src={selectedPrompt.image}
                                    alt={selectedPrompt.title}
                                    className="max-w-full w-full h-auto object-contain max-h-[90vh]"
                                />
                            </div>

                            {/* Info Section */}
                            <div className="p-4 lg:px-0 lg:py-6 space-y-4">
                                <h2 className="text-lg md:text-2xl font-semibold leading-snug">{selectedPrompt.title}</h2>

                                {/* Channel Row (YouTube-style) */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 md:w-11 md:h-11 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 flex-shrink-0">
                                            <span className="text-red-600 font-black text-base uppercase">P</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black uppercase text-base tracking-tighter leading-none">
                                                Promptcollection<span className="text-red-600">.</span>
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{selectedPrompt.aiModel}</p>
                                        </div>
                                        <button
                                            onClick={handleJoinHub}
                                            className={`ml-4 px-5 py-2 rounded-full text-sm font-semibold transition-all ${isJoined ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black hover:bg-zinc-200'}`}
                                        >
                                            {isJoined ? 'Joined' : 'Join Hub'}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-zinc-800 rounded-full h-10">
                                            <button
                                                onClick={() => handleLike(selectedPrompt._id)}
                                                className={`flex items-center gap-2 px-4 h-10 hover:bg-zinc-700 rounded-full text-sm font-medium transition-all ${likedPrompts.includes(selectedPrompt._id) ? 'text-red-500' : 'text-white'}`}
                                            >
                                                <ThumbsUp size={16} fill={likedPrompts.includes(selectedPrompt._id) ? "currentColor" : "none"} />
                                                <span>{likedPrompts.includes(selectedPrompt._id) ? 'Liked' : 'Like'}</span>
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(selectedPrompt.promptText, selectedPrompt._id)}
                                            className="flex items-center gap-2 px-5 h-10 bg-white text-black hover:bg-zinc-200 rounded-full text-sm font-semibold transition-all active:scale-95"
                                        >
                                            {copiedId === selectedPrompt._id ? <Check size={16} /> : <Copy size={16} />}
                                            <span>{copiedId === selectedPrompt._id ? 'Copied!' : 'Copy Prompt'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Description Box */}
                                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
                                    <div className="flex gap-3 text-xs text-zinc-500">
                                        <span className="text-zinc-400 font-medium">{selectedPrompt.category}</span>
                                        <span>•</span>
                                        <span>{new Date(selectedPrompt.createdAt).toDateString()}</span>
                                    </div>
                                    <div className="p-5 bg-black border border-white/5 rounded-xl relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-600" />
                                        <p className="text-sm md:text-base text-zinc-200 leading-relaxed select-all pl-3">
                                            {selectedPrompt.promptText}
                                        </p>
                                    </div>
                                    {selectedPrompt.description && (
                                        <p className="text-zinc-400 text-sm leading-relaxed">{selectedPrompt.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Recommended (Up Next) */}
                        <div className="w-full lg:w-[400px] px-4 lg:px-0 flex-shrink-0">
                            <h3 className="text-sm font-semibold text-zinc-400 mb-4">Up next</h3>
                            <div className="space-y-4">
                                {prompts.filter(p => p._id !== selectedPrompt._id).slice(0, 15).map(rec => (
                                    <div
                                        key={rec._id}
                                        onClick={() => handleSelectPrompt(rec)}
                                        className="flex gap-3 cursor-pointer group"
                                    >
                                        <div className="w-40 h-24 flex-shrink-0 bg-zinc-900 rounded-xl overflow-hidden border border-white/5">
                                            <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-1 group-hover:text-zinc-300 transition-colors">{rec.title}</h4>
                                            <div className="text-xs text-zinc-500 space-y-0.5">
                                                <p>{rec.category}</p>
                                                <p>{new Date(rec.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
