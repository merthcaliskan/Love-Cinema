import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Hls from 'hls.js';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';

const VideoPlayer = ({ url, playing, onPlay, onPause, onProgress, onDuration, seekTo }) => {
    const playerRef = useRef(null); // For ReactPlayer
    const videoRef = useRef(null);  // For native video (HLS)
    const hlsRef = useRef(null);    // To store HLS instance
    const isRemoteUpdate = useRef(false); // FLAG: Prevent infinite loops

    // Determine if we should use native player (HLS or MP4) to bypass ReactPlayer issues
    const isNative = url?.includes('.m3u8') || url?.includes('.mp4') || url?.includes('sibnet.ru');

    // -- HLS LOGIC --
    useEffect(() => {
        if (!isNative || !videoRef.current) return;

        // Reset text tracks just in case
        const isM3U8 = url?.includes('.m3u8');

        let hls;
        if (isM3U8 && Hls.isSupported()) {
            hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // If already playing in session, try to play
                if (playing) {
                    videoRef.current.play().catch(e => console.log("Autoplay blocked:", e));
                }
            });
            hlsRef.current = hls;
        } else {
            // Standard MP4 or Safari Native HLS
            videoRef.current.src = url;
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [url, isNative]);

    // Native Player Play/Pause Sync
    useEffect(() => {
        if (!isNative || !videoRef.current) return;

        // Prevent event listeners from firing back to Firebase
        if (playing !== !videoRef.current.paused) {
            isRemoteUpdate.current = true;
            if (playing) {
                videoRef.current.play().catch(() => { }).finally(() => {
                    // small delay to allow event to fire and be ignored
                    setTimeout(() => isRemoteUpdate.current = false, 500);
                });
            } else {
                videoRef.current.pause();
                setTimeout(() => isRemoteUpdate.current = false, 500);
            }
        }
    }, [playing, isNative]);

    // Native Player Seeking
    useEffect(() => {
        if (!isNative || !videoRef.current || seekTo === null) return;

        const diff = Math.abs(videoRef.current.currentTime - seekTo);
        if (diff > 1) { // Only seek if difference is significant
            isRemoteUpdate.current = true;
            videoRef.current.currentTime = seekTo;
            // Seek events happen fast, but let's keep flag up briefly
            setTimeout(() => isRemoteUpdate.current = false, 1000);
        }
    }, [seekTo, isNative]);


    // -- RENDER NATIVE --
    if (isNative) {
        return (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center pointer-events-auto">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    referrerPolicy="no-referrer"
                    onPlay={() => {
                        if (isRemoteUpdate.current) return;
                        onPlay && onPlay();
                    }}
                    onPause={() => {
                        if (isRemoteUpdate.current) return;
                        onPause && onPause();
                    }}
                    onSeeked={(e) => {
                        if (isRemoteUpdate.current) return;

                        update(ref(db, 'session'), {
                            timestamp: e.target.currentTime,
                            lastUpdated: Date.now()
                        });
                    }}
                    onTimeUpdate={() => onProgress && onProgress({ playedSeconds: videoRef.current?.currentTime || 0 })}
                />
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center pointer-events-auto">
            <ReactPlayer
                ref={playerRef}
                url={url}
                playing={playing}
                width="100%"
                height="100%"
                controls={true}
                onPlay={onPlay}
                onPause={onPause}
                onProgress={onProgress}
                onDuration={onDuration}
                onError={(e) => console.error("ReactPlayer Error:", e)}
                config={{
                    youtube: { playerVars: { showinfo: 0, modestbranding: 1 } },
                    file: {
                        attributes: {
                            controlsList: 'nodownload'
                        }
                    }
                }}
            />
        </div>
    );
};

export default VideoPlayer;
