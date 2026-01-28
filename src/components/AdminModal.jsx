import React, { useState, useEffect } from 'react';
import { X, Save, Film, Tv, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { ref, push, set, update } from 'firebase/database';
import { db } from '../firebase';

const AdminModal = ({ onClose, initialData = null }) => {
    const [type, setType] = useState(initialData?.type || 'movie');

    // Initialize form with existing data or defaults
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        poster: initialData?.poster || '',
        backdrop: initialData?.backdrop || '',
        videoUrl: initialData?.videoUrl || '', // For movies
        episodes: initialData?.episodes || [{ url: '', number: 1 }], // For series
        category: initialData?.category || 'Trending'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update form when initialData changes (e.g. switching between edit items)
    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                poster: initialData.poster || '',
                backdrop: initialData.backdrop || '',
                videoUrl: initialData.videoUrl || '',
                episodes: initialData.episodes || [{ url: '', number: 1 }],
                category: initialData.category || 'Trending'
            });
            setType(initialData.type || 'movie');
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (initialData?.id) {
                // UPDATE existing content
                const contentRef = ref(db, `content/${initialData.id}`);
                await update(contentRef, {
                    ...formData,
                    type,
                    lastUpdated: Date.now()
                });
                alert('Content updated successfully!');
            } else {
                // CREATE new content
                const newContentRef = push(ref(db, 'content'));
                await set(newContentRef, {
                    ...formData,
                    type,
                    timestamp: Date.now()
                });
                alert('Content added successfully!');
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to save content.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-8 mt-4">
                        {initialData ? 'Edit Content' : 'Add New Content'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Content Type Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-lg w-fit">
                        <button
                            type="button"
                            onClick={() => setType('movie')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${type === 'movie' ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Movie
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('series')}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${type === 'series' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            Series
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div className="group relative">
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                                placeholder="e.g. Inception"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Description / Plot</label>
                            <textarea
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all h-24 resize-none"
                                placeholder="Write a short summary for the Hero section..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-2">
                                    <ImageIcon size={12} /> Poster URL (Vertical)
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.poster}
                                    onChange={(e) => setFormData({ ...formData, poster: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-2">
                                    <ImageIcon size={12} /> Backdrop URL (Horizontal)
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.backdrop}
                                    onChange={(e) => setFormData({ ...formData, backdrop: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* Video / Episode Input Logic */}
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-2">
                                <LinkIcon size={12} /> {type === 'movie' ? 'Video URL' : 'Episodes'}
                            </label>

                            {type === 'movie' ? (
                                <input
                                    type="url"
                                    required
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all font-mono text-sm"
                                    placeholder="https://stream.url/movie.mp4"
                                />
                            ) : (
                                <div className="space-y-3 bg-black/30 p-4 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                    {(formData.episodes || [{ url: '' }]).map((ep, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <span className="text-gray-500 text-sm w-8 font-mono">#{idx + 1}</span>
                                            <input
                                                type="url"
                                                value={ep.url}
                                                onChange={(e) => {
                                                    const newEpisodes = [...(formData.episodes || [{ url: '' }])];
                                                    newEpisodes[idx] = { ...newEpisodes[idx], url: e.target.value, number: idx + 1 };
                                                    setFormData({ ...formData, episodes: newEpisodes });
                                                }}
                                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none font-mono text-sm"
                                                placeholder={`Episode ${idx + 1} link`}
                                            />
                                            {idx > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newEpisodes = formData.episodes.filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, episodes: newEpisodes });
                                                    }}
                                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            episodes: [...(formData.episodes || [{ url: '' }]), { url: '' }]
                                        })}
                                        className="text-xs flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider mt-2 ml-10"
                                    >
                                        <div className="bg-cyan-400/20 p-1 rounded-full"><X className="rotate-45" size={12} /></div>
                                        Add Episode {(formData.episodes?.length || 1) + 1}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Category / List</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none"
                            >
                                <option>Trending</option>
                                <option>Must Watch</option>
                                <option>Romance</option>
                                <option>Sci-Fi</option>
                                <option>Comedy</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Saving...' : <><Save size={20} /> Add to Library</>}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default AdminModal;
