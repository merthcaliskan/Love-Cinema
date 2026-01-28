import React, { useState, useEffect } from 'react';
import { Play, Info, Bell, Search, ChevronDown, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import AdminModal from './AdminModal';
import EpisodeSelector from './EpisodeSelector';
import ContentDetailsModal from './ContentDetailsModal';

const Navbar = ({ profile, onOpenAdmin, onLogout, activeUsers = [] }) => {
    const [scrolled, setScrolled] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-40 transition-colors duration-300 px-4 md:px-12 py-4 flex items-center justify-between ${scrolled ? 'bg-midnight shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'} `}>
            <div className="flex items-center gap-8">
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 cursor-pointer select-none">
                    MERTFLIX
                </h1>
                <ul className="hidden md:flex gap-6 text-sm text-gray-300">
                    <li className="hover:text-white cursor-pointer font-medium">Home</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Series</li>
                    <li className="hover:text-white cursor-pointer transition-colors">Movies</li>
                    <li className="hover:text-white cursor-pointer transition-colors">My List</li>
                </ul>
            </div>

            <div className="flex items-center gap-6 text-gray-300">

                {/* Active Users Indicator */}
                <div className="flex items-center -space-x-2 mr-2">
                    {activeUsers.map((user) => (
                        <div key={user.name} className="relative group" title={`${user.name} is watching`}>
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border-2 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                            />
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black transform translate-y-1/3 translate-x-1/3"></div>
                        </div>
                    ))}
                </div>

                {/* Admin Button directly in Navbar for Mert */}
                {profile.name === 'Mert' && (
                    <button onClick={onOpenAdmin} className="text-cyan-400 hover:text-cyan-300 transition-colors" title="Add Content">
                        <PlusCircle size={24} />
                    </button>
                )}

                <Search className="w-5 h-5 cursor-pointer hover:text-white" />
                <Bell className="w-5 h-5 cursor-pointer hover:text-white" />

                {/* Profile Dropdown */}
                <div
                    className="relative"
                    onMouseEnter={() => setIsProfileMenuOpen(true)}
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                    <div className="flex items-center gap-2 cursor-pointer group pb-2 pt-2">
                        <img src={profile.avatar} alt="Profile" className="w-8 h-8 rounded-md border border-white/20" />
                        <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 top-full bg-black/90 border border-gray-700 rounded-md shadow-xl py-2 w-48 backdrop-blur-md animate-fade-in z-50">
                            <div className="px-4 py-2 border-b border-gray-700 mb-2">
                                <p className="text-sm text-gray-400">Signed in as</p>
                                <p className="text-white font-bold truncate">{profile.name}</p>
                            </div>
                            <button
                                onClick={onLogout}
                                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                            >
                                Switch Profile
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                Account Settings
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                Help Center
                            </button>
                            <div className="border-t border-gray-700 mt-2 pt-2">
                                <button
                                    onClick={onLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-white hover:underline"
                                >
                                    Sign out of MERTFLIX
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

// ... HeroSection (Unchanged for now, will link to real hero data later) ...
const HeroSection = ({ movie, onPlay, onMoreInfo }) => {
    if (!movie) return null;

    return (
        <div className="relative h-[80vh] w-full">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/50 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent"></div>
            </div>

            {/* Content info */}
            <div className="absolute bottom-1/3 left-4 md:left-12 max-w-xl space-y-4 animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-2xl">
                    {movie.title}
                </h1>
                <p className="text-base md:text-lg text-gray-200 drop-shadow-md line-clamp-3">
                    {movie.description || "No description available."}
                </p>

                <div className="flex items-center gap-4 mt-6">
                    <button
                        onClick={() => onPlay(movie)}
                        className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-gray-200 transition-colors"
                    >
                        <Play fill="black" size={24} /> Play
                    </button>
                    <button onClick={() => onMoreInfo && onMoreInfo(movie)} className="flex items-center gap-2 bg-white/30 backdrop-blur-md text-white px-6 py-2 rounded-md font-bold hover:bg-white/40 transition-colors">
                        <Info size={24} /> More Info
                    </button>
                </div>
            </div>
        </div>
    );
};

const ContentRow = ({ title, movies, onPlay, profile, onEdit }) => {
    if (!movies || movies.length === 0) return null;

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to remove this from the library?")) {
            remove(ref(db, `content/${id}`));
        }
    };

    const handleEdit = (e, movie) => {
        e.stopPropagation();
        onEdit(movie);
    };

    return (
        <div className="px-4 md:px-12 mb-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-200 hover:text-white cursor-pointer group flex items-center gap-2">
                {title} <span className="opacity-0 group-hover:opacity-100 text-xs text-cyan-400 transition-opacity">Explore All</span>
            </h2>
            <div className="flex gap-4 overflow-x-scroll no-scrollbar pb-8 pt-2 pl-1">
                {movies.map((movie) => (
                    <div
                        key={movie.id}
                        onClick={() => onPlay(movie)}
                        className="flex-none w-[150px] md:w-[200px] aspect-[2/3] rounded-lg overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-20 hover:shadow-2xl hover:shadow-cyan-500/20 shadow-lg border border-white/5"
                    >
                        <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Admin Action Buttons */}
                        {profile?.name === 'Mert' && (
                            <div className="absolute top-2 right-2 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                                <button
                                    onClick={(e) => handleEdit(e, movie)}
                                    className="bg-blue-600/90 text-white p-1.5 rounded-full hover:bg-blue-500 transition-colors shadow-md"
                                    title="Edit content"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, movie.id)}
                                    className="bg-red-600/90 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-md"
                                    title="Remove content"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        {/* Hover Overlay - Premium Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4 text-center pointer-events-none">
                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full shadow-2xl ring-1 ring-white/20 transform scale-50 group-hover:scale-100 transition-all duration-300 ease-out group-hover:delay-75">
                                <Play fill="white" size={24} className="text-white translate-x-0.5" />
                            </div>
                            <h3 className="text-white font-bold tracking-wide drop-shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-out delay-100 line-clamp-2">
                                {movie.title}
                            </h3>
                            <p className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity delay-200">
                                Watch Now
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HomeScreen = ({ profile, onPlayContent, onLogout, onOpenDetails, activeUsers }) => {
    const [contentList, setContentList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [editingContent, setEditingContent] = useState(null);

    // Fetch Content from Firebase
    useEffect(() => {
        const contentRef = ref(db, 'content');
        const unsubscribe = onValue(contentRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convert object to array
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Ensure episodes is an array if it exists
                const processedList = list.map(item => {
                    if (item.episodes && !Array.isArray(item.episodes)) {
                        return { ...item, episodes: Object.values(item.episodes) };
                    }
                    return item;
                });
                // Sort by timestamp if available to get latest for hero
                processedList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

                setContentList(processedList);
            } else {
                setContentList([]);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter content by category
    const getByCategory = (cat) => contentList.filter(m => m.category === cat);

    // Dynamic Hero: Get the first item with a backdrop, or just the first item
    const featuredMovie = contentList.find(m => m.backdrop) || contentList[0];

    // Handler for Card Or Hero Play Click - accepts full content object
    const handlePlayClick = (content) => {
        if (!content) return;

        if (content.type === 'movie') {
            // For movies: pass content, title, and videoUrl
            onPlayContent(content, content.title, content.videoUrl);
        } else {
            // For series: pass content, first episode title, and first episode url
            const firstEp = content.episodes?.[0];
            if (firstEp) {
                const epTitle = `${content.title}: ${firstEp.title || 'Episode 1'}`;
                onPlayContent(content, epTitle, firstEp.url);
            }
        }
    };

    // Handler for opening Details Modal (from Hero "More Info" or Series click)
    const handleOpenDetails = (content) => {
        onOpenDetails(content);
    };

    // Modified Card Click Logic as per User Request:
    const handleCardClick = (content) => {
        onOpenDetails(content);
    };

    const handleEditOpen = (content) => {
        setEditingContent(content);
        setIsAdminOpen(true);
    };

    const handleAdminClose = () => {
        setIsAdminOpen(false);
        setEditingContent(null);
    };

    return (
        <div className="min-h-screen bg-midnight pb-20">
            <Navbar profile={profile} onOpenAdmin={() => setIsAdminOpen(true)} onLogout={onLogout} activeUsers={activeUsers} />

            {/* Dynamic Hero Section - only show when content exists */}
            {featuredMovie && (
                <HeroSection
                    movie={featuredMovie}
                    onPlay={handlePlayClick}
                    onMoreInfo={handleOpenDetails}
                />
            )}

            <div className="-mt-32 relative z-30 space-y-2">
                <ContentRow title="My List" movies={getByCategory('Trending')} onPlay={handleCardClick} profile={profile} onEdit={handleEditOpen} />
                <ContentRow title="Romance" movies={getByCategory('Romance')} onPlay={handleCardClick} profile={profile} onEdit={handleEditOpen} />
                <ContentRow title="Sci-Fi & Action" movies={getByCategory('Sci-Fi')} onPlay={handleCardClick} profile={profile} onEdit={handleEditOpen} />
                <ContentRow title="Comedy" movies={getByCategory('Comedy')} onPlay={handleCardClick} profile={profile} onEdit={handleEditOpen} />

                {/* Fallback for empty list */}
                {contentList.length === 0 && (
                    <div className="text-center text-gray-500 py-20">
                        <p>No movies added yet. Use the + button to add content!</p>
                    </div>
                )}
            </div>

            {isAdminOpen && <AdminModal onClose={handleAdminClose} initialData={editingContent} />}

        </div>
    );
};

export default HomeScreen;
