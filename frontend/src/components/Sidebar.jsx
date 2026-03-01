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
        <div className="py-8 px-5 space-y-10">
            {/* Header for mobile */}
            <div className="flex items-center gap-6 px-2 mb-10 lg:hidden focus:outline-none">
                <button onClick={closeSidebar} className="p-2 hover:bg-white/5 rounded-full silent-transition">
                    <X size={20} className="text-muted/40" />
                </button>
                <Link to="/" className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
                    <span className="text-foreground text-[10px] font-bold uppercase tracking-[0.4em] italic leading-none pt-1">The Hub</span>
                </Link>
            </div>

            {/* Main Nav */}
            <div className="space-y-2">
                <p className="px-4 text-[9px] font-bold text-muted/20 uppercase tracking-[0.3em] mb-4">Core</p>
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                        className={`flex items-center gap-6 px-4 py-3 rounded-2xl silent-transition group ${location.pathname === item.path ? 'bg-white/5 text-foreground' : 'text-muted/40 hover:text-foreground hover:bg-white/[0.02]'}`}
                    >
                        <div className={`silent-transition ${location.pathname === item.path ? 'text-foreground' : 'text-muted/20 group-hover:text-muted/60'}`}>
                            {item.icon}
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Library */}
            <div className="space-y-2">
                <p className="px-4 text-[9px] font-bold text-muted/20 uppercase tracking-[0.3em] mb-4">Intelligence</p>
                <Link
                    to="/?chip=Recent"
                    onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                    className="flex items-center gap-6 px-4 py-3 rounded-2xl silent-transition text-muted/40 hover:text-foreground hover:bg-white/[0.02] group"
                >
                    <Clock size={20} className="text-muted/20 group-hover:text-muted/60 silent-transition" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">Recent Archive</span>
                </Link>
                {user && (
                    <Link
                        to="/?chip=Liked"
                        onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                        className="flex items-center gap-6 px-4 py-3 rounded-2xl silent-transition text-muted/40 hover:text-foreground hover:bg-white/[0.02] group"
                    >
                        <Heart size={20} className="text-muted/20 group-hover:text-muted/60 silent-transition" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Saved Assets</span>
                    </Link>
                )}
            </div>

            {isAdmin && (
                <div className="space-y-2">
                    <p className="px-4 text-[9px] font-bold text-red-500/20 uppercase tracking-[0.3em] mb-4">System</p>
                    <Link
                        to="/admin"
                        onClick={() => { if (window.innerWidth < 1024) closeSidebar(); }}
                        className={`flex items-center gap-6 px-4 py-3 rounded-2xl silent-transition group ${location.pathname === '/admin' ? 'bg-red-500/5 text-red-400' : 'text-muted/40 hover:text-red-400/80 hover:bg-red-500/[0.02]'}`}
                    >
                        <Shield size={20} className="opacity-20" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Terminal</span>
                    </Link>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`fixed left-0 top-14 bottom-0 w-72 bg-background border-r border-white/[0.03] overflow-y-auto no-scrollbar z-40 transition-all duration-700 ease-in-out ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
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
                            className="absolute inset-0 bg-background/60 backdrop-blur-md"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r border-white/5 shadow-2xl overflow-y-auto no-scrollbar"
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
