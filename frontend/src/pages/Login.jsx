import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        try {
            const user = await loginWithGoogle();
            // Unified redirect: If admin, Terminal. Else Home.
            if (user.email === 'shaikhmdaseel@gmail.com') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Studio Auth Error:", error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 font-brand selection:bg-accent selection:text-background">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent blur-[200px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-studio blur-[150px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="w-full max-w-lg p-12 md:p-20 bg-background border border-white/5 relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
                <div className="mb-24">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-8 h-px bg-accent/30" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Security Gate</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold lowercase tracking-tighter mb-8 leading-none">
                        Identity <br />
                        Required.
                    </h2>
                    <p className="text-muted text-[11px] uppercase tracking-widest opacity-40 leading-relaxed">
                        Access to the intelligence terminal requires verified station authorization.
                    </p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="group w-full py-6 bg-foreground text-background flex items-center justify-between px-8 hover:bg-accent hover:text-background transition-all duration-700"
                    >
                        <div className="flex items-center space-x-4">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 brightness-0" />
                            <span className="font-black text-[11px] uppercase tracking-widest">Initialise Authorisation</span>
                        </div>
                        <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-2 transition-transform" />
                    </button>

                    <p className="text-center text-[8px] font-black uppercase tracking-[0.5em] text-white/5 pt-12">
                        PC.STUDIO / SECURE NODE 01
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
