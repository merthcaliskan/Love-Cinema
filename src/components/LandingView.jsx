import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Play } from 'lucide-react';
import { ref, update, set } from 'firebase/database';
import { db } from '../firebase';

const LandingView = () => {
    const [inputUrl, setInputUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputUrl) return;

        setIsLoading(true);

        // 1. Clear previous chat history for a fresh room feel
        set(ref(db, 'messages'), null);

        // 2. Start new session
        update(ref(db, 'session'), {
            url: inputUrl,
            isPlaying: true,
            timestamp: 0
        }).catch((error) => {
            console.error("Firebase update error:", error);
            alert("Hata oluştu: " + error.message);
            setIsLoading(false);
        });
    };

    return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 opacity-30 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="z-10 w-full max-w-2xl text-center"
            >
                <h1 className="text-4xl md:text-5xl font-light text-white/90 mb-2 tracking-tight">
                    Private Cinema
                </h1>
                <p className="text-white/40 mb-12 text-lg font-light">
                    Paste a link to start watching together.
                </p>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl transition-opacity duration-500 opacity-50 group-hover:opacity-75" />
                    <div className="relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 transition-all duration-300 focus-within:ring-white/20">
                        <div className="pl-4 pr-3 text-white/40">
                            <Link size={24} strokeWidth={1.5} />
                        </div>
                        <input
                            type="text"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="Paste movie link (mp4, m3u8, YouTube)..."
                            className="w-full bg-transparent border-none outline-none text-xl text-white/90 placeholder-white/30 py-4 font-light tracking-wide"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!inputUrl || isLoading}
                            className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-md font-medium transition-all disabled:opacity-0 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {isLoading ? 'Loading...' : <>Watch <Play size={16} fill="currentColor" /></>}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default LandingView;
