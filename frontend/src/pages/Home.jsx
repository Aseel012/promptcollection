import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, X, Heart, ArrowRight, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Masonry from 'react-masonry-css';
import { fetchPrompts, fetchCategories, fetchEngines, fetchPromptById } from '../api/apiConfig';

const Home = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Core State
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
    const [showJoinedToast, setShowJoinedToast] = useState(false);

    const observer = useRef();
    const watchContainerRef = useRef(null);

    // ── Data Fetching ──────────────────────────────────────────

    // Initial metadata (categories/engines)
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const [cats, engs] = await Promise.all([
                    fetchCategories(),
                    fetchEngines(),
                ]);
                if (Array.isArray(cats)) setCategories(cats);
                if (Array.isArray(engs)) setEngines(engs);
            } catch (error) {
                console.error("Error fetching metadata:", error);
                // Fallback
                setCategories([{ _id: '1', name: 'Digital Art' }, { _id: '2', name: 'Photography' }]);
            }
        };
        loadMetadata();
    }, []);

    // Load Liked Prompts & Join Status
    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                try {
                    const docRef = doc(db, "users", user.email);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setLikedPrompts(docSnap.data().likes || []);
                        setIsJoined(docSnap.data().isJoined || false);
                    }
                } catch (e) { console.error("Firebase fetch error", e); }
            };
            fetchUserData();
        }
    }, [user]);

    // Handle URL Params for Category Chips
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const chip = params.get('chip') || params.get('category');
        if (chip) setActiveChip(chip);
        else setActiveChip("All");
    }, [location.search]);

    // Main Prompt Fetching & Infinite Scroll Logic
    useEffect(() => {
        const loadData = async () => {
            if (pageNumber === 1) setLoading(true);
            const params = new URLSearchParams(location.search);
            const searchQuery = params.get('search') || '';

            try {
                let result;
                if (searchQuery) {
                    result = await fetchPrompts({ keyword: searchQuery, pageSize: 20 });
                } else if (activeChip !== "All" && activeChip !== "Recent" && activeChip !== "Liked") {
                    result = await fetchPrompts({ category: activeChip, pageNumber, pageSize: 20, shuffle: true });
                } else {
                    // Default All
                    result = await fetchPrompts({ pageNumber, pageSize: 20, shuffle: true });
                }

                if (result && result.prompts) {
                    setPrompts(prev => pageNumber === 1 ? result.prompts : [...prev, ...result.prompts]);
                    setTotalPages(result.pages || 1);
                }
            } catch (error) {
                console.error("Connection error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [pageNumber, activeChip, location.search]);

    // Intersection Observer for Infinite Scroll
    const lastPromptRef = (node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && pageNumber < totalPages) {
                setPageNumber(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    };

    // ── UI Handlers ─────────────────────────────────────────────

    const handleSelectPrompt = async (prompt) => {
        if (!user) { navigate('/login'); return; }
        setFetchingDetails(true);
        try {
            const [full, sugResult] = await Promise.all([
                fetchPromptById(prompt._id || prompt.id),
                fetchPrompts({ pageSize: 12, shuffle: true })
            ]);
            setSelectedPrompt(full || prompt);
            if (sugResult && sugResult.prompts) {
                setSuggestions(sugResult.prompts.filter(p => (p._id || p.id) !== (prompt._id || prompt.id)));
            }
            if (watchContainerRef.current) watchContainerRef.current.scrollTo(0, 0);
        } catch (e) {
            setSelectedPrompt(prompt);
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleLike = async (id) => {
        if (!user) return;
        const isLiked = likedPrompts.includes(id);
        const newUserLikes = isLiked ? likedPrompts.filter(l => l !== id) : [id, ...likedPrompts];
        setLikedPrompts(newUserLikes);

        try {
            const userRef = doc(db, "users", user.email);
            if (isLiked) {
                await updateDoc(userRef, { likes: arrayRemove(id) });
            } else {
                await setDoc(userRef, { likes: arrayUnion(id) }, { merge: true });
            }
        } catch (e) {
            console.error("Like update failed", e);
            setLikedPrompts(likedPrompts); // Revert
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleJoinHub = async () => {
        if (!user) return;
        const newJoinedState = !isJoined;
        setIsJoined(newJoinedState);
        if (newJoinedState) {
            setShowJoinedToast(true);
            setTimeout(() => setShowJoinedToast(false), 3000);
        }
        try {
            const userRef = doc(db, "users", user.email);
            await setDoc(userRef, { isJoined: newJoinedState }, { merge: true });
        } catch (error) {
            setIsJoined(!newJoinedState);
        }
    };

    // ── Render Helpers ──────────────────────────────────────────

    const breakpointColumns = { default: 4, 1400: 3, 1000: 2, 640: 1 };

    // Hero carousel logic: use top prompts with images
    const heroImages = prompts.filter(p => p.image).slice(0, 6);
    const carouselImages = heroImages.length > 0 ? [...heroImages, ...heroImages, ...heroImages] : [];

    return (
        <div className="bg-background min-h-screen hero-gradient selection:bg-accent selection:text-white">
            <div className="grainy-overlay" />

            {/* Join Hub Notification */}
            {showJoinedToast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] bg-white text-black px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-bounce border border-black/5">
                    <Check size={20} className="text-green-600" />
                    <span className="font-bold text-[11px] uppercase tracking-[0.3em]">Subscribed to Intelligence Hub</span>
                </div>
            )}

            {/* ── Hero Section ── */}
            <header className="pt-24 sm:pt-32 pb-4 sm:pb-8 px-6 text-center max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 leading-[1.05] tracking-tighter text-white">
                        Create Stunning Images<br />
                        with Just a <span className="font-light italic text-accent">Prompt</span>
                    </h1>
                    <p className="text-white/40 text-xs sm:text-sm md:text-base font-medium mb-8 max-w-xl mx-auto leading-relaxed px-4">
                        Turn your ideas into high-quality visuals in seconds. Pure AI Intelligence at your fingertips.
                    </p>
                    <button
                        onClick={() => document.getElementById('grid-start')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group inline-flex items-center gap-3 px-8 py-3.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] text-white hover:bg-white hover:text-black transition-all duration-500 shadow-xl shadow-black/20"
                    >
                        Explore Database
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </header>

            {/* ── 3D Perspective Image Carousel ── */}
            <section className="relative z-10 py-10 overflow-hidden">
                {carouselImages.length > 0 ? (
                    <div className="perspective-carousel relative">
                        <div className="carousel-track">
                            {carouselImages.map((img, i) => (
                                <div
                                    key={`carousel-${i}`}
                                    onClick={() => handleSelectPrompt(img)}
                                    className="carousel-card group"
                                >
                                    <img
                                        src={img.image}
                                        alt={img.title || 'AI Generated'}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{img.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center opacity-10">
                        <p className="text-[10px] font-black uppercase tracking-[1em]">Scanning Frequency...</p>
                    </div>
                )}
            </section>

            {/* ── Main Content Grid ── */}
            <main id="grid-start" className="page-container relative z-10 !pt-4">

                {/* Fixed Filter Bar */}
                <div className="sticky top-20 z-[40] bg-black/80 backdrop-blur-2xl py-4 -mx-6 md:-mx-12 px-6 md:px-12 mb-8 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1" style={{ flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                        <button
                            onClick={() => { setActiveChip("All"); navigate('/'); }}
                            className={`glass-tag flex-shrink-0 ${activeChip === "All" ? 'glass-tag-active' : ''}`}
                        >
                            Indices
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0 hidden md:block" />
                        {categories.map((cat) => (
                            <button
                                key={cat._id || cat.id}
                                onClick={() => { setActiveChip(cat.name); navigate(`/?chip=${encodeURIComponent(cat.name)}`); }}
                                className={`glass-tag flex-shrink-0 ${activeChip === cat.name ? 'glass-tag-active' : ''}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {engines.length > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 rounded-full border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">Cores:</span>
                            {engines.slice(0, 5).map(e => (
                                <button
                                    key={e._id || e.id}
                                    onClick={() => { setActiveChip(e.name); navigate(`/?chip=${encodeURIComponent(e.name)}`); }}
                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeChip === e.name ? 'bg-accent text-white scale-105' : 'text-white/20 hover:text-white'}`}
                                >
                                    {e.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* The Grid */}
                {loading && pageNumber === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-10">
                        {[1, 2, 3, 4, 8].map(i => (
                            <div key={i} className="aspect-[4/5] bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse" />
                        ))}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="text-center py-40 border border-white/5 rounded-[3rem] bg-white/[0.01]">
                        <p className="text-white/10 font-black uppercase tracking-[0.5em] text-[10px]">No intelligence found in this sector</p>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointColumns}
                        className="my-masonry-grid"
                        columnClassName="my-masonry-grid_column"
                    >
                        {prompts.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                key={item._id || item.id}
                                ref={prompts.length === index + 1 ? lastPromptRef : null}
                                onClick={() => handleSelectPrompt(item)}
                                className="group cursor-pointer mb-10"
                            >
                                <div className="glass-card !rounded-[2.5rem] hover:translate-y-[-8px] shadow-2xl">
                                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 silent-transition" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-white/5 text-[10px] font-bold uppercase tracking-widest italic">Signal Missing</div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                                            <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleLike(item._id || item.id); }}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all ${likedPrompts.includes(item._id || item.id) ? 'bg-accent border-accent text-white' : 'text-white'}`}
                                                >
                                                    <Heart size={18} fill={likedPrompts.includes(item._id || item.id) ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.promptText || item.prompt_text, item._id || item.id); }}
                                                    className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all text-white"
                                                >
                                                    {copiedId === (item._id || item.id) ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60">{item.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{item.aiModel?.split(' ')[0]}</span>
                                        </div>
                                        <h3 className="text-sm font-black text-white/90 leading-tight tracking-tight line-clamp-2 uppercase italic">
                                            {item.title}
                                        </h3>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </Masonry>
                )}

                {loading && pageNumber > 1 && (
                    <div className="flex justify-center py-20">
                        <div className="premium-loader" />
                    </div>
                )}
            </main>

            {/* ── Prompt Detail Modal ── */}
            <AnimatePresence>
                {selectedPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl overflow-y-auto no-scrollbar"
                    >
                        <div className="min-h-screen py-10 px-4 md:px-10 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                className="w-full max-w-7xl bg-neutral-900 border border-white/10 rounded-[4rem] overflow-hidden shadow-2xl relative"
                            >
                                <button
                                    onClick={() => setSelectedPrompt(null)}
                                    className="absolute top-8 right-8 z-20 p-4 bg-black/40 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all border border-white/5"
                                >
                                    <X size={24} />
                                </button>

                                <div className="flex flex-col lg:flex-row">
                                    <div className="w-full lg:w-[60%] bg-black flex items-center justify-center p-8 lg:p-20 border-b lg:border-b-0 lg:border-r border-white/5">
                                        {selectedPrompt.image ? (
                                            <img src={selectedPrompt.image} className="max-w-full h-auto max-h-[80vh] rounded-[2rem] shadow-2xl border border-white/5" alt="" />
                                        ) : (
                                            <div className="aspect-square w-full max-w-md bg-neutral-950 rounded-[3rem] border border-white/5 opacity-10 flex items-center justify-center font-black uppercase tracking-[1em]">Void</div>
                                        )}
                                    </div>

                                    <div className="flex-1 p-10 lg:p-16 flex flex-col bg-neutral-900/50">
                                        <div className="mb-12">
                                            <div className="flex items-center gap-4 mb-10">
                                                <span className="px-5 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20">{selectedPrompt.category}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{selectedPrompt.aiModel}</span>
                                            </div>
                                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-10 uppercase italic">
                                                {selectedPrompt.title}
                                            </h2>
                                            <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest leading-loose max-w-lg mb-12">
                                                {selectedPrompt.description || "Intelligence synthesized for professional grade visual processing."}
                                            </p>
                                        </div>

                                        <div className="mt-auto space-y-8">
                                            <div className="p-10 bg-black/40 border border-white/5 rounded-[3rem] relative overflow-hidden group">
                                                <p className="text-base text-white/90 leading-relaxed font-medium italic mb-10 select-all pr-10">
                                                    "{selectedPrompt.promptText || selectedPrompt.prompt_text}"
                                                </p>
                                                <div className="flex items-center justify-between pt-10 border-t border-white/5">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Core Logic</span>
                                                    <button
                                                        onClick={() => copyToClipboard(selectedPrompt.promptText || selectedPrompt.prompt_text, selectedPrompt._id || selectedPrompt.id)}
                                                        className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all transform active:scale-95"
                                                    >
                                                        {copiedId === (selectedPrompt._id || selectedPrompt.id) ? <Check size={14} /> : <Copy size={14} />}
                                                        {copiedId === (selectedPrompt._id || selectedPrompt.id) ? 'Optimized' : 'Copy Prompt'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4 pt-4">
                                                <button
                                                    onClick={() => handleLike(selectedPrompt._id || selectedPrompt.id)}
                                                    className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${likedPrompts.includes(selectedPrompt._id || selectedPrompt.id) ? 'bg-accent border-accent text-white scale-102' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}
                                                >
                                                    <Heart size={18} fill={likedPrompts.includes(selectedPrompt._id || selectedPrompt.id) ? "currentColor" : "none"} />
                                                    {likedPrompts.includes(selectedPrompt._id || selectedPrompt.id) ? 'Pinned' : 'Pin Asset'}
                                                </button>
                                                <button
                                                    onClick={handleJoinHub}
                                                    className={`px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isJoined ? 'bg-white/5 text-white/20 border border-white/5' : 'bg-white text-black hover:bg-accent hover:text-white'}`}
                                                >
                                                    {isJoined ? 'Verified' : 'Initialise Hub'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Related Suggestions */}
                                <div className="w-full p-10 lg:p-16 border-t border-white/5 bg-black/20">
                                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-white/40 mb-10">Related <span className="text-accent/60">Signals</span></h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                                        {suggestions.map((p) => (
                                            <button
                                                key={p._id || p.id}
                                                onClick={() => handleSelectPrompt(p)}
                                                className="group text-left space-y-4"
                                            >
                                                <div className="aspect-[4/5] bg-neutral-900 rounded-[2rem] overflow-hidden border border-white/5 group-hover:border-accent/40 transition-all shadow-xl">
                                                    {p.image ? (
                                                        <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 silent-transition" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/5 uppercase tracking-widest">No Signal</div>
                                                    )}
                                                </div>
                                                <div className="px-1">
                                                    <p className="text-[10px] font-black text-white/80 line-clamp-2 uppercase italic leading-tight group-hover:text-amber-500 transition-colors">{p.title}</p>
                                                    <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-2">{p.category}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fetching Details Overlay */}
            <AnimatePresence>
                {fetchingDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center"
                    >
                        <div className="premium-loader mb-10" />
                        <span className="text-[11px] font-black uppercase tracking-[0.8em] text-accent animate-pulse">Syncing Streams...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
