import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Sparkles } from 'lucide-react';

const Login = () => {
    const { loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const user = await loginWithGoogle();
            if (user.email === 'shaikhmdaseel@gmail.com') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Auth Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md w-full"
            >
                <div className="glass-card p-12 md:p-16 text-center bg-card shadow-2xl shadow-black/50 border-white/5">
                    <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-10 ring-1 ring-white/10">
                        <Sparkles className="text-white opacity-40" size={28} />
                    </div>

                    <h1 className="text-4xl font-bold mb-4 tracking-tighter uppercase italic text-foreground">
                        The Hub
                    </h1>
                    <p className="text-muted text-[10px] mb-12 tracking-[0.2em] uppercase font-bold opacity-40">
                        Initialise Authorisation
                    </p>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-5 bg-foreground text-background font-bold rounded-full hover:bg-neutral-200 silent-transition active:scale-[0.98] flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] shadow-xl"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                        ) : (
                            <>
                                <LogIn size={14} />
                                Sign in with Google
                            </>
                        )}
                    </button>

                    <div className="mt-14 pt-10 border-t border-white/5 flex flex-col gap-6">
                        <div className="flex items-center justify-center gap-3">
                            <ShieldCheck size={14} className="text-muted/30" />
                            <p className="text-[10px] uppercase font-bold text-muted/30 tracking-widest">Secure Node 01</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 text-center text-[9px] text-muted/20 font-bold uppercase tracking-[0.4em]">
                    PC.STUDIO &copy; {new Date().getFullYear()}
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
