import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, X, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Masonry from 'react-masonry-css';
import { fetchPrompts, fetchCategories, fetchEngines, fetchPromptById } from '../api/apiConfig';

const Home = () => {
    const [suggestions, setSuggestions] = useState([]);

    // Fetch initial metadata
    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const cats = await fetchCategories();
                const engs = await fetchEngines();
                if (Array.isArray(cats)) setCategories(cats);
                if (Array.isArray(engs)) setEngines(engs);
            } catch (error) {
                console.error("Metadata fetch error:", error);
                // Fallback categories if API fails
                setCategories([{ id: 'default', name: 'Art' }, { id: 'default2', name: 'Realism' }]);
            }
        };
        loadMetadata();
    }, []);

    // ... (keep previous search/user effects)

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
                setSuggestions(sugResult.prompts.filter(p => p.id !== (prompt._id || prompt.id)));
            }
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
            await updateDoc(userRef, { likes: isLiked ? arrayRemove(id) : arrayUnion(id) });
        } catch (e) {
            setLikedPrompts(likedPrompts);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const breakpointColumns = { default: 4, 1400: 3, 1000: 2, 640: 1 };

    // Get up to 6 images for the hero carousel (more to ensure fill)
    const heroImages = prompts.filter(p => p.image).slice(0, 6);
    // Triple for seamless infinite scroll
    const carouselImages = heroImages.length > 0
        ? [...heroImages, ...heroImages, ...heroImages]
        : [];

    return (
        <div className="bg-background min-h-screen hero-gradient selection:bg-accent selection:text-white">
            <div className="grainy-overlay" />

            {/* ── Hero Section ── */}
            <header className="pt-24 sm:pt-32 pb-4 sm:pb-8 px-6 text-center max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 leading-[1.05] tracking-tighter text-white">
                        Create Stunning Images<br />
                        with Just a <span className="font-light italic">Prompt</span>
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
            <section className="relative z-10 py-6 sm:py-10 overflow-hidden">
                {carouselImages.length > 0 ? (
                    <>
                        <div className="absolute inset-y-0 left-0 w-20 sm:w-32 bg-gradient-to-r from-black to-transparent z-20 pointer-events-none" />
                        <div className="absolute inset-y-0 right-0 w-20 sm:w-32 bg-gradient-to-l from-black to-transparent z-20 pointer-events-none" />
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
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />
                                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{img.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-40 flex items-center justify-center opacity-10">
                        <p className="text-[10px] font-black uppercase tracking-[1em]">Scanning Frequency...</p>
                    </div>
                )}
            </section>

            {/* ── Main Content ── */}
            <main id="grid-start" className="page-container relative z-10 !pt-4">

                {/* Filter Chips */}
                <div className="sticky top-20 z-[40] bg-black/80 backdrop-blur-2xl py-4 -mx-6 md:-mx-12 px-6 md:px-12 mb-8 border-b border-white/5 space-y-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1" style={{ flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                            <button
                                onClick={() => navigate('/')}
                                className={`glass-tag flex-shrink-0 ${activeChip === "All" ? 'glass-tag-active' : ''}`}
                            >
                                All Prompts
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-1 flex-shrink-0 hidden md:block" />
                            {categories.map((cat) => (
                                <button
                                    key={cat.id || cat._id}
                                    onClick={() => navigate(`/?chip=${encodeURIComponent(cat.name)}`)}
                                    className={`glass-tag flex-shrink-0 ${activeChip === cat.name ? 'glass-tag-active' : ''}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>

                        {engines.length > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 rounded-full border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 whitespace-nowrap">Engine Core:</span>
                                {engines.slice(0, 5).map(e => (
                                    <button
                                        key={e.id || e._id}
                                        onClick={() => navigate(`/?chip=${encodeURIComponent(e.name)}`)}
                                        className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeChip === e.name ? 'bg-accent text-black scale-105' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                                    >
                                        {e.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Grid */}
                {loading && pageNumber === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2">
                        {[1, 2, 3, 4, 8].map(i => (
                            <div key={i} className="aspect-[4/5] bg-neutral-900/40 rounded-[2rem] border border-white/5 shadow-2xl" />
                        ))}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="text-center py-40 border border-white/5 rounded-[3rem] bg-white/[0.01] mx-4">
                        <p className="text-white/10 font-black uppercase tracking-[0.5em] text-[10px]">No intelligence found in this sector</p>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointColumns}
                        className="my-masonry-grid px-2"
                        columnClassName="my-masonry-grid_column"
                    >
                        {prompts.map((item, index) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                key={item.id || item._id}
                                ref={prompts.length === index + 1 ? lastPromptRef : null}
                                onClick={() => handleSelectPrompt(item)}
                                className="group cursor-pointer mb-6"
                            >
                                <div className="glass-card !rounded-[2.5rem] hover:translate-y-[-8px] shadow-2xl shadow-black/40">
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-neutral-950 text-white/5 text-[10px] font-black uppercase tracking-widest italic">No Visual Signal</div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                                            <div className="flex items-center gap-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleLike(item.id || item._id); }}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all ${likedPrompts.includes(item.id || item._id) ? 'bg-accent border-accent text-white scale-110' : 'text-white'}`}
                                                >
                                                    <Heart size={18} fill={likedPrompts.includes(item.id || item._id) ? "currentColor" : "none"} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(item.prompt_text || item.promptText, item.id || item._id); }}
                                                    className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20 hover:bg-white hover:text-black transition-all text-white"
                                                >
                                                    {copiedId === (item.id || item._id) ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent/60">{item.category}</span>
                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">{item.ai_model || item.aiModel}</span>
                                        </div>
                                        <h3 className="text-base font-black text-white/90 leading-tight tracking-tight line-clamp-2 uppercase italic">
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
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl overflow-y-auto no-scrollbar"
                    >
                        <div className="min-h-screen py-6 sm:py-12 px-4 md:px-10 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="w-full max-w-7xl bg-neutral-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative"
                            >
                                <button
                                    onClick={() => setSelectedPrompt(null)}
                                    className="absolute top-6 right-6 z-20 p-3 bg-black/60 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all backdrop-blur-md border border-white/5"
                                >
                                    <X size={20} />
                                </button>

                                <div className="flex flex-col lg:row">
                                    <div className="flex flex-col lg:flex-row w-full">
                                        {/* Image Content */}
                                        <div className="w-full lg:w-[60%] bg-black flex items-center justify-center p-4 sm:p-10 lg:p-16 border-b lg:border-b-0 lg:border-r border-white/5 min-h-[400px]">
                                            {selectedPrompt.image ? (
                                                <div className="relative group">
                                                    <img src={selectedPrompt.image} className="max-w-full h-auto max-h-[75vh] rounded-3xl shadow-2xl" alt={selectedPrompt.title} />
                                                    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10 shadow-inner" />
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-square max-w-md flex flex-col items-center justify-center bg-neutral-950 rounded-[3rem] text-white/5 border border-white/5">
                                                    <LayoutGrid size={48} className="mb-4 opacity-20" />
                                                    <span className="text-[10px] font-black uppercase tracking-[1em]">No Visual</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta Content */}
                                        <div className="flex-1 p-8 sm:p-12 lg:p-16 flex flex-col bg-neutral-900/50">
                                            <div className="mb-12">
                                                <div className="flex items-center gap-4 mb-8">
                                                    <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20">{selectedPrompt.category}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{selectedPrompt.ai_model || selectedPrompt.aiModel}</span>
                                                </div>
                                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-[0.95] mb-8 uppercase italic transition-all">
                                                    {selectedPrompt.title}
                                                </h2>
                                                <p className="text-white/40 text-[11px] sm:text-xs font-bold uppercase tracking-widest leading-loose max-w-lg mb-12">
                                                    {selectedPrompt.description || "Experimental intelligence parameters synthesized for professional visual environments."}
                                                </p>
                                            </div>

                                            <div className="mt-auto space-y-8">
                                                <div className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                                        <Copy size={20} className="text-white" />
                                                    </div>
                                                    <p className="text-sm sm:text-base text-white/90 leading-relaxed font-medium italic mb-10 select-all pr-4">
                                                        "{selectedPrompt.prompt_text || selectedPrompt.promptText}"
                                                    </p>
                                                    <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">Core Logic</span>
                                                        <button
                                                            onClick={() => copyToClipboard(selectedPrompt.prompt_text || selectedPrompt.promptText, selectedPrompt.id || selectedPrompt._id)}
                                                            className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5"
                                                        >
                                                            {copiedId === (selectedPrompt.id || selectedPrompt._id) ? <Check size={14} /> : <Copy size={14} />}
                                                            {copiedId === (selectedPrompt.id || selectedPrompt._id) ? 'Optimized' : 'Copy Prompt'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleLike(selectedPrompt.id || selectedPrompt._id)}
                                                    className={`w-full flex items-center justify-center gap-3 py-5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${likedPrompts.includes(selectedPrompt.id || selectedPrompt._id) ? 'bg-accent border-accent text-black scale-102' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white hover:bg-white/[0.08]'}`}
                                                >
                                                    <Heart size={18} fill={likedPrompts.includes(selectedPrompt.id || selectedPrompt._id) ? "currentColor" : "none"} />
                                                    {likedPrompts.includes(selectedPrompt.id || selectedPrompt._id) ? 'Pinned to Collection' : 'Pin to Collection'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── YouTube-style Suggestions Section ── */}
                                    <div className="w-full p-8 sm:p-12 lg:p-16 border-t border-white/5 bg-black/20">
                                        <div className="flex items-center justify-between mb-10 px-2">
                                            <h4 className="text-lg font-black uppercase italic tracking-tighter text-white/80">Related <span className="text-accent/60">Intelligence</span></h4>
                                            <div className="w-20 h-px bg-white/5 hidden md:block" />
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                            {suggestions.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleSelectPrompt(p)}
                                                    className="group text-left space-y-4"
                                                >
                                                    <div className="aspect-[4/5] bg-neutral-900 rounded-3xl overflow-hidden border border-white/5 group-hover:border-accent/30 transition-all shadow-xl">
                                                        {p.image ? (
                                                            <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt="" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/10 uppercase tracking-widest">No Meta</div>
                                                        )}
                                                    </div>
                                                    <div className="px-1">
                                                        <p className="text-[10px] font-black text-white/80 line-clamp-2 uppercase italic leading-tight group-hover:text-accent transition-colors">{p.title}</p>
                                                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-2">{p.category}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {suggestions.length === 0 && (
                                                <div className="col-span-full py-10 text-center opacity-10">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">Calculating Similar Signals...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
                {fetchingDetails && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center"
                    >
                        <div className="premium-loader mb-10" />
                        <span className="text-[11px] font-black uppercase tracking-[0.8em] text-accent animate-pulse">Synchronizing Data...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
