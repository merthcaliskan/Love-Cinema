import React, { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { Send, Mic, Volume2, Camera, Play, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatOverlay = ({ isVisible, profile }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isInputOpen, setIsInputOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [isChoosingMode, setIsChoosingMode] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [videoStream, setVideoStream] = useState(null);
    const [playingVideoId, setPlayingVideoId] = useState(null);

    // Refs
    const chatRef = useRef(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const lastPlayedIdRef = useRef(null); // Track last auto-played message
    const longPressTimer = useRef(null); // Track Hold-to-Record
    const videoPreviewRef = useRef(null); // Video preview element
    const videoRecorderRef = useRef(null); // MediaRecorder for video
    const videoChunksRef = useRef([]); // Video data chunks
    const audioCancelledRef = useRef(false); // Track if audio was cancelled
    const videoCancelledRef = useRef(false); // Track if video was cancelled

    // Update 'now' every second to trigger re-renders for message expiry
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Subscribe to messages & Auto-Play Logic
    useEffect(() => {
        const messagesRef = query(ref(db, 'chat'), limitToLast(20));
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const msgList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                }));
                msgList.sort((a, b) => a.timestamp - b.timestamp);
                setMessages(msgList);

                // --- Auto Play Logic ---
                const lastMsg = msgList[msgList.length - 1];
                if (lastMsg) {
                    // Check if it's new, is audio, and NOT from me
                    const isNew = lastMsg.id !== lastPlayedIdRef.current;
                    const isAudio = lastMsg.type === 'audio';
                    const isOthers = lastMsg.user !== (profile?.name || 'Guest');
                    const isRecent = (Date.now() - lastMsg.timestamp) < 10000; // Only play if just arrived

                    if (isNew && isAudio && isOthers && isRecent) {
                        try {
                            const audio = new Audio(lastMsg.audio);
                            audio.volume = 1.0;
                            audio.play().catch(e => console.error("Auto-play blocked:", e));
                            lastPlayedIdRef.current = lastMsg.id;
                        } catch (err) {
                            console.error("Audio error", err);
                        }
                    } else if (isNew) {
                        // Mark as seen so we don't play it later if re-render happens
                        lastPlayedIdRef.current = lastMsg.id;
                    }
                }
            }
        });

        return () => unsubscribe();
    }, [profile]);

    // Bind video stream to preview element when recording starts
    useEffect(() => {
        if (videoStream && videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = videoStream;
        }
    }, [videoStream, isRecordingVideo]);

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        push(ref(db, 'chat'), {
            type: 'text',
            text: inputText,
            timestamp: Date.now(),
            user: profile?.name || 'Guest'
        });

        setInputText('');
        setIsInputOpen(false);
    };

    // --- Voice Recording Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            audioCancelledRef.current = false; // Reset cancelled flag

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                // Check cancelled flag - if cancelled, don't send
                if (audioCancelledRef.current) {
                    stream.getTracks().forEach(track => track.stop());
                    audioCancelledRef.current = false; // Reset for next time
                    return;
                }

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    // Send to Firebase
                    push(ref(db, 'chat'), {
                        type: 'audio',
                        audio: base64Audio,
                        timestamp: Date.now(),
                        user: profile?.name || 'Guest'
                    });
                };

                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setIsInputOpen(true); // Keep UI expanded while recording
        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Microphone access is needed for voice messages.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsInputOpen(false); // Close UI after send
        }
    };

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const toggleInput = () => {
        if (!isInputOpen) {
            setIsInputOpen(true);
            setTimeout(() => chatRef.current?.focus(), 100);
        } else if (inputText.trim()) {
            setIsInputOpen(false);
        } else {
            setIsInputOpen(false);
        }
    };

    const playAudio = (audioSource) => {
        try {
            const audio = new Audio(audioSource);
            audio.play().catch(e => console.error("Play error:", e));
        } catch (err) {
            console.error("Audio init error:", err);
        }
    };

    const startVideoRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false // Video only, no audio
            });
            setVideoStream(stream);

            const recorder = new MediaRecorder(stream);
            videoRecorderRef.current = recorder;
            videoChunksRef.current = [];
            videoCancelledRef.current = false; // Reset cancelled flag

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) videoChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                // Check cancelled flag - if cancelled, don't send
                if (videoCancelledRef.current) {
                    stream.getTracks().forEach(track => track.stop());
                    setVideoStream(null);
                    videoCancelledRef.current = false; // Reset for next time
                    return;
                }

                const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(videoBlob);
                reader.onloadend = () => {
                    push(ref(db, 'chat'), {
                        type: 'video',
                        video: reader.result,
                        timestamp: Date.now(),
                        user: profile?.name || 'Guest'
                    });
                };

                // Cleanup
                stream.getTracks().forEach(track => track.stop());
                setVideoStream(null);
            };

            recorder.start();
            setIsRecordingVideo(true);
            setIsChoosingMode(false);
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Camera access is needed for video messages.");
        }
    };

    const stopVideoRecording = () => {
        if (videoRecorderRef.current && videoRecorderRef.current.state === "recording") {
            videoRecorderRef.current.stop();
            setIsRecordingVideo(false);
        }
    };

    const cancelVideoRecording = () => {
        // Set cancelled flag so onstop handler skips sending
        videoCancelledRef.current = true;

        // Stop recording (onstop will check cancelled flag)
        if (videoRecorderRef.current && videoRecorderRef.current.state === "recording") {
            videoRecorderRef.current.stop();
        }

        // Clean up stream
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }

        setIsRecordingVideo(false);
    };

    const playVideo = (videoId, videoElement) => {
        if (playingVideoId === videoId) {
            // Pause if already playing
            videoElement.pause();
            setPlayingVideoId(null);
        } else {
            // Play this video
            videoElement.play().catch(e => console.error("Play error:", e));
            setPlayingVideoId(videoId);

            // Auto-pause when ended
            videoElement.onended = () => {
                setPlayingVideoId(null);
            };
        }
    };

    const visibleMessages = messages.filter(msg => (now - msg.timestamp) < 20000);

    return (
        <div className={`fixed right-0 top-32 bottom-32 w-80 lg:w-96 flex flex-col justify-end p-6 z-40 transition-opacity duration-300 pointer-events-none ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 no-scrollbar mask-image-b pointer-events-auto">
                <AnimatePresence initial={false}>
                    {visibleMessages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="flex flex-col items-end px-2 w-full"
                        >
                            {/* Chat Bubble Container */}
                            <div className={`flex flex-col ${msg.user === (profile?.name || 'Guest') ? 'items-end' : 'items-start'} w-full`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{msg.user}</span>
                                </div>

                                {msg.type === 'audio' ? (
                                    /* Audio Bubble Visual */
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => playAudio(msg.audio)}
                                        className={`px-4 py-2 rounded-2xl backdrop-blur-md text-sm font-medium shadow-lg flex items-center gap-2 cursor-pointer hover:brightness-110 transition-all
                                        ${msg.user === (profile?.name || 'Guest')
                                                ? 'bg-red-600 text-white rounded-br-none'
                                                : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                                            }`}
                                    >
                                        <Volume2 size={16} />
                                        <span className="text-xs">Play Audio</span>
                                    </motion.div>
                                ) : msg.type === 'video' ? (
                                    /* Video Bubble - Circular */
                                    <motion.div
                                        whileTap={{ scale: 0.95 }}
                                        onClick={(e) => {
                                            const videoEl = e.currentTarget.querySelector('video');
                                            if (videoEl) playVideo(msg.id, videoEl);
                                        }}
                                        className="relative cursor-pointer group"
                                    >
                                        <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all
                                            ${msg.user === (profile?.name || 'Guest')
                                                ? 'border-red-600'
                                                : 'border-white/20'
                                            }`}
                                        >
                                            <video
                                                src={msg.video}
                                                loop
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {playingVideoId !== msg.id && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full group-hover:bg-black/40 transition-colors pointer-events-none">
                                                <Play size={32} className="text-white" />
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    /* Text Bubble */
                                    <div className={`px-4 py-2 rounded-2xl backdrop-blur-md text-sm font-medium shadow-lg max-w-[90%] break-words
                                        ${msg.user === (profile?.name || 'Guest')
                                            ? 'bg-red-600/80 text-white rounded-br-none'
                                            : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Morphing Input Bar - Transforms Between Modes */}
            <div className="flex justify-end pointer-events-auto">
                <motion.div
                    layout
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {/* TEXT MODE - Default */}
                        {!isRecording && !isRecordingVideo && (
                            <motion.div
                                key="text-mode"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-2"
                            >
                                {/* Left Side: Media Buttons */}
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        type="button"
                                        onClick={startRecording}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-300"
                                    >
                                        <Mic size={16} />
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        onClick={startVideoRecording}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all duration-300"
                                    >
                                        <Camera size={16} />
                                    </motion.button>
                                </div>

                                <div className="w-px h-6 bg-white/10" />

                                {/* Text Input */}
                                <form onSubmit={handleSend} className="flex-1 min-w-0">
                                    <input
                                        ref={chatRef}
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full bg-transparent border-none text-white text-sm px-2 py-2 focus:outline-none placeholder-white/40"
                                        style={{ minWidth: '140px' }}
                                    />
                                </form>

                                {/* Send Button */}
                                <motion.button
                                    type="button"
                                    onClick={handleSend}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={!inputText.trim()}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                                        ${inputText.trim()
                                            ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                                            : 'bg-white/10 text-white/40'
                                        }`}
                                >
                                    <Send size={16} />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* AUDIO RECORDING MODE */}
                        {isRecording && !isRecordingVideo && (
                            <motion.div
                                key="audio-mode"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                {/* Cancel/Trash Button */}
                                <motion.button
                                    type="button"
                                    onClick={() => {
                                        // Set cancelled flag so onstop handler skips sending
                                        audioCancelledRef.current = true;
                                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                                            mediaRecorderRef.current.stop();
                                        }
                                        setIsRecording(false);
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
                                >
                                    <Trash2 size={16} />
                                </motion.button>

                                {/* Recording Indicator */}
                                <div className="flex items-center gap-2 px-3">
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2.5 h-2.5 bg-red-500 rounded-full"
                                    />
                                    <span className="text-white/80 text-sm font-medium">Recording...</span>
                                </div>

                                {/* Send Button */}
                                <motion.button
                                    type="button"
                                    onClick={stopRecording}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 transition-all duration-300"
                                >
                                    <Check size={16} />
                                </motion.button>
                            </motion.div>
                        )}

                        {/* VIDEO RECORDING MODE */}
                        {isRecordingVideo && (
                            <motion.div
                                key="video-mode"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center gap-3"
                            >
                                {/* Cancel/Trash Button */}
                                <motion.button
                                    type="button"
                                    onClick={cancelVideoRecording}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
                                >
                                    <Trash2 size={16} />
                                </motion.button>

                                {/* Circular Video Preview */}
                                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-red-500 shadow-lg">
                                    <video
                                        ref={(el) => {
                                            if (el && videoStream && el.srcObject !== videoStream) {
                                                el.srcObject = videoStream;
                                            }
                                        }}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                    {/* Recording pulse */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 border-2 border-red-500 rounded-full"
                                    />
                                </div>

                                {/* Recording text */}
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        animate={{ opacity: [1, 0.3, 1] }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="w-2 h-2 bg-red-500 rounded-full"
                                    />
                                    <span className="text-white/60 text-xs">REC</span>
                                </div>

                                {/* Send Button */}
                                <motion.button
                                    type="button"
                                    onClick={stopVideoRecording}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 transition-all duration-300"
                                >
                                    <Check size={16} />
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ChatOverlay;
