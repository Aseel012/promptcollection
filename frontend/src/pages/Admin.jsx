import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, X, Upload, Check, AlertCircle,
    LayoutGrid, Database, Cpu, Image as ImageIcon, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    fetchPrompts, fetchCategories as apiFetchCategories, fetchEngines as apiFetchEngines,
    createPrompt, updatePrompt, deletePrompt as apiDeletePrompt,
    createCategory, deleteCategory as apiDeleteCategory,
    createEngine, deleteEngine as apiDeleteEngine,
    INSFORGE_HEADERS, API_BASE_URL,
} from '../api/apiConfig';

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
    const [promptImageFile, setPromptImageFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '', description: '', promptText: '', aiModel: '', category: '', image: '', tags: ''
    });

    // Category form
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [catPreviewImage, setCatPreviewImage] = useState(null);
    const [catImageFile, setCatImageFile] = useState(null);
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
            setDbHealth({ db: 'CONNECTED' }); // InsForge is always connected

            const [promptResult, cats, engs] = await Promise.all([
                fetchPrompts({ pageSize: 1000, shuffle: false }),
                apiFetchCategories(),
                apiFetchEngines(),
            ]);

            setPrompts(promptResult.prompts || []);
            setCategories(cats || []);
            if (cats.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: cats[0].name }));
            }
            setEngines(engs || []);
        } catch (error) {
            console.error("Critical Sync Failure:", error);
            setError(`DATABASE UPLINK FAILED: ${error.message}`);
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
                    setPromptImageFile(file);
                } else {
                    setCatPreviewImage(reader.result);
                    setCatImageFile(file);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadImageToFirebase = async (file, pathPrefix) => {
        if (!file) return null;
        const filename = `${pathPrefix}_${Date.now()}_${file.name}`;
        const storageRef = ref(storage, `uploads/${filename}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
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

            let finalImageUrl = formData.image;
            if (promptImageFile) {
                finalImageUrl = await uploadImageToFirebase(promptImageFile, 'prompt');
            }

            const promptPayload = {
                title: formData.title,
                description: formData.description,
                promptText: formData.promptText,
                aiModel: formData.aiModel,
                category: cat,
                image: finalImageUrl,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
                userId: user.uid,
            };

            if (editingPrompt) {
                await updatePrompt(editingPrompt._id, promptPayload);
            } else {
                await createPrompt(promptPayload);
            }

            await fetchData();
            setIsAddingPrompt(false);
            setEditingPrompt(null);
            setPreviewImage(null);
            setPromptImageFile(null);
            setFormData(prev => ({ ...prev, image: '' }));
        } catch (error) {
            alert("Upload Failed: " + error.message);
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
            let finalImageUrl = categoryData.image;
            if (catImageFile) {
                finalImageUrl = await uploadImageToFirebase(catImageFile, 'category');
            }

            await createCategory({ ...categoryData, image: finalImageUrl });
            await fetchData();
            setIsAddingCategory(false);
            setCategoryData({ name: '', image: '', description: '' });
            setCatPreviewImage(null);
            setCatImageFile(null);
        } catch (error) {
            alert("Category Creation Failed: " + error.message);
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
            if (editingEngine) {
                // For engines, just create a new one (PostgREST upsert)
                await createEngine(engineData);
            } else {
                await createEngine(engineData);
            }
            await fetchData();
            setIsAddingEngine(false);
            setEditingEngine(null);
            setEngineData({ name: '', description: '', website: '', icon: '', isActive: true });
        } catch (error) {
            alert("Engine Save Failed: " + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    // ── Universal Delete ──────────────────────────────────────────
    const handleDelete = async (id, type) => {
        if (window.confirm(`Delete this ${type}?`)) {
            try {
                if (type === 'prompt') await apiDeletePrompt(id);
                else if (type === 'category') await apiDeleteCategory(id);
                else if (type === 'engine') await apiDeleteEngine(id);
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
        <div className="page-container font-sans">
            {/* Header */}
            <div className="flex flex-col gap-10 mb-16 pb-16 border-b border-white/[0.03]">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                    <div>
                        <div className="flex items-center gap-3 mb-6 text-muted/20">
                            <div className="w-8 h-px bg-current" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em]">System Node</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter italic text-foreground mb-4">Terminal</h1>
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-[9px] font-bold text-muted/40 border border-white/5 px-4 py-1.5 rounded-full uppercase tracking-widest bg-white/[0.01]">{user.email}</span>
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${dbHealth?.db === 'CONNECTED' ? 'bg-white/5 text-foreground/60' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
                                <Database size={10} /> {dbHealth?.db || 'OFFLINE'}
                            </div>
                            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/5 text-muted/40 hover:text-foreground silent-transition">
                                <RefreshCw size={10} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 w-full lg:w-auto">
                        {activeTab === 'prompts' && (
                            <button onClick={openAddPrompt} className="styled-button w-full lg:w-auto !py-4 shadow-2xl">
                                <Plus size={14} /> New Asset
                            </button>
                        )}
                        {activeTab === 'categories' && (
                            <button onClick={() => setIsAddingCategory(true)} className="styled-button w-full lg:w-auto !py-4 shadow-2xl">
                                <LayoutGrid size={14} /> New Domain
                            </button>
                        )}
                        {activeTab === 'engines' && (
                            <button onClick={openAddEngine} className="styled-button w-full lg:w-auto !py-4 shadow-2xl">
                                <Cpu size={14} /> New Engine
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] flex items-center gap-6 text-red-400 text-[11px] font-bold uppercase tracking-widest">
                        <AlertCircle size={20} className="opacity-50" />
                        <span>{error}</span>
                        <button onClick={fetchData} className="ml-auto underline decoration-dotted underline-offset-4">Retry Sync</button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-12 mb-16 border-b border-white/[0.03] overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 pb-6 text-[11px] font-bold uppercase tracking-[0.2em] silent-transition relative ${activeTab === tab.id ? 'text-foreground' : 'text-muted/20 hover:text-muted/60'}`}
                    >
                        {tab.icon} {tab.label}
                        {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="w-full">
                {/* ── Prompts Tab ── */}
                {activeTab === 'prompts' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
                        {loading && prompts.length === 0 ? (
                            <div className="col-span-full py-40 text-center text-muted/10 font-bold uppercase tracking-[0.4em] text-[10px]">Syncing Data Stream...</div>
                        ) : prompts.length === 0 ? (
                            <div className="col-span-full py-40 text-center border border-white/5 rounded-[4rem] bg-white/[0.01]">
                                <ImageIcon size={48} className="mx-auto mb-8 opacity-10" />
                                <p className="text-muted/20 font-bold uppercase tracking-[0.4em] text-[10px]">Archive Empty</p>
                            </div>
                        ) : (
                            prompts.map(p => (
                                <div key={p._id} className="group relative bg-white/[0.01] border border-white/5 p-4 rounded-[2.5rem] silent-transition hover:border-white/10 hover:bg-white/[0.02]">
                                    <div className="rounded-[2rem] overflow-hidden mb-6 bg-neutral-900 border border-white/5 aspect-[4/3] relative">
                                        <img src={p.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 silent-transition" alt={p.title} />
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 silent-transition transform translate-y-2 group-hover:translate-y-0">
                                            <button onClick={() => openEditPrompt(p)} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white/40 hover:text-white silent-transition border border-white/5"><Edit size={14} /></button>
                                            <button onClick={() => handleDelete(p._id, 'prompt')} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-red-400/40 hover:text-red-400 silent-transition border border-white/5"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                    <div className="px-3">
                                        <h3 className="font-bold text-foreground/80 text-sm truncate mb-2 group-hover:text-foreground silent-transition">{p.title}</h3>
                                        <p className="text-[9px] text-muted/20 font-bold uppercase tracking-widest">{p.category} // {p.aiModel?.split(' ')[0]}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── Categories Tab ── */}
                {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map(cat => (
                            <div key={cat._id} className="p-8 bg-white/[0.01] border border-white/5 rounded-[3rem] flex items-center gap-8 group hover:border-white/10 silent-transition">
                                <div className="w-24 h-24 rounded-[2rem] overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5">
                                    <img src={cat.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 silent-transition" alt={cat.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold uppercase tracking-tighter text-2xl truncate mb-2 text-foreground/60 group-hover:text-foreground silent-transition">{cat.name}</h3>
                                    <p className="text-[10px] text-muted/20 font-bold uppercase tracking-[0.2em]">
                                        {prompts.filter(p => p.category === cat.name).length} Nodes
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(cat._id, 'category')} className="opacity-0 group-hover:opacity-100 p-4 bg-red-500/5 text-red-400/40 hover:text-red-400 rounded-full silent-transition"><Trash2 size={18} /></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Engines Tab ── */}
                {activeTab === 'engines' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {engines.map(eng => (
                            <div key={eng._id} className="group p-8 bg-white/[0.01] border border-white/5 rounded-[3rem] flex items-center gap-6 hover:border-white/10 silent-transition">
                                <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:border-white/20 silent-transition">
                                    {eng.icon ? (
                                        eng.icon.startsWith('http') ? <img src={eng.icon} className="w-full h-full object-cover rounded-full opacity-40 group-hover:opacity-100 silent-transition" alt="" /> : <span className="text-xl grayscale opacity-40 group-hover:opacity-100 silent-transition">{eng.icon}</span>
                                    ) : <Cpu size={20} className="text-muted/20" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="font-bold text-foreground/60 group-hover:text-foreground silent-transition text-sm">{eng.name}</p>
                                        <div className={`w-1 h-1 rounded-full ${eng.isActive ? 'bg-green-500' : 'bg-muted/20'}`} />
                                    </div>
                                    <p className="text-[9px] text-muted/20 font-bold uppercase tracking-widest truncate">{eng.isActive ? 'Synchronized' : 'Offline'}</p>
                                </div>
                                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 silent-transition">
                                    <button onClick={() => openEditEngine(eng)} className="p-2 text-muted/40 hover:text-foreground silent-transition"><Edit size={14} /></button>
                                    <button onClick={() => handleDelete(eng._id, 'engine')} className="p-2 text-red-400/40 hover:text-red-400 silent-transition"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Add/Edit Prompt Modal */}
                {isAddingPrompt && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingPrompt(false)} className="absolute inset-0 bg-background/98 backdrop-blur-3xl" />
                        <motion.form
                            initial={{ y: 50, opacity: 0, scale: 0.98 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 50, opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            onSubmit={handleSavePrompt}
                            className="relative w-full max-w-5xl bg-card p-12 md:p-20 rounded-[4rem] border border-white/5 overflow-y-auto max-h-[90vh] no-scrollbar shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-16">
                                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-foreground">
                                    {editingPrompt ? 'Modify Asset' : 'New Asset'}
                                </h2>
                                <button type="button" onClick={() => setIsAddingPrompt(false)} className="p-4 hover:bg-white/5 rounded-full silent-transition border border-white/5 text-muted/40 hover:text-foreground"><X size={24} /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                <div className="space-y-10">
                                    <div className="aspect-video bg-neutral-950 border border-white/5 rounded-[3rem] relative flex items-center justify-center overflow-hidden group">
                                        {previewImage ? <img src={previewImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 silent-transition" alt="" /> : <div className="text-center opacity-10 group-hover:opacity-20 silent-transition"><Upload className="mx-auto mb-4" size={48} /><p className="text-[10px] font-bold uppercase tracking-[0.3em]">Initialize Visual</p></div>}
                                        <input type="file" onChange={(e) => handleFileChange(e, 'prompt')} className="absolute inset-0 opacity-0 cursor-pointer" title="." />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Remote Visual URI</p>
                                        <input placeholder="https://external-asset.cdn" value={formData.image.startsWith('data:') ? '' : formData.image} onChange={e => setFormData({ ...formData, image: e.target.value, })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Identification</p>
                                        <input required placeholder="Asset Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8 text-lg font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Domain</p>
                                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8 appearance-none cursor-pointer">
                                                {categories.map(c => <option key={c.name} value={c.name} className="bg-neutral-900">{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Intelligence</p>
                                            <select value={formData.aiModel} onChange={e => setFormData({ ...formData, aiModel: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8 appearance-none cursor-pointer">
                                                {engineList.map(m => <option key={m} value={m} className="bg-neutral-900">{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Neural Parameters (Prompt)</p>
                                        <textarea required rows={5} placeholder="Input coordinates..." value={formData.promptText} onChange={e => setFormData({ ...formData, promptText: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8 resize-none font-mono" />
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Operational Context</p>
                                        <textarea required rows={2} placeholder="Brief description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8 resize-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-8 mt-20">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingPrompt(false)} className="styled-button-outline flex-1 !p-6 !rounded-[2.5rem]">Abort</button>
                                <button type="submit" disabled={actionLoading} className="styled-button flex-[2] !p-6 !rounded-[2.5rem] shadow-2xl">
                                    {actionLoading ? 'Synchronizing...' : (editingPrompt ? 'Update Node' : 'Initialize Node')}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}

                {/* Add Category Modal */}
                {isAddingCategory && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingCategory(false)} className="absolute inset-0 bg-background/98 backdrop-blur-3xl" />
                        <motion.form
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onSubmit={handleCreateCategory}
                            className="relative w-full max-w-xl bg-card p-16 rounded-[4rem] border border-white/5 shadow-2xl"
                        >
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-12 text-center text-foreground">New Domain</h2>
                            <div className="space-y-10">
                                <div className="aspect-square w-32 mx-auto bg-neutral-950 border border-white/5 rounded-[2.5rem] relative flex items-center justify-center overflow-hidden group">
                                    {catPreviewImage ? <img src={catPreviewImage} className="w-full h-full object-cover opacity-60" alt="" /> : <Plus size={32} className="opacity-10 group-hover:opacity-30 silent-transition" />}
                                    <input type="file" onChange={(e) => handleFileChange(e, 'category')} className="absolute inset-0 opacity-0 cursor-pointer" title="." />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Identifier</p>
                                    <input required placeholder="Domain Name" value={categoryData.name} onChange={e => setCategoryData({ ...categoryData, name: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Descriptor</p>
                                    <input placeholder="System parameters..." value={categoryData.description} onChange={e => setCategoryData({ ...categoryData, description: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                            </div>
                            <div className="flex gap-6 mt-16">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingCategory(false)} className="styled-button-outline flex-1 !rounded-[2rem]">Abort</button>
                                <button type="submit" disabled={actionLoading} className="styled-button flex-1 !rounded-[2rem] shadow-xl">
                                    {actionLoading ? 'Initializing...' : 'Authorize'}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}

                {/* Add/Edit Engine Modal */}
                {isAddingEngine && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingEngine(false)} className="absolute inset-0 bg-background/98 backdrop-blur-3xl" />
                        <motion.form
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onSubmit={handleSaveEngine}
                            className="relative w-full max-w-xl bg-card p-16 rounded-[4rem] border border-white/5 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar"
                        >
                            <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-12 text-center text-foreground">
                                {editingEngine ? 'Modify Engine' : 'New Engine'}
                            </h2>
                            <div className="space-y-8">
                                <div className="flex justify-center mb-10">
                                    <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-3xl overflow-hidden ring-1 ring-white/10 relative group">
                                        {engineData.icon ? (
                                            engineData.icon.startsWith('http') ? <img src={engineData.icon} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 silent-transition" alt="" /> : <span className="opacity-60 group-hover:opacity-100 silent-transition">{engineData.icon}</span>
                                        ) : <Cpu size={32} className="text-muted/20" />}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Identifier</p>
                                    <input required placeholder="Engine Name" value={engineData.name} onChange={e => setEngineData({ ...engineData, name: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Aesthetic / Icon URL</p>
                                    <input placeholder="🎨 or https://..." value={engineData.icon} onChange={e => setEngineData({ ...engineData, icon: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Descriptor</p>
                                    <input placeholder="Core parameters..." value={engineData.description} onChange={e => setEngineData({ ...engineData, description: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-muted/20 uppercase tracking-widest px-4">Domain URI</p>
                                    <input placeholder="https://api.engine.io" value={engineData.website} onChange={e => setEngineData({ ...engineData, website: e.target.value })} className="styled-input !bg-white/[0.01] !rounded-[2rem] !py-6 !px-8" />
                                </div>
                                <div className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-[2rem] silent-transition group hover:border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${engineData.isActive ? 'bg-green-500' : 'bg-muted/10'}`} />
                                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted/40 group-hover:text-muted/80 silent-transition">Active Synchronization</p>
                                    </div>
                                    <button type="button" onClick={() => setEngineData({ ...engineData, isActive: !engineData.isActive })} className={`w-12 h-6 rounded-full silent-transition relative ${engineData.isActive ? 'bg-green-500' : 'bg-white/10'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full silent-transition ${engineData.isActive ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-6 mt-16">
                                <button type="button" disabled={actionLoading} onClick={() => setIsAddingEngine(false)} className="styled-button-outline flex-1 !rounded-[2rem]">Abort</button>
                                <button type="submit" disabled={actionLoading} className="styled-button flex-1 !rounded-[2rem] shadow-xl">
                                    {actionLoading ? 'Initializing...' : 'Authorize'}
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
