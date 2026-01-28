import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Plus, Lock } from 'lucide-react';

const ProfileGate = ({ onSelectProfile }) => {
    const [isExiting, setIsExiting] = useState(false);
    // Cinematic "Whoosh" sound placeholder
    const audioRef = React.useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'));
    const [hoveredProfile, setHoveredProfile] = useState(null);

    const handleProfileSelect = (profile) => {
        setIsExiting(true);
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(e => console.log("Audio play failed", e));

        // Wait for animation to finish before switching
        setTimeout(() => {
            onSelectProfile(profile);
        }, 800);
    };

    const profiles = [
        {
            id: 'mert',
            name: 'Mert',
            avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mert&backgroundColor=b6e3f4',
            role: 'Admin',
            pinProtected: true
        },
        {
            id: 'honeydrop',
            name: 'Honey Drop',
            avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=HoneyDrop&backgroundColor=ffdfbf',
            role: 'Viewer',
            pinProtected: false
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        },
        exit: {
            opacity: 0,
            scale: 2.5, // Strong zoom In
            filter: "blur(20px)",
            transition: { duration: 0.8, ease: "easeInOut" }
        }
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0, scale: 0.9 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 20 }
        }
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-black"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={containerVariants}
                >
                    {/* Cinematic Background Layer */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black opacity-80" />
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-cyan-900/10"
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 1, -1, 0]
                            }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 flex flex-col items-center w-full max-w-5xl px-4">

                        <motion.h1
                            className="text-5xl md:text-7xl font-bold mb-16 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)] tracking-tight"
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                        >
                            Who's watching?
                        </motion.h1>

                        <motion.div
                            className="flex flex-wrap justify-center gap-8 md:gap-12"
                            variants={containerVariants}
                        >
                            {profiles.map((profile) => (
                                <motion.div
                                    key={profile.id}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.05, y: -10 }}
                                    whileTap={{ scale: 0.95 }}
                                    onHoverStart={() => setHoveredProfile(profile.id)}
                                    onHoverEnd={() => setHoveredProfile(null)}
                                    onClick={() => handleProfileSelect(profile)}
                                    className="group relative flex flex-col items-center cursor-pointer"
                                >
                                    {/* Card Glow Effect */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"
                                        animate={{
                                            opacity: hoveredProfile === profile.id ? 1 : 0,
                                            scale: hoveredProfile === profile.id ? 1.2 : 1
                                        }}
                                    />

                                    {/* Avatar Container */}
                                    <div className="relative w-32 h-32 md:w-48 md:h-48 mb-6">
                                        <div className={`w-full h-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${hoveredProfile === profile.id ? 'border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-80 group-hover:opacity-100'}`}>
                                            <img
                                                src={profile.avatar}
                                                alt={profile.name}
                                                className="w-full h-full object-cover bg-gray-800"
                                            />
                                            {/* Overlay Gradient */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        </div>

                                        {/* Pin Icon */}
                                        {profile.pinProtected && (
                                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                                                <Lock size={12} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Profile Name */}
                                    <span className={`text-xl md:text-2xl font-medium tracking-wide transition-colors duration-300 ${hoveredProfile === profile.id ? 'text-white drop-shadow-md' : 'text-gray-400'}`}>
                                        {profile.name}
                                    </span>
                                </motion.div>
                            ))}

                            {/* Add Profile Button */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, y: -10 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative flex flex-col items-center cursor-pointer"
                            >
                                <div className="w-32 h-32 md:w-48 md:h-48 mb-6 flex items-center justify-center rounded-2xl border-2 border-gray-700 hover:border-gray-500 bg-gray-900/50 backdrop-blur-sm transition-all duration-300">
                                    <Plus size={48} className="text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-xl md:text-2xl font-medium text-gray-500 group-hover:text-gray-300 tracking-wide transition-colors">
                                    Add Profile
                                </span>
                            </motion.div>
                        </motion.div>

                        {/* Manage Profiles Button */}
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                            className="mt-20 px-10 py-3 border border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-white/5 uppercase tracking-[0.2em] text-sm md:text-base transition-all duration-300 rounded-sm"
                        >
                            Manage Profiles
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProfileGate;
