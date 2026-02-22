import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, X, Upload, Check, AlertCircle,
    LayoutGrid, Database, Cpu, Image as ImageIcon, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ENDPOINTS, API_BASE_URL } from '../api/apiConfig';

const FALLBACK_ENGINES = ["Midjourney", "DALL-E 3", "Stable Diffusion XL", "Leonardo AI", "Freepik", "Gemini"];

const Admin = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [prompts, setPrompts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [engines, setEngines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('prompts');
    const [dbHealth, setDbHealth] = useState(null);
    const [error, setError] = useState(null);

    // Prompt form
    const [isAddingPrompt, setIsAddingPrompt] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState(null); // holds prompt object for edit
    const [previewImage, setPreviewImage] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', promptText: '', aiModel: '', category: '', image: '', tags: ''
    });

    // Category form
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [catPreviewImage, setCatPreviewImage] = useState(null);
    const [categoryData, setCategoryData] = useState({ name: '', image: '', description: '' });

    // Engine form
    const [isAddingEngine, setIsAddingEngine] = useState(false);
    const [editingEngine, setEditingEngine] = useState(null);
    const [engineData, setEngineData] = useState({ name: '', description: '', website: '', icon: '', isActive: true });

    useEffect(() => {
        if (!user || user.email !== 'shaikhmdaseel@gmail.com') {
            navigate('/');
        } else {
            fetchData();
        }
    }, [user, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            setError(null);
            const healthRes = await fetch(API_ENDPOINTS.HEALTH).catch(() => null);
            if (healthRes && healthRes.ok) {
                const healthData = await healthRes.json();
                setDbHealth(healthData);
            } else {
                setDbHealth({ db: 'OFFLINE' });
            }

            const [promptRes, catRes, engRes] = await Promise.all([
                fetch(API_ENDPOINTS.PROMPTS),
                fetch(API_ENDPOINTS.CATEGORIES),
                fetch(API_ENDPOINTS.ENGINES),
            ]);

            if (promptRes.ok) {
                const promptData = await promptRes.json();
                setPrompts(Array.isArray(promptData) ? promptData : []);
            }
            if (catRes.ok) {
                const catData = await catRes.json();
                const validCats = Array.isArray(catData) ? catData : [];
                setCategories(validCats);
                if (validCats.length > 0 && !formData.category) {
                    setFormData(prev => ({ ...prev, category: validCats[0].name }));
                }
            }
            if (engRes.ok) {
                const engData = await engRes.json();
                setEngines(Array.isArray(engData) ? engData : []);
            }
        } catch (error) {
            console.error("Critical Sync Failure:", error);
            setError("Database Uplink Failed. Ensure backend is active and MongoDB is whitelisted.");
            setDbHealth({ db: 'OFFLINE' });
            setPrompts([]);
            setCategories([]);
            setEngines([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'prompt') {
                    setPreviewImage(reader.result);
                    setFormData({ ...formData, image: reader.result });
                } else {
                    setCatPreviewImage(reader.result);
                    setCategoryData({ ...categoryData, image: reader.result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // ── Prompt CRUD ──────────────────────────────────────────────
    const openAddPrompt = () => {
        setEditingPrompt(null);
        setFormData({ title: '', description: '', promptText: '', aiModel: engines[0]?.name || FALLBACK_ENGINES[0], category: categories[0]?.name || '', image: '', tags: '' });
        setPreviewImage(null);
        setIsAddingPrompt(true);
    };

    const openEditPrompt = (p) => {
        setEditingPrompt(p);
        setFormData({
            title: p.title, description: p.description, promptText: p.promptText,
            aiModel: p.aiModel, category: p.category, image: p.image, tags: (p.tags || []).join(', ')
        });
        setPreviewImage(p.image || null);
        setIsAddingPrompt(true);
    };

    const handleSavePrompt = async (e) => {
        e.preventDefault();
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const cat = formData.category || categories[0]?.name;
            if (!cat) { alert("Please create a category first!"); setActionLoading(false); return; }

            const method = editingPrompt ? 'PUT' : 'POST';
            const url = editingPrompt
                ? `${API_ENDPOINTS.PROMPTS}/${editingPrompt._id}`
                : API_ENDPOINTS.PROMPTS;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MASTER_STUDIO_BYPASS' },
                body: JSON.stringify({ ...formData, category: cat, user: user.uid })
            });
            if (response.ok) {
                await fetchData();
                setIsAddingPrompt(false);
                setEditingPrompt(null);
                setPreviewImage(null);
            } else {
                const data = await response.json();
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Upload Failed: Connection Timeout / Buffer Error.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Category CRUD ─────────────────────────────────────────────
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.CATEGORIES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MASTER_STUDIO_BYPASS' },
                body: JSON.stringify(categoryData)
            });
            if (response.ok) {
                await fetchData();
                setIsAddingCategory(false);
                setCategoryData({ name: '', image: '', description: '' });
                setCatPreviewImage(null);
            } else {
                const data = await response.json();
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Category Creation Failed: Network Timeout.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Engine CRUD ───────────────────────────────────────────────
    const openAddEngine = () => {
        setEditingEngine(null);
        setEngineData({ name: '', description: '', website: '', icon: '', isActive: true });
        setIsAddingEngine(true);
    };

    const openEditEngine = (eng) => {
        setEditingEngine(eng);
        setEngineData({ name: eng.name, description: eng.description || '', website: eng.website || '', icon: eng.icon || '', isActive: eng.isActive });
        setIsAddingEngine(true);
    };

    const handleSaveEngine = async (e) => {
        e.preventDefault();
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const method = editingEngine ? 'PUT' : 'POST';
            const url = editingEngine
                ? `${API_ENDPOINTS.ENGINES}/${editingEngine._id}`
                : API_ENDPOINTS.ENGINES;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer MASTER_STUDIO_BYPASS' },
                body: JSON.stringify(engineData)
            });
            if (response.ok) {
                await fetchData();
                setIsAddingEngine(false);
                setEditingEngine(null);
                setEngineData({ name: '', description: '', website: '', icon: '', isActive: true });
            } else {
                const data = await response.json();
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Engine Save Failed: Network issue.");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Universal Delete ──────────────────────────────────────────
    const handleDelete = async (id, type) => {
        if (window.confirm(`Delete this ${type}?`)) {
            try {
                await fetch(`${API_BASE_URL}/api/${type}s/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer MASTER_STUDIO_BYPASS' }
                });
                fetchData();
            } catch (error) {
                console.error("Deletion Error:", error);
            }
        }
    };

    if (!user || user.email !== 'shaikhmdaseel@gmail.com') return null;

    const engineList = engines.length > 0 ? engines.map(e => e.name) : FALLBACK_ENGINES;
    const tabs = [
        { id: 'prompts', label: 'Prompts Library', icon: <ImageIcon size={14} /> },
        { id: 'categories', label: 'Categories Hub', icon: <LayoutGrid size={14} /> },
        { id: 'engines', label: 'Engines Terminal', icon: <Cpu size={14} /> },
    ];

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4">
            {/* Header */}
            <div className="flex flex-col gap-6 mb-10 py-10 border-b border-white/5">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 italic">Creator Terminal</h1>
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 border border-white/5 px-3 py-1 rounded-full uppercase">{user.email}</span>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${dbHealth?.db === 'CONNECTED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                                <Database size={12} /> {dbHealth?.db || 'OFFLINE'}
                            </div>
                            <button onClick={fetchData} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors">
                                <RefreshCw size={11} /> Refresh
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full lg:w-auto flex-wrap">
                        {activeTab === 'prompts' && (
                            <button onClick={openAddPrompt} className="flex-1 lg:flex-none px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-3xl hover:scale-105 transition-all shadow-xl shadow-white/5">
                                <Plus size={16} className="inline mr-2" /> Add Prompt
                            </button>
                        )}
                        {activeTab === 'categories' && (
                            <button onClick={() => setIsAddingCategory(true)} className="flex-1 lg:flex-none px-6 py-4 bg-zinc-800 text-white font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-zinc-700 transition-all border border-white/5">
                                <LayoutGrid size={16} className="inline mr-2" /> New Category
                            </button>
                        )}
                        {activeTab === 'engines' && (
                            <button onClick={openAddEngine} className="flex-1 lg:flex-none px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-3xl hover:scale-105 transition-all shadow-xl shadow-white/5">
                                <Cpu size={16} className="inline mr-2" /> New Engine
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-400 text-sm font-bold uppercase tracking-tight">
                        <AlertCircle size={24} />
                        <span>{error}</span>
                        <button onClick={fetchData} className="ml-auto underline">Try Reconnect</button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-8 mb-10 border-b border-white/10 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-white text-white' : 'border-transparent text-zinc-600 hover:text-white'}`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="w-full">
                {/* ── Prompts Tab ── */}
                {activeTab === 'prompts' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {loading && prompts.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-zinc-600 font-black uppercase tracking-widest">Accessing Database DataStream...</div>
                        ) : prompts.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-zinc-900/50 rounded-[3rem] border border-white/5">
                                <ImageIcon size={64} className="mx-auto mb-6 text-zinc-800" />
                                <p className="text-zinc-500 font-black uppercase tracking-widest">The Library is Empty</p>
                            </div>
                        ) : (
                            prompts.map(p => (
                                <div key={p._id} className="group relative bg-zinc-900/40 border border-white/5 p-4 rounded-[2.5rem] transition-all hover:bg-zinc-900/60 shadow-lg">
                                    <div className="aspect-video rounded-[2rem] overflow-hidden mb-5 ring-1 ring-white/10 shadow-inner bg-black">
                                        <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={p.title} />
                                    </div>
                                    <div className="px-2">
                                        <h3 className="font-bold text-white text-base truncate mb-1">{p.title}</h3>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic truncate">{p.category} · {p.aiModel}</p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditPrompt(p)} className="p-2 text-zinc-400 hover:text-blue-400 transition-colors"><Edit size={15} /></button>
                                                <button onClick={() => handleDelete(p._id, 'prompt')} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── Categories Tab ── */}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {categories.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-zinc-900/50 rounded-[3rem] border border-white/5">
                                <LayoutGrid size={64} className="mx-auto mb-6 text-zinc-800" />
                                <p className="text-zinc-500 font-black uppercase tracking-widest">No Categories Yet</p>
                            </div>
                        ) : categories.map(cat => (
                            <div key={cat._id} className="p-6 bg-zinc-900/40 border border-white/5 rounded-[3rem] flex items-center gap-6 group hover:bg-zinc-900 transition-all">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden flex-shrink-0 ring-1 ring-white/10">
                                    <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black uppercase tracking-tighter text-2xl truncate italic mb-1">{cat.name}</h3>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest opacity-60">
                                        {(prompts || []).filter(p => p.category === cat.name).length} Assets
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(cat._id, 'category')} className="opacity-0 group-hover:opacity-100 p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Engines Tab ── */}
                {activeTab === 'engines' && (
                    <div>
                        {/* Info banner */}
                        <div className="mb-8 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm text-zinc-400 flex items-start gap-3">
                            <Cpu size={18} className="text-zinc-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-zinc-300 mb-0.5">AI Engine Management</p>
                                <p className="text-xs">Engines define the AI models available on the platform. Adding engines here makes them appear as filter chips on the homepage and in the prompt creation form.</p>
                                {engines.length === 0 && <p className="text-xs text-amber-400 mt-1">⚡ No engines in database — using built-in defaults. Add engines to override.</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {engines.length === 0 ? (
                                // Show fallback static engines with note
                                FALLBACK_ENGINES.map(name => (
                                    <div key={name} className="p-5 bg-zinc-900/30 border border-dashed border-white/10 rounded-[2.5rem] flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                            <Cpu size={20} className="text-zinc-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-zinc-300">{name}</p>
                                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Default · Not in DB</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                engines.map(eng => (
                                    <div key={eng._id} className="group p-5 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] flex items-center gap-4 hover:bg-zinc-900 transition-all">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 text-xl overflow-hidden ring-1 ring-white/10">
                                            {eng.icon ? (
                                                eng.icon.startsWith('http') ? (
                                                    <img src={eng.icon} className="w-full h-full object-cover" alt={eng.name} />
                                                ) : <span>{eng.icon}</span>
                                            ) : <Cpu size={20} className="text-zinc-500" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-white truncate">{eng.name}</p>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase ${eng.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                                    {eng.isActive ? 'Active' : 'Off'}
                                                </span>
                                            </div>
                                            {eng.description && <p className="text-xs text-zinc-500 truncate mt-0.5">{eng.description}</p>}
                                            {eng.website && <a href={eng.website} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline truncate block mt-0.5">{eng.website}</a>}
                                        </div>
                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditEngine(eng)} className="p-2 text-zinc-400 hover:text-blue-400 transition-colors"><Edit size={15} /></button>
                                            <button onClick={() => handleDelete(eng._id, 'engine')} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════════════ MODALS ═══════════════════════ */}
            <AnimatePresence>
                {/* Add/Edit Prompt Modal */}
                {isAddingPrompt && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingPrompt(false)} className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
                        <motion.form
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            onSubmit={handleSavePrompt}
                            className="relative w-full max-w-6xl bg-[#0f0f0f] p-8 md:p-14 rounded-[4rem] border border-white/10 overflow-y-auto max-h-[95vh] shadow-[0_0_100px_rgba(255,255,255,0.05)]"
                        >
                            <div className="flex justify-between items-center mb-12">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic">
                                    {editingPrompt ? 'Edit Prompt' : 'Add New Prompt'}
                                </h2>
                                <button type="button" onClick={() => setIsAddingPrompt(false)} className="p-3 hover:bg-zinc-800 rounded-full transition-all"><X size={32} /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                {/* Left: Image */}
                                <div className="space-y-8">
                                    <div className="aspect-video bg-black border border-white/5 rounded-[3rem] relative flex items-center justify-center overflow-hidden shadow-2xl group ring-1 ring-white/10">
                                        {previewImage ? <img src={previewImage} className="w-full h-full object-cover" alt="Preview" /> : <div className="text-center group-hover:scale-110 transition-transform"><Upload className="mx-auto mb-4 text-zinc-800" size={64} /><p className="text-[11px] font-black text-zinc-800 uppercase tracking-[0.3em]">Upload Image</p></div>}
                                        <input type="file" onChange={(e) => handleFileChange(e, 'prompt')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Or paste image URL</p>
                                        <input id="prompt-image-url" name="imageUrl" placeholder="https://..." value={formData.image.startsWith('data:') ? '' : formData.image} onChange={e => setFormData({ ...formData, image: e.target.value, })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem]" />
                                    </div>
                                </div>

                                {/* Right: Fields */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Title</p>
                                        <input id="prompt-title" name="title" required placeholder="E.g. Neon City Skyline" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem] font-bold text-lg" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Category</p>
                                            <select id="prompt-category" name="category" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem] cursor-pointer">
                                                {categories.length === 0 && <option value="">Create Category First...</option>}
                                                {categories.map(c => <option key={c.name} value={c.name} className="bg-zinc-900">{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Engine</p>
                                            <select id="prompt-engine" name="aiModel" value={formData.aiModel} onChange={e => setFormData({ ...formData, aiModel: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem] cursor-pointer">
                                                {engineList.map(m => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Full Prompt Text</p>
                                        <textarea id="prompt-text" name="promptText" required rows={6} placeholder="Describe your prompt in detail..." value={formData.promptText} onChange={e => setFormData({ ...formData, promptText: e.target.value })} className="yt-input w-full bg-black border-white/5 resize-none py-6 rounded-[2rem] text-base leading-relaxed" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Description</p>
                                        <textarea id="prompt-description" name="description" required rows={3} placeholder="Short description of the visual result..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="yt-input w-full bg-black border-white/5 resize-none py-5 rounded-[2rem] text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-6 mt-14">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingPrompt(false)} className="flex-1 py-6 bg-zinc-900 text-zinc-500 font-black uppercase text-xs tracking-widest rounded-[2rem] border border-white/5 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-[2] py-6 bg-white text-black font-black uppercase text-xs tracking-widest rounded-[2rem] hover:bg-zinc-100 transition-all shadow-2xl disabled:opacity-50">
                                    {actionLoading ? 'Saving...' : editingPrompt ? 'Save Changes' : 'Add Prompt'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}

                {/* Add Category Modal */}
                {isAddingCategory && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingCategory(false)} className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
                        <motion.form
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onSubmit={handleCreateCategory}
                            className="relative w-full max-w-xl bg-[#0f0f0f] p-12 rounded-[4rem] border border-white/10"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-4xl font-black uppercase tracking-tighter">New Category</h2>
                                <button type="button" onClick={() => setIsAddingCategory(false)} className="p-3 hover:bg-zinc-800 rounded-full transition-all"><X size={28} /></button>
                            </div>
                            <div className="space-y-8">
                                <div className="aspect-square w-40 mx-auto bg-black border border-white/5 rounded-[3rem] relative flex items-center justify-center overflow-hidden shadow-2xl group ring-1 ring-white/10">
                                    {catPreviewImage ? <img src={catPreviewImage} className="w-full h-full object-cover" alt="Preview" /> : <Plus size={64} className="text-zinc-800 group-hover:scale-110 transition-transform" />}
                                    <input type="file" onChange={(e) => handleFileChange(e, 'category')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Category Name</p>
                                    <input id="cat-name" name="name" required placeholder="E.g. Minimalist" value={categoryData.name} onChange={e => setCategoryData({ ...categoryData, name: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem] font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Description</p>
                                    <input id="cat-description" name="description" placeholder="Style descriptor..." value={categoryData.description} onChange={e => setCategoryData({ ...categoryData, description: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem]" />
                                </div>
                            </div>
                            <div className="flex gap-6 mt-12">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingCategory(false)} className="flex-1 py-6 bg-zinc-900 text-zinc-500 font-black uppercase text-xs tracking-widest rounded-[2rem] border border-white/5 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-6 bg-white text-black font-black uppercase text-xs tracking-widest rounded-[2rem] hover:bg-zinc-100 shadow-2xl disabled:opacity-50">
                                    {actionLoading ? 'Creating...' : 'Create Category'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}

                {/* Add/Edit Engine Modal */}
                {isAddingEngine && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingEngine(false)} className="absolute inset-0 bg-black/98 backdrop-blur-xl" />
                        <motion.form
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onSubmit={handleSaveEngine}
                            className="relative w-full max-w-xl bg-[#0f0f0f] p-12 rounded-[4rem] border border-white/10 overflow-y-auto max-h-[95vh]"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-4xl font-black uppercase tracking-tighter">
                                    {editingEngine ? 'Edit Engine' : 'New Engine'}
                                </h2>
                                <button type="button" onClick={() => setIsAddingEngine(false)} className="p-3 hover:bg-zinc-800 rounded-full transition-all"><X size={28} /></button>
                            </div>

                            <div className="space-y-8">
                                {/* Icon preview */}
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl overflow-hidden ring-1 ring-white/10">
                                        {engineData.icon ? (
                                            engineData.icon.startsWith('http') ? (
                                                <img src={engineData.icon} className="w-full h-full object-cover" alt="icon" />
                                            ) : <span>{engineData.icon}</span>
                                        ) : <Cpu size={28} className="text-zinc-600" />}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Engine Name <span className="text-red-500">*</span></p>
                                    <input id="engine-name" name="name" required placeholder="E.g. Midjourney" value={engineData.name} onChange={e => setEngineData({ ...engineData, name: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem] font-bold text-lg" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Icon (emoji or image URL)</p>
                                    <input id="engine-icon" name="icon" placeholder="🎨 or https://..." value={engineData.icon} onChange={e => setEngineData({ ...engineData, icon: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem]" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Description</p>
                                    <input id="engine-description" name="description" placeholder="Brief description of this AI model..." value={engineData.description} onChange={e => setEngineData({ ...engineData, description: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem]" />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Website URL</p>
                                    <input id="engine-website" name="website" placeholder="https://midjourney.com" value={engineData.website} onChange={e => setEngineData({ ...engineData, website: e.target.value })} className="yt-input w-full bg-black border-white/5 py-6 rounded-[2rem]" />
                                </div>
                                <label className="flex items-center gap-4 cursor-pointer px-2 py-3 rounded-2xl bg-zinc-900/50 border border-white/5">
                                    <div className={`w-12 h-6 rounded-full transition-all relative ${engineData.isActive ? 'bg-green-500' : 'bg-zinc-700'}`} onClick={() => setEngineData({ ...engineData, isActive: !engineData.isActive })}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${engineData.isActive ? 'left-7' : 'left-1'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Active Status</p>
                                        <p className="text-xs text-zinc-500">{engineData.isActive ? 'Visible on homepage chips' : 'Hidden from users'}</p>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-6 mt-12">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingEngine(false)} className="flex-1 py-6 bg-zinc-900 text-zinc-500 font-black uppercase text-xs tracking-widest rounded-[2rem] border border-white/5 disabled:opacity-50">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-6 bg-white text-black font-black uppercase text-xs tracking-widest rounded-[2rem] hover:bg-zinc-100 shadow-2xl disabled:opacity-50">
                                    {actionLoading ? 'Saving...' : editingEngine ? 'Save Changes' : 'Add Engine'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Admin;
