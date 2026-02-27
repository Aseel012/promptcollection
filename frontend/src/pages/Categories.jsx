import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid, Search } from 'lucide-react';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            // Load from cache for "instant" feel
            const cached = localStorage.getItem('cache_categories');
            if (cached) setCategories(JSON.parse(cached));

            try {
                const response = await fetch(API_ENDPOINTS.CATEGORIES);
                const data = await response.json();

                if (Array.isArray(data)) {
                    setCategories(data);
                    localStorage.setItem('cache_categories', JSON.stringify(data));
                } else {
                    console.error("Categories API returned non-array data:", data);
                    if (!cached) setCategories([]);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                if (!cached) setCategories([]);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleCategoryClick = (category) => {
        navigate(`/?chip=${category}`);
    };


    return (
        <div className="pb-20 w-full max-w-[2000px] mx-auto">
            <div className="mb-10 lg:mb-16">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter uppercase italic">
                    Categories
                </h1>
                <p className="text-zinc-500 text-base md:text-lg font-medium max-w-2xl leading-relaxed">
                    Explore curated collections of the world's most creative AI prompts.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse bg-zinc-900 rounded-[2rem] h-64 md:h-80" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-24 bg-zinc-900/50 rounded-[3rem] border border-white/5 backdrop-blur-3xl">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutGrid className="text-zinc-600" size={32} />
                    </div>
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Library Empty</p>
                    <p className="text-xs text-zinc-600 mt-2 font-medium italic">Initialize categories via Admin Terminal</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((cat, i) => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05, type: 'spring', damping: 25 }}
                            onClick={() => handleCategoryClick(cat.name)}
                            className="group relative bg-[#151515] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden cursor-pointer border border-white/5 hover:border-white/20 transition-all shadow-2xl min-h-[16rem]"
                        >
                            <div className="absolute inset-0 z-0">
                                <img src={cat.image} alt="" className="w-full h-full object-cover opacity-50 md:opacity-40 group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            </div>

                            <div className="relative z-10 h-full p-6 md:p-8 flex flex-col justify-end min-h-[16rem]">
                                <div className="flex items-end justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter truncate uppercase mb-1">
                                            {cat.name}
                                        </h3>
                                        <p className="text-[11px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest opacity-80 truncate">
                                            {cat.description || 'Verified Collection'}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-500 shadow-xl">
                                        <ChevronRight size={24} />
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
