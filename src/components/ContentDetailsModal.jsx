import React, { useState } from 'react';
import { X, Play, Plus, ThumbsUp, Volume2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ContentDetailsModal = ({ content, onClose, onPlay }) => {
    if (!content) return null;

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md overflow-y-auto w-full h-full"
            onClick={onClose}
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            {/* Modal Container */}
            <motion.div
                className="relative w-full max-w-6xl bg-[#141414] rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10 my-12 mx-4"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
            >

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-[#181818] rounded-full text-white transition-all ring-1 ring-white/20 group"
                >
                    <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>

                {/* Hero / Backdrop Section */}
                <div className="relative h-[50vh] min-h-[400px] w-full group">
                    <img
                        src={content.backdrop || content.poster}
                        alt={content.title}
                        className="w-full h-full object-cover"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>

                    {/* Content Meta over Hero */}
                    <div className="absolute bottom-10 left-8 right-8">
                        <h1 className="text-5xl font-extrabold text-white drop-shadow-xl mb-4 leading-tight">
                            {content.title}
                        </h1>

                        <div className="flex items-center gap-4 mb-6">
                            {/* Play Button - Dynamic based on Type */}
                            <button
                                onClick={() => {
                                    if (content.type === 'movie') {
                                        onPlay(content.videoUrl, "Movie");
                                    } else if (content.episodes && content.episodes.length > 0) {
                                        // Play Ep 1
                                        onPlay(content.episodes[0].url, `S1 E${content.episodes[0].number || 1}`);
                                    }
                                }}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-200 transition-colors"
                            >
                                <Play fill="black" size={24} />
                                {content.type === 'movie' ? 'Play' : 'Play S1 E1'}
                            </button>

                            <button className="p-3 border-2 border-gray-500 rounded-full text-gray-300 hover:border-white hover:text-white transition-all" title="Add to My List">
                                <Plus size={20} />
                            </button>
                            <button className="p-3 border-2 border-gray-500 rounded-full text-gray-300 hover:border-white hover:text-white transition-all" title="Like">
                                <ThumbsUp size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Details Body */}
                <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Col: Info & Episodes */}
                    <div className="col-span-2 space-y-6">

                        {/* Meta Data Row */}
                        <div className="flex items-center gap-4 text-green-400 font-bold">
                            <span>XX% Match</span>
                            <span className="text-gray-400 font-normal">2023</span>
                            <span className="border border-gray-500 px-1 text-xs text-gray-400 rounded">HD</span>
                        </div>

                        {/* Description */}
                        <p className="text-white text-lg leading-relaxed text-gray-100">
                            {content.description || "No description available. Enter a plot summary in the admin panel to see it here."}
                        </p>

                        {/* EPISODES LIST (Series Only) */}
                        {content.type === 'series' && content.episodes && (
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4 border-b border-white/20 pb-2">
                                    <h3 className="text-xl font-bold text-white">Episodes</h3>
                                    <span className="text-sm text-gray-400 font-mono">Season 1</span>
                                </div>

                                <div className="space-y-1">
                                    {content.episodes.map((ep, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => onPlay(ep.url, `Episode ${ep.number || idx + 1}`)}
                                            className="flex items-center p-4 hover:bg-[#333] rounded-lg cursor-pointer transition-colors group border-b border-white/5 last:border-0"
                                        >
                                            <span className="text-gray-400 font-mono text-xl w-8 group-hover:text-white">{ep.number || idx + 1}</span>

                                            <div className="ml-4 flex-1">
                                                {/* Placeholder Thumbnail for Episode */}
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-32 aspect-video bg-gray-800 rounded-md overflow-hidden flex-shrink-0 group-hover:ring-2 ring-white/50">
                                                        <img src={content.backdrop} className="w-full h-full object-cover opacity-60" alt={`Episode ${idx + 1}`} />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Play fill="white" size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-base mb-1">Episode {ep.number || idx + 1}</h4>
                                                        <p className="text-gray-400 text-sm line-clamp-2 w-full">
                                                            Episode description placeholder...
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-gray-400 text-sm">45m</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Col: Extra Info */}
                    <div className="col-span-1 space-y-4 text-sm text-gray-400 mt-1">
                        <div>
                            <span className="text-gray-500">Cast:</span> <span className="text-white hover:underline cursor-pointer">Coming Soon</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Genres:</span> <span className="text-white hover:underline cursor-pointer">{content.category}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">This show is:</span> <span className="text-white hover:underline cursor-pointer">Exciting, Dark</span>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default ContentDetailsModal;
