import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';

const LinkInput = ({ isVisible, currentUrl }) => {
    const [inputUrl, setInputUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submit pressed with URL:", inputUrl);

        if (!inputUrl) {
            alert("Lütfen bir link yapıştırın!");
            return;
        }

        // Update Firebase with new URL
        update(ref(db, 'session'), {
            url: inputUrl,
            isPlaying: true, // Auto-play on new link
            timestamp: 0
        }).then(() => {
            console.log("Firebase updated successfully");
            // Alert removed to prevent blocking. Video should load automatically.
        }).catch((error) => {
            console.error("Firebase update error:", error);
            alert("Hata oluştu: " + error.message);
        });

        setInputUrl('');
    };

    return (
        <AnimatePresence>
            {(isVisible || !currentUrl) && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Apple-like spring
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                >
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-2xl px-6 pointer-events-auto"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/5 rounded-2xl blur-xl transition-opacity duration-500 opacity-50 group-hover:opacity-75" />
                            <div className="relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl ring-1 ring-white/5">
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
                                    disabled={!inputUrl}
                                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 text-sm font-medium transition-colors disabled:opacity-0 disabled:pointer-events-none"
                                >
                                    Watch
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LinkInput;
