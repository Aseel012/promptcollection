import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Clock, Heart, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const location = useLocation();
    const { user } = useAuth();
    const isAdmin = user?.email === 'shaikhmdaseel@gmail.com';

    const menuItems = [
        { icon: <Home size={20} />, label: 'Home', path: '/' },
        { icon: <LayoutGrid size={20} />, label: 'Categories', path: '/categories' },
    ];

    const SidebarContent = () => (
        <div className="py-4 px-3 space-y-6">
            {/* Header for mobile */}
            <div className="flex items-center gap-4 px-3 mb-6 lg:hidden">
                <button onClick={closeSidebar} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <X size={24} />
                </button>
                <span className="font-black text-xl uppercase tracking-tighter">Promptcollection<span className="text-red-600">.</span></span>
            </div>

            {/* Main Nav */}
            <div className="space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                        className={`flex items-center gap-5 px-3 py-2.5 rounded-xl transition-all ${location.pathname === item.path ? 'bg-zinc-800 text-white font-medium' : 'hover:bg-zinc-800/70 text-zinc-400 hover:text-white'}`}
                    >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="h-px bg-white/5 mx-2" />

            {/* Library — navigates to Home with chip active via URL param */}
            <div className="space-y-1">
                <p className="px-3 text-xs font-medium text-zinc-600 uppercase tracking-widest mb-2">Library</p>
                <Link
                    to="/?chip=Recent"
                    onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                    className="flex items-center gap-5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/70 text-zinc-400 hover:text-white transition-all"
                >
                    <Clock size={20} />
                    <span className="text-sm">Recent</span>
                </Link>
                {user && (
                    <Link
                        to="/?chip=Liked"
                        onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                        className="flex items-center gap-5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/70 text-zinc-400 hover:text-white transition-all"
                    >
                        <Heart size={20} />
                        <span className="text-sm">Liked</span>
                    </Link>
                )}
            </div>

            {isAdmin && (
                <>
                    <div className="h-px bg-white/5 mx-2" />
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-medium text-red-500/50 uppercase tracking-widest mb-2">Internal</p>
                        <Link
                            to="/admin"
                            onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                            className={`flex items-center gap-5 px-3 py-2.5 rounded-xl transition-all ${location.pathname === '/admin' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'}`}
                        >
                            <Shield size={20} />
                            <span className="text-sm">Terminal</span>
                        </Link>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`fixed left-0 top-14 bottom-0 w-64 bg-[#0f0f0f] border-r border-white/5 overflow-y-auto z-40 transition-transform duration-300 transform hidden lg:block ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeSidebar}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-72 bg-[#0f0f0f] shadow-2xl overflow-y-auto"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
