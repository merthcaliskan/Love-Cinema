import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import Hls from 'hls.js';

const VideoPlayer = ({ url, playing, onPlay, onPause, onProgress, onDuration, seekCommand, volume, muted }) => {
    const playerRef = useRef(null); // For ReactPlayer
    const videoRef = useRef(null);  // For native video (HLS)
    const hlsRef = useRef(null);    // To store HLS instance
    const [error, setError] = useState(null);

    // Track last executed seek ID to prevent re-runs
    const lastSeekId = useRef(0);

    // Determine if we should use native player (HLS or MP4) to bypass ReactPlayer issues
    const isNative = url?.includes('.m3u8') || url?.includes('.mp4') || url?.includes('sibnet.ru');

    // -- NATIVE VOLUME SYNC --
    useEffect(() => {
        if (!isNative || !videoRef.current) return;
        videoRef.current.volume = volume;
        videoRef.current.muted = muted;
    }, [volume, muted, isNative]);

    // ...


    // -- HLS LOGIC --
    useEffect(() => {
        setError(null);
        console.log("VideoPlayer: Effect URL changed", url, "isNative:", isNative);
        if (!isNative || !videoRef.current) return;

        const isM3U8 = url?.includes('.m3u8');
        let hls;

        if (isM3U8 && Hls.isSupported()) {
            console.log("VideoPlayer: Initializing HLS");
            hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true
            });
            hls.loadSource(url);
            hls.attachMedia(videoRef.current);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log("VideoPlayer: HLS Manifest Parsed", playing);
                if (playing) {
                    videoRef.current?.play().catch(e => console.error("HLS AutoPlay Fail:", e));
                }
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error("VideoPlayer: HLS Error", data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            setError("Video stream failed (HLS Fatal).");
                            break;
                    }
                }
            });
            hlsRef.current = hls;
        } else {
            console.log("VideoPlayer: Setting src directly", url);
            videoRef.current.src = url;
            if (playing) {
                videoRef.current.play().catch(e => {
                    console.error("Native AutoPlay Fail:", e);
                });
            }
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [url, isNative]);

    // Native Player Play/Pause Sync
    useEffect(() => {
        if (!isNative || !videoRef.current) return;
        if (playing) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    }, [playing, isNative]);

    // Native Player Seeking
    useEffect(() => {
        if (!isNative || !videoRef.current || !seekCommand) return;
        if (seekCommand.id !== lastSeekId.current) {
            console.log("VideoPlayer: Seeking Native to", seekCommand.time);
            videoRef.current.currentTime = seekCommand.time;
            lastSeekId.current = seekCommand.id;
        }
    }, [seekCommand, isNative]);

    // ReactPlayer Seeking
    useEffect(() => {
        if (isNative || !playerRef.current || !seekCommand) return;
        if (seekCommand.id !== lastSeekId.current) {
            console.log("VideoPlayer: Seeking RP to", seekCommand.time);
            playerRef.current.seekTo(seekCommand.time, 'seconds');
            lastSeekId.current = seekCommand.id;
        }
    }, [seekCommand, isNative]);

    // -- RENDER NATIVE --
    if (isNative) {
        return (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center pointer-events-auto">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                    referrerPolicy="no-referrer"
                    onPlay={() => { console.log("Native: onPlay"); onPlay && onPlay(); }}
                    onPause={() => { console.log("Native: onPause"); onPause && onPause(); }}
                    onTimeUpdate={() => onProgress && onProgress({ playedSeconds: videoRef.current?.currentTime || 0 })}
                    onLoadedMetadata={() => onDuration && onDuration(videoRef.current?.duration || 0)}
                    onError={(e) => {
                        console.error("Native Video Error:", e.nativeEvent);
                        setError("Video playback failed. Source may be expired or unsupported.");
                    }}
                />
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                        <div className="text-white text-center p-4">
                            <p className="text-red-500 font-bold mb-2">Playback Error</p>
                            <p className="text-sm text-gray-300">{error}</p>
                        </div>
                    </div>
                )}
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
                controls={false}
                onPlay={() => { console.log("RP: onPlay"); onPlay && onPlay(); }}
                onPause={() => { console.log("RP: onPause"); onPause && onPause(); }}
                onProgress={onProgress}
                onDuration={onDuration}
                volume={volume}
                muted={muted}
                onError={(e) => {
                    console.error("ReactPlayer Error:", e);
                    setError("Video playback failed.");
                }}
                progressInterval={100}
                config={{
                    youtube: { playerVars: { showinfo: 0, modestbranding: 1 } },
                    file: {
                        forceHLS: true,
                        attributes: {
                            controlsList: 'nodownload'
                        }
                    }
                }}
            />
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <div className="text-white text-center p-4">
                        <p className="text-red-500 font-bold mb-2">Playback Error</p>
                        <p className="text-sm text-gray-300">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
