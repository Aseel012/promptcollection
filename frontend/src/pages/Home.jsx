import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (!user) return;
        const isLiked = likedPrompts.includes(id);

        // Optimistic update
        setLikedPrompts(prev =>
            isLiked ? prev.filter(p => p !== id) : [id, ...prev]
        );

        const userRef = doc(db, "users", user.email);
        try {
            if (isLiked) {
                await updateDoc(userRef, { likes: arrayRemove(id) });
            } else {
                await setDoc(userRef, { likes: arrayUnion(id) }, { merge: true });
            }
        } catch (error) {
            console.error("Error updating likes:", error);
            // Revert on error
            setLikedPrompts(prev =>
                isLiked ? [id, ...prev] : prev.filter(p => p !== id)
            );
        }
    };

    const handleJoinHub = async () => {
        if (!user) return;
        const newJoinedState = !isJoined;

        // Optimistic update
        setIsJoined(newJoinedState);
        if (newJoinedState) {
            setShowJoinedToast(true);
            setTimeout(() => setShowJoinedToast(false), 3000);
        }

        const userRef = doc(db, "users", user.email);
        try {
            await setDoc(userRef, { isJoined: newJoinedState }, { merge: true });
        } catch (error) {
            console.error("Error joining hub:", error);
            // Revert
            setIsJoined(!newJoinedState);
        }
    };

    const watchContainerRef = useRef(null);

    const handleSelectPrompt = async (prompt) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        setFetchingDetails(true);
        try {
            const fullPrompt = await fetchPromptById(prompt._id);
            setSelectedPrompt(fullPrompt || prompt); // Fallback to prompt if full fetch fails

            // Add to recent prompts
            const updatedRecent = [prompt._id, ...recentPrompts.filter(id => id !== prompt._id)].slice(0, 50);
            setRecentPrompts(updatedRecent);
            localStorage.setItem('recent_prompts', JSON.stringify(updatedRecent));

            if (watchContainerRef.current) {
                watchContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (e) {
            console.error("Failed to fetch full prompt details:", e);
            setSelectedPrompt(prompt); // Show what we have
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

    const filteredPrompts = prompts;


    const breakpointColumnsObj = {
        default: 5,
        1800: 4,
        1400: 3,
        1000: 2,
        640: 1
    };

    return (
        <div className="bg-background min-h-screen">

            {/* Join Hub Notification */}
            {showJoinedToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-white text-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
                    <Check size={18} className="text-green-600" />
                    <span className="font-bold text-[10px] uppercase tracking-[0.2em]">
                        {isJoined ? 'Subscribed to Hub' : 'Unsubscribed'}
                    </span>
                </div>
            )}

            {/* Loading Overlay */}
            {fetchingDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-xl">
                    <div className="w-10 h-px bg-white/20 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white animate-[loading_1.5s_infinite]" />
                    </div>
                </div>
            )}

            {/* Precision Filter Chips */}
            <div className="sticky top-14 z-20 bg-background/80 backdrop-blur-xl py-6 -mx-8 px-8 mb-4 border-b border-white/[0.03] overflow-x-auto no-scrollbar">
                <div className="flex gap-3 min-w-max">
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

                    <div className="w-px h-3 bg-white/10 mx-2 self-center" />

                    {categories.map((cat) => (
                        <button key={cat._id} onClick={() => handleChipClick(cat.name)} className={`glass-tag ${activeChip === cat.name ? 'glass-tag-active' : ''}`}>{cat.name}</button>
                    ))}

                    <div className="w-px h-3 bg-white/10 mx-2 self-center" />

                    {engineNames.map((model) => (
                        <button key={model} onClick={() => handleChipClick(model)} className={`glass-tag ${activeChip === model ? 'glass-tag-active' : ''}`}>{model}</button>
                    ))}
                </div>
            </div>


            <div className="w-full">
                {loading ? (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="animate-pulse mb-6">
                                <div className="glass-card w-full p-4 space-y-4 rounded-[1.5rem]" style={{ height: `${240 + (i % 3) * 60}px` }}>
                                    <div className="h-full bg-white/[0.02] rounded-2xl w-full" />
                                </div>
                            </div>
                        ))}
                    </Masonry>
                ) : filteredPrompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-48 text-center px-4">
                        <h2 className="text-xl font-bold mb-3 uppercase tracking-tighter opacity-20 italic">Empty Terminal</h2>
                        <button onClick={() => { setActiveChip("All"); window.history.pushState({}, '', '/'); }} className="text-[10px] items-center gap-2 text-muted uppercase tracking-[0.3em] font-bold hover:text-foreground silent-transition">
                            Reload Index
                        </button>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                    >
                        {filteredPrompts.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: (index % 10) * 0.05, duration: 0.6 }}
                                key={item._id}
                                ref={filteredPrompts.length === index + 1 ? lastPromptElementRef : null}
                                onClick={() => handleSelectPrompt(item)}
                                className="mb-8 cursor-pointer group"
                            >
                                <div className="glass-card group flex flex-col h-full bg-card border-white/[0.04] p-2 hover:bg-white/[0.02]">
                                    {/* Image Centric Box */}
                                    <div className="w-full relative rounded-[1rem] overflow-hidden bg-neutral-900 group-hover:scale-[0.99] silent-transition">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.title}
                                                className="w-full h-auto object-cover min-h-[120px] max-h-[500px] opacity-90 group-hover:opacity-100 silent-transition"
                                            />
                                        ) : (
                                            <div className="aspect-[4/5] flex items-center justify-center text-white/5 uppercase font-bold text-xs tracking-widest">
                                                No Preview
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 silent-transition" />
                                    </div>

                                    <div className="p-3 pt-4">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="text-[13px] font-semibold text-foreground leading-snug tracking-tight">
                                                {item.title}
                                            </h3>
                                            <div className="flex-shrink-0 pt-1">
                                                <div className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/5 text-[8px] font-bold uppercase tracking-widest text-muted">
                                                    {item.aiModel?.split(' ')[0]}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[9px] font-bold text-muted/30 uppercase tracking-widest">
                                                {item.category}
                                            </span>
                                            <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                                            <span className="text-[9px] font-bold text-muted/30 tracking-widest uppercase">
                                                {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
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

            {/* ===== Silent Modal Overlay ===== */}
            {selectedPrompt && (
                <div
                    ref={watchContainerRef}
                    className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-fade-in"
                >
                    {/* Minimal Close */}
                    <button
                        onClick={handleClosePrompt}
                        className="fixed top-8 right-8 z-[110] p-3 bg-white/5 hover:bg-white/10 rounded-full silent-transition border border-white/5"
                    >
                        <X size={20} className="text-white/40" />
                    </button>

                    <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-16 lg:px-12 pt-20 pb-32">
                        {/* Left: Content */}
                        <div className="flex-1 min-w-0">
                            {selectedPrompt.image && (
                                <motion.div
                                    initial={{ scale: 0.98, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="bg-cardHighlight/30 rounded-[2.5rem] overflow-hidden border border-white/5 flex items-center justify-center p-4 lg:p-12 mb-12 shadow-2xl"
                                >
                                    <img
                                        src={selectedPrompt.image}
                                        alt={selectedPrompt.title}
                                        className="max-w-full h-auto object-contain max-h-[70vh] rounded-2xl shadow-black/50 shadow-2xl"
                                    />
                                </motion.div>
                            )}

                            <div className="px-4 lg:px-0">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                                        {selectedPrompt.category}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/30">
                                        {selectedPrompt.aiModel}
                                    </span>
                                </div>

                                <h1 className="text-4xl lg:text-7xl font-bold tracking-tighter mb-12 leading-[1.05] uppercase italic text-foreground">
                                    {selectedPrompt.title}
                                </h1>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12 border-t border-white/5">
                                    <div className="space-y-6">
                                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted/40">Prompt Intelligence</p>
                                        <div className="p-8 bg-card border border-white/5 rounded-[2rem] relative group group-hover:border-white/10 silent-transition">
                                            <p className="text-sm md:text-base text-foreground/80 font-medium leading-relaxed select-all">
                                                {selectedPrompt.promptText}
                                            </p>
                                            <button
                                                onClick={() => copyToClipboard(selectedPrompt.promptText, selectedPrompt._id)}
                                                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-lg silent-transition"
                                            >
                                                {copiedId === selectedPrompt._id ? <Check size={14} /> : <Copy size={14} className="opacity-40" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted/40">Visual Context</p>
                                        <p className="text-muted text-sm leading-relaxed opacity-60">
                                            {selectedPrompt.description || "Experimental visual data generated via high-precision neural networks."}
                                        </p>

                                        <div className="flex flex-wrap gap-4 pt-4">
                                            <button
                                                onClick={() => handleLike(selectedPrompt._id)}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest silent-transition ${likedPrompts.includes(selectedPrompt._id) ? 'bg-white text-black' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <Heart size={14} fill={likedPrompts.includes(selectedPrompt._id) ? "currentColor" : "none"} />
                                                {likedPrompts.includes(selectedPrompt._id) ? 'Saved' : 'Save Asset'}
                                            </button>
                                            <button
                                                onClick={handleJoinHub}
                                                className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest silent-transition ${isJoined ? 'border border-white/10 text-white/20' : 'bg-foreground text-background shadow-xl'}`}
                                            >
                                                {isJoined ? 'Hub Verified' : 'Initialise Hub'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Sidebar */}
                        <div className="w-full lg:w-[400px] px-4 lg:px-0">
                            <h3 className="text-[10px] uppercase font-bold tracking-[0.3em] text-muted/40 mb-8 px-2">Discover</h3>
                            <div className="space-y-6">
                                {suggestions.filter(p => p._id !== selectedPrompt._id).map((rec, idx) => (
                                    <div
                                        key={rec._id}
                                        onClick={() => handleSelectPrompt(rec)}
                                        className="group flex gap-5 cursor-pointer"
                                    >
                                        <div className="w-24 h-24 flex-shrink-0 bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 silent-transition group-hover:scale-95">
                                            {rec.image && <img src={rec.image} alt={rec.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 silent-transition" />}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center">
                                            <h4 className="text-xs font-bold text-foreground/60 leading-tight mb-2 group-hover:text-foreground silent-transition">{rec.title}</h4>
                                            <span className="text-[9px] font-bold text-muted/20 uppercase tracking-widest">{rec.aiModel?.split(' ')[0]}</span>
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
