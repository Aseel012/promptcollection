import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Signup with", name, email, password);
        // Redirect to login for now
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 bg-white border border-border rounded-2xl shadow-sm"
            >
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-serif mb-2">Create Account</h2>
                    <p className="text-muted">Join the professional prompt collection.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/10"
                            placeholder="Aseel"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/10"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-foreground/10"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="w-full py-4 btn btn-primary flex items-center justify-center space-x-2">
                        <UserPlus size={20} />
                        <span>Create Account</span>
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-border text-center">
                    <p className="text-sm text-muted">
                        Already have an account? <Link to="/login" className="text-foreground font-semibold">Login</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
