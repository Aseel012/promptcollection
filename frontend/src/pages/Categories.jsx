import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid, Sparkles } from 'lucide-react';
import { fetchCategories as loadCategories } from '../api/apiConfig';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const init = async () => {
            try {
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
        <div className="bg-background min-h-screen selection:bg-accent selection:text-white pb-32">
            <div className="grainy-overlay" />

            <header className="pt-32 pb-20 px-6 max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                        <Sparkles size={14} className="text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Knowledge Domains</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter uppercase italic">
                        Explore <span className="text-accent text-glow">Collections</span>
                    </h1>
                    <p className="text-white/30 text-xs md:text-sm font-bold uppercase tracking-[0.4em] max-w-xl leading-loose">
                        High-precision intelligence domains curated for professional visual output.
                    </p>
                </motion.div>
            </header>

            <main className="max-w-7xl mx-auto px-6 relative z-10">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="animate-pulse bg-neutral-900/40 border border-white/5 rounded-[3rem] h-96" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-40 border border-white/5 rounded-[4rem] bg-white/[0.01]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 grayscale opacity-20">
                            <LayoutGrid size={32} />
                        </div>
                        <p className="text-white/20 font-black uppercase tracking-[0.5em] text-[10px]">No active signals in this frequency</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((cat, i) => (
                            <motion.div
                                key={cat._id || cat.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.8 }}
                                onClick={() => handleCategoryClick(cat.name)}
                                className="group relative overflow-hidden cursor-pointer h-[32rem] rounded-[3.5rem] bg-neutral-900 border border-white/5 hover:border-accent/40 transition-all duration-700"
                            >
                                {/* Texture/Image Layer */}
                                {cat.image ? (
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={cat.image}
                                            alt=""
                                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-[2s] ease-out grayscale group-hover:grayscale-0"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 z-0 bg-neutral-950 flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white/5 uppercase tracking-[1em] -rotate-90">No Visual</span>
                                    </div>
                                )}

                                {/* Content Layer */}
                                <div className="absolute inset-0 z-10 flex flex-col justify-end p-12">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="w-8 h-px bg-accent/40 group-hover:w-16 transition-all duration-700" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent/60 group-hover:text-accent transition-colors">Domain Verified</span>
                                    </div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic group-hover:translate-x-2 transition-transform duration-700">
                                        {cat.name}
                                    </h3>
                                    <p className="mt-8 text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] leading-loose max-w-xs group-hover:text-white/60 transition-colors duration-700">
                                        {cat.description || 'Intelligence parameters optimized for professional production environments.'}
                                    </p>
                                </div>

                                {/* Action Icon */}
                                <div className="absolute top-12 right-12 w-14 h-14 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 transform translate-y-8 group-hover:translate-y-0 shadow-2xl">
                                    <ChevronRight size={24} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Categories;
