import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
// FIX: Removed unused import `getNewSeasons`.
import { getGenres, clearMediaCache, getMediaDetails, getCollectionDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo, CustomListItem, EpisodeRatings, SearchHistoryItem, Comment, Theme, ShowProgress, TraktToken, Follows, PrivacySettings, ProfileTheme, Reminder } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import { playNotificationSound } from './utils/soundUtils';
import ActorDetail from './components/ActorDetail';
import LiveWatchTracker from './components/LiveWatchTracker';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import * as traktService from './services/traktService';
import UserProfileModal from './components/UserProfileModal';
import { firebaseConfig } from './firebaseConfig';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import ThemeTransitionAnimation from './components/ThemeTransitionAnimation';
import CalendarScreen from './screens/CalendarScreen';
import { useAchievements } from './hooks/useAchievements';
import ActivityScreen from './screens/ActivityScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import { animationService } from './services/animationService';
import AnimationContainer from './components/AnimationContainer';
import AllNewReleasesScreen from './screens/AllNewReleasesScreen';
import AllTrendingTVShowsScreen from './screens/AllTrendingTVShowsScreen';
import AllTrendingMoviesScreen from './screens/AllTrendingMoviesScreen';

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
    autoHolidayThemesEnabled: boolean;
    setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
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


export const MainApp: React.FC<MainAppProps> = ({ userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, onForgotPasswordRequest, onForgotPasswordReset, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled }) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>(`customThemes_${userId}`, []);
  const [holidayAnimationsEnabled, setHolidayAnimationsEnabled] = useLocalStorage<boolean>(`holidayAnimationsEnabled_${userId}`, true);
  const [activeTheme, setTheme, holidayInfo] = useTheme(customThemes, autoHolidayThemesEnabled);
  
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
  const [mediaNotes, setMediaNotes] = useLocalStorage<Record<number, string>>(`media_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [showStatusCache, setShowStatusCache] = useLocalStorage<Record<number, string>>(`show_status_cache_${userId}`, {});
  const [movieCollectionCache, setMovieCollectionCache] = useLocalStorage<Record<number, number>>(`movie_collection_cache_${userId}`, {});
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true,
    newEpisodes: true,
    movieReleases: true,
    sounds: true,
    newFollowers: true,
    listLikes: true,
    appUpdates: true,
    importSyncCompleted: true,
    showWatchedConfirmation: true,
  });
  const [follows, setFollows] = useLocalStorage<Follows>(`sceneit_follows`, {});
  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, { activityVisibility: 'followers' });
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [profileTheme, setProfileTheme] = useLocalStorage<ProfileTheme | null>(`profileTheme_${userId}`, null);
  const [textSize, setTextSize] = useLocalStorage<number>(`textSize_${userId}`, 1);
  const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>(`timeFormat_${userId}`, '12h');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize * 100}%`;
  }, [textSize]);

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [initialProfileTab, setInitialProfileTab] = useState<ProfileTab>('overview');
  const [modalShow, setModalShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [genres, setGenres] = useState<Record<number, string>>({});
  
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);
  const [isLiveWatchMinimized, setIsLiveWatchMinimized] = useState(false);
  const [liveWatchHistoryLogId, setLiveWatchHistoryLogId] = useState<string | null>(null);
  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});

  const liveWatchIntervalRef = useRef<number | null>(null);
  const liveWatchPauseTimeRef = useRef<number | null>(null);

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
  const [transitionEffect, setTransitionEffect] = useState<Theme['colors']['particleEffect'] | null>(null);
  const prevThemeIdRef = useRef(activeTheme.id);

  useEffect(() => {
    if (prevThemeIdRef.current !== activeTheme.id) {
        if (holidayInfo.isHoliday) {
            setTransitionEffect(activeTheme.colors.particleEffect || null);
        }
        prevThemeIdRef.current = activeTheme.id;
    }
  }, [activeTheme.id, activeTheme.colors.particleEffect, holidayInfo.isHoliday]);

  const [autoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);

  useEffect(() => {
    confirmationService.updateSetting(notificationSettings.showWatchedConfirmation);
  }, [notificationSettings.showWatchedConfirmation]);
  
  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!notificationSettings.masterEnabled) return;
    
    if (notification.type === 'new_season' && !notificationSettings.newEpisodes) return;
    if (notification.type === 'new_sequel' && !notificationSettings.movieReleases) return;
    if (notification.type === 'achievement_unlocked' && !notificationSettings.appUpdates) return;
    if (notification.type === 'new_follower' && !notificationSettings.newFollowers) return;
    if (notification.type === 'list_like' && !notificationSettings.listLikes) return;
    if (notification.type === 'release_reminder' && !notificationSettings.newEpisodes && !notificationSettings.movieReleases) return;


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

        return [newNotification, ...prev].slice(0, 50); 
    });
  }, [setNotifications, notificationSettings]);

  const handleFeedbackSubmit = useCallback(() => {
    const oldLevel = calculateLevelInfo(userXp).level;
    const newXp = userXp + XP_CONFIG.feedback;
    setUserXp(newXp);
    confirmationService.show("Thanks for your feedback! You've earned 5 XP.");
    const newLevel = calculateLevelInfo(newXp).level;
    if (newLevel > oldLevel) {
        addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
    }
  }, [userXp, setUserXp, addNotification]);

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const lastBackup = localStorage.getItem('auto_backup_last_timestamp');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastBackup && (now - parseInt(lastBackup, 10)) < oneDay) {
        return; 
    }
    
    try {
        const backupData: { [key: string]: string } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
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


  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments, mediaNotes
  }), [watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments, mediaNotes]);
  
  const allTrackedItems = useMemo(() => [
    ...watching, ...planToWatch, ...completed, ...onHold, ...dropped, ...favorites
  ], [watching, planToWatch, completed, onHold, dropped, favorites]);
  
  const { achievements, isLoading: achievementsLoading } = useAchievements(allUserData);
  const [prevAchievements, setPrevAchievements] = useLocalStorage<UserAchievementStatus[]>(`prev_achievements_${userId}`, []);

  useEffect(() => {
      if (achievementsLoading || achievements.length === 0) return;
      
      const isInitialLoadWithData = prevAchievements.length === 0 && achievements.some(a => a.unlocked);
      if (isInitialLoadWithData) {
          setPrevAchievements(achievements);
          return;
      }

      const newlyUnlocked = achievements.filter(currentAch => {
          if (!currentAch.unlocked) return false;
          const prevAch = prevAchievements.find(p => p.id === currentAch.id);
          return !prevAch || !prevAch.unlocked;
      });

      if (newlyUnlocked.length > 0) {
          newlyUnlocked.forEach(ach => {
               addNotification({
                  type: 'achievement_unlocked',
                  title: 'Achievement Unlocked!',
                  description: `You've earned the "${ach.name}" badge.`,
              });
          });
      }
      
      if (JSON.stringify(prevAchievements) !== JSON.stringify(achievements)) {
          setPrevAchievements(achievements);
      }
  }, [achievements, achievementsLoading, addNotification, prevAchievements, setPrevAchievements]);
  
  const handleToggleReminder = useCallback((newReminder: Reminder | null, reminderId: string) => {
      setReminders(prev => {
        const filtered = prev.filter(r => r.id !== reminderId);
        if (newReminder) {
            return [...filtered, newReminder];
        }
        return filtered;
      });
  }, [setReminders]);
  
  useEffect(() => {
    const checkReminders = () => {
        const now = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        reminders.forEach(reminder => {
            const releaseDate = new Date(`${reminder.releaseDate}T00:00:00`);
            const diff = releaseDate.getTime() - now.getTime();
            
            let shouldNotify = false;
            let message = '';
            
            if (reminder.reminderType === 'release' && diff > 0 && diff < 5 * 60 * 1000) { // 5 minutes for 'at release'
                shouldNotify = true;
                message = `Reminder: ${reminder.title} is releasing now!`;
            } else if (reminder.reminderType === 'day_before' && diff > 0 && diff < oneDay) {
                shouldNotify = true;
                message = `Reminder: ${reminder.title} releases tomorrow!`;
            } else if (reminder.reminderType === 'week_before' && diff > 0 && diff < oneWeek) {
                 shouldNotify = true;
                 message = `Reminder: ${reminder.title} releases in a week!`;
            }

            if (shouldNotify) {
                const lastNotifiedKey = `notified_${reminder.id}_${reminder.reminderType}`;
                const lastNotified = localStorage.getItem(lastNotifiedKey);
                const todayStr = now.toDateString();

                if (lastNotified !== todayStr) { // Prevents re-notifying for the same day
                     addNotification({
                        type: 'release_reminder',
                        mediaId: reminder.mediaId,
                        mediaType: reminder.mediaType,
                        title: message,
                        description: reminder.episodeInfo || '',
                        poster_path: reminder.poster_path,
                    });
                    localStorage.setItem(lastNotifiedKey, todayStr);
                }
            }
        });
    };
    const interval = setInterval(checkReminders, 5 * 60 * 1000); // Check every 5 minutes
    checkReminders(); // Check on load
    return () => clearInterval(interval);
  }, [reminders, addNotification]);

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
    if (tab === 'profile') { 
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

  const handleUpdateSearchHistory = useCallback((query: string) => {
      setSearchHistory(prev => {
          const newEntry = { query, timestamp: new Date().toISOString() };
          const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
          const updated = [newEntry, ...filtered];
          return updated.slice(0, 20); 
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

    const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching,
            planToWatch: setPlanToWatch,
            completed: setCompleted,
            onHold: setOnHold,
            dropped: setDropped,
        };

        Object.keys(setters).forEach(key => {
            setters[key](prev => prev.filter(i => i.id !== item.id));
        });

        if (newList && setters[newList]) {
            setters[newList](prev => [item, ...prev]);
        }

        if (newList) {
            animationService.show('flyToNav', { posterPath: item.poster_path });
        }
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleCloseLiveWatch = useCallback(() => {
    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    
    if (liveWatchMedia) {
        setPausedLiveSessions(prevPaused => {
            const newPaused = { ...prevPaused };
            delete newPaused[liveWatchMedia.id];
            return newPaused;
        });
    }

    setLiveWatchMedia(null);
    setLiveWatchHistoryLogId(null);
    setIsLiveWatchOpen(false);
  }, [liveWatchMedia, setPausedLiveSessions]);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => {
        const isNowPausing = !prev;
        if (isNowPausing) { 
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
        } else { 
            if (liveWatchPauseTimeRef.current && liveWatchHistoryLogId) {
                const pausedDuration = Date.now() - liveWatchPauseTimeRef.current;
                handleAdjustHistoryTimestamp(liveWatchHistoryLogId, pausedDuration);
                liveWatchPauseTimeRef.current = null;
            }
        }
        return !prev;
    });
  }, [liveWatchHistoryLogId, liveWatchMedia, liveWatchElapsedSeconds, setPausedLiveSessions]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    if (liveWatchMedia && liveWatchMedia.id !== mediaInfo.id && !window.confirm("Starting a new live watch session will stop the current one. Continue?")) {
        return;
    }

    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    
    const isResuming = pausedLiveSessions[mediaInfo.id];
    const startTime = isResuming ? pausedLiveSessions[mediaInfo.id].elapsedSeconds : 0;
    
    setLiveWatchMedia(mediaInfo);
    setLiveWatchElapsedSeconds(startTime);
    setLiveWatchIsPaused(false);
    setIsLiveWatchOpen(true);
    setIsLiveWatchMinimized(false);

    const logId = `live-${mediaInfo.id}-${Date.now()}`;
    const newHistoryEntry: HistoryItem = {
      logId: logId, id: mediaInfo.id, media_type: mediaInfo.media_type, title: mediaInfo.title, poster_path: mediaInfo.poster_path,
      timestamp: new Date().toISOString(), seasonNumber: mediaInfo.seasonNumber, episodeNumber: mediaInfo.episodeNumber,
      note: `Live watch session started.`,
    };
    
    if(isResuming) {
        setPausedLiveSessions(prev => {
            const newPaused = {...prev};
            delete newPaused[mediaInfo.id];
            return newPaused;
        });
    }

    setHistory(prev => [newHistoryEntry, ...prev]);
    setLiveWatchHistoryLogId(logId);

  }, [liveWatchMedia, pausedLiveSessions, setHistory, setPausedLiveSessions]);

  const handleToggleMinimize = () => {
      setIsLiveWatchMinimized(prev => !prev);
  };

    const handleToggleEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => {
        const wasWatched = currentStatus === 2;
        const newStatus = wasWatched ? 0 : 2;

        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
        newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, journal: epProgress.journal, status: newStatus };
        setWatchProgress(newProgress);
        
        clearMediaCache(showId, 'tv');

        if (!wasWatched) {
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
            if (episodeName) {
                confirmationService.show(`✅ “${showInfo.title} – S${seasonNumber}, E${episodeNumber} (‘${episodeName}’) has been marked as watched.”`);
            }
            // Grant XP
            const oldLevel = calculateLevelInfo(userXp).level;
            const newXp = userXp + XP_CONFIG.episode;
            setUserXp(newXp);
            const newLevel = calculateLevelInfo(newXp).level;
            if (newLevel > oldLevel) {
                addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
            }
        } else { 
            setHistory(prev => prev.filter(item => 
                !(item.id === showId && item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber)
            ));
        }
    }, [watchProgress, setWatchProgress, setHistory, watching, completed, updateLists, userXp, setUserXp, addNotification]);

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
            if (liveWatchMedia.media_type === 'movie') {
                const trackedItem: TrackedItem = { ...liveWatchMedia, genre_ids: [] };
                updateLists(trackedItem, null, 'completed');
            } else if (liveWatchMedia.media_type === 'tv' && liveWatchMedia.seasonNumber && liveWatchMedia.episodeNumber) {
                const showInfo: TrackedItem = { id: liveWatchMedia.id, title: liveWatchMedia.title, media_type: 'tv', poster_path: liveWatchMedia.poster_path, genre_ids: [] };
                handleToggleEpisode(liveWatchMedia.id, liveWatchMedia.seasonNumber, liveWatchMedia.episodeNumber, 0, showInfo, liveWatchMedia.episodeTitle);
            }
            handleCloseLiveWatch();
          }
          return next;
        });
      }, 1000);
    } else {
      cleanup();
    }
    return cleanup;
  }, [liveWatchMedia, liveWatchIsPaused, handleCloseLiveWatch, handleToggleEpisode, updateLists]);

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

  useEffect(() => {
        const checkCompletion = async () => {
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
    
  
  const handleMarkAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, [setNotifications]);

    const handleMarkOneNotificationRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

  useEffect(() => {
    const hasVisitedKey = `sceneit_has_visited_${userId}`;
    const hasVisited = localStorage.getItem(hasVisitedKey);
    if (!hasVisited) {
        setIsWelcomeModalOpen(true);
        localStorage.setItem(hasVisitedKey, 'true');
    }
  }, [userId]);

  useEffect(() => {
    const isInitialized = localStorage.getItem(`sceneit_initialized_${userId}`);
    if (!isInitialized) {
        localStorage.setItem(`sceneit_initialized_${userId}`, 'true');
        localStorage.setItem(`sceneit_join_date_${userId}`, new Date().toISOString());
    }
  }, [userId]);

  useEffect(() => {
    if (sessionStorage.getItem('trakt_auth_complete') === 'true') {
        sessionStorage.removeItem('trakt_auth_complete');
        handleShortcutNavigate('profile', 'imports');
    }
  }, []); 

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
    useEffect(() => {
        const runBackgroundChecks = async () => {
            const lastCheck = localStorage.getItem('last_status_check');
            const now = Date.now();
            const twoHours = 2 * 60 * 60 * 1000;

            if (lastCheck && now - parseInt(lastCheck, 10) < twoHours) {
                return;
            }

            const itemsToCheck = [...watching, ...planToWatch];
            
            const showsToCheck = itemsToCheck.filter(item => item.media_type === 'tv');
            const uniqueShowIds = Array.from(new Set(showsToCheck.map(s => s.id)));
            const newStatusCache = { ...showStatusCache };
            let statusCacheUpdated = false;

            for (const showId of uniqueShowIds) {
                try {
                    clearMediaCache(showId, 'tv'); 
                    const details = await getMediaDetails(showId, 'tv');
                    const showInfo = showsToCheck.find(s => s.id === showId);
                    if (!showInfo) continue;

                    const newStatus = details.status;
                    const oldStatus = showStatusCache[showId];
                    if (newStatus && oldStatus && newStatus !== oldStatus) {
                        if (newStatus === 'Cancelled') {
                            addNotification({ type: 'status_change', mediaId: showId, mediaType: 'tv', title: `Status Update: ${showInfo.title}`, description: `Unfortunately, ${showInfo.title} has been officially cancelled.`, poster_path: showInfo.poster_path });
                        } else if (newStatus === 'Returning Series' && oldStatus === 'Ended') {
                            addNotification({ type: 'new_season', mediaId: showId, mediaType: 'tv', title: `${showInfo.title} Renewed!`, description: `${showInfo.title} has been renewed for a new season!`, poster_path: showInfo.poster_path });
                        }
                    }
                    if (newStatus && newStatus !== oldStatus) {
                        newStatusCache[showId] = newStatus;
                        statusCacheUpdated = true;
                    } else if (!oldStatus && newStatus) {
                        newStatusCache[showId] = newStatus;
                        statusCacheUpdated = true;
                    }

                    const lastEp = details.last_episode_to_air;
                    if (lastEp && lastEp.air_date) {
                        const airDate = new Date(`${lastEp.air_date}T00:00:00Z`);
                        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
                        if (airDate >= fourteenDaysAgo && airDate <= new Date(now)) {
                            const latestSeason = details.seasons?.find(s => s.season_number === lastEp.season_number);
                            if (latestSeason && lastEp.episode_number === 1) { 
                                addNotification({ type: 'new_season', mediaId: details.id, mediaType: 'tv', title: `Premiere: ${details.name}`, description: `${latestSeason.name} just premiered!`, poster_path: details.poster_path });
                            }
                        }
                    }

                } catch (error) { console.error(`Failed to check status for show ID ${showId}`, error); }
                await new Promise(resolve => setTimeout(resolve, 300)); 
            }
            if (statusCacheUpdated) setShowStatusCache(newStatusCache);


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
                                addNotification({ type: 'new_sequel', mediaId: newestMovie.id, mediaType: 'movie', title: `New in "${collectionDetails.name}"`, description: `${newestMovie.title || 'A new installment'} has been added to this collection.`, poster_path: newestMovie.poster_path });
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

        const timer = setTimeout(runBackgroundChecks, 10000); 
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

  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber?: number, episodeNumber?: number, timestamp?: string, note?: string) => {
    const newTimestamp = timestamp || new Date().toISOString();
    const historyEntry: HistoryItem = {
        logId: `log-${item.id}-${new Date(newTimestamp).getTime()}-${Math.random().toString(36).substring(2, 9)}`,
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        timestamp: newTimestamp,
        seasonNumber: seasonNumber,
        episodeNumber: episodeNumber,
        note: note,
    };
    
    setHistory(prev => [...prev, historyEntry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    let currentStatus: WatchStatus | null = null;
    for (const listName of ['watching', 'planToWatch', 'completed', 'onHold', 'dropped'] as WatchStatus[]) {
        if (allUserData[listName]?.some((i: TrackedItem) => i.id === item.id)) {
            currentStatus = listName;
            break;
        }
    }

    if (item.media_type === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined) {
        const wasPreviouslyUnwatched = !watchProgress[item.id] || Object.keys(watchProgress[item.id]).length === 0;

        setWatchProgress(prev => {
            const newProgress = JSON.parse(JSON.stringify(prev));
            if (!newProgress[item.id]) newProgress[item.id] = {};
            if (!newProgress[item.id][seasonNumber]) newProgress[item.id][seasonNumber] = {};
            const epProgress = newProgress[item.id][seasonNumber][episodeNumber] || { status: 0 };
            newProgress[item.id][seasonNumber][episodeNumber] = { ...epProgress, status: 2 };
            return newProgress;
        });

        if (wasPreviouslyUnwatched && currentStatus !== 'watching' && currentStatus !== 'completed') {
            updateLists(item, currentStatus, 'watching');
        }
    } else if (item.media_type === 'movie') {
        updateLists(item, currentStatus, 'completed');
    }
  }, [setHistory, setWatchProgress, updateLists, watchProgress, allUserData]);


  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
    if (window.confirm(`This will fetch details for all seasons of "${showInfo.title}" and mark every AIRED episode as watched. This may take a moment and cannot be undone. Continue?`)) {
        confirmationService.show(`Processing "${showInfo.title}"... Please wait.`);
        try {
            clearMediaCache(showId, 'tv');
            const details = await getMediaDetails(showId, 'tv');
            if (!details || !details.seasons) throw new Error("Could not fetch show details.");

            const seasonDetailPromises = details.seasons
                .filter(s => s.season_number > 0)
                .map(s => getSeasonDetails(showId, s.season_number).catch(() => null));
            
            const allSeasonDetails = await Promise.all(seasonDetailPromises);
            
            const newProgress = JSON.parse(JSON.stringify(watchProgress));
            if (!newProgress[showId]) newProgress[showId] = {};
            
            const newHistory: HistoryItem[] = [];
            const timestamp = new Date().toISOString();
            const today = new Date().toISOString().split('T')[0];
            let episodesMarked = 0;

            for (const seasonDetails of allSeasonDetails) {
                if (!seasonDetails) continue;
                const seasonNumber = seasonDetails.season_number;
                if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
                
                for (const ep of seasonDetails.episodes) {
                    if (ep.air_date && ep.air_date <= today) {
                        const epProgress = newProgress[showId][seasonNumber][ep.episode_number] || { status: 0 };
                        if (epProgress.status !== 2) {
                             newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                             newHistory.push({
                                logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}-${Math.random()}`,
                                id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                                timestamp, seasonNumber, episodeNumber: ep.episode_number
                            });
                            episodesMarked++;
                        }
                    }
                }
            }

            if (newHistory.length > 0) {
                setWatchProgress(newProgress);
                setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
                updateLists(showInfo, null, 'completed'); // Move to completed
                confirmationService.show(`✅ Marked ${episodesMarked} new episodes of "${showInfo.title}" as watched.`);
                // Grant XP
                const oldLevel = calculateLevelInfo(userXp).level;
                const newXp = userXp + (episodesMarked * XP_CONFIG.episode);
                setUserXp(newXp);
                const newLevel = calculateLevelInfo(newXp).level;
                if (newLevel > oldLevel) {
                  addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
                }
            } else {
                confirmationService.show(`All aired episodes of "${showInfo.title}" are already watched.`);
                updateLists(showInfo, null, 'completed'); // Ensure it's in completed if not already
            }
        } catch (error) {
            console.error("Failed to mark all as watched:", error);
            confirmationService.show(`Error: Could not mark all episodes. Please try again.`);
        }
    }
}, [watchProgress, setWatchProgress, setHistory, updateLists, userXp, setUserXp, addNotification]);

const handleUnmarkAllWatched = useCallback((showId: number) => {
    const itemToUnmark = allTrackedItems.find(i => i.id === showId);
    if (!itemToUnmark) {
        console.error(`Cannot find item with ID ${showId} to unmark.`);
        return;
    }

    if (window.confirm(`This will mark ALL episodes of "${itemToUnmark.title}" as unwatched and delete its ENTIRE watch history. This cannot be undone. Are you sure?`)) {
        // Remove watch progress
        setWatchProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[showId];
            return newProgress;
        });
        // Remove history
        setHistory(prev => prev.filter(h => h.id !== showId));
        // Remove episode favorites
        setFavoriteEpisodes(prev => {
            const newFavs = { ...prev };
            delete newFavs[showId];
            return newFavs;
        });
        // Remove episode ratings
        setEpisodeRatings(prev => {
            const newRatings = { ...prev };
            delete newRatings[showId];
            return newRatings;
        });

        // Remove from all lists
        updateLists(itemToUnmark, null, null); 
        
        confirmationService.show(`"${itemToUnmark.title}" has been fully reset and removed from your lists.`);
    }
}, [allTrackedItems, setHistory, setWatchProgress, setFavoriteEpisodes, setEpisodeRatings, updateLists]);

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
          const releaseYear = ('release_date' in itemToMark && itemToMark.release_date)?.substring(0, 4);
          confirmationService.show(`✅ “${trackedItem.title}${releaseYear ? ` (${releaseYear})` : ''} has been marked as watched.”`);

          // Grant XP for movie
          const oldLevel = calculateLevelInfo(userXp).level;
          const newXp = userXp + XP_CONFIG.movie;
          setUserXp(newXp);
          const newLevel = calculateLevelInfo(newXp).level;
          if (newLevel > oldLevel) {
              addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
          }
      } else {
          handleMarkAllWatched(trackedItem.id, trackedItem);
      }
  }, [handleAddWatchHistory, handleMarkAllWatched, userXp, setUserXp, addNotification]);

    const handleUnmarkMovieWatched = useCallback((media