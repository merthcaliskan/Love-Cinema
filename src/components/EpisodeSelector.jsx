import React from 'react';
import { X, PlayCircle } from 'lucide-react';

const EpisodeSelector = ({ series, onClose, onPlayEpisode }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-gray-900 w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

                {/* Header with Backdrop */}
                <div className="relative h-40">
                    <img src={series.backdrop} alt={series.title} className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                        <h2 className="text-3xl font-bold text-white drop-shadow-lg">{series.title}</h2>
                        <span className="text-purple-400 text-sm font-medium tracking-wider uppercase">Select Episode</span>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Episodes List */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
                    {(!series.episodes || series.episodes.length === 0) ? (
                        <p className="text-gray-500 text-center">No episodes available.</p>
                    ) : (
                        series.episodes.map((ep, idx) => (
                            <button
                                key={idx}
                                onClick={() => onPlayEpisode(ep.url)}
                                className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/50 p-4 rounded-xl flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold font-mono group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                        {ep.number || idx + 1}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-white font-medium group-hover:text-purple-300 transition-colors">Episode {ep.number || idx + 1}</h3>
                                        <span className="text-xs text-gray-500">Ready to play</span>
                                    </div>
                                </div>
                                <PlayCircle className="text-gray-500 group-hover:text-white transition-colors" size={24} />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default EpisodeSelector;
