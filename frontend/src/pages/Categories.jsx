import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { fetchCategories as loadCategories } from '../api/apiConfig';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch categories without needing images
                const cats = await loadCategories();
                setCategories(cats);
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const handleCategoryClick = (category) => {
        navigate(`/?chip=${category}`);
    };

    return (
        <div className="pb-32 w-full max-w-[1600px] mx-auto px-6 lg:px-12 pt-16">
            <div className="mb-20">
                <div className="flex items-center gap-4 mb-8 text-muted/20">
                    <div className="w-12 h-px bg-current" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Collections</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter uppercase italic text-foreground">
                    Categories
                </h1>
                <p className="text-muted text-[11px] leading-relaxed uppercase tracking-[0.3em] font-bold opacity-30 max-w-xl">
                    Curated intelligence domains for high-precision visual generation.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse bg-white/[0.02] border border-white/5 rounded-[3rem] h-80" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-40 border border-white/5 rounded-[4rem] bg-white/[0.01]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 grayscale opacity-20">
                        <LayoutGrid size={32} />
                    </div>
                    <p className="text-muted font-bold uppercase tracking-[0.4em] text-[10px] opacity-20">No active domains</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="group relative overflow-hidden cursor-pointer h-[28rem] rounded-[3rem] bg-neutral-900 border border-white/5 silent-transition hover:border-white/20"
                        >
                            {/* Texture/Image Layer */}
                            {cat.image && (
                                <div className="absolute inset-0 z-0 overflow-hidden">
                                    <img
                                        src={cat.image}
                                        alt=""
                                        className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                                    <div className="absolute inset-0 bg-background/20 group-hover:bg-transparent silent-transition" />
                                </div>
                            )}

                            {/* Content Layer */}
                            <div className="absolute inset-0 z-10 flex flex-col justify-end p-10">
                                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted/40 mb-4 group-hover:text-foreground/40 silent-transition">Verified Model</span>
                                <h3 className="text-3xl font-bold text-foreground tracking-tighter uppercase mb-6 group-hover:italic silent-transition">
                                    {cat.name}
                                </h3>
                                <div className="h-px w-0 group-hover:w-full bg-white/10 silent-transition mb-6" />
                                <p className="text-[10px] font-bold text-muted/30 uppercase tracking-widest line-clamp-2 leading-loose group-hover:text-muted/60 silent-transition">
                                    {cat.description || 'Intelligence parameters optimized for production.'}
                                </p>
                            </div>

                            {/* Action Icon */}
                            <div className="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 silent-transition transform translate-y-4 group-hover:translate-y-0">
                                <ChevronRight size={20} className="text-white" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Categories;
