import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { db } from './firebase';
import VideoPlayer from './components/VideoPlayer';
import ControlLayer from './components/ControlLayer';
import LandingView from './components/LandingView';
import ChatOverlay from './components/ChatOverlay';
import ProfileGate from './components/ProfileGate';
import HomeScreen from './components/HomeScreen'; // <--- New Home
import { Home, Maximize, Minimize } from 'lucide-react';
import PremiumPlayerControls from './components/PremiumPlayerControls';
import { motion, AnimatePresence } from 'framer-motion';

import ContentDetailsModal from './components/ContentDetailsModal';

function App() {
  const [session, setSession] = useState({
    url: '',
    isPlaying: false,
    timestamp: 0,
    lastUpdated: 0,
    playlist: [],     // Persisted Playlist
    episodeIndex: 0   // Persisted Index
  });
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1); // 0 to 1
  const [isMuted, setIsMuted] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null); // <--- Lifted State

  const appRef = useRef(null);
  const seekingRef = useRef(false);
  const seekTimeoutRef = useRef(null);
  const [seekCommand, setSeekCommand] = useState(null);

  const latestSessionRef = useRef(session); // Ref to access latest state in listener
  const ignoreRemoteUpdatesUntil = useRef(0);

  // Keep Ref updated
  useEffect(() => {
    latestSessionRef.current = session;
  }, [session]);

  // Ref to track if initial load is done (avoids stale closure in onValue)
  const isFirebaseLoadedRef = useRef(false);

  // Subscribe to Session Data
  useEffect(() => {
    const sessionRef = ref(db, 'session');
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      const now = Date.now();

      console.log(`[Firebase] Update received. URL: ${data?.url}, TS: ${data?.timestamp}, Ignore: ${now < ignoreRemoteUpdatesUntil.current}`);

      // Ignore stale updates if we just performed a local action
      if (now < ignoreRemoteUpdatesUntil.current) return;

      const currentSession = latestSessionRef.current;

      if (data) {
        // Prevent auto-play on initial load (page refresh)
        if (!isFirebaseLoadedRef.current) {
          console.log("[Firebase] Initial Load - Preventing auto-play");
          setSession({
            ...data,
            url: '', // Force empty URL locally so we land on Home Screen
            isPlaying: false,
            timestamp: data.timestamp || 0
          });
          isFirebaseLoadedRef.current = true;
          setIsFirebaseLoaded(true); // Trigger re-render
        } else {
          // ... normal update logic
          const diff = Math.abs(data.timestamp - currentSession.timestamp);
          const isRemoteSeek = diff > 2.5;

          if (isRemoteSeek) {
            setSeekCommand({ time: data.timestamp, id: Date.now() });
            setSession(prev => ({ ...prev, ...data }));
          } else {
            if (currentSession.isPlaying) {
              setSession(prev => ({ ...prev, ...data, timestamp: prev.timestamp }));
            } else {
              setSession(prev => ({ ...prev, ...data }));
            }
          }
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ... (handlers)

  // Shared Logic for Starting Playback (from Card or Modal)
  const handlePlayContent = (contentData, startTitle, startUrl) => {
    console.log(`[handlePlayContent] Request: Title=${startTitle}, URL=${startUrl}`);

    let epList = [];
    let startIdx = 0;

    // Helper to normalize URL for comparison (remove query params)
    const normalize = (u) => u ? u.split('?')[0] : '';
    const normStart = normalize(startUrl);

    // If it's a series (has episodes), setup playlist
    if (contentData.episodes) {
      epList = contentData.episodes.map((ep, idx) => ({
        url: ep.url,
        title: `${contentData.title}: ${ep.title || 'Episode ' + (ep.number || idx + 1)}`,
        index: idx
      }));

      // Find index using normalized URLs to avoid query param mismatches
      const clickedEp = contentData.episodes.find(e => {
        const n1 = normalize(e.url);
        const match = n1 === normStart;
        console.log(`[URL Check] Start=${normStart} vs Ep=${n1} -> Match=${match}`);
        return match;
      });

      if (clickedEp) {
        startIdx = contentData.episodes.indexOf(clickedEp);
      } else {
        console.warn("[handlePlayContent] Normalized match failed. Trying fallback...");
        // Fallback: Try exact match
        const exact = contentData.episodes.find(e => e.url === startUrl);
        if (exact) {
          startIdx = contentData.episodes.indexOf(exact);
          console.log("[handlePlayContent] Exact match found!");
        } else {
          console.error("[handlePlayContent] No match found for URL. Defaulting to 0.");
        }
      }
    } else {
      // Movie
      epList = [{ url: startUrl, title: startTitle, index: 0 }];
    }

    console.log(`[handlePlayContent] Setting Session. Index=${startIdx}`);

    // CRITICAL: Reset seek command so the new player doesn't "resume" the old timestamp
    setSeekCommand(null);

    const now = Date.now();
    ignoreRemoteUpdatesUntil.current = now + 2000;
    console.log(`[handlePlayContent] Ignore Ref set to: ${now + 2000}`);

    setSession({
      url: startUrl,
      title: startTitle,
      playlist: epList,
      episodeIndex: startIdx,
      isPlaying: true, // Auto-start
      timestamp: 0
    });
    setIsFullscreen(true);

    // Sync to Firebase
    set(ref(db, 'messages'), null);
    update(ref(db, 'session'), {
      url: startUrl,
      title: startTitle,
      playlist: epList,
      episodeIndex: startIdx,
      isPlaying: true,
      timestamp: 0
    });
  };

  // Handlers for Player
  const handlePlay = () => update(ref(db, 'session'), { isPlaying: true });
  const handlePause = () => update(ref(db, 'session'), { isPlaying: false });

  const handleProgress = (state) => {
    if (!session.isPlaying) return;
    setSession(prev => ({ ...prev, timestamp: state.playedSeconds }));
  };

  const togglePlay = () => {
    console.log("[App] togglePlay triggered");
    if (session.isPlaying) {
      update(ref(db, 'session'), {
        isPlaying: false,
        timestamp: session.timestamp
      });
    } else {
      update(ref(db, 'session'), { isPlaying: true });
    }
  };
  const resetSession = () => {
    ignoreRemoteUpdatesUntil.current = Date.now() + 1000;
    update(ref(db, 'session'), { url: '', isPlaying: false, playlist: [], episodeIndex: 0 });
    set(ref(db, 'messages'), null);
  };

  const handleDuration = (dur) => {
    setDuration(dur);
  };

  const triggerSeek = (newTime) => {
    setSeekCommand({ time: newTime, id: Date.now() });
    setSession(prev => ({ ...prev, timestamp: newTime }));
    update(ref(db, 'session'), { timestamp: newTime });
  };

  const handleSeek = (time) => {
    triggerSeek(time);
  };

  const handleSeekRw = () => {
    triggerSeek(Math.max(0, session.timestamp - 10));
  };

  const handleSeekFf = () => {
    const nextTime = session.timestamp + 10;
    if (duration > 0) {
      triggerSeek(Math.min(duration, nextTime));
    } else {
      triggerSeek(nextTime);
    }
  };

  const handleNextEpisode = () => {
    const playlist = session.playlist || [];
    const currentIdx = session.episodeIndex || 0;

    if (currentIdx < playlist.length - 1) {
      const nextIdx = currentIdx + 1;
      const nextEp = playlist[nextIdx];

      ignoreRemoteUpdatesUntil.current = Date.now() + 2000;

      setSession(prev => ({
        ...prev,
        url: nextEp.url,
        title: nextEp.title,
        episodeIndex: nextIdx,
        timestamp: 0,
        isPlaying: true
      }));

      set(ref(db, 'messages'), null);
      update(ref(db, 'session'), {
        url: nextEp.url,
        title: nextEp.title,
        episodeIndex: nextIdx,
        timestamp: 0,
        isPlaying: true
      });
    }
  };

  const handlePrevEpisode = () => {
    const playlist = session.playlist || [];
    const currentIdx = session.episodeIndex || 0;

    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      const prevEp = playlist[prevIdx];

      ignoreRemoteUpdatesUntil.current = Date.now() + 2000;

      setSession(prev => ({
        ...prev,
        url: prevEp.url,
        title: prevEp.title,
        episodeIndex: prevIdx,
        timestamp: 0,
        isPlaying: true
      }));

      set(ref(db, 'messages'), null);
      update(ref(db, 'session'), {
        url: prevEp.url,
        title: prevEp.title,
        episodeIndex: prevIdx,
        timestamp: 0,
        isPlaying: true
      });
    }
  };

  const handleClosePlayback = () => {
    console.log("[App] handleClosePlayback triggered. Source: ???");
    ignoreRemoteUpdatesUntil.current = Date.now() + 500;
    setSession(prev => ({ ...prev, isPlaying: false, url: null }));
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (appRef.current.requestFullscreen) {
        appRef.current.requestFullscreen();
      } else if (appRef.current.webkitRequestFullscreen) {
        appRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  if (!isFirebaseLoaded) {
    return <div className="w-screen h-screen bg-black" />;
  }

  if (isLoading) {
    console.log("Render: isLoading is TRUE");
    return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading Cinema...</div>;
  }

  if (!currentProfile) {
    console.log("Render: Rendering ProfileGate");
    return <ProfileGate onSelectProfile={setCurrentProfile} />;
  }

  const isPlaybackActive = session.url && session.isPlaying !== undefined;
  console.log(`Render: Main App. Active=${isPlaybackActive}, URL=${session.url}, Playing=${session.isPlaying}`);

  return (
    <div className="relative w-full h-screen bg-midnight overflow-hidden">

      {/* Base Layer: HomeScreen - Animated Entrance */}
      <motion.div
        className="w-full h-full overflow-y-auto no-scrollbar"
        initial={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <HomeScreen
          profile={currentProfile}
          onLogout={() => setCurrentProfile(null)}
          onPlayContent={handlePlayContent}
          onOpenDetails={setSelectedContent}
        />
      </motion.div>

      {/* Layer 2: Details Modal (Fixed above Home, below Player) */}
      <AnimatePresence>
        {selectedContent && (
          <ContentDetailsModal
            key="content-modal"
            content={selectedContent}
            onClose={() => setSelectedContent(null)}
            onPlay={(url, episodeTitle) => {
              setSelectedContent(null);
              const fullTitle = episodeTitle
                ? `${selectedContent.title}: ${episodeTitle}`
                : selectedContent.title;
              handlePlayContent(selectedContent, fullTitle, url);
            }}
          />
        )}
      </AnimatePresence>

      {/* Overlay Layer: Cinema/Playback - Slides up from bottom */}
      <AnimatePresence>
        {isPlaybackActive && (
          <motion.div
            key="cinema-overlay"
            ref={appRef}
            className="fixed inset-0 w-full h-full bg-black z-50"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1] // Custom cubic bezier for premium feel
            }}
          >
            <VideoPlayer
              key={session.url}
              url={session.url}
              playing={session.isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onProgress={handleProgress}
              onDuration={handleDuration}
              seekCommand={seekCommand}
              volume={volume}
              muted={isMuted}
            />

            <ControlLayer>
              <PremiumPlayerControls
                title={session.title}
                isPlaying={session.isPlaying}
                onPlayPause={togglePlay}
                onSeek={handleSeek}
                onSeekRw={handleSeekRw}
                onSeekFf={handleSeekFf}
                played={session.timestamp}
                duration={duration}
                onBack={handleClosePlayback}

                hasNextEpisode={session.playlist && session.episodeIndex < session.playlist.length - 1}
                onNextEpisode={handleNextEpisode}

                hasPrevEpisode={session.playlist && session.episodeIndex > 0}
                onPrevEpisode={handlePrevEpisode}

                isMuted={isMuted}
                onToggleMute={toggleMute}
                volume={volume}
                onVolumeChange={handleVolumeChange}

                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
              <ChatOverlay profile={currentProfile} />
            </ControlLayer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
