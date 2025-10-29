import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, getNewSeasons, clearMediaCache, getMediaDetails, getCollectionDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, DriveStatus, FavoriteEpisodes, ProfileTab, ScreenName, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo, CustomListItem, EpisodeRatings, SearchHistoryItem, Comment, Theme, ShowProgress, TraktToken, Follows, PrivacySettings } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import * as googleDriveService from './services/googleDriveService';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import { useAchievements } from './hooks/useAchievements';
import { playNotificationSound } from './utils/soundUtils';
import Recommendations from './screens/Recommendations';
import ActorDetail from './components/ActorDetail';
import LiveWatchTracker from './components/LiveWatchTracker';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import * as traktService from './services/traktService';
import UserProfileModal from './components/UserProfileModal';
// FIX: Added missing import for firebaseConfig to construct the Trakt auth function URL.
import { firebaseConfig } from './firebaseConfig';


const StorageWarningBanner: React.FC<{ onDismiss: () => void; onConnect: () => void; }> = ({ onDismiss, onConnect }) => (
    <div className="bg-red-600 text-white p-3 text-center text-sm flex justify-center items-center sticky top-0 z-50">
        <span className="flex-grow">
            <strong>Storage Full:</strong> To prevent data loss, please connect Google Drive in Settings to back up your data.
        </span>
        <button onClick={onConnect} className="ml-4 font-semibold text-sm underline px-2 py-1 rounded hover:bg-white/20">Connect</button>
        <button onClick={onDismiss} className="ml-2 font-bold text-lg">&times;</button>
    </div>
);

interface User {
  id: string;
  username: string;
  email: string;
}

interface MainAppProps {
    userId: string;
    currentUser: User | null;
    onLogout: () => void;
    onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
    onUpdateProfile: (details: { username: string; email: string; }) => Promise<string | null>;
    onAuthClick: () => void;
    onForgotPasswordRequest: (email: string) => Promise<string | null>;
    onForgotPasswordReset: (data: { code: string; newPassword: string }) => Promise<string | null>;
}

