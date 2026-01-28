import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Maximize, Minimize, FastForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
};

const PremiumPlayerControls = ({
    isVisible,
    isPlaying,
    onPlayPause,
    onSeek,
    onSeekRw,
    onSeekFf,
    played,
    duration,
    title,
    onBack,
    onNextEpisode,
    hasNextEpisode,
    onPrevEpisode,
    hasPrevEpisode,
    isFullscreen,

    onToggleFullscreen,
    volume,
    onVolumeChange,
    isMuted,
    onToggleMute
}) => {

    return (
        <div className={`absolute inset-0 flex flex-col justify-between p-6 transition-opacity duration-300 ${isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>

            {/* Top Gradient */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-0" />

            {/* Header / Top Bar */}
            <div className="flex items-center justify-between z-20 relative">
                <div onClick={onBack} className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white -ml-0.5">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">{title || "Playing"}</h1>
                </div>
            </div>


            {/* Center Area: Click to Play/Pause - CSS Only, No Framer Motion */}
            <div
                className="absolute inset-0 flex items-center justify-center z-0"
                onClick={onPlayPause}
            >
                {!isPlaying && (
                    <div className="relative group pointer-events-auto animate-fade-in">
                        {/* Outer glow ring */}
                        <div
                            className="absolute -inset-4 rounded-full animate-pulse"
                            style={{
                                background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)'
                            }}
                        />

                        {/* Gradient border ring */}
                        <div
                            className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(239,68,68,0.5) 50%, rgba(255,255,255,0.1) 100%)',
                                filter: 'blur(1px)'
                            }}
                        />

                        {/* Main button */}
                        <button
                            className="relative p-8 rounded-full border border-white/20 
                                       bg-gradient-to-br from-black/70 via-gray-900/80 to-black/90
                                       backdrop-blur-xl shadow-2xl
                                       hover:scale-110 active:scale-95
                                       transition-all duration-300 ease-out
                                       group-hover:border-white/40"
                            style={{
                                boxShadow: '0 0 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Play Icon */}
                            <div className="w-[52px] h-[52px] flex items-center justify-center">
                                <svg
                                    width="52"
                                    height="52"
                                    viewBox="0 0 24 24"
                                    fill="white"
                                    className="drop-shadow-lg translate-x-0.5"
                                >
                                    <polygon
                                        points="6,4 20,12 6,20"
                                        style={{
                                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                        }}
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-8 pb-8 pt-20 pointer-events-none z-20">
                <div className="pointer-events-auto space-y-4">

                    {/* Progress Bar Group */}
                    <div className="flex items-center gap-4 group">
                        <span className="text-xs text-gray-300 font-mono w-10 text-right">{formatTime(played)}</span>

                        {/* Interactive Progress Bar */}
                        <div className="relative flex-1 h-6 flex items-center group cursor-pointer">
                            {/* Background Track */}
                            <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full" />

                            {/* Range Input for Seek */}
                            <input
                                type="range"
                                min={0}
                                max={duration > 0 ? duration : 100}
                                value={played}
                                onChange={(e) => onSeek(parseFloat(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 range-sm accent-red-600"
                            />

                            {/* Visual Progress Bar (Pointer Events None) */}
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-red-600 rounded-full -translate-y-1/2 pointer-events-none z-10"
                                style={{ width: `${duration > 0 ? Math.min(100, (played / duration) * 100) : 0}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg border border-white" />
                            </div>
                        </div>

                        <span className="text-xs text-gray-300 font-mono w-10">{formatTime(duration)}</span>
                    </div>

                    {/* Button Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={onPlayPause} className="hover:text-red-500 text-white transition-colors">
                                {isPlaying ? <Pause fill="white" size={32} /> : <Play fill="white" size={32} />}
                            </button>
                            <button onClick={onSeekRw} className="hover:text-white text-gray-300 transition-colors flex items-center gap-1 group/rw" title="-10s">
                                <RotateCcw size={28} className="group-hover/rw:text-white" />
                                <span className="text-xs font-bold text-gray-400 group-hover/rw:text-white">-10s</span>
                            </button>
                            <button onClick={onSeekFf} className="hover:text-white text-gray-300 transition-colors flex items-center gap-1 group/ff" title="+10s">
                                <span className="text-xs font-bold text-gray-400 group-hover/ff:text-white">+10s</span>
                                <RotateCw size={28} className="group-hover/ff:text-white" />
                            </button>
                            <div className="flex items-center gap-2 group/vol">
                                <button onClick={onToggleMute} className="hover:text-white text-gray-300 transition-colors">
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-28 transition-all duration-300 flex items-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                        className="w-24 h-1 ml-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white hover:accent-red-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Area (Next/Prev Ep & Fullscreen) */}
                        <div className="flex items-center gap-4">

                            {hasPrevEpisode && (
                                <button onClick={onPrevEpisode} className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-sm font-medium transition-colors">
                                    <FastForward size={16} className="rotate-180" /> {/* Reusing FF icon rotated */}
                                    <span>Prev Ep</span>
                                </button>
                            )}

                            {hasNextEpisode && (
                                <button onClick={onNextEpisode} className="flex items-center gap-2 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-md text-sm font-medium transition-colors">
                                    <span>Next Ep</span>
                                    <FastForward size={16} />
                                </button>
                            )}

                            <button onClick={onToggleFullscreen} className="hover:text-white text-gray-300 transition-colors">
                                {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumPlayerControls;
