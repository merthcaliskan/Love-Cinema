import React, { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, set, onDisconnect } from 'firebase/database';
import { db } from './firebase';
import VideoPlayer from './components/VideoPlayer';
import ControlLayer from './components/ControlLayer';
import LandingView from './components/LandingView';
import ChatOverlay from './components/ChatOverlay';
import ProfileGate from './components/ProfileGate';
import HomeScreen from './components/HomeScreen';
import { Home, Maximize, Minimize } from 'lucide-react';
import PremiumPlayerControls from './components/PremiumPlayerControls';
import JoinInvitation from './components/JoinInvitation'; // <--- New Invite Component
import { motion, AnimatePresence } from 'framer-motion';

import ContentDetailsModal from './components/ContentDetailsModal';

function App() {
  const [session, setSession] = useState({
    url: '',
    isPlaying: false,
    timestamp: 0,
    lastUpdated: 0,
    playlist: [],
    episodeIndex: 0,
    startedBy: '' // <--- Track who started it
  });
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Invite & Presence State
  const [incomingInvitation, setIncomingInvitation] = useState(null); // { title: '...', startedBy: '...' }
  const [activeUsers, setActiveUsers] = useState([]);

  const appRef = useRef(null);
  const seekingRef = useRef(false);
  const seekTimeoutRef = useRef(null);
  const [seekCommand, setSeekCommand] = useState(null);

  const latestSessionRef = useRef(session);
  const ignoreRemoteUpdatesUntil = useRef(0);
  const isFirebaseLoadedRef = useRef(false);

  // Keep Ref updated
  useEffect(() => {
    latestSessionRef.current = session;
  }, [session]);

  // --- PRESENCE SYSTEM ---
  useEffect(() => {
    if (!currentProfile) return;

    // 1. Heartbeat: Write to presence/{profileName} every 30s
    const userRef = ref(db, `presence/${currentProfile.name}`);
    const beat = () => {
      set(userRef, {
        name: currentProfile.name,
        avatar: currentProfile.avatar,
        lastSeen: Date.now()
      });
    };

    // Set initial presence and set disconnect logic
    beat();
    onDisconnect(userRef).remove();

    const interval = setInterval(beat, 30000); // 30s heartbeat

    // 2. Listen for other active users
    const presenceRef = ref(db, 'presence');
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const users = [];
      const now = Date.now();
      snapshot.forEach((child) => {
        const u = child.val();
        // Filter out stale users (> 2 mins inactivity)
        if (now - u.lastSeen < 120000 && u.name !== currentProfile.name) {
          users.push(u);
        }
      });
      setActiveUsers(users);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      set(userRef, null); // Remove self on unmount/logout
    };
  }, [currentProfile]);


  // --- SESSION LISTENER (Smart Join Logic) ---
  useEffect(() => {
    const sessionRef = ref(db, 'session');
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      const now = Date.now();

      console.log(`[Firebase] Update. URL: ${data?.url}, TS: ${data?.timestamp}`);

      if (now < ignoreRemoteUpdatesUntil.current) return;

      const currentSession = latestSessionRef.current;

      if (data) {
        // SCENARIO 1: Initial Load
        if (!isFirebaseLoadedRef.current) {
          console.log("[Firebase] Initial Load - Preventing auto-play");

          // If there is active content, show invitation instead of playing
          if (data.url && data.isPlaying) {
            setIncomingInvitation({
              title: data.title,
              episodeTitle: data.playlist?.[data.episodeIndex]?.title,
              startedBy: data.startedBy,
              data: data
            });
          }

          setSession({
            ...data,
            url: '',
            isPlaying: false,
            timestamp: data.timestamp || 0
          });
          isFirebaseLoadedRef.current = true;
          setIsFirebaseLoaded(true);

        } else {
          // SCENARIO 2: Runtime Update

          // If we are NOT watching anything, and a remote session starts...
          if (!currentSession.url && data.url && data.isPlaying) {
            console.log("[Firebase] Remote session started while we are idle. Show Invite.");
            setIncomingInvitation({
              title: data.title,
              episodeTitle: data.playlist?.[data.episodeIndex]?.title,
              startedBy: data.startedBy,
              data: data
            });
            return;
          }

          // If we ARE watching, sync normally
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


  // --- HANDLERS ---

  const handleJoinSession = () => {
    if (!incomingInvitation) return;

    // Sync local state to match the remote invite data
    const remoteData = incomingInvitation.data;

    setSession(remoteData);
    setIncomingInvitation(null); // clear invite
    setIsFullscreen(true);

    // Optionally trigger a seek if needed (though session sync should handle it)
    setSeekCommand({ time: remoteData.timestamp, id: Date.now() });
  };

  const handleIgnoreInvite = () => {
    setIncomingInvitation(null);
  };

  const handlePlayContent = (contentData, startTitle, startUrl) => {
    // ... (Log & Normalize Logic same as before)
    console.log(`[handlePlayContent] Request: Title=${startTitle}, URL=${startUrl}`);

    let epList = [];
    let startIdx = 0;
    const normalize = (u) => u ? u.split('?')[0] : '';
    const normStart = normalize(startUrl);

    if (contentData.episodes) {
      epList = contentData.episodes.map((ep, idx) => ({
        url: ep.url,
        title: `${contentData.title}: ${ep.title || 'Episode ' + (ep.number || idx + 1)}`,
        index: idx
      }));
      const clickedEp = contentData.episodes.find(e => normalize(e.url) === normStart) || contentData.episodes.find(e => e.url === startUrl);
      if (clickedEp) startIdx = contentData.episodes.indexOf(clickedEp);
    } else {
      epList = [{ url: startUrl, title: startTitle, index: 0 }];
    }

    setSeekCommand(null);
    const now = Date.now();
    ignoreRemoteUpdatesUntil.current = now + 2000;

    const newSessionState = {
      url: startUrl,
      title: startTitle,
      playlist: epList,
      episodeIndex: startIdx,
      isPlaying: true, // Auto-start
      timestamp: 0,
      startedBy: currentProfile?.name || 'Admin' // <--- Add Caller Name
    };

    setSession(newSessionState);
    setIsFullscreen(true);

    set(ref(db, 'messages'), null);
    update(ref(db, 'session'), newSessionState);
  };

  // ... (handlePlay, handlePause, handleProgress etc. - KEEP SAME)
  const handlePlay = () => update(ref(db, 'session'), { isPlaying: true });
  const handlePause = () => update(ref(db, 'session'), { isPlaying: false });

  const handleProgress = (state) => {
    if (!session.isPlaying) return;
    setSession(prev => ({ ...prev, timestamp: state.playedSeconds }));
  };

  const togglePlay = () => {
    if (session.isPlaying) {
      update(ref(db, 'session'), { isPlaying: false, timestamp: session.timestamp });
    } else {
      update(ref(db, 'session'), { isPlaying: true });
    }
  };

  const resetSession = () => {
    ignoreRemoteUpdatesUntil.current = Date.now() + 1000;
    update(ref(db, 'session'), { url: '', isPlaying: false, playlist: [], episodeIndex: 0 });
    set(ref(db, 'messages'), null);
  };

  const handleDuration = (dur) => setDuration(dur);

  const triggerSeek = (newTime) => {
    setSeekCommand({ time: newTime, id: Date.now() });
    setSession(prev => ({ ...prev, timestamp: newTime }));
    update(ref(db, 'session'), { timestamp: newTime });
  };

  const handleSeek = (time) => triggerSeek(time);
  const handleSeekRw = () => triggerSeek(Math.max(0, session.timestamp - 10));
  const handleSeekFf = () => {
    const nextTime = session.timestamp + 10;
    triggerSeek(duration > 0 ? Math.min(duration, nextTime) : nextTime);
  };

  const handleNextEpisode = () => {
    // ... logic same as existing, just ensure `startedBy` is preserved or updated
    const playlist = session.playlist || [];
    const currentIdx = session.episodeIndex || 0;
    if (currentIdx < playlist.length - 1) {
      const nextIdx = currentIdx + 1;
      const nextEp = playlist[nextIdx];
      ignoreRemoteUpdatesUntil.current = Date.now() + 2000;
      const nextState = {
        ...session,
        url: nextEp.url,
        title: nextEp.title,
        episodeIndex: nextIdx,
        timestamp: 0,
        isPlaying: true
      };
      setSession(nextState);
      set(ref(db, 'messages'), null);
      update(ref(db, 'session'), { ...nextState, startedBy: currentProfile?.name || 'User' });
    }
  };

  const handlePrevEpisode = () => {
    // ... logic same as existing
    const playlist = session.playlist || [];
    const currentIdx = session.episodeIndex || 0;
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      const prevEp = playlist[prevIdx];
      ignoreRemoteUpdatesUntil.current = Date.now() + 2000;
      const prevState = {
        ...session,
        url: prevEp.url,
        title: prevEp.title,
        episodeIndex: prevIdx,
        timestamp: 0,
        isPlaying: true
      };
      setSession(prevState);
      set(ref(db, 'messages'), null);
      update(ref(db, 'session'), { ...prevState, startedBy: currentProfile?.name || 'User' });
    }
  };

  const handleClosePlayback = () => {
    ignoreRemoteUpdatesUntil.current = Date.now() + 500;
    setSession(prev => ({ ...prev, isPlaying: false, url: null }));
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (appRef.current.requestFullscreen) { appRef.current.requestFullscreen(); }
      else if (appRef.current.webkitRequestFullscreen) { appRef.current.webkitRequestFullscreen(); }
    } else {
      if (document.exitFullscreen) { document.exitFullscreen(); }
      else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) setIsMuted(false);
  };
  const toggleMute = () => setIsMuted(!isMuted);

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

  if (!isFirebaseLoaded) return <div className="w-screen h-screen bg-black" />;
  if (isLoading) return <div className="h-screen w-screen bg-black flex items-center justify-center text-white">Loading Cinema...</div>;
  if (!currentProfile) return <ProfileGate onSelectProfile={setCurrentProfile} />;

  const isPlaybackActive = session.url && session.isPlaying !== undefined;

  return (
    <div className="relative w-full h-screen bg-midnight overflow-hidden">

      {/* INVITATION POPUP */}
      <AnimatePresence>
        {incomingInvitation && !isPlaybackActive && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 w-full z-[60] flex justify-center pointer-events-none"
          >
            <div className="pointer-events-auto mt-4">
              <JoinInvitation
                title={incomingInvitation.title}
                episodeTitle={incomingInvitation.episodeTitle}
                startedBy={incomingInvitation.startedBy}
                onJoin={handleJoinSession}
                onIgnore={handleIgnoreInvite}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          activeUsers={activeUsers} // <--- Pass Active Users
        />
      </motion.div>

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

      <AnimatePresence>
        {isPlaybackActive && (
          <motion.div
            key="cinema-overlay"
            ref={appRef}
            className="fixed inset-0 w-full h-full bg-black z-50"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
