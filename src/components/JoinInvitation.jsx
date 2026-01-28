import React from 'react';
import { Play, X, Film } from 'lucide-react';

const JoinInvitation = ({ title, episodeTitle, startedBy, onJoin, onIgnore }) => {
    return (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[60] animate-slide-down">
            <div className="bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-6 min-w-[320px] max-w-[90vw]">

                {/* Icon / Avatar Placeholder */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
                    <Film className="text-white" size={20} />
                </div>

                <div className="flex-1">
                    <h3 className="text-white font-bold text-sm">Now Playing</h3>
                    <p className="text-cyan-400 text-xs font-medium uppercase tracking-wider mb-1">
                        {startedBy || 'Someone'} started a session
                    </p>
                    <p className="text-gray-300 text-sm truncate max-w-[200px]">
                        {title}
                    </p>
                    {episodeTitle && (
                        <p className="text-gray-400 text-xs truncate max-w-[200px]">{episodeTitle}</p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onIgnore}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors group"
                        title="Ignore"
                    >
                        <X size={18} className="text-gray-400 group-hover:text-white" />
                    </button>

                    <button
                        onClick={onJoin}
                        className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-xs hover:scale-105 transition-transform"
                    >
                        <Play size={12} fill="currentColor" />
                        JOIN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinInvitation;
