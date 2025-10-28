
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, getNewSeasons, clearMediaCache, getMediaDetails, getCollectionDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, DriveStatus, FavoriteEpisodes, ProfileTab, ScreenName, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo, CustomListItem, EpisodeRatings, SearchHistoryItem, Comment, Theme, ShowProgress, TraktToken } from './types';
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
    onAuthClick: () => void;
}

const TraktCallbackHandler: React.FC = () => {
    const [status, setStatus] = useState('Authenticating with Trakt, please wait...');
    const [error, setError] = useState<string | null>(null);

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
                const token = await traktService.exchangeCodeForToken(code);
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
    }, []);

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



const MainApp: React.FC<MainAppProps> = ({ userId, currentUser, onLogout, onUpdatePassword, onAuthClick }) => {
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
    appAnnouncements: true,
    sounds: true,
  });
  
  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [initialProfileTab, setInitialProfileTab] = useState<ProfileTab>('overview');
  const [modalShow, setModalShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  
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
        if (notification.type === 'achievement_unlocked' && !notificationSettings.appAnnouncements) return;


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
                const showsWithNewSeasons = await getNewSeasons();
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
    }, [watching, addNotification]);
  
  // --- Background Status Check for Notifications ---
  useEffect(() => {
    const runBackgroundChecks = async () => {
        const lastCheck = localStorage.getItem('last_status_check');
        const now = Date.now();
        const twelveHours = 12 * 60 * 60 * 1000;

        if (lastCheck && now - parseInt(lastCheck, 10) < twelveHours) {
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

    const handleToggleEpisode = (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem) => {
        const newStatus = currentStatus === 2 ? 0 : 2;

        setWatchProgress(prev => {
            const newProgress = JSON.parse(JSON.stringify(prev));
            if (!newProgress[showId]) newProgress[showId] = {};
            if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
            const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
            newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, status: newStatus };
            return newProgress;
        });

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
        }
    };


  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber?: number, episodeNumber?: number, timestamp?: string, note?: string) => {
    const newTimestamp = timestamp || new Date().toISOString();
    const logId = `rewatch-${item.id}-${newTimestamp}-${Math.random()}`;
    
    const historyEntry: HistoryItem = {
        logId,
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        timestamp: newTimestamp,
        seasonNumber,
        episodeNumber,
        note,
    };

    setHistory(prev => [historyEntry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, [setHistory]);

    const handleMarkAllWatched = (showId: number, showInfo: TrackedItem) => {
        getMediaDetails(showId, 'tv').then(async (details) => {
            if (!details || !details.seasons) return;

            const today = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toISOString();
            
            const newHistoryItems: HistoryItem[] = [];
            
            const newProgress = JSON.parse(JSON.stringify(watchProgress));
            if (!newProgress[showId]) newProgress[showId] = {};

            const seasonsToProcess = details.seasons.filter(s => s.season_number > 0);

            for (const season of seasonsToProcess) {
                try {
                    const seasonDetails = await getSeasonDetails(showId, season.season_number);
                    if (!newProgress[showId][season.season_number]) newProgress[showId][season.season_number] = {};
                    
                    seasonDetails.episodes.forEach(episode => {
                        if (episode.air_date && episode.air_date <= today && watchProgress[showId]?.[season.season_number]?.[episode.episode_number]?.status !== 2) {
                            newProgress[showId][season.season_number][episode.episode_number] = { status: 2 };
                            newHistoryItems.push({
                                logId: `tv-${showId}-${season.season_number}-${episode.episode_number}-${timestamp}-${Math.random()}`,
                                id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                                timestamp, seasonNumber: season.season_number, episodeNumber: episode.episode_number
                            });
                        }
                    });
                } catch (error) {
                    console.error(`Failed to fetch season ${season.season_number} details for marking all watched`, error);
                }
            }
            
            if (newHistoryItems.length > 0) {
                setHistory(prevHistory => [...newHistoryItems.reverse(), ...prevHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                setWatchProgress(newProgress);

                const isWatching = watching.some(i => i.id === showId);
                const isCompleted = completed.some(i => i.id === showId);
                if (!isWatching && !isCompleted) {
                    const wasPlanToWatch = planToWatch.some(i => i.id === showId);
                    const wasOnHold = onHold.some(i => i.id === showId);
                    const wasDropped = dropped.some(i => i.id === showId);
                    let oldList: WatchStatus | null = null;
                    if (wasPlanToWatch) oldList = 'planToWatch';
                    else if (wasOnHold) oldList = 'onHold';
                    else if (wasDropped) oldList = 'dropped';
                    updateLists(showInfo, oldList, 'watching');
                }
            }
        }).catch(error => console.error("Failed to mark all as watched:", error));
    };

  const handleMarkShowAsWatched = (item: TmdbMedia, date?: string) => {
    const trackedItem: TrackedItem = {
        id: item.id,
        title: item.title || item.name || 'Untitled',
        media_type: item.media_type,
        poster_path: item.poster_path,
        genre_ids: item.genre_ids,
    };

    if (item.media_type === 'movie') {
        const timestamp = date || new Date().toISOString();
        const historyEntry: HistoryItem = {
            logId: `movie-${item.id}-${new Date(timestamp).getTime()}`,
            id: item.id, media_type: 'movie', title: trackedItem.title, poster_path: item.poster_path, timestamp
        };
        setHistory(prev => [historyEntry, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        updateLists(trackedItem, null, 'completed');
    } else {
        handleMarkAllWatched(item.id, trackedItem);
    }
  };
  
    const handleMarkPreviousEpisodesWatched = (showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
        const showInfo = watching.find(s => s.id === showId);
        if (!showInfo) return;

        setWatchProgress(prevProgress => {
            const newProgress = JSON.parse(JSON.stringify(prevProgress));
            if (!newProgress[showId]) newProgress[showId] = {};
            if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};

            const newHistoryItems: HistoryItem[] = [];
            const timestamp = new Date().toISOString();

            for (let i = 1; i <= lastEpisodeNumber; i++) {
                if (prevProgress[showId]?.[seasonNumber]?.[i]?.status !== 2) {
                    newProgress[showId][seasonNumber][i] = { status: 2 };
                    newHistoryItems.push({
                        logId: `tv-${showId}-${seasonNumber}-${i}-${timestamp}-${Math.random()}`,
                        id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                        timestamp, seasonNumber, episodeNumber: i
                    });
                }
            }
            if (newHistoryItems.length > 0) {
                // Reverse the newly created items so the last episode appears first in the history.
                setHistory(prevHistory => [...newHistoryItems.reverse(), ...prevHistory]);
            }
            return newProgress;
        });
    };

  const handleSaveComment = useCallback((mediaKey: string, text: string) => {
    setComments(prev => {
        const existingCommentIndex = prev.findIndex(c => c.mediaKey === mediaKey);
        
        if (text.trim() === '') {
            if (existingCommentIndex > -1) {
                return prev.filter((_, index) => index !== existingCommentIndex);
            }
            return prev;
        }

        if (existingCommentIndex > -1) {
            const updatedComments = [...prev];
            updatedComments[existingCommentIndex] = { ...updatedComments[existingCommentIndex], text: text, timestamp: new Date().toISOString() };
            return updatedComments;
        } else {
            const newComment: Comment = {
                id: `comment-${Date.now()}-${Math.random()}`, mediaKey: mediaKey,
                text: text, timestamp: new Date().toISOString()
            };
            return [newComment, ...prev];
        }
    });
  }, [setComments]);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
        const isFavorited = prev.some(i => i.id === item.id);
        if (isFavorited) {
            return prev.filter(i => i.id !== item.id);
        } else {
            return [item, ...prev];
        }
    });
  }, [setFavorites]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
    setRatings(prev => ({
        ...prev,
        [mediaId]: { rating, date: new Date().toISOString() }
    }));
  }, [setRatings]);
  
  const handleRateEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, rating: number) => {
    setEpisodeRatings(prev => {
        const newRatings = JSON.parse(JSON.stringify(prev));
        if (!newRatings[showId]) newRatings[showId] = {};
        if (!newRatings[showId][seasonNumber]) newRatings[showId][seasonNumber] = {};
        newRatings[showId][seasonNumber][episodeNumber] = rating;
        return newRatings;
    });
  }, [setEpisodeRatings]);

  const handleSaveJournal = useCallback((showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => {
    setWatchProgress(prev => {
        const newProgress = JSON.parse(JSON.stringify(prev));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        if (!newProgress[showId][seasonNumber][episodeNumber]) newProgress[showId][seasonNumber][episodeNumber] = { status: 0 };
        
        if (entry) {
          newProgress[showId][seasonNumber][episodeNumber].journal = entry;
        } else {
          if (newProgress[showId]?.[seasonNumber]?.[episodeNumber]?.journal) {
              delete newProgress[showId][seasonNumber][episodeNumber].journal;
          }
        }
        
        return newProgress;
    });
  }, [setWatchProgress]);

  const handleSetCustomImage = useCallback((mediaId: number, type: 'poster' | 'backdrop', path: string) => {
    setCustomImagePaths(prev => ({
        ...prev,
        [mediaId]: {
            ...prev[mediaId],
            [type === 'poster' ? 'poster_path' : 'backdrop_path']: path,
        }
    }));
  }, [setCustomImagePaths]);

    const handleDeleteHistoryItem = (logId: string) => {
        setHistory(prev => prev.filter(item => item.logId !== logId));
    };
    
    const handleClearMediaHistory = useCallback((mediaIdToClear: number, mediaType: 'tv' | 'movie') => {
        const allItems = [...watching, ...completed, ...planToWatch, ...onHold, ...dropped, ...favorites];
        const item = allItems.find(i => i.id === mediaIdToClear);

        const mediaTypeName = mediaType === 'tv' ? 'show' : 'movie';
        const message = `Are you sure you want to clear all history for this ${mediaTypeName}? This will also reset its watch progress if it's a show. This action cannot be undone.`;

        if (window.confirm(message)) {
            // 1. Clear history entries
            setHistory(prev => prev.filter(h => h.id !== mediaIdToClear));

            if (mediaType === 'tv') {
                // 2. Clear watch progress
                setWatchProgress(prev => {
                    const newProgress = JSON.parse(JSON.stringify(prev));
                    if (newProgress[mediaIdToClear]) {
                        delete newProgress[mediaIdToClear];
                    }
                    return newProgress;
                });

                // 3. Update lists if necessary
                // If the show was on the 'completed' list, move it to 'watching' as it's no longer fully watched.
                if (item && completed.some(c => c.id === mediaIdToClear)) {
                    updateLists(item, 'completed', 'watching');
                }
            } else { // It's a movie
                // For a movie, clearing history implies it is no longer completed. Remove from that list.
                setCompleted(prev => prev.filter(c => c.id !== mediaIdToClear));
            }
        }
    }, [watching, completed, planToWatch, onHold, dropped, favorites, setHistory, setWatchProgress, setCompleted, updateLists]);


  const handleImportCompleted = useCallback((historyItems: HistoryItem[], completedItems: TrackedItem[]) => {
    const uniqueHistory = historyItems.filter(h => !history.some(existing => existing.logId === h.logId));
    const uniqueCompleted = completedItems.filter(c => !completed.some(existing => existing.id === c.id));
    
    setHistory(prev => [...uniqueHistory, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setCompleted(prev => [...uniqueCompleted, ...prev]);
  }, [history, completed, setHistory, setCompleted]);

  const handleTraktImportCompleted = useCallback((data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => {
    const mergeUniqueById = (arr1: TrackedItem[], arr2: TrackedItem[]): TrackedItem[] => {
      const combined = [...arr1, ...arr2];
      const map = new Map(combined.map(item => [item.id, item]));
      return Array.from(map.values());
    };

    setHistory(prev => {
        const existingLogIds = new Set(prev.map(p => p.logId));
        const uniqueNew = data.history.filter(h => !existingLogIds.has(h.logId));
        return [...uniqueNew, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    });
    setCompleted(prev => mergeUniqueById(prev, data.completed));
    setPlanToWatch(prev => mergeUniqueById(prev, data.planToWatch));
    
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
              newProgress[showId][seasonNum] = {
                ...newProgress[showId][seasonNum],
                ...data.watchProgress[showId][seasonNum]
              };
            }
          }
        }
      }
      return newProgress;
    });

    setRatings(prev => ({ ...prev, ...data.ratings }));
    alert('Trakt import complete! Your data has been merged.');

  }, [setHistory, setCompleted, setPlanToWatch, setWatchProgress, setRatings]);

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
  
  const handleOpenAddToListModal = (item: TmdbMedia | TrackedItem) => {
      setAddToListModalState({ isOpen: true, item });
  };
  
  const handleAddItemToCustomList = useCallback((listId: string, item: CustomListItem) => {
    setCustomLists(prev => prev.map(list => {
        if (list.id === listId) {
            if (list.items.some(i => i.id === item.id)) return list; // Already exists
            return { ...list, items: [item, ...list.items] };
        }
        return list;
    }));
  }, [setCustomLists]);

  const handleCreateAndAddToList = useCallback((listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`,
          name: listName,
          description: '',
          items: [item],
          createdAt: new Date().toISOString(),
      };
      setCustomLists(prev => [newList, ...prev]);
  }, [setCustomLists]);

    const handleMarkSeasonWatched = (showId: number, seasonNumber: number, showInfo: TrackedItem) => {
        getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
            const today = new Date().toISOString().split('T')[0];
            const timestamp = new Date().toISOString();
            const newHistoryItems: HistoryItem[] = [];
            
            const newProgress = JSON.parse(JSON.stringify(watchProgress));
            if (!newProgress[showId]) newProgress[showId] = {};
            if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
            
            seasonDetails.episodes.forEach(ep => {
                if (ep.air_date && ep.air_date <= today && watchProgress[showId]?.[seasonNumber]?.[ep.episode_number]?.status !== 2) {
                    newProgress[showId][seasonNumber][ep.episode_number] = { status: 2 };
                    newHistoryItems.push({
                        logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${timestamp}-${Math.random()}`,
                        id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                        timestamp, seasonNumber, episodeNumber: ep.episode_number
                    });
                }
            });

            if (newHistoryItems.length > 0) {
                setHistory(prevHistory => [...newHistoryItems.reverse(), ...prevHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                setWatchProgress(newProgress);

                const isWatching = watching.some(i => i.id === showId);
                const isCompleted = completed.some(i => i.id === showId);
                if (!isWatching && !isCompleted) {
                    const wasPlanToWatch = planToWatch.some(i => i.id === showId);
                    const wasOnHold = onHold.some(i => i.id === showId);
                    const wasDropped = dropped.some(i => i.id === showId);
                    let oldList: WatchStatus | null = null;
                    if (wasPlanToWatch) oldList = 'planToWatch';
                    else if (wasOnHold) oldList = 'onHold';
                    else if (wasDropped) oldList = 'dropped';
                    updateLists(showInfo, oldList, 'watching');
                }
            }
        });
    };

  const trackedLists = useMemo(() => ({ watching, planToWatch, completed, onHold, dropped }), [watching, planToWatch, completed, onHold, dropped]);
  
  const isLiveWatchMinimized = !!liveWatchMedia && (!selectedShow || selectedShow.id !== liveWatchMedia.id);
  
  if (window.location.pathname === '/auth/trakt/callback') {
    return <TraktCallbackHandler />;
  }
  
  const renderContent = () => {
    if (selectedPerson) {
        return <ActorDetail 
            personId={selectedPerson} 
            onBack={handleBack} 
            userData={allUserData}
            onSelectShow={handleSelectShow}
            onToggleFavoriteShow={handleToggleFavoriteShow}
            onRateItem={handleRateItem}
            ratings={ratings}
            favorites={favorites}
        />;
    }

    if (selectedShow) {
      return (
        <ShowDetail
          id={selectedShow.id}
          mediaType={selectedShow.media_type}
          onBack={handleBack}
          watchProgress={watchProgress}
          history={history}
          onToggleEpisode={handleToggleEpisode}
          onSaveJournal={handleSaveJournal}
          trackedLists={trackedLists}
          onUpdateLists={updateLists}
          customImagePaths={customImagePaths}
          onSetCustomImage={handleSetCustomImage}
          favorites={favorites}
          onToggleFavoriteShow={handleToggleFavoriteShow}
          onSelectShow={handleSelectShow}
          onOpenCustomListModal={handleOpenAddToListModal}
          ratings={ratings}
          onRateItem={handleRateItem}
          onMarkAllWatched={handleMarkAllWatched}
          onMarkSeasonWatched={handleMarkSeasonWatched}
          onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched}
          favoriteEpisodes={favoriteEpisodes}
          onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
          onSelectPerson={handleSelectPerson}
          onStartLiveWatch={handleStartLiveWatch}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onClearMediaHistory={handleClearMediaHistory}
          episodeRatings={episodeRatings}
          onRateEpisode={handleRateEpisode}
          onAddWatchHistory={handleAddWatchHistory}
          onSaveComment={handleSaveComment}
          comments={comments}
        />
      );
    }

    switch (activeScreen) {
      case 'home':
        return <Dashboard 
            userData={allUserData} 
            onSelectShow={handleSelectShow}
            onSelectShowInModal={handleSelectShowInModal}
            watchProgress={watchProgress}
            onToggleEpisode={(showId, season, episode, status) => {
              const showInfo = watching.find(s => s.id === showId);
              if (showInfo) handleToggleEpisode(showId, season, episode, status, showInfo);
            }}
            onShortcutNavigate={handleShortcutNavigate}
            onOpenAddToListModal={handleOpenAddToListModal}
            setCustomLists={setCustomLists}
            liveWatchMedia={liveWatchMedia}
            liveWatchElapsedSeconds={liveWatchElapsedSeconds}
            liveWatchIsPaused={liveWatchIsPaused}
            onLiveWatchTogglePause={handleLiveWatchTogglePause}
            onLiveWatchStop={handleCloseLiveWatch}
            onMarkShowAsWatched={handleMarkShowAsWatched}
            onToggleFavoriteShow={handleToggleFavoriteShow}
            favorites={favorites}
            pausedLiveSessions={pausedLiveSessions}
        />;
      case 'recommendations':
        return <Recommendations 
            userData={allUserData} 
            onSelectShow={handleSelectShow} 
            onMarkShowAsWatched={handleMarkShowAsWatched}
            onOpenAddToListModal={handleOpenAddToListModal}
            onToggleFavoriteShow={handleToggleFavoriteShow}
            favorites={favorites}
        />;
      case 'search':
        return <SearchScreen
          userData={allUserData}
          onSelectShow={handleSelectShow}
          onSelectPerson={handleSelectPerson}
          searchHistory={searchHistory}
          onUpdateSearchHistory={handleUpdateSearchHistory}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onMarkShowAsWatched={handleMarkShowAsWatched}
          onOpenAddToListModal={handleOpenAddToListModal}
          onToggleFavoriteShow={handleToggleFavoriteShow}
          favorites={favorites}
          genres={genres}
          currentUser={currentUser}
        />;
      case 'progress':
        return <ProgressScreen
          userData={allUserData}
          onToggleEpisode={(showId, season, episode, status) => {
            const showInfo = watching.find(s => s.id === showId);
            if (showInfo) handleToggleEpisode(showId, season, episode, status, showInfo);
          }}
          onUpdateLists={updateLists}
          favoriteEpisodes={favoriteEpisodes}
          onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
          onSelectShow={handleSelectShow}
          currentUser={currentUser}
          onAuthClick={onAuthClick}
          pausedLiveSessions={pausedLiveSessions}
          onStartLiveWatch={handleStartLiveWatch}
        />;
      case 'profile':
        return <Profile
          userData={allUserData}
          genres={genres}
          onSelectShow={handleSelectShow}
          driveStatus={driveStatus}
          onDriveSignIn={() => {}}
          onDriveSignOut={() => {}}
          onBackupToDrive={() => {}}
          onRestoreFromDrive={() => {}}
          onImportCompleted={handleImportCompleted}
          onTraktImportCompleted={handleTraktImportCompleted}
          onToggleEpisode={(showId, season, episode, status) => {
            const showInfo = watching.find(s => s.id === showId) || completed.find(s => s.id === showId);
            if (showInfo) handleToggleEpisode(showId, season, episode, status, showInfo);
          }}
          onUpdateLists={updateLists}
          favoriteEpisodes={favoriteEpisodes}
          onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
          setCustomLists={setCustomLists}
          initialTab={initialProfileTab}
          notificationSettings={notificationSettings}
          setNotificationSettings={setNotificationSettings}
          onDeleteHistoryItem={handleDeleteHistoryItem}
          onDeleteSearchHistoryItem={handleDeleteSearchHistoryItem}
          onClearSearchHistory={handleClearSearchHistory}
          setHistory={setHistory}
          setWatchProgress={setWatchProgress}
          setEpisodeRatings={setEpisodeRatings}
          setFavoriteEpisodes={setFavoriteEpisodes}
          setTheme={setTheme}
          customThemes={customThemes}
          setCustomThemes={setCustomThemes}
          onLogout={onLogout}
          onUpdatePassword={onUpdatePassword}
          currentUser={currentUser}
          onAuthClick={onAuthClick}
          profilePictureUrl={profilePictureUrl}
          setProfilePictureUrl={setProfilePictureUrl}
        />;
      default:
        return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} watchProgress={watchProgress} onToggleEpisode={() => {}} onSelectShowInModal={handleSelectShowInModal} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={handleOpenAddToListModal} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleCloseLiveWatch} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} />;
    }
  };

  return (
    <>
      {showStorageWarning && <StorageWarningBanner onDismiss={() => setShowStorageWarning(false)} onConnect={() => handleShortcutNavigate('profile', 'imports')} />}
      <Header
        currentUser={currentUser}
        onAuthClick={onAuthClick}
        onSelectShow={handleSelectShow}
        onGoHome={handleGoHome}
        onMarkShowAsWatched={handleMarkShowAsWatched}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        isOnSearchScreen={activeScreen === 'search' && !selectedShow && !selectedPerson}
      />
      <main className="container mx-auto px-0 sm:px-4 py-8 pb-24">
        {renderContent()}
      </main>
      
      <LiveWatchTracker
        isOpen={!!liveWatchMedia}
        onClose={handleCloseLiveWatch}
        mediaInfo={liveWatchMedia}
        elapsedSeconds={liveWatchElapsedSeconds}
        isPaused={liveWatchIsPaused}
        onTogglePause={handleLiveWatchTogglePause}
        isMinimized={isLiveWatchMinimized}
      />

      <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} />

      <AddToListModal
        isOpen={addToListModalState.isOpen}
        onClose={() => setAddToListModalState({ isOpen: false, item: null })}
        itemToAdd={addToListModalState.item}
        customLists={customLists}
        onAddToList={handleAddItemToCustomList}
        onCreateAndAddToList={handleCreateAndAddToList}
        onGoToDetails={handleSelectShowInModal}
      />
      
      {modalShow && (
          <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
              <ShowDetail
                  id={modalShow.id}
                  mediaType={modalShow.media_type}
                  isModal={true}
                  onBack={handleCloseModal}
                  watchProgress={watchProgress}
                  history={history}
                  onToggleEpisode={handleToggleEpisode}
                  onSaveJournal={handleSaveJournal}
                  trackedLists={trackedLists}
                  onUpdateLists={updateLists}
                  customImagePaths={customImagePaths}
                  onSetCustomImage={handleSetCustomImage}
                  favorites={favorites}
                  onToggleFavoriteShow={handleToggleFavoriteShow}
                  onSelectShow={handleSelectShow}
                  onOpenCustomListModal={handleOpenAddToListModal}
                  ratings={ratings}
                  onRateItem={handleRateItem}
                  onMarkAllWatched={handleMarkAllWatched}
                  onMarkSeasonWatched={handleMarkSeasonWatched}
                  onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched}
                  favoriteEpisodes={favoriteEpisodes}
                  onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                  onSelectPerson={handleSelectPerson}
                  onStartLiveWatch={handleStartLiveWatch}
                  onDeleteHistoryItem={handleDeleteHistoryItem}
                  onClearMediaHistory={handleClearMediaHistory}
                  episodeRatings={episodeRatings}
                  onRateEpisode={handleRateEpisode}
                  onAddWatchHistory={handleAddWatchHistory}
                  onSaveComment={handleSaveComment}
                  comments={comments}
              />
          </div>
      )}
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
    </>
  );
};

export default MainApp;