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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
          <Navbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

          <div className="flex flex-1 pt-14">
            <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

            <main className={`flex-1 transition-all duration-300 w-full ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
              <div className="p-4 md:p-6 lg:p-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </div>
            </main>
          </div>

          <footer className="py-10 border-t border-zinc-800 mt-auto text-center w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              &copy; {new Date().getFullYear()} PROMPTCOLLECTION.
            </p>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
