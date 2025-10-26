
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import AchievementsScreen from './screens/AchievementsScreen';
import { getGenres, getNewSeasons, clearMediaCache, getMediaDetails, getCollectionDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, DriveStatus, FavoriteEpisodes, ProfileTab, ScreenName, VipStatus, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import * as googleDriveService from './services/googleDriveService';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import StatsScreen from './screens/StatsScreen';
import { useAchievements } from './hooks/useAchievements';
import { playNotificationSound } from './utils/soundUtils';
import Recommendations from './screens/Recommendations';
import ActorDetail from './components/ActorDetail';
import LiveWatchTracker from './components/LiveWatchTracker';


const StorageWarningBanner: React.FC<{ onDismiss: () => void; onConnect: () => void; }> = ({ onDismiss, onConnect }) => (
    <div className="bg-red-600 text-white p-3 text-center text-sm flex justify-center items-center sticky top-0 z-50">
        <span className="flex-grow">
            <strong>Storage Full:</strong> To prevent data loss, please connect Google Drive in Settings to back up your data.
        </span>
        <button onClick={onConnect} className="ml-4 font-semibold text-sm underline px-2 py-1 rounded hover:bg-white/20">Connect</button>
        <button onClick={onDismiss} className="ml-2 font-bold text-lg">&times;</button>
    </div>
);


const App: React.FC = () => {
  useTheme(); // Apply theme on app load
  
  // State
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>('watching_list', []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>('plan_to_watch_list', []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>('completed_list', []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>('favorites_list', []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>('watch_progress', {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('history', []);
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>('custom_image_paths', {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('notifications', []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>('favorite_episodes', {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>('custom_lists', []);
  const [showStatusCache, setShowStatusCache] = useLocalStorage<Record<number, string>>('show_status_cache', {});
  const [movieCollectionCache, setMovieCollectionCache] = useLocalStorage<Record<number, number>>('movie_collection_cache', {});
  const [ratings, setRatings] = useLocalStorage<UserRatings>('user_ratings', {});
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('notification_settings', {
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
  
  const [genres, setGenres] = useState<Record<number, string>>({});
  
  // --- Live Watch State ---
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [liveWatchHistoryLogId, setLiveWatchHistoryLogId] = useState<string | null>(null);

  const liveWatchIntervalRef = useRef<number | null>(null);
  const liveWatchPauseTimeRef = useRef<number | null>(null);


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

  // --- VIP & Achievements State ---
  const [vipStatus, setVipStatus] = useLocalStorage<VipStatus>('vip_status', { expires: null });
  const [claimedRewards, setClaimedRewards] = useLocalStorage<string[]>('claimed_rewards', []);
  const isVip = useMemo(() => vipStatus.expires !== null && vipStatus.expires > Date.now(), [vipStatus]);
  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, favorites, watchProgress, history, customLists, ratings
  }), [watching, planToWatch, completed, favorites, watchProgress, history, customLists, ratings]);
  const { achievements } = useAchievements(allUserData);

  // --- Handlers
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
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

  // --- Live Watch Handlers ---
  const handleStartLiveWatch = (mediaInfo: LiveWatchMediaInfo) => {
    setLiveWatchElapsedSeconds(0);
    setLiveWatchIsPaused(false);
    liveWatchPauseTimeRef.current = null;
  
    const logId = `live-${mediaInfo.id}-${Date.now()}`;
    const startTime = new Date();
    // The timestamp is the *finish* time.
    const finishTime = new Date(startTime.getTime() + mediaInfo.runtime * 60000);
    
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
    setLiveWatchMedia(mediaInfo); // Start everything by setting the media
  };

  const handleCloseLiveWatch = useCallback(() => {
    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    setLiveWatchMedia(null);
    setLiveWatchHistoryLogId(null);
  }, []);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => {
        const currentlyPaused = prev;
        if (currentlyPaused) { // Resuming
            if (liveWatchPauseTimeRef.current && liveWatchHistoryLogId) {
                const pausedDuration = Date.now() - liveWatchPauseTimeRef.current;
                handleAdjustHistoryTimestamp(liveWatchHistoryLogId, pausedDuration);
                liveWatchPauseTimeRef.current = null;
            }
        } else { // Pausing
            liveWatchPauseTimeRef.current = Date.now();
        }
        return !currentlyPaused;
    });
  }, [liveWatchHistoryLogId]);

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
    const listSetters: Record<WatchStatus, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
        watching: setWatching,
        planToWatch: setPlanToWatch,
        completed: setCompleted,
        favorites: setFavorites, // This won't be used for moving, but good for completeness
    };

    // Remove from old list
    if (oldList && listSetters[oldList] && oldList !== 'favorites') {
        listSetters[oldList](prev => prev.filter(i => i.id !== item.id));
    }

    // Add to new list
    if (newList && listSetters[newList] && newList !== 'favorites') {
        listSetters[newList](prev => [item, ...prev.filter(i => i.id !== item.id)]);
    }
    
    // Add to history if a movie is marked as completed
    if (newList === 'completed' && item.media_type === 'movie' && oldList !== 'completed') {
        // FIX: Add missing 'logId' property to the HistoryItem object.
        const timestamp = new Date().toISOString();
        const historyEntry: HistoryItem = {
            logId: `movie-${item.id}-${new Date(timestamp).getTime()}`,
            id: item.id,
            media_type: 'movie',
            title: item.title,
            poster_path: item.poster_path,
            timestamp: timestamp,
        };
        // Add to history, replacing any previous watch for the same movie
        setHistory(prev => [historyEntry, ...prev.filter(h => h.id !== item.id || h.media_type !== 'movie')]);
    }
  }, [setCompleted, setFavorites, setPlanToWatch, setWatching, setHistory]);

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
                    
                    if (watchedCount >= totalEpisodes) {
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

    // --- VIP Reward System ---
    useEffect(() => {
        const newlyUnlockedRewards = achievements.filter(
            ach => ach.unlocked && ach.reward !== 'none' && !claimedRewards.includes(ach.id)
        );

        if (newlyUnlockedRewards.length > 0) {
            let totalDaysToAdd = 0;
            
            newlyUnlockedRewards.forEach(ach => {
                if (ach.reward === 'vipPass') {
                    // Simple mapping for now, can be more granular
                    if (ach.difficulty === 'Hard') totalDaysToAdd += 7;
                    else if (ach.difficulty === 'Medium') totalDaysToAdd += 3;
                }
            });

            if (totalDaysToAdd > 0) {
                const now = Date.now();
                const currentExpiry = (vipStatus.expires && vipStatus.expires > now) ? vipStatus.expires : now;
                const newExpiry = currentExpiry + totalDaysToAdd * 24 * 60 * 60 * 1000;
                
                setVipStatus({ expires: newExpiry });
                setClaimedRewards(prev => [...prev, ...newlyUnlockedRewards.map(ach => ach.id)]);

                // Add a notification for the user
                addNotification({
                    type: 'achievement_unlocked',
                    mediaId: 0,
                    mediaType: 'movie', // Generic, no specific media
                    title: `VIP Pass Granted!`,
                    description: `You've earned ${totalDaysToAdd} day(s) of VIP access from new achievements!`,
                    poster_path: null,
                });
            }
        }
    }, [achievements, claimedRewards, setClaimedRewards, setVipStatus, vipStatus.expires, addNotification]);


  // --- One-time initialization for new users ---
  useEffect(() => {
    const isInitialized = localStorage.getItem('sceneit_initialized');
    if (!isInitialized) {
        localStorage.setItem('sceneit_initialized', 'true');
        localStorage.setItem('sceneit_join_date', new Date().toISOString());
    }
  }, []);

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


  // --- Data Management & Handlers ---
  const allAppData = useMemo(() => {
    const appData: Record<string, any> = {};
    const keysToBackup = [
        'watching_list', 'plan_to_watch_list', 'completed_list', 'favorites_list',
        'watch_progress', 'history', 'custom_image_paths', 'notifications',
        'favorite_episodes', 'customThemes', 'trakt_token', 'themeId', 'show_status_cache',
        'movie_collection_cache', 'notification_settings', 'custom_lists', 'user_ratings'
    ];
     keysToBackup.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                appData[key] = JSON.parse(item);
            } catch (e) {
                appData[key] = item;
            }
        }
    });
    return appData;
  }, [watching, planToWatch, completed, favorites, watchProgress, history, customImagePaths, notifications, favoriteEpisodes, showStatusCache, movieCollectionCache, notificationSettings, customLists, ratings]);

  // --- Automatic Local Backup ---
  useEffect(() => {
    const performAutoBackup = () => {
        try {
            const backupData = JSON.stringify(allAppData);
            localStorage.setItem('sceneit_local_backup', backupData);
            localStorage.setItem('auto_backup_last_timestamp', new Date().toISOString());
            console.log("Automatic local backup completed.");
        } catch (error) {
            console.error("Failed to perform automatic local backup", error);
        }
    };
    
    const autoBackupEnabled = JSON.parse(localStorage.getItem('autoBackupEnabled') || 'false');
    if (autoBackupEnabled) {
        const lastBackupTimestamp = localStorage.getItem('auto_backup_last_timestamp');
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (!lastBackupTimestamp || new Date().getTime() - new Date(lastBackupTimestamp).getTime() > twentyFourHours) {
            performAutoBackup();
        }
    }
    
    // Recovery check on load
    const isPristine = watching.length === 0 && completed.length === 0 && history.length === 0;
    const localBackup = localStorage.getItem('sceneit_local_backup');
    if (isPristine && localBackup) {
        if (window.confirm("It looks like your data is empty. Would you like to restore from your last local backup?")) {
            try {
                const data = JSON.parse(localBackup);
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
                });
                window.location.reload();
            } catch (e) {
                alert("Failed to restore local backup. The file may be corrupted.");
            }
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on app mount

  // --- Google Drive Handlers ---
  const handleDriveSignIn = async () => {
    try {
        await googleDriveService.signIn();
        // After successful sign in, the listener in the useEffect will update state
    } catch (error: any) {
        console.error("Sign in failed", error);
        setDriveStatus(prev => ({...prev, error: `Sign-in failed: ${error.details || 'Popup closed or cookies disabled.'}`}));
    }
  };
    
  const handleDriveSignOut = async () => {
      await googleDriveService.signOut();
  };

  const handleBackupToDrive = useCallback(async () => {
      if (!driveStatus.isSignedIn) {
          alert("Please sign in to Google Drive first.");
          return;
      }
      setDriveStatus(prev => ({...prev, isSyncing: true, error: null}));
      try {
          const dataToBackup = { ...allAppData };
          await googleDriveService.uploadData(dataToBackup);
          const now = new Date().toISOString();
          setDriveStatus(prev => ({ ...prev, isSyncing: false, lastSync: now }));
          localStorage.setItem('drive_last_sync', now);
      } catch (error: any) {
          console.error("Backup failed", error);
          setDriveStatus(prev => ({ ...prev, isSyncing: false, error: `Backup failed: ${error.message}` }));
      }
  }, [allAppData, driveStatus.isSignedIn]);

  const handleRestoreFromDrive = useCallback(async () => {
      if (!driveStatus.isSignedIn) return;
      
      setDriveStatus(prev => ({...prev, isSyncing: true, error: null}));
      try {
          const data = await googleDriveService.downloadData() as UserData & { customImagePaths: CustomImagePaths, notifications: AppNotification[], favorites: TrackedItem[], customLists: CustomList[] } | null;
          if (data) {
              if (!window.confirm("This will overwrite your current local data with the data from Google Drive. Are you sure you want to continue?")) {
                   setDriveStatus(prev => ({...prev, isSyncing: false }));
                   return;
              }

              // Validate incoming data to prevent crashes from malformed backups
              setWatching(Array.isArray(data.watching) ? data.watching : []);
              setPlanToWatch(Array.isArray(data.planToWatch) ? data.planToWatch : []);
              setCompleted(Array.isArray(data.completed) ? data.completed : []);
              setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
              setWatchProgress(typeof data.watchProgress === 'object' && data.watchProgress !== null ? data.watchProgress : {});
              setHistory(Array.isArray(data.history) ? data.history : []);
              setCustomImagePaths(typeof data.customImagePaths === 'object' && data.customImagePaths !== null ? data.customImagePaths : {});
              setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
              setCustomLists(Array.isArray(data.customLists) ? data.customLists : []);
              setRatings(typeof data.ratings === 'object' && data.ratings !== null ? data.ratings : {});

              const now = new Date().toISOString();
              setDriveStatus(prev => ({ ...prev, isSyncing: false, lastSync: now }));
              localStorage.setItem('drive_last_sync', now);
              alert("Data restored successfully!");
          } else {
               setDriveStatus(prev => ({ ...prev, isSyncing: false }));
               alert("No backup data found in Google Drive. Sync now to create one.");
          }
      } catch (error: any) {
          console.error("Restore failed", error);
          setDriveStatus(prev => ({ ...prev, isSyncing: false, error: `Restore failed: ${error.message}` }));
      }
  }, [driveStatus.isSignedIn, setWatching, setPlanToWatch, setCompleted, setFavorites, setWatchProgress, setHistory, setCustomImagePaths, setNotifications, setCustomLists, setRatings]);
  
   // --- Google Drive Init & Onboarding ---
    useEffect(() => {
        const init = async () => {
            try {
                await googleDriveService.initGoogleDriveClient();
                const authInstance = googleDriveService.getAuthInstance();

                const updateSigninStatus = (signedIn: boolean) => {
                    if (signedIn) {
                        const profile = authInstance.currentUser.get().getBasicProfile();
                        setDriveStatus(prev => ({
                            ...prev,
                            isSignedIn: true,
                            user: {
                                name: profile.getName(),
                                email: profile.getEmail(),
                                imageUrl: profile.getImageUrl(),
                            },
                        }));
                        
                        // Onboarding restore prompt for first-time sign-in this session
                        if (!sessionStorage.getItem('drive_restore_prompted')) {
                            sessionStorage.setItem('drive_restore_prompted', 'true');
                            googleDriveService.downloadData().then(data => {
                                if (data) {
                                    // Heuristic: if local storage is basically empty, it's a new device/install
                                    const isPristine = watching.length === 0 && completed.length === 0 && history.length === 0;
                                    if (isPristine) {
                                        if (window.confirm("Welcome! We found a backup on your Google Drive. Would you like to restore it to this device?")) {
                                            handleRestoreFromDrive();
                                        }
                                    }
                                }
                            });
                        }

                    } else {
                        setDriveStatus(prev => ({...prev, isSignedIn: false, user: null }));
                    }
                };
                
                setDriveStatus(prev => ({ ...prev, isGapiReady: true }));
                if (authInstance) {
                    authInstance.isSignedIn.listen(updateSigninStatus);
                    updateSigninStatus(authInstance.isSignedIn.get());
                }

            } catch (error) {
                console.error("Error initializing Google Drive client", error);
                setDriveStatus(prev => ({ ...prev, isGapiReady: true, error: "Failed to load Google Drive client." }));
            }
        };
        init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleRestoreFromDrive]); // handleRestoreFromDrive is memoized
  
  
  useEffect(() => {
    // This effect is left empty after removing OAuth logic to prevent any regressions
    // if other logic were to be added here in the future.
  }, []);
  // --- End OAuth ---

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

  const handleToggleEpisode = (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number) => {
      const newStatus = currentStatus === 2 ? 0 : 2;
      setWatchProgress(prev => {
          const newProgress = { ...prev };
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const existingEntry = newProgress[showId][seasonNumber][episodeNumber];
          
          newProgress[showId][seasonNumber][episodeNumber] = {
              ...existingEntry,
              status: newStatus as 0 | 1 | 2,
          };
          
          return newProgress;
      });

      if (newStatus === 2) {
          // This will ensure that the next time details are fetched for this show,
          // it will be fresh from the API, reflecting any newly aired episodes.
          clearMediaCache(showId, 'tv');
          const allItems = [...watching, ...planToWatch, ...completed, ...favorites];
          const showInfo = allItems.find(item => item.id === showId);
          if (showInfo) {
              // FIX: Add missing 'logId' property to the HistoryItem object.
              const timestamp = new Date().toISOString();
              const historyEntry: HistoryItem = {
                  logId: `tv-${showId}-${seasonNumber}-${episodeNumber}-${new Date(timestamp).getTime()}`,
                  id: showId,
                  media_type: showInfo.media_type,
                  title: showInfo.title,
                  poster_path: showInfo.poster_path,
                  timestamp: timestamp,
                  seasonNumber: showInfo.media_type === 'tv' ? seasonNumber : undefined,
                  episodeNumber: showInfo.media_type === 'tv' ? episodeNumber : undefined,
              };
              setHistory(prev => [historyEntry, ...prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber))]);
          }
      } else if (newStatus === 0) {
        // Remove from history if unmarked
        setHistory(prev => prev.filter(h =>
            !(h.id === showId && h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber)
        ));
      }
  };

    const handleMarkAllWatched = useCallback(async (showId: number) => {
        if (!window.confirm("Are you sure you want to mark all episodes of this show as watched?")) return;
        try {
            const details = await getMediaDetails(showId, 'tv');
            if (!details || !details.seasons) return;

            setWatchProgress(prev => {
                const newProgress = { ...prev };
                if (!newProgress[showId]) newProgress[showId] = {};
                
                const showInfo = [...watching, ...planToWatch, ...completed].find(s => s.id === showId);
                const newHistoryItems: HistoryItem[] = [];

                details.seasons.forEach(season => {
                    if (season.season_number > 0) {
                        if (!newProgress[showId][season.season_number]) newProgress[showId][season.season_number] = {};
                        for (let i = 1; i <= season.episode_count; i++) {
                            const isAlreadyWatched = newProgress[showId][season.season_number][i]?.status === 2;
                            if (!isAlreadyWatched) {
                                newProgress[showId][season.season_number][i] = { ...newProgress[showId][season.season_number][i], status: 2 };
                                if (showInfo) {
                                    // FIX: Add missing 'logId' property to the HistoryItem object.
                                    const timestamp = new Date().toISOString();
                                    newHistoryItems.push({
                                        logId: `tv-${showId}-${season.season_number}-${i}-${new Date(timestamp).getTime()}`,
                                        id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                                        timestamp: timestamp, seasonNumber: season.season_number, episodeNumber: i
                                    });
                                }
                            }
                        }
                    }
                });
                
                if (newHistoryItems.length > 0) {
                    setHistory(prevHistory => [...newHistoryItems, ...prevHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                }
                return newProgress;
            });
        } catch (error) {
            console.error("Failed to mark all as watched", error);
        }
    }, [setWatchProgress, setHistory, watching, planToWatch, completed]);

  const handleSaveJournal = (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => {
      setWatchProgress(prev => {
          const newProgress = { ...prev };
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const existingEntry = newProgress[showId][seasonNumber][episodeNumber];

          // If entry is null, we can decide to either clear the journal or the whole entry
          if (entry === null) {
              if (existingEntry?.status) {
                  delete newProgress[showId][seasonNumber][episodeNumber].journal;
              } else {
                  // If there's no status, we can remove the episode entry itself
                   delete newProgress[showId][seasonNumber][episodeNumber];
              }
          } else {
             newProgress[showId][seasonNumber][episodeNumber] = {
                status: existingEntry?.status || 0,
                journal: entry,
            };
          }
          
          return newProgress;
      });
  };
  
  const handleToggleFavorite = (item: TrackedItem) => {
    setFavorites(prev => {
        if (prev.some(fav => fav.id === item.id)) {
            return prev.filter(fav => fav.id !== item.id);
        } else {
            return [item, ...prev];
        }
    });
  };

  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
    setFavoriteEpisodes(prev => {
        const newFavs = JSON.parse(JSON.stringify(prev)); // Deep copy for safety
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
  
  const handleSetCustomImage = (mediaId: number, type: 'poster' | 'backdrop', path: string) => {
      setCustomImagePaths(prev => ({
          ...prev,
          [mediaId]: {
              ...prev[mediaId],
              [`${type}_path`]: path,
          }
      }));
  };
  
  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleImportCompleted = (historyItems: HistoryItem[], completedItems: TrackedItem[]) => {
      // Add to history, avoiding duplicates
      const existingHistoryTimestamps = new Set(history.map(h => h.timestamp));
      const newHistoryItems = historyItems.filter(h => !existingHistoryTimestamps.has(h.timestamp));
      setHistory(prev => [...newHistoryItems, ...prev].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // Add to completed list, avoiding duplicates from any list
      const existingIds = new Set([...watching, ...planToWatch, ...completed].map(i => i.id));
      const newCompletedItems = completedItems.filter(item => !existingIds.has(item.id));
      setCompleted(prev => [...newCompletedItems, ...prev]);

      // If imported items were on other lists, remove them
      const newCompletedIds = new Set(completedItems.map(i => i.id));
      setWatching(prev => prev.filter(i => !newCompletedIds.has(i.id)));
      setPlanToWatch(prev => prev.filter(i => !newCompletedIds.has(i.id)));
  };

  // FIX: Changed parameter from 'timestamp' to 'logId' and updated filtering logic to match.
  const handleDeleteHistoryItem = (logId: string) => {
    if (window.confirm('Are you sure you want to remove this item from your history? This action cannot be undone.')) {
        setHistory(prev => prev.filter(item => item.logId !== logId));
    }
  };

  const handleRateItem = (mediaId: number, rating: number) => {
    setRatings(prev => ({ ...prev, [mediaId]: rating }));
  };


  const renderContent = () => {
    if (selectedPerson) {
      return (
        <ActorDetail
          personId={selectedPerson}
          onBack={handleBack}
          userData={allUserData}
          onSelectShow={handleSelectShow}
          onToggleFavoriteShow={handleToggleFavorite}
          onRateItem={handleRateItem}
          ratings={ratings}
          favorites={favorites}
        />
      );
    }

    if (selectedShow) {
        return (
            <ShowDetail
                id={selectedShow.id}
                mediaType={selectedShow.media_type}
                onBack={handleBack}
                onSelectShow={handleSelectShow}
                watchProgress={watchProgress}
                onToggleEpisode={handleToggleEpisode}
                onSaveJournal={handleSaveJournal}
                trackedLists={{ watching, planToWatch, completed }}
                onUpdateLists={updateLists}
                customImagePaths={customImagePaths}
                onSetCustomImage={handleSetCustomImage}
                favorites={favorites}
                onToggleFavoriteShow={handleToggleFavorite}
                customLists={customLists}
                onUpdateCustomList={handleUpdateCustomList}
                ratings={ratings}
                onRateItem={handleRateItem}
                onMarkAllWatched={handleMarkAllWatched}
                history={history}
                favoriteEpisodes={favoriteEpisodes}
                onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                onSelectPerson={handleSelectPerson}
                onStartLiveWatch={handleStartLiveWatch}
            />
        );
    }
    
    switch (activeScreen) {
      case 'home':
        return (
          <Dashboard
            userData={allUserData}
            onSelectShow={handleSelectShow}
            watchProgress={watchProgress}
            onToggleEpisode={handleToggleEpisode}
            onShortcutNavigate={handleShortcutNavigate}
            onAddItemToList={handleAddItemToList}
            setCustomLists={setCustomLists}
            onSelectShowInModal={handleSelectShowInModal}
            liveWatchMedia={liveWatchMedia}
            liveWatchElapsedSeconds={liveWatchElapsedSeconds}
            liveWatchIsPaused={liveWatchIsPaused}
            onLiveWatchTogglePause={handleLiveWatchTogglePause}
            onLiveWatchStop={handleCloseLiveWatch}
          />
        );
      case 'recommendations':
        return <Recommendations userData={allUserData} onSelectShow={handleSelectShow} />;
      case 'search':
        return <SearchScreen onSelectShow={handleSelectShow} genres={genres} />;
       case 'stats':
        return <StatsScreen userData={allUserData} genres={genres} />;
      case 'achievements':
        return <AchievementsScreen userData={allUserData} />;
      case 'profile':
          return <Profile 
                    userData={allUserData} 
                    onSelectShow={handleSelectShow}
                    genres={genres}
                    driveStatus={driveStatus}
                    onDriveSignIn={handleDriveSignIn}
                    onDriveSignOut={handleDriveSignOut}
                    onBackupToDrive={handleBackupToDrive}
                    onRestoreFromDrive={handleRestoreFromDrive}
                    onImportCompleted={handleImportCompleted}
                    onToggleEpisode={handleToggleEpisode}
                    onUpdateLists={updateLists}
                    favoriteEpisodes={favoriteEpisodes}
                    onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                    setCustomLists={setCustomLists}
                    initialTab={initialProfileTab}
                    isVip={isVip}
                    vipExpiry={vipStatus.expires}
                    notificationSettings={notificationSettings}
                    setNotificationSettings={setNotificationSettings}
                    onDeleteHistoryItem={handleDeleteHistoryItem}
                 />
      default:
        return null;
    }
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary">
      {showStorageWarning && <StorageWarningBanner onDismiss={() => setShowStorageWarning(false)} onConnect={() => { handleTabPress('profile'); }} />}
      <Header onSelectShow={handleSelectShow} onGoHome={handleGoHome} />
      <main className="py-6 pb-16">
        <div className="container mx-auto">
          {renderContent()}
        </div>
      </main>
      <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} />
      <LiveWatchTracker
        isOpen={!!liveWatchMedia}
        mediaInfo={liveWatchMedia}
        elapsedSeconds={liveWatchElapsedSeconds}
        isPaused={liveWatchIsPaused}
        onTogglePause={handleLiveWatchTogglePause}
        onClose={handleCloseLiveWatch}
      />
       {modalShow && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4" onClick={handleCloseModal}>
            <div className="bg-bg-primary w-full max-w-5xl h-[95vh] rounded-lg shadow-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-grow overflow-y-auto hide-scrollbar">
                    <ShowDetail
                        id={modalShow.id}
                        mediaType={modalShow.media_type}
                        onBack={handleCloseModal}
                        onSelectShow={(id, media_type) => {
                            handleCloseModal();
                            handleSelectShow(id, media_type);
                        }}
                        onSelectPerson={(personId) => {
                            handleCloseModal();
                            handleSelectPerson(personId);
                        }}
                        watchProgress={watchProgress}
                        onToggleEpisode={handleToggleEpisode}
                        onSaveJournal={handleSaveJournal}
                        trackedLists={{ watching, planToWatch, completed }}
                        onUpdateLists={updateLists}
                        customImagePaths={customImagePaths}
                        onSetCustomImage={handleSetCustomImage}
                        favorites={favorites}
                        onToggleFavoriteShow={handleToggleFavorite}
                        customLists={customLists}
                        onUpdateCustomList={handleUpdateCustomList}
                        ratings={ratings}
                        onRateItem={handleRateItem}
                        onMarkAllWatched={handleMarkAllWatched}
                        history={history}
                        favoriteEpisodes={favoriteEpisodes}
                        onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                        onStartLiveWatch={handleStartLiveWatch}
                    />
                </div>
            </div>
        </div>
    )}
    </div>
  );
};

export default App;