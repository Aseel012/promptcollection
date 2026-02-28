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
        <div className="pb-20 w-full max-w-[2000px] mx-auto">
            <div className="mb-10 lg:mb-16">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight uppercase">
                    Collections
                </h1>
                <p className="text-muted text-sm md:text-base max-w-2xl leading-relaxed uppercase tracking-widest font-semibold opacity-60">
                    Explore curated categories of the world's most creative AI prompts.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse glass-card h-64 md:h-72" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-24 glass-card">
                    <div className="w-16 h-16 bg-cardHighlight rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutGrid className="text-muted" size={32} />
                    </div>
                    <p className="text-muted font-bold uppercase tracking-widest text-sm">Library Empty</p>
                    <p className="text-xs text-muted/60 mt-2 font-medium">Initialize categories via Admin Terminal</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, type: 'spring', damping: 25 }}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="glass-card group relative overflow-hidden cursor-pointer min-h-[14rem] md:min-h-[16rem] bg-card flex flex-col justify-end p-6 md:p-8"
                        >
                            <div className="relative z-10 w-full">
                                <div className="flex items-end justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight uppercase mb-2 group-hover:underline underline-offset-4 decoration-1">
                                            {cat.name}
                                        </h3>
                                        <p className="text-xs font-semibold text-muted uppercase tracking-tight line-clamp-2 leading-relaxed opacity-60">
                                            {cat.description || 'Verified Collection'}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-foreground text-background flex items-center justify-center group-hover:bg-white/90 transition-all duration-300 shadow-xl">
                                        <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Categories;