const TraktCallbackHandler: React.FC = () => {
    const [status, setStatus] = useState('Authenticating with Trakt, please wait...');
    const [error, setError] = useState<string | null>(null);
    const TRAKT_AUTH_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/traktAuth`;


    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const errorParam = urlParams.get('error');

            if (errorParam) {
                setError(`Error from Trakt: ${urlParams.get('error_description') || 'Unknown error'}.`);
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
                return;
            }

            if (!code) {
                setError('Invalid callback: No authorization code found.');
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
                return;
            }

            try {
                // FIX: Pass the TRAKT_AUTH_FUNCTION_URL as the second argument to exchangeCodeForToken.
                const token = await traktService.exchangeCodeForToken(code, TRAKT_AUTH_FUNCTION_URL);
                if (token) {
                    setStatus('Authentication successful! You can now import your data.');
                    sessionStorage.setItem('trakt_auth_complete', 'true');
                    setTimeout(() => window.location.href = '/', 2000); // Redirect to root after a short delay
                } else {
                    throw new Error('Token exchange returned no data.');
                }
            } catch (err: any) {
                console.error(err);
                setError(`Failed to authenticate with Trakt: ${err.message || 'Please try again.'}`);
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
            }
        };

        handleCallback();
    }, [TRAKT_AUTH_FUNCTION_URL]);

    // Render a more integrated loading page for the callback
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-bg-primary text-text-primary text-center p-4">
            <h1 className="text-3xl font-bold mb-4">Connecting to Trakt...</h1>
            {error ? (
                 <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">
                    <p className="font-bold">Authentication Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                 </div>
            ) : (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
            )}
            <p className="mt-4 text-text-secondary">{status}</p>
        </div>
    );
};


// FIX: Changed to a named export to resolve potential module resolution issues.
export const MainApp: React.FC<MainAppProps> = ({ userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, onForgotPasswordRequest, onForgotPasswordReset }) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>('customThemes', []);
  const [activeTheme, setTheme] = useTheme(customThemes);
  
  // State
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>(`watching_list_${userId}`, []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>(`plan_to_watch_list_${userId}`, []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>(`completed_list_${userId}`, []);
  const [onHold, setOnHold] = useLocalStorage<TrackedItem[]>(`on_hold_list_${userId}`, []);
  const [dropped, setDropped] = useLocalStorage<TrackedItem[]>(`dropped_list_${userId}`, []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>(`favorites_list_${userId}`, []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>(`watch_progress_${userId}`, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(`history_${userId}`, []);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`search_history_${userId}`, []);
  const [comments, setComments] = useLocalStorage<Comment[]>(`comments_${userId}`, []);
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [showStatusCache, setShowStatusCache] = useLocalStorage<Record<number, string>>(`show_status_cache_${userId}`, {});
  const [movieCollectionCache, setMovieCollectionCache] = useLocalStorage<Record<number, number>>(`movie_collection_cache_${userId}`, {});
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true,
    newEpisodes: true,
    movieReleases: true,
    sounds: true,
    newFollowers: true,
    listLikes: true,
    appUpdates: true,
    importSyncCompleted: true,
  });
  const [follows, setFollows] = useLocalStorage<Follows>(`sceneit_follows`, {});
  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, { activityVisibility: 'followers' });
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [initialProfileTab, setInitialProfileTab] = useState<ProfileTab>('overview');
  const [modalShow, setModalShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  // FIX: This state setter was used but not defined. It's used to force re-renders.
  const [refreshKey, setRefreshKey] = useState(0);
  const [genres, setGenres] = useState<Record<number, string>>({});
  
  // --- Live Watch State ---
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [liveWatchHistoryLogId, setLiveWatchHistoryLogId] = useState<string | null>(null);
  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});

  const liveWatchIntervalRef = useRef<number | null>(null);
  const liveWatchPauseTimeRef = useRef<number | null>(null);

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);


  // --- Google Drive State ---
  const [driveStatus, setDriveStatus] = useState<DriveStatus>({
    isGapiReady: false,
    isSignedIn: false,
    user: null,
    lastSync: localStorage.getItem('drive_last_sync'),
    isSyncing: false,
    error: null,
  });
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  
  // --- Auto Backup State & Logic ---
  const [autoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);

  // One-time data integrity check on startup to remove duplicates from lists
  useEffect(() => {
    const deDupeArrayById = <T extends { id: number }>(arr: T[]): T[] => {
        const seen = new Set<number>();
        return arr.filter(item => {
            if (seen.has(item.id)) {
                return false;
            }
            seen.add(item.id);
            return true;
        });
    };

    // Clean up main lists
    setWatching(deDupeArrayById);
    setPlanToWatch(deDupeArrayById);
    setCompleted(deDupeArrayById);
    setOnHold(deDupeArrayById);
    setDropped(deDupeArrayById);
    setFavorites(deDupeArrayById);
    
    // Clean up custom lists
    setCustomLists(prevLists => 
        prevLists.map(list => ({
            ...list,
            items: deDupeArrayById(list.items),
        }))
    );
  }, []); // Empty dependency array means this runs only once on mount

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const lastBackup = localStorage.getItem('auto_backup_last_timestamp');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastBackup && (now - parseInt(lastBackup, 10)) < oneDay) {
        return; // Backup is recent enough
    }
    
    try {
        const backupData: { [key: string]: string } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Backup all keys except the backup itself and session-like data
            if (key && key !== 'sceneit_local_backup' && key !== 'auto_backup_last_timestamp') {
                const value = localStorage.getItem(key);
                if (value) {
                    backupData[key] = value;
                }
            }
        }
        localStorage.setItem('sceneit_local_backup', JSON.stringify(backupData));
        localStorage.setItem('auto_backup_last_timestamp', now.toString());
        console.log("Automatic local backup completed.");
    } catch (error) {
        console.error("Failed to perform automatic local backup:", error);
    }
  }, [autoBackupEnabled]);


  // --- Achievements State ---
  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments
  }), [watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments]);
  const { achievements } = useAchievements(allUserData);

  // --- Handlers
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };
  
  const handleSelectShowInModal = (id: number, media_type: 'tv' | 'movie') => {
    setModalShow({ id, media_type });
  };

  const handleCloseModal = () => {
    setModalShow(null);
  };

  const handleSelectPerson = (personId: number) => {
    setSelectedPerson(personId);
    setSelectedShow(null);
    window.scrollTo(0, 0);
  };

  const handleSelectUser = (userId: string) => {
    setViewingUserId(userId);
  };
  
  const handleGoHome = () => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setActiveScreen('home');
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedShow(null);
    setSelectedPerson(null);
  };
  
  const handleTabPress = (tab: TabName) => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setActiveScreen(tab);
    if (tab !== 'search') {
      setSearchQuery('');
    }
    if (tab === 'profile') { // When using bottom nav, always go to overview
        setInitialProfileTab('overview');
    }
    window.scrollTo(0, 0);
  };

  const handleShortcutNavigate = (screen: ScreenName, profileTab?: ProfileTab) => {
    setSelectedShow(null);
    setActiveScreen(screen);
    if (screen === 'profile' && profileTab) {
        setInitialProfileTab(profileTab);
    }
    window.scrollTo(0, 0);
  };

  const handleAdjustHistoryTimestamp = (logId: string, durationToAddMs: number) => {
    setHistory(prev => prev.map(item => {
        if (item.logId === logId) {
            const newTimestamp = new Date(new Date(item.timestamp).getTime() + durationToAddMs).toISOString();
            return { ...item, timestamp: newTimestamp };
        }
        return item;
    }));
  };

  // --- Search History Handlers ---
  const handleUpdateSearchHistory = useCallback((query: string) => {
      setSearchHistory(prev => {
          const newEntry = { query, timestamp: new Date().toISOString() };
          const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
          const updated = [newEntry, ...filtered];
          return updated.slice(0, 20); // Keep last 20 searches
      });
  }, [setSearchHistory]);

  const handleDeleteSearchHistoryItem = useCallback((timestamp: string) => {
      setSearchHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  }, [setSearchHistory]);

  const handleClearSearchHistory = useCallback(() => {
      if (window.confirm("Are you sure you want to clear your search history?")) {
          setSearchHistory([]);
      }
  }, [setSearchHistory]);

  // --- Live Watch Handlers ---
  const handleStartLiveWatch = (mediaInfo: LiveWatchMediaInfo) => {
    const pausedSession = pausedLiveSessions[mediaInfo.id];
    let startSeconds = 0;

    if (pausedSession) {
        // Simple resume, could add a confirmation dialog later
        startSeconds = pausedSession.elapsedSeconds;
    }

    setLiveWatchElapsedSeconds(startSeconds);
    setLiveWatchIsPaused(false);
    liveWatchPauseTimeRef.current = null;
  
    const logId = `live-${mediaInfo.id}-${Date.now()}`;
    const startTime = new Date();
    // The timestamp is the *finish* time.
    const finishTime = new Date(startTime.getTime() + (mediaInfo.runtime * 60000) - (startSeconds * 1000));
    
    const newHistoryItem: HistoryItem = {
      logId: logId,
      id: mediaInfo.id,
      media_type: mediaInfo.media_type,
      title: mediaInfo.title,
      poster_path: mediaInfo.poster_path,
      timestamp: finishTime.toISOString(),
      seasonNumber: mediaInfo.seasonNumber,
      episodeNumber: mediaInfo.episodeNumber,
    };
    setHistory(prev => [newHistoryItem, ...prev]);
    setLiveWatchHistoryLogId(logId);

    // Remove from paused sessions now that it's active
    setPausedLiveSessions(prevPaused => {
        const newPaused = { ...prevPaused };
        delete newPaused[mediaInfo.id];
        return newPaused;
    });

    setLiveWatchMedia(mediaInfo); // Start everything by setting the media
  };
  
  const handleCloseLiveWatch = useCallback(() => {
    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    
    // Remove from paused sessions on stop
    if (liveWatchMedia) {
        setPausedLiveSessions(prevPaused => {
            const newPaused = { ...prevPaused };
            delete newPaused[liveWatchMedia.id];
            return newPaused;
        });
    }

    setLiveWatchMedia(null);
    setLiveWatchHistoryLogId(null);
  }, [liveWatchMedia, setPausedLiveSessions]);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => {
        const isNowPausing = !prev;
        if (isNowPausing) { // Pausing
            liveWatchPauseTimeRef.current = Date.now();
            if (liveWatchMedia) {
                setPausedLiveSessions(prevPaused => ({
                    ...prevPaused,
                    [liveWatchMedia.id]: {
                        mediaInfo: liveWatchMedia,
                        elapsedSeconds: liveWatchElapsedSeconds,
                        pausedAt: new Date().toISOString(),
                    }
                }));
            }
        } else { // Resuming
            if (liveWatchPauseTimeRef.current && liveWatchHistoryLogId) {
                const pausedDuration = Date.now() - liveWatchPauseTimeRef.current;
                handleAdjustHistoryTimestamp(liveWatchHistoryLogId, pausedDuration);
                liveWatchPauseTimeRef.current = null;
            }
        }
        return !prev;
    });
  }, [liveWatchHistoryLogId, liveWatchMedia, liveWatchElapsedSeconds, setPausedLiveSessions]);


  useEffect(() => {
    const cleanup = () => {
      if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
      liveWatchIntervalRef.current = null;
    };

    if (liveWatchMedia && !liveWatchIsPaused) {
      const runtimeInSeconds = liveWatchMedia.runtime * 60;
      liveWatchIntervalRef.current = window.setInterval(() => {
        setLiveWatchElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= runtimeInSeconds) {
            handleCloseLiveWatch();
          }
          return next;
        });
      }, 1000);
    } else {
      cleanup();
    }
    return cleanup;
  }, [liveWatchMedia, liveWatchIsPaused, handleCloseLiveWatch]);


    const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching,
            planToWatch: setPlanToWatch,
            completed: setCompleted,
            onHold: setOnHold,
            dropped: setDropped,
            favorites: setFavorites,
        };

        // Remove from all lists
        Object.values(setters).forEach(setter => {
            setter(prev => prev.filter(i => i.id !== item.id));
        });

        // Add to the new list
        if (newList && setters[newList]) {
            setters[newList](prev => [item, ...prev]);
        }
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setFavorites]);

    const removeMediaFromAllLists = useCallback((mediaIdToRemove: number) => {
        setWatching(prev => prev.filter(i => i.id !== mediaIdToRemove));
        setPlanToWatch(prev => prev.filter(i => i.id !== mediaIdToRemove));
        setCompleted(prev => prev.filter(c => c.id !== mediaIdToRemove));
        setOnHold(prev => prev.filter(i => i.id !== mediaIdToRemove));
        setDropped(prev => prev.filter(i => i.id !== mediaIdToRemove));
        setFavorites(prev => prev.filter(i => i.id !== mediaIdToRemove));
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setFavorites]);


  const handleUpdateCustomList = useCallback((listId: string, item: TrackedItem, action: 'add' | 'remove') => {
    setCustomLists(prevLists => {
        return prevLists.map(list => {
            if (list.id === listId) {
                let newItems = [...list.items];
                if (action === 'add') {
                    if (!newItems.some(i => i.id === item.id)) {
                        const { id, media_type, title, poster_path } = item;
                        newItems = [{ id, media_type, title, poster_path }, ...newItems];
                    }
                } else {
                    newItems = newItems.filter(i => i.id !== item.id);
                }
                return { ...list, items: newItems };
            }
            return list;
        });
    });
  }, [setCustomLists]);

  // --- Automatic list management on progress change ---
    useEffect(() => {
        const checkCompletion = async () => {
            // Create a stable copy of the array to iterate over
            const watchingTvShows = [...watching.filter(item => item.media_type === 'tv')];

            for (const show of watchingTvShows) {
                const progressForShow = watchProgress[show.id];
                if (!progressForShow) continue;

                try {
                    const details = await getMediaDetails(show.id, 'tv');
                    if (!details || !details.seasons || details.seasons.length === 0) continue;

                    const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
                    const totalEpisodes = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);

                    if (totalEpisodes === 0) continue;

                    let watchedCount = 0;
                    for (const season of seasonsForCalc) {
                        for (let i = 1; i <= season.episode_count; i++) {
                            if (progressForShow[season.season_number]?.[i]?.status === 2) {
                                watchedCount++;
                            }
                        }
                    }
                    
                    if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
                        updateLists(show, 'watching', 'completed');
                    }
                } catch (error) {
                    console.error(`Error during completion check for show ID ${show.id}:`, error);
                }
            }
        };

        checkCompletion();
    }, [watchProgress, watching, updateLists]);
    
    // --- Notification Logic ---
    const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        if (!notificationSettings.masterEnabled) return;
        
        // Check specific notification type settings
        if (notification.type === 'new_season' && !notificationSettings.newEpisodes) return;
        if (notification.type === 'new_sequel' && !notificationSettings.movieReleases) return;
        if (notification.type === 'achievement_unlocked' && !notificationSettings.appUpdates) return;
        if (notification.type === 'new_follower' && !notificationSettings.newFollowers) return;
        if (notification.type === 'list_like' && !notificationSettings.listLikes) return;


        setNotifications(prev => {
            const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
            const exists = prev.some(n => 
                n.mediaId === notification.mediaId && 
                n.type === notification.type &&
                new Date(n.timestamp).getTime() > twentyFourHoursAgo 
            );
            if (exists) {
                return prev;
            }
            const newNotification: AppNotification = {
                ...notification,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                read: false,
            };

            if(notificationSettings.sounds) {
                playNotificationSound();
            }

            return [newNotification, ...prev].slice(0, 50); // Keep max 50 notifications
        });
    }, [setNotifications, notificationSettings]);

    const handleMarkAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, [setNotifications]);

    const handleMarkOneNotificationRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

    // --- Welcome Modal Logic ---
    useEffect(() => {
        const hasVisited = localStorage.getItem('sceneit_has_visited');
        if (!hasVisited) {
            setIsWelcomeModalOpen(true);
            localStorage.setItem('sceneit_has_visited', 'true');
        }
    }, []); // Empty dependency array ensures this runs only once on mount


  // --- One-time initialization for new users ---
  useEffect(() => {
    const isInitialized = localStorage.getItem(`sceneit_initialized_${userId}`);
    if (!isInitialized) {
        localStorage.setItem(`sceneit_initialized_${userId}`, 'true');
        localStorage.setItem(`sceneit_join_date_${userId}`, new Date().toISOString());
    }
  }, [userId]);

  // --- Trakt Redirect Handler ---
  useEffect(() => {
    // This effect runs when the app loads on the main path after a Trakt redirect
    if (sessionStorage.getItem('trakt_auth_complete') === 'true') {
        sessionStorage.removeItem('trakt_auth_complete');
        handleShortcutNavigate('profile', 'imports');
    }
  }, []); // Empty dependency array, runs once on mount

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
  // --- Storage Warning ---
   useEffect(() => {
        if (localStorage.getItem('sceneit_storage_critical') === 'true') {
            setShowStorageWarning(true);
        }
    }, []);

    useEffect(() => {
        const checkForNewSeasons = async () => {
            try {
                const showsWithNewSeasons = await getNewSeasons(false, timezone);
                const watchingIds = new Set(watching.map(item => item.id));

                for (const details of showsWithNewSeasons) {
                    if (watchingIds.has(details.id)) {
                        const latestSeason = details.seasons
                            ?.filter(s => s.season_number > 0)
                            .sort((a, b) => b.season_number - a.season_number)[0];
                        
                        if (latestSeason) {
                            addNotification({
                                type: 'new_season',
                                mediaId: details.id,
                                mediaType: 'tv',
                                title: details.name || 'Unknown Show',
                                description: `${latestSeason.name} just premiered!`,
                                poster_path: details.poster_path,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to check for new season notifications", error);
            }
        };
        checkForNewSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watching, addNotification, timezone]);
  
  // --- Background Status Check for Notifications ---
  useEffect(() => {
    const runBackgroundChecks = async () => {
        const lastCheck = localStorage.getItem('last_status_check');
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000;

        if (lastCheck && now - parseInt(lastCheck, 10) < twoHours) {
            return;
        }

        const itemsToCheck = [...watching, ...planToWatch];
        
        // --- TV Show Status Check ---
        const showsToCheck = itemsToCheck.filter(item => item.media_type === 'tv');
        const uniqueShowIds = Array.from(new Set(showsToCheck.map(s => s.id)));
        const newStatusCache = { ...showStatusCache };
        let statusCacheUpdated = false;

        for (const showId of uniqueShowIds) {
            try {
                clearMediaCache(showId, 'tv'); 
                const details = await getMediaDetails(showId, 'tv');
                const newStatus = details.status;
                const oldStatus = showStatusCache[showId];
                
                if (newStatus && oldStatus && newStatus !== oldStatus) {
                    const showInfo = showsToCheck.find(s => s.id === showId);
                    if (showInfo) {
                        if (newStatus === 'Cancelled') {
                            addNotification({
                                type: 'status_change',
                                mediaId: showId,
                                mediaType: 'tv',
                                title: `Status Update: ${showInfo.title}`,
                                description: `Unfortunately, ${showInfo.title} has been officially cancelled.`,
                                poster_path: showInfo.poster_path,
                            });
                        } else if (newStatus === 'Returning Series' && oldStatus === 'Ended') {
                             addNotification({
                                type: 'new_season', 
                                mediaId: showId,
                                mediaType: 'tv',
                                title: `${showInfo.title} Renewed!`,
                                description: `${showInfo.title} has been renewed for a new season!`,
                                poster_path: showInfo.poster_path,
                            });
                        }
                    }
                }
                
                if (newStatus && newStatus !== oldStatus) {
                    newStatusCache[showId] = newStatus;
                    statusCacheUpdated = true;
                } else if (!oldStatus && newStatus) {
                    newStatusCache[showId] = newStatus;
                    statusCacheUpdated = true;
                }
            } catch (error) { console.error(`Failed to check status for show ID ${showId}`, error); }
            await new Promise(resolve => setTimeout(resolve, 300)); 
        }
        if (statusCacheUpdated) setShowStatusCache(newStatusCache);

        // --- Movie Sequel Check ---
        const moviesToCheck = itemsToCheck.filter(item => item.media_type === 'movie');
        const uniqueMovieIds = Array.from(new Set(moviesToCheck.map(m => m.id)));
        const newCollectionCache = { ...movieCollectionCache };
        let collectionCacheUpdated = false;

        for (const movieId of uniqueMovieIds) {
            try {
                const details = await getMediaDetails(movieId, 'movie');
                if (details.belongs_to_collection) {
                    const collectionId = details.belongs_to_collection.id;
                    const collectionDetails = await getCollectionDetails(collectionId);
                    const newPartCount = collectionDetails.parts.length;
                    const oldPartCount = movieCollectionCache[collectionId];

                    if (oldPartCount !== undefined && newPartCount > oldPartCount) {
                        const newestMovie = collectionDetails.parts.sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime())[0];
                        if (newestMovie) {
                            addNotification({
                                type: 'new_sequel',
                                mediaId: newestMovie.id,
                                mediaType: 'movie',
                                title: `New in "${collectionDetails.name}"`,
                                description: `${newestMovie.title || 'A new installment'} has been added to this collection.`,
                                poster_path: newestMovie.poster_path,
                            });
                        }
                    }
                    if (newPartCount !== oldPartCount) {
                        newCollectionCache[collectionId] = newPartCount;
                        collectionCacheUpdated = true;
                    }
                }
            } catch (error) { console.error(`Failed to check sequel status for movie ID ${movieId}`, error); }
             await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (collectionCacheUpdated) setMovieCollectionCache(newCollectionCache);

        localStorage.setItem('last_status_check', now.toString());
    };

    const timer = setTimeout(runBackgroundChecks, 10000); // Run check 10s after app load
    return () => clearTimeout(timer);
  }, [watching, planToWatch, showStatusCache, setShowStatusCache, movieCollectionCache, setMovieCollectionCache, addNotification]);


  const handleAddItemToList = useCallback((itemToAdd: TmdbMedia, list: WatchStatus) => {
    const trackedItem: TrackedItem = {
        id: itemToAdd.id,
        title: itemToAdd.title || itemToAdd.name || 'Untitled',
        media_type: itemToAdd.media_type,
        poster_path: itemToAdd.poster_path,
        genre_ids: itemToAdd.genre_ids,
    };
    updateLists(trackedItem, null, list);
  }, [updateLists]);

    const handleToggleEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem) => {
        const newStatus = currentStatus === 2 ? 0 : 2;

        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
        newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, status: newStatus };
        setWatchProgress(newProgress);
        
        // Bust the cache for this show to get fresh data on next load
        clearMediaCache(showId, 'tv');

        if (newStatus === 2) {
            const historyEntry: HistoryItem = {
                logId: `tv-${showId}-${seasonNumber}-${episodeNumber}-${Date.now()}`,
                id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                timestamp: new Date().toISOString(), seasonNumber, episodeNumber
            };
            setHistory(prev => [historyEntry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

            const isWatching = watching.some(i => i.id === showId);
            const isCompleted = completed.some(i => i.id === showId);
            if (!isWatching && !isCompleted) {
                updateLists(showInfo, null, 'watching');
            }
        } else {
            setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber)));
            
            let hasWatchedEpisodes = false;
            if (newProgress[showId]) {
                for (const sNum in newProgress[showId]) {
                    for (const eNum in newProgress[showId][sNum]) {
                        if (newProgress[showId][sNum][eNum]?.status === 2) {
                            hasWatchedEpisodes = true;
                            break;
                        }
                    }
                    if (hasWatchedEpisodes) break;
                }
            }

            if (!hasWatchedEpisodes) {
                updateLists(showInfo, 'watching', null);
            }
        }
    }, [watchProgress, setWatchProgress, setHistory, watching, completed, updateLists]);


  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber?: number, episodeNumber?: number, timestamp?: string, note?: string) => {
    const newTimestamp = timestamp || new Date().toISOString();
    const historyEntry: HistoryItem = {
        logId: `log-${item.id}-${newTimestamp}`,
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        timestamp: newTimestamp,
        seasonNumber: seasonNumber,
        episodeNumber: episodeNumber,
        note: note,
    };
    
    // Add to history and sort
    setHistory(prev => [...prev, historyEntry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    // Also mark as watched if it's a new log
    if (item.media_type === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined) {
        setWatchProgress(prev => {
            const newProgress = JSON.parse(JSON.stringify(prev));
            if (!newProgress[item.id]) newProgress[item.id] = {};
            if (!newProgress[item.id][seasonNumber]) newProgress[item.id][seasonNumber] = {};
            const epProgress = newProgress[item.id][seasonNumber][episodeNumber] || { status: 0 };
            newProgress[item.id][seasonNumber][episodeNumber] = { ...epProgress, status: 2 };
            return newProgress;
        });
    } else if (item.media_type === 'movie') {
        const isCompleted = completed.some(c => c.id === item.id);
        if (!isCompleted) {
            updateLists(item, null, 'completed');
        }
    }

  }, [setHistory, setWatchProgress, completed, updateLists]);


  const handleMarkShowAsWatched = useCallback((itemToMark: TmdbMedia | TrackedItem, date?: string) => {
      const trackedItem: TrackedItem = {
        id: itemToMark.id,
        title: itemToMark.title || (itemToMark as TmdbMedia).name || 'Untitled',
        media_type: itemToMark.media_type,
        poster_path: itemToMark.poster_path,
        genre_ids: itemToMark.genre_ids,
      };

      if (trackedItem.media_type === 'movie') {
          handleAddWatchHistory(trackedItem, undefined, undefined, date);
          if (date) { // If a specific date is given, don't move from plan to watch
              const isOnPlanToWatch = planToWatch.some(i => i.id === trackedItem.id);
              if (!isOnPlanToWatch) {
                 updateLists(trackedItem, null, 'completed');
              }
          } else {
             updateLists(trackedItem, 'planToWatch', 'completed');
          }
      } else {
          // TV Show
          if (window.confirm(`Mark all seasons and episodes of "${trackedItem.title}" as watched? This will add entries to your history.`)) {
              getMediaDetails(trackedItem.id, 'tv').then(details => {
                  if (!details || !details.seasons) return;
                  const newProgress = JSON.parse(JSON.stringify(watchProgress));
                  if (!newProgress[trackedItem.id]) newProgress[trackedItem.id] = {};
                  
                  const newHistory: HistoryItem[] = [];
                  const timestamp = date || new Date().toISOString();

                  details.seasons.forEach(season => {
                      if (season.season_number > 0) {
                          if (!newProgress[trackedItem.id][season.season_number]) newProgress[trackedItem.id][season.season_number] = {};
                          for (let i = 1; i <= season.episode_count; i++) {
                              const epProgress = newProgress[trackedItem.id][season.season_number][i] || { status: 0 };
                              newProgress[trackedItem.id][season.season_number][i] = { ...epProgress, status: 2 };
                              newHistory.push({
                                  logId: `tv-${trackedItem.id}-${season.season_number}-${i}-${Date.now()}`,
                                  id: trackedItem.id, media_type: 'tv', title: trackedItem.title, poster_path: trackedItem.poster_path,
                                  timestamp, seasonNumber: season.season_number, episodeNumber: i
                              });
                          }
                      }
                  });
                  setWatchProgress(newProgress);
                  setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                  updateLists(trackedItem, null, 'completed');
              });
          }
      }
  }, [updateLists, handleAddWatchHistory, planToWatch, watchProgress, setWatchProgress, setHistory]);

  const handleMarkSeasonWatched = useCallback((showId: number, seasonNumber: number, showInfo: TrackedItem) => {
    getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        
        const newHistory: HistoryItem[] = [];
        const timestamp = new Date().toISOString();
        
        seasonDetails.episodes.forEach(ep => {
            const epProgress = newProgress[showId][seasonNumber][ep.episode_number] || { status: 0 };
            if (epProgress.status !== 2) {
                 newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                 newHistory.push({
                    logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                    id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                    timestamp, seasonNumber, episodeNumber: ep.episode_number
                 });
            }
        });
        
        setWatchProgress(newProgress);
        setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

        const isWatching = watching.some(i => i.id === showId);
        if (!isWatching) {
            updateLists(showInfo, null, 'watching');
        }
    });
  }, [watchProgress, setWatchProgress, setHistory, watching, updateLists]);
  
  const handleUnmarkSeasonWatched = useCallback((showId: number, seasonNumber: number) => {
    getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (newProgress[showId]?.[seasonNumber]) {
            seasonDetails.episodes.forEach(ep => {
                if (newProgress[showId][seasonNumber][ep.episode_number]) {
                    newProgress[showId][seasonNumber][ep.episode_number].status = 0;
                }
            });
        }
        
        setWatchProgress(newProgress);
        setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber)));
        
        let hasWatchedEpisodes = false;
        if (newProgress[showId]) {
            for (const sNum in newProgress[showId]) {
                if (hasWatchedEpisodes) break;
                for (const eNum in newProgress[showId][sNum]) {
                    if (newProgress[showId][sNum][eNum]?.status === 2) {
                        hasWatchedEpisodes = true;
                        break;
                    }
                }
            }
        }
        
        if (!hasWatchedEpisodes) {
            const itemToRemove = watching.find(i => i.id === showId) || onHold.find(i => i.id === showId);
            if (itemToRemove) {
                 const currentList = watching.some(i => i.id === showId) ? 'watching' : 'onHold';
                 updateLists(itemToRemove, currentList, null);
            }
        }
    });
}, [watchProgress, setWatchProgress, setHistory, updateLists, watching, onHold]);
  
  const handleMarkRemainingWatched = useCallback((showId: number, seasonNumber: number, showInfo: TrackedItem) => {
      getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
          const newProgress = JSON.parse(JSON.stringify(watchProgress));
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const newHistory: HistoryItem[] = [];
          const timestamp = new Date().toISOString();

          seasonDetails.episodes.forEach(ep => {
              const epProgress = newProgress[showId][seasonNumber]?.[ep.episode_number] || { status: 0 };
              if (epProgress.status !== 2) {
                  newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                  newHistory.push({
                      logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                      id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                      timestamp, seasonNumber, episodeNumber: ep.episode_number
                  });
              }
          });
          
          setWatchProgress(newProgress);
          setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
  }, [watchProgress, setWatchProgress, setHistory]);

  const handleMarkPreviousEpisodesWatched = useCallback((showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
      const newProgress = JSON.parse(JSON.stringify(watchProgress));
      if (!newProgress[showId]) newProgress[showId] = {};
      if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};

      for (let i = 1; i <= lastEpisodeNumber; i++) {
          const epProgress = newProgress[showId][seasonNumber][i] || { status: 0 };
          newProgress[showId][seasonNumber][i] = { ...epProgress, status: 2 };
      }
      setWatchProgress(newProgress);
  }, [watchProgress, setWatchProgress]);

  const handleSaveJournal = useCallback((showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => {
    setWatchProgress(prev => {
        const newProgress = JSON.parse(JSON.stringify(prev));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
        
        if (entry) {
            newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, journal: entry };
        } else {
            delete newProgress[showId][seasonNumber][episodeNumber].journal;
            // If the episode has no other data, remove it.
            if (Object.keys(newProgress[showId][seasonNumber][episodeNumber]).length === 0) {
                delete newProgress[showId][seasonNumber][episodeNumber];
            }
        }
        return newProgress;
    });
  }, [setWatchProgress]);

  const handleSaveComment = useCallback((mediaKey: string, text: string) => {
      setComments(prev => {
          const existingIndex = prev.findIndex(c => c.mediaKey === mediaKey);
          if (text.trim() === '') {
              // If text is empty, remove the comment
              return prev.filter(c => c.mediaKey !== mediaKey);
          }
          if (existingIndex > -1) {
              const updatedComments = [...prev];
              updatedComments[existingIndex] = { ...updatedComments[existingIndex], text, timestamp: new Date().toISOString() };
              return updatedComments;
          } else {
              const newComment: Comment = {
                  id: `comment-${Date.now()}`,
                  mediaKey,
                  text,
                  timestamp: new Date().toISOString()
              };
              return [newComment, ...prev];
          }
      });
  }, [setComments]);

  const handleSetCustomImage = useCallback((mediaId: number, type: 'poster' | 'backdrop', path: string) => {
    setCustomImagePaths(prev => ({
        ...prev,
        [mediaId]: {
            ...prev[mediaId],
            [`${type}_path`]: path,
        }
    }));
  }, [setCustomImagePaths]);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === item.id);
        if (isFav) {
            return prev.filter(f => f.id !== item.id);
        } else {
            return [item, ...prev];
        }
    });
  }, [setFavorites]);
  
  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
    setFavoriteEpisodes(prev => {
        const newFavs = JSON.parse(JSON.stringify(prev));
        if (!newFavs[showId]) newFavs[showId] = {};
        if (!newFavs[showId][seasonNumber]) newFavs[showId][seasonNumber] = {};
        
        if (newFavs[showId][seasonNumber][episodeNumber]) {
            delete newFavs[showId][seasonNumber][episodeNumber];
        } else {
            newFavs[showId][seasonNumber][episodeNumber] = true;
        }
        return newFavs;
    });
  }, [setFavoriteEpisodes]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
      setRatings(prev => {
          if (rating === 0) { // Un-rate
              const newRatings = { ...prev };
              delete newRatings[mediaId];
              return newRatings;
          }
          return {
              ...prev,
              [mediaId]: { rating, date: new Date().toISOString() },
          }
      });
  }, [setRatings]);
  
   const handleRateEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, rating: number) => {
      setEpisodeRatings(prev => {
          const newRatings = JSON.parse(JSON.stringify(prev));
          if (!newRatings[showId]) newRatings[showId] = {};
          if (!newRatings[showId][seasonNumber]) newRatings[showId][seasonNumber] = {};

          if (rating === 0) {
              delete newRatings[showId][seasonNumber][episodeNumber];
          } else {
              newRatings[showId][seasonNumber][episodeNumber] = rating;
          }
          return newRatings;
      });
  }, [setEpisodeRatings]);


  const handleOpenCustomListModal = (item: TmdbMedia | TrackedItem) => {
      setAddToListModalState({ isOpen: true, item: item });
  };
  
  const handleAddToList = (listId: string, item: CustomListItem) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              if (list.items.some(i => i.id === item.id)) return list; // Already exists
              return { ...list, items: [item, ...list.items] };
          }
          return list;
      }));
  };
  
  const handleCreateAndAddToList = (listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`,
          name: listName,
          description: '',
          items: [item],
          createdAt: new Date().toISOString(),
          isPublic: false,
      };
      setCustomLists(prev => [newList, ...prev]);
  };
  
  const handleFollow = (userIdToFollow: string, username: string) => {
    if (!currentUser) return;
    setFollows(prev => {
        const following = prev[currentUser.id] || [];
        if (following.includes(userIdToFollow)) return prev;
        
        addNotification({
            type: 'new_follower',
            title: 'You followed a user!',
            description: `You are now following ${username}.`,
        });
        
        return { ...prev, [currentUser.id]: [...following, userIdToFollow] };
    });
  };

  const handleUnfollow = (userIdToUnfollow: string) => {
      if (!currentUser) return;
      setFollows(prev => {
          const following = prev[currentUser.id] || [];
          return { ...prev, [currentUser.id]: following.filter(id => id !== userIdToUnfollow) };
      });
  };

  const handleToggleLikeList = (ownerId: string, listId: string, listName: string) => {
      if (!currentUser) {
          onAuthClick();
          return;
      }
      
      const ownerListsKey = `custom_lists_${ownerId}`;
      const ownerListsJson = localStorage.getItem(ownerListsKey);
      if (!ownerListsJson) return;

      const ownerLists: CustomList[] = JSON.parse(ownerListsJson);
      const listIndex = ownerLists.findIndex(l => l.id === listId);
      if (listIndex === -1) return;

      const list = ownerLists[listIndex];
      const likes = list.likes || [];
      const userIndex = likes.indexOf(currentUser.id);
      
      if (userIndex > -1) {
          likes.splice(userIndex, 1);
      } else {
          likes.push(currentUser.id);
          addNotification({
              type: 'list_like',
              listId: listId,
              listName: listName,
              likerInfo: { userId: currentUser.id, username: currentUser.username },
              title: 'Your list was liked!',
              description: `${currentUser.username} liked your list: "${listName}"`
          });
      }

      ownerLists[listIndex] = { ...list, likes };
      localStorage.setItem(ownerListsKey, JSON.stringify(ownerLists));
      
      // Force a re-render if the user is viewing their own profile or search
      if (activeScreen === 'profile' || activeScreen === 'search') {
          setRefreshKey(prev => prev + 1);
      }
  };


  const handleDeleteHistoryItem = useCallback((logId: string) => {
      setHistory(prev => prev.filter(h => h.logId !== logId));
  }, [setHistory]);
  
  const handleClearMediaHistory = useCallback((mediaId: number, mediaType: 'tv' | 'movie') => {
      setHistory(prev => prev.filter(h => h.id !== mediaId));
      if (mediaType === 'tv') {
          setWatchProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[mediaId];
              return newProgress;
          });
      }
      // Reset from completed list as well
      setCompleted(prev => prev.filter(c => c.id !== mediaId));
  }, [setHistory, setWatchProgress, setCompleted]);


  const handleImportCompleted = (historyItems: HistoryItem[], completedItems: TrackedItem[]) => {
      setHistory(prev => [...prev, ...historyItems].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setCompleted(prev => [...prev, ...completedItems]);
      if (notificationSettings.importSyncCompleted) {
          addNotification({
              type: 'recommendation', // Using a generic type for now
              title: 'Import Complete',
              description: `Successfully imported ${completedItems.length} items from your file.`,
          });
      }
  };
  
  const handleTraktImportCompleted = (data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => {
    // Merge history
    setHistory(prev => [...prev, ...data.history].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    // Merge completed, planToWatch (deduplicating)
    const deDupe = (original: TrackedItem[], additions: TrackedItem[]) => {
        const existingIds = new Set(original.map(i => i.id));
        return [...original, ...additions.filter(i => !existingIds.has(i.id))];
    };
    setCompleted(prev => deDupe(prev, data.completed));
    setPlanToWatch(prev => deDupe(prev, data.planToWatch));
    
    // Merge watch progress
    setWatchProgress(prev => {
        const newProgress = JSON.parse(JSON.stringify(prev));
        for (const showId in data.watchProgress) {
            if (!newProgress[showId]) {
                newProgress[showId] = data.watchProgress[showId];
            } else {
                for (const seasonNum in data.watchProgress[showId]) {
                     if (!newProgress[showId][seasonNum]) {
                         newProgress[showId][seasonNum] = data.watchProgress[showId][seasonNum];
                     } else {
                         // User's existing data takes precedence
                         newProgress[showId][seasonNum] = {...data.watchProgress[showId][seasonNum], ...newProgress[showId][seasonNum]};
                     }
                }
            }
        }
        return newProgress;
    });

    // Merge ratings (Trakt ratings take precedence for simplicity)
    setRatings(prev => ({...prev, ...data.ratings}));

    if (notificationSettings.importSyncCompleted) {
        addNotification({
            type: 'recommendation',
            title: 'Trakt Import Complete',
            description: 'Successfully imported your data from Trakt.tv.',
        });
    }
  };
  
  const handleRemoveDuplicateHistory = () => {
      setHistory(prev => {
          if (prev.length < 2) return prev;
          const uniqueHistory: HistoryItem[] = [];
          const seen = new Set<string>(); // "mediaId-season-episode"
          const sorted = [...prev].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          sorted.forEach(item => {
              const key = `${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
              if (!seen.has(key)) {
                  uniqueHistory.push(item);
                  seen.add(key);
              }
          });

          const final = uniqueHistory.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const removedCount = prev.length - final.length;
          if (removedCount > 0) {
              alert(`Removed ${removedCount} duplicate history entries.`);
          } else {
              alert("No duplicate entries found.");
          }
          return final;
      });
  };


  // Render
  if (window.location.pathname.startsWith('/auth/trakt/callback')) {
      return <TraktCallbackHandler />;
  }
  
  const renderScreen = () => {
    if (selectedPerson) return <ActorDetail personId={selectedPerson} onBack={handleBack} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} />;
    if (selectedShow) return <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={handleSaveJournal} trackedLists={{watching, planToWatch, completed, onHold, dropped}} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} onSelectShow={handleSelectShow} onOpenCustomListModal={handleOpenCustomListModal} ratings={ratings} onRateItem={handleRateItem} onMarkAllWatched={handleMarkShowAsWatched} onMarkSeasonWatched={handleMarkSeasonWatched} onUnmarkSeasonWatched={handleUnmarkSeasonWatched} onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectPerson={handleSelectPerson} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem} onClearMediaHistory={handleClearMediaHistory} episodeRatings={episodeRatings} onRateEpisode={handleRateEpisode} onAddWatchHistory={handleAddWatchHistory} onSaveComment={handleSaveComment} comments={comments} onMarkRemainingWatched={handleMarkRemainingWatched} genres={genres} />;

    switch (activeScreen) {
      case 'home': return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShowInModal} watchProgress={watchProgress} onToggleEpisode={(...args) => handleToggleEpisode(...args, watching.find(i => i.id === args[0])!)} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={handleOpenCustomListModal} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleCloseLiveWatch} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} />;
      case 'recommendations': return <Recommendations onSelectShow={handleSelectShow} userData={allUserData} onMarkShowAsWatched={handleMarkShowAsWatched} onOpenAddToListModal={handleOpenCustomListModal} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} />;
      case 'search': return <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={handleSelectPerson} onSelectUser={handleSelectUser} searchHistory={searchHistory} onUpdateSearchHistory={handleUpdateSearchHistory} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={handleMarkShowAsWatched} onOpenAddToListModal={handleOpenCustomListModal} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={handleToggleLikeList} />;
      case 'progress': return <ProgressScreen userData={allUserData} onToggleEpisode={(...args) => handleToggleEpisode(...args, watching.find(i => i.id === args[0])!)} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={handleStartLiveWatch} />;
      case 'profile': return <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} driveStatus={driveStatus} onDriveSignIn={()=>{}} onDriveSignOut={()=>{}} onBackupToDrive={()=>{}} onRestoreFromDrive={()=>{}} onImportCompleted={handleImportCompleted} onTraktImportCompleted={handleTraktImportCompleted} onToggleEpisode={(...args) => handleToggleEpisode(...args, watching.find(i => i.id === args[0])!)} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} setCustomLists={setCustomLists} initialTab={initialProfileTab} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={handleDeleteHistoryItem} onDeleteSearchHistoryItem={handleDeleteSearchHistoryItem} onClearSearchHistory={handleClearSearchHistory} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onSelectUser={handleSelectUser} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={handleRemoveDuplicateHistory} notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onMarkOneRead={handleMarkOneNotificationRead} />;
      default: return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShowInModal} watchProgress={watchProgress} onToggleEpisode={(...args) => handleToggleEpisode(...args, watching.find(i => i.id === args[0])!)} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={handleOpenCustomListModal} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleCloseLiveWatch} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary font-sans">
      {showStorageWarning && <StorageWarningBanner onDismiss={() => setShowStorageWarning(false)} onConnect={() => handleShortcutNavigate('profile', 'imports')} />}
      
      <Header currentUser={currentUser} onAuthClick={onAuthClick} onSelectShow={handleSelectShow} onGoHome={handleGoHome} onMarkShowAsWatched={handleMarkShowAsWatched} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'}/>
      <main className={`pb-20 ${selectedShow ? '' : 'pt-6'}`}>
        {renderScreen()}
      </main>

      {/* --- Global Modals --- */}
      {viewingUserId && <UserProfileModal userId={viewingUserId} currentUser={currentUser!} follows={follows[currentUser?.id || ''] || []} onFollow={handleFollow} onUnfollow={handleUnfollow} onClose={() => setViewingUserId(null)} onToggleLikeList={handleToggleLikeList} />}
      {modalShow && <ShowDetail isModal id={modalShow.id} mediaType={modalShow.media_type} onBack={handleCloseModal} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={handleSaveJournal} trackedLists={{watching, planToWatch, completed, onHold, dropped}} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} onSelectShow={handleSelectShowInModal} onOpenCustomListModal={handleOpenCustomListModal} ratings={ratings} onRateItem={handleRateItem} onMarkAllWatched={handleMarkShowAsWatched} onMarkSeasonWatched={handleMarkSeasonWatched} onUnmarkSeasonWatched={handleUnmarkSeasonWatched} onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectPerson={handleSelectPerson} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem} onClearMediaHistory={handleClearMediaHistory} episodeRatings={episodeRatings} onRateEpisode={handleRateEpisode} onAddWatchHistory={handleAddWatchHistory} onSaveComment={handleSaveComment} comments={comments} onMarkRemainingWatched={handleMarkRemainingWatched} genres={genres} />}
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={handleSelectShow} />
      <LiveWatchTracker isOpen={!!liveWatchMedia} onClose={handleCloseLiveWatch} mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={handleLiveWatchTogglePause} isMinimized={!selectedShow && !selectedPerson} />
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} timezone={timezone} setTimezone={setTimezone} />
      
      {!selectedShow && !selectedPerson && <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} />}
    </div>
  );
};