import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from './firebase';
import VideoPlayer from './components/VideoPlayer';
import ControlLayer from './components/ControlLayer';
import LandingView from './components/LandingView';
import ChatOverlay from './components/ChatOverlay';
import { Home, Maximize, Minimize } from 'lucide-react';

function App() {
  const [session, setSession] = useState({
    url: '',
    isPlaying: false,
    timestamp: 0,
    lastUpdated: 0
  });
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const appRef = useRef(null);

  // Subscribe to Session Data
  useEffect(() => {
    const sessionRef = ref(db, 'session');
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSession(prev => ({ ...prev, ...data }));
      }
      setIsFirebaseLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  // Handlers for Player
  // Handlers for Player
  const handlePlay = () => update(ref(db, 'session'), { isPlaying: true });
  const handlePause = () => update(ref(db, 'session'), { isPlaying: false });
  const handleProgress = (state) => { };
  const togglePlay = () => update(ref(db, 'session'), { isPlaying: !session.isPlaying });
  const resetSession = () => {
    update(ref(db, 'session'), { url: '', isPlaying: false });
    set(ref(db, 'messages'), null); // Clear chat on exit
  };

  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // Enter Fullscreen
      if (appRef.current.requestFullscreen) {
        appRef.current.requestFullscreen().catch(err => console.error(err));
      } else if (appRef.current.webkitRequestFullscreen) {
        appRef.current.webkitRequestFullscreen(); // Safari/Chrome older
      }
      // Always toggle state (even if API fails/missing on iOS)
      setIsFullscreen(true);
    } else {
      // Exit Fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change (ESC key or System exit)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange); // iOS/Safari listener
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Show nothing (or loader) until Firebase connects to prevent "Landing Flash"
  if (!isFirebaseLoaded) {
    return <div className="w-screen h-screen bg-black" />;
  }

  // Render Landing View if no URL
  if (!session.url) {
    return <LandingView />;
  }

  // Render Cinema View
  return (
    <div ref={appRef} className="relative w-screen h-screen bg-black overflow-hidden select-none">
      {/* Status Overlay for Debugging */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4 text-xs text-white/30 pointer-events-none font-mono group">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
          Playing: {session.isPlaying ? 'YES' : 'NO'} |
        </span>

        {/* Eject / Home Button */}
        <button
          onClick={resetSession}
          className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-2 rounded-lg text-white/80 transition-all hover:scale-105"
        >
          <Home size={14} />
          <span className="font-sans font-medium">Change Movie</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="pointer-events-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-2 rounded-lg text-white/80 transition-all hover:scale-105"
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          <span className="font-sans font-medium">{isFullscreen ? 'Exit Cinema' : 'Cinema Mode'}</span>
        </button>
      </div>

      <VideoPlayer
        url={session.url}
        playing={session.isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        seekTo={session.timestamp}
      />

      <ControlLayer onBackdropClick={togglePlay}>
        <ChatOverlay />
      </ControlLayer>
    </div>
  );
}

export default App;
