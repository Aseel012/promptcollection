import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Categories from './pages/Categories';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-white">
          <div className="grainy-overlay" />

          <Navbar toggleSidebar={() => setIsSidebarOpen(true)} />

          <div className="flex flex-1 pt-20 relative z-10">
            <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

            <main className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </main>
          </div>

          <footer className="py-20 border-t border-white/5 mt-auto relative z-10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-0 opacity-30 hover:opacity-100 transition-opacity duration-700">
                <span className="text-white text-sm font-bold tracking-tight">Prompt</span>
                <span className="text-accent text-sm font-bold tracking-tight">Collection</span>
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10">
                &copy; {new Date().getFullYear()} Precision Intelligence. All Rights Reserved.
              </p>

              <div className="flex gap-8 opacity-20">
                <a href="#" className="text-[9px] font-black uppercase tracking-widest hover:text-accent transition-colors">Twitter</a>
                <a href="#" className="text-[9px] font-black uppercase tracking-widest hover:text-accent transition-colors">Discord</a>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
