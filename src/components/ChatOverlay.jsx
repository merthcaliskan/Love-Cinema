import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, push, onValue, query, limitToLast } from 'firebase/database';
import { db } from '../firebase';
import { Send } from 'lucide-react';

const ChatOverlay = ({ isVisible }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatRef = useRef(null);

    // Subscribe to messages
    useEffect(() => {
        const messagesRef = query(ref(db, 'chat'), limitToLast(20));
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const msgList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    localCreateTime: Date.now() // For fading logic
                }));
                setMessages(msgList);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        push(ref(db, 'chat'), {
            text: inputText,
            timestamp: Date.now(),
            // In a real app we'd have user auth, but for 2 people we can just use generic or local state
            user: 'Partner'
        });

        setInputText('');
        setIsTyping(false);
    };

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className={`fixed right-0 top-0 bottom-0 w-80 lg:w-96 flex flex-col justify-end p-6 z-40 transition-opacity duration-300 ${isVisible ? 'pointer-events-auto' : 'pointer-events-none opacity-0'}`}>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col space-y-4 mb-4 overflow-y-auto no-scrollbar mask-linear-gradient max-h-[75vh]">
                {/* Spacer to push content down if few messages */}
                <div className="flex-1" />

                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <MessageItem key={msg.id} message={msg} />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Reveals on interaction */}
            <motion.div
                initial={false}
                animate={{
                    backgroundColor: isTyping ? 'rgba(0,0,0,0.4)' : 'transparent',
                    backdropFilter: isTyping ? 'blur(12px)' : 'blur(0px)',
                }}
                className="rounded-2xl transition-all duration-500 will-change-transform"
                onClick={() => setIsTyping(true)}
            >
                {isTyping ? (
                    <form onSubmit={handleSend} className="flex items-center p-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type..."
                            className="flex-1 bg-transparent border-none outline-none text-white/90 px-3 py-2 text-base font-medium placeholder-white/20"
                            autoFocus
                            onBlur={() => !inputText && setIsTyping(false)}
                        />
                        <button type="submit" className="p-2 text-white/60 hover:text-white transition-colors">
                            <Send size={18} />
                        </button>
                    </form>
                ) : (
                    <div className="h-10 flex items-center justify-center cursor-text">
                        <span className="text-white/10 text-xs font-medium tracking-widest uppercase">Chat</span>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const MessageItem = ({ message }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Fade out after 6 seconds
        const timer = setTimeout(() => setIsVisible(false), 6000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 1 } }}
                    layout
                    className="self-end max-w-[85%]"
                >
                    <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl rounded-tr-sm border border-white/5 shadow-sm">
                        <p className="text-white/90 text-[1.05rem] font-medium leading-relaxed">{message.text}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatOverlay;
