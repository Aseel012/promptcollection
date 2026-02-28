import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Check, X, ChevronLeft, ThumbsUp, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Masonry from 'react-masonry-css';
import { fetchPrompts, fetchCategories, fetchEngines, fetchPromptById } from '../api/apiConfig';

const Home = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [prompts, setPrompts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [engines, setEngines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [activeChip, setActiveChip] = useState("All");
    const [likedPrompts, setLikedPrompts] = useState([]);
    const [recentPrompts, setRecentPrompts] = useState([]);
    const [isJoined, setIsJoined] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [suggestions, setSuggestions] = useState([]);
    const observer = useRef();

    const [showJoinedToast, setShowJoinedToast] = useState(false);

    // Fetch categories and engines once on mount
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [cats, engs] = await Promise.all([
                    fetchCategories(),
                    fetchEngines(),
                ]);
                setCategories(cats);
                setEngines(engs);
            } catch (error) {
                console.error("Error fetching metadata:", error);
            }
        };
        loadMetadata();
    }, []);

    // Reset page to 1 whenever filter or search changes
    useEffect(() => {
        setPageNumber(1);
    }, [activeChip, location.search]);

    // Main data fetching
    useEffect(() => {
        const loadData = async () => {
            if (pageNumber === 1) setLoading(true);
            const params = new URLSearchParams(location.search);
            const searchQuery = params.get('search') || '';
            const urlCategory = params.get('category') || params.get('chip');

            if (urlCategory && activeChip === "All") {
                setActiveChip(urlCategory);
            }

            try {
                let result;

                if (searchQuery) {
                    result = await fetchPrompts({ keyword: searchQuery, shuffle: false });
                } else if (activeChip !== "All" && activeChip !== "Recent" && activeChip !== "Liked") {
                    result = await fetchPrompts({ category: activeChip, shuffle: true });
                } else if (activeChip === "Recent") {
                    if (recentPrompts.length > 0) {
                        result = await fetchPrompts({ ids: recentPrompts, shuffle: false });
                    } else {
                        result = { prompts: [], pages: 1, count: 0 };
                    }
                } else if (activeChip === "Liked") {
                    if (likedPrompts.length > 0) {
                        result = await fetchPrompts({ ids: likedPrompts, shuffle: false });
                    } else {
                        result = { prompts: [], pages: 1, count: 0 };
                    }
                } else {
                    // "All" - shuffled
                    result = await fetchPrompts({ shuffle: true });
                }

                if (result && result.prompts) {
                    setPrompts(prev => pageNumber === 1 ? result.prompts : [...prev, ...result.prompts]);
                    setTotalPages(result.pages);
                }
            } catch (error) {
                console.error("Connection error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

    // Fetch shuffled suggestions for "Up Next"
    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                const result = await fetchPrompts({ pageSize: 6, shuffle: true });
                if (result && result.prompts) {
                    setSuggestions(result.prompts);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            }
        };
        loadSuggestions();
    }, [selectedPrompt?._id]);


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

    // Infinite Scroll Observer
    const lastPromptElementRef = (node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && pageNumber < totalPages) {
                setPageNumber(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    };

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

    const handleSelectPrompt = async (prompt) => {
        setFetchingDetails(true);
        try {
            const fullPrompt = await fetchPromptById(prompt._id);
            setSelectedPrompt(fullPrompt);
            const updatedRecent = [prompt._id, ...recentPrompts.filter(id => id !== prompt._id)].slice(0, 50);
            setRecentPrompts(updatedRecent);
            localStorage.setItem('recent_prompts', JSON.stringify(updatedRecent));
            if (watchContainerRef.current) {
                watchContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            console.error("Failed to fetch full prompt details:", e);
        } finally {
            setFetchingDetails(false);
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
        <div className="bg-background min-h-screen text-foreground">

            {/* Join Hub Notification */}
            {showJoinedToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                    <Check size={18} className="text-green-600" />
                    <span className="font-bold text-sm uppercase tracking-widest">
                        {isJoined ? 'Welcome to the Prompt Hub!' : 'You left the Hub.'}
                    </span>
                </div>
            )}

            {/* Loading Overlay when fetching full prompt */}
            {fetchingDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
                </div>
            )}

            {/* Precision Filter Chips */}
            <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-md py-3 -mx-4 md:-mx-8 px-4 md:px-8 mb-6 border-b border-border shadow-sm overflow-x-auto no-scrollbar">
                <div className="flex gap-2 min-w-max pb-1">
                    <button
                        onClick={() => {
                            setActiveChip("All");
                            setPageNumber(1);
                            window.history.pushState({}, '', '/');
                        }}
                        className={`glass-tag ${activeChip === "All" ? 'glass-tag-active' : ''}`}
                    >
                        Index
                    </button>
                    <button onClick={() => handleChipClick("Recent")} className={`glass-tag ${activeChip === "Recent" ? 'glass-tag-active' : ''}`}>Recent</button>
                    {user && <button onClick={() => handleChipClick("Liked")} className={`glass-tag ${activeChip === "Liked" ? 'glass-tag-active' : ''}`}>Liked</button>}

                    {categories.length > 0 && <div className="w-px h-4 bg-border mx-2 self-center" />}
                    {categories.map((cat) => (
                        <button key={cat._id} onClick={() => handleChipClick(cat.name)} className={`glass-tag ${activeChip === cat.name ? 'glass-tag-active' : ''}`}>{cat.name}</button>
                    ))}

                    {engineNames.length > 0 && <div className="w-px h-4 bg-border mx-2 self-center" />}
                    {engineNames.map((model) => (
                        <button key={model} onClick={() => handleChipClick(model)} className={`glass-tag ${activeChip === model ? 'glass-tag-active' : ''}`}>{model}</button>
                    ))}
                </div>
            </div>


            <div className="w-full">
                {loading ? (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="my-masonry-grid px-4"
                        columnClassName="my-masonry-grid_column"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <div key={i} className="animate-pulse flex flex-col gap-4 mb-6 px-2">
                                <div className="glass-card w-full p-6 space-y-4" style={{ height: `${160 + (i % 3) * 40}px` }}>
                                    <div className="h-5 bg-cardHighlight rounded w-3/4" />
                                    <div className="h-4 bg-cardHighlight rounded w-full" />
                                    <div className="h-4 bg-cardHighlight rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </Masonry>
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
                        {filteredPrompts.map((item, index) => (
                            <div
                                key={item._id}
                                ref={filteredPrompts.length === index + 1 ? lastPromptElementRef : null}
                                onClick={() => handleSelectPrompt(item)}
                                className="mb-6 cursor-pointer group px-2 animate-slide-up"
                                style={{ animationDelay: `${(index % 10) * 50}ms` }}
                            >
                                <div className="glass-card p-5 flex flex-col h-full bg-card">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted/60 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                                            {item.aiModel}
                                        </div>
                                        {likedPrompts.includes(item._id) && (
                                            <Heart size={14} fill="currentColor" className="text-foreground" />
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:underline underline-offset-4 decoration-1">
                                        {item.title}
                                    </h3>

                                    {item.description && (
                                        <p className="text-xs text-muted/80 line-clamp-3 leading-relaxed mb-4 flex-grow">
                                            {item.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                                        <div className="text-[10px] font-semibold text-muted/60 uppercase tracking-tight">
                                            {item.category}
                                        </div>
                                        <div className="text-[10px] font-mono text-muted/40">
                                            {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Masonry>
                )}

                {/* Loading Indicator for Infinite Scroll */}
                {loading && pageNumber > 1 && (
                    <div className="flex justify-center py-6 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                        Loading more assets...
                    </div>
                )}
            </div>

            {/* ===== Sleek Glass Modal Overlay ===== */}
            {selectedPrompt && (
                <div
                    ref={watchContainerRef}
                    className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl overflow-y-auto animate-fade-in"
                >
                    {/* Mobile Back Header */}
                    <div className="lg:hidden sticky top-0 bg-background/80 backdrop-blur-md z-20 flex items-center justify-between px-4 py-4 border-b border-border">
                        <button onClick={handleClosePrompt} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <span className="font-brand font-bold tracking-tight truncate px-4 text-sm text-foreground">
                            Antigravity
                        </span>
                        <div className="w-10" />
                    </div>

                    {/* Desktop Close Button */}
                    <button
                        onClick={handleClosePrompt}
                        className="hidden lg:flex fixed top-8 right-8 z-[110] items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-white/90 rounded-md text-xs font-bold transition-all shadow-xl"
                    >
                        <X size={14} />
                        <span className="uppercase tracking-widest">Close</span>
                    </button>

                    {/* Modal Content */}
                    <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-10 lg:px-12 pt-6 lg:pt-16 pb-24">

                        {/* Left: Main Content (image + info) */}
                        <div className="flex-1 min-w-0 flex flex-col gap-8">

                            {/* Image Showcase */}
                            {selectedPrompt.image && (
                                <div className="bg-card/30 lg:rounded-3xl overflow-hidden border-y lg:border border-border flex items-center justify-center p-2 lg:p-8 backdrop-blur-md relative group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    <img
                                        src={selectedPrompt.image}
                                        alt={selectedPrompt.title}
                                        className="max-w-full w-auto h-auto object-contain max-h-[75vh] rounded-xl lg:rounded-2xl shadow-2xl ring-1 ring-white/10"
                                    />
                                </div>
                            )}

                            {/* Info Section */}
                            <div className="p-6 lg:p-0 space-y-6">
                                <h1 className="text-3xl lg:text-5xl font-black leading-tight tracking-tight uppercase">
                                    {selectedPrompt.title}
                                </h1>

                                {/* Author & Actions Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-y border-border">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-cardHighlight rounded-full flex items-center justify-center border border-border shadow-inner">
                                            <span className="text-accent font-bold text-lg font-brand">A</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-base">Antigravity Hub</p>
                                            <p className="text-sm text-muted mt-0.5">{selectedPrompt.aiModel}</p>
                                        </div>
                                        <button
                                            onClick={handleJoinHub}
                                            className={`ml-6 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all ${isJoined ? 'bg-card text-muted border border-border' : 'bg-foreground text-background hover:bg-white/90 shadow-md'}`}
                                        >
                                            {isJoined ? 'Subscribed' : 'Join Hub'}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleLike(selectedPrompt._id)}
                                            className={`flex items-center justify-center gap-2 h-9 px-4 rounded-md text-[11px] font-bold uppercase tracking-widest transition-all border ${likedPrompts.includes(selectedPrompt._id) ? 'bg-foreground text-background border-foreground' : 'bg-card border-border hover:bg-cardHighlight text-foreground'}`}
                                        >
                                            <Heart size={14} fill={likedPrompts.includes(selectedPrompt._id) ? "currentColor" : "none"} />
                                            <span>{likedPrompts.includes(selectedPrompt._id) ? 'Liked' : 'Like'}</span>
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(selectedPrompt.promptText, selectedPrompt._id)}
                                            className="flex items-center justify-center gap-2 h-9 px-5 bg-foreground hover:bg-white/90 text-background rounded-md text-[11px] font-bold uppercase tracking-widest transition-all shadow-md"
                                        >
                                            {copiedId === selectedPrompt._id ? <Check size={14} /> : <Copy size={14} />}
                                            <span>{copiedId === selectedPrompt._id ? 'Copied' : 'Copy Prompt'}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Description Box */}
                                <div className="glass-card p-6 md:p-8 space-y-6 border-white/5">
                                    <div className="flex gap-4 text-sm font-medium text-muted">
                                        <span className="px-3 py-1 bg-white/5 rounded-md text-foreground">{selectedPrompt.category}</span>
                                        <span className="flex items-center">{new Date(selectedPrompt.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>

                                    <div className="p-6 bg-background/50 border border-border rounded-xl relative group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <p className="text-base md:text-lg text-foreground/90 font-mono leading-relaxed select-all pl-2">
                                            {selectedPrompt.promptText}
                                        </p>
                                    </div>

                                    {selectedPrompt.description && (
                                        <p className="text-muted text-base leading-relaxed max-w-3xl">
                                            {selectedPrompt.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Recommended (Up Next) */}
                        <div className="w-full lg:w-[420px] px-6 lg:px-0 flex-shrink-0">
                            <h3 className="text-base font-semibold text-foreground mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                                Discover more
                            </h3>
                            <div className="flex flex-col gap-4">
                                {suggestions.filter(p => p._id !== selectedPrompt._id).map((rec, idx) => (
                                    <div
                                        key={rec._id}
                                        onClick={() => handleSelectPrompt(rec)}
                                        className="glass-card p-4 cursor-pointer flex gap-4 animate-slide-up"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="w-24 h-24 flex-shrink-0 bg-background rounded-lg border border-border overflow-hidden flex items-center justify-center">
                                            {rec.image ? (
                                                <img src={rec.image} alt={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <span className="text-muted/30 font-bold text-2xl">{rec.title.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="text-sm font-semibold text-foreground leading-tight mb-2 line-clamp-2">{rec.title}</h4>
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted">
                                                <span className="px-2 py-0.5 bg-white/5 rounded text-foreground/80">{rec.category}</span>
                                                <span>•</span>
                                                <span className="truncate">{rec.aiModel}</span>
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
