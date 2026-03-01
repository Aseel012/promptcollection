import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, X, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, closeSidebar }) => {
    const location = useLocation();
    const { user, logout } = useAuth();
    const isAdmin = user?.email === 'shaikhmdaseel@gmail.com';

    const menuItems = [
        { icon: <Home size={22} />, label: 'Home', path: '/' },
        { icon: <LayoutGrid size={22} />, label: 'Categories', path: '/categories' },
    ];

    const SidebarContent = () => (
        <div className="py-12 px-8 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-16">
                <Link to="/" onClick={closeSidebar} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                        <span className="text-black font-black text-xs italic">P</span>
                    </div>
                    <span className="text-white text-sm font-black uppercase tracking-[0.3em]">Collection</span>
                </Link>
                <button onClick={closeSidebar} className="p-2 bg-white/5 rounded-full text-white/40">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <div className="space-y-4 flex-1">
                <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mb-8">Navigation</p>
                {menuItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        onClick={closeSidebar}
                        className={`flex items-center gap-6 p-6 rounded-[2rem] silent-transition group ${location.pathname === item.path ? 'bg-accent text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                    >
                        <div className="transition-transform group-active:scale-90">
                            {item.icon}
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{item.label}</span>
                    </Link>
                ))}
            </div>

            {/* Footer / Auth */}
            {user && (
                <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
                    {isAdmin && (
                        <Link
                            to="/admin"
                            onClick={closeSidebar}
                            className="flex items-center gap-6 p-6 rounded-[2rem] text-white/40 hover:text-white hover:bg-white/5 silent-transition"
                        >
                            <Shield size={22} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Terminal</span>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] lg:hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeSidebar}
                        className="absolute inset-0 bg-black/80 backdrop-blur-3xl"
                    />
                    <motion.aside
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 40, stiffness: 400 }}
                        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-black border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-y-auto no-scrollbar"
                    >
                        <SidebarContent />
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Sidebar;
