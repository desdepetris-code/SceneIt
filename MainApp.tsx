import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  UserData, WatchProgress, Theme, HistoryItem, TrackedItem, UserRatings, 
  EpisodeRatings, SeasonRatings, CustomList, AppNotification, FavoriteEpisodes, 
  LiveWatchMediaInfo, SearchHistoryItem, Comment, Note, ScreenName, ProfileTab, 
  WatchStatus, WeeklyPick, DeletedHistoryItem, CustomImagePaths, Reminder, 
  NotificationSettings, ShortcutSettings, NavSettings, AppPreferences, 
  PrivacySettings, ProfileTheme, TmdbMedia, Follows, CustomListItem 
} from './types';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './screens/ShowDetail';
import { getGenres, clearMediaCache, getMediaDetails, getSeasonDetails } from './services/tmdbService';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import PersonDetailModal from './components/PersonDetailModal';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import UserProfileModal from './components/UserProfileModal';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import CalendarScreen from './screens/CalendarScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import AnimationContainer from './components/AnimationContainer';
import LiveWatchTracker from './components/LiveWatchTracker';
import NominatePicksModal from './components/NominatePicksModal';
import { calculateAutoStatus } from './utils/libraryLogic';
import { checkForUpdates } from './services/updateService';

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

export const MainApp: React.FC<MainAppProps> = ({ 
    userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, 
    onForgotPasswordRequest, onForgotPasswordReset, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled 
}) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>(`customThemes_${userId}`, []);
  const [activeTheme, setTheme, baseThemeId, currentHolidayName] = useTheme(customThemes, autoHolidayThemesEnabled);
  
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>(`watching_list_${userId}`, []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>(`plan_to_watch_list_${userId}`, []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>(`completed_list_${userId}`, []);
  const [onHold, setOnHold] = useLocalStorage<TrackedItem[]>(`on_hold_list_${userId}`, []);
  const [dropped, setDropped] = useLocalStorage<TrackedItem[]>(`dropped_list_${userId}`, []);
  const [allCaughtUp, setAllCaughtUp] = useLocalStorage<TrackedItem[]>(`all_caught_up_list_${userId}`, []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>(`favorites_list_${userId}`, []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>(`watch_progress_${userId}`, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(`history_${userId}`, []);
  const [deletedHistory, setDeletedHistory] = useLocalStorage<DeletedHistoryItem[]>(`deleted_history_${userId}`, []);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`search_history_${userId}`, []);
  const [comments, setComments] = useLocalStorage<Comment[]>(`comments_${userId}`, []);
  const [mediaNotes, setMediaNotes] = useLocalStorage<Record<number, Note[]>>(`media_notes_${userId}`, {});
  const [episodeNotes, setEpisodeNotes] = useLocalStorage<Record<number, Record<number, Record<number, string>>>>(`episode_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [seasonRatings, setSeasonRatings] = useLocalStorage<SeasonRatings>(`season_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true, newEpisodes: true, movieReleases: true, sounds: true, newFollowers: true, listLikes: true, appUpdates: true, importSyncCompleted: true, showWatchedConfirmation: true, showPriorEpisodesPopup: true,
  });

  const [shortcutSettings, setShortcutSettings] = useLocalStorage<ShortcutSettings>(`shortcut_settings_${userId}`, {
    show: true,
    tabs: ['progress', 'history', 'weeklyPicks', 'lists', 'achievements', 'imports', 'settings']
  });
  const [navSettings, setNavSettings] = useLocalStorage<NavSettings>(`nav_settings_${userId}`, {
    tabs: ['home', 'search', 'calendar', 'progress', 'profile'],
    position: 'bottom',
    hoverRevealNav: false,
    hoverRevealHeader: false
  });

  const [preferences, setPreferences] = useLocalStorage<AppPreferences>(`app_preferences_${userId}`, {
    searchAlwaysExpandFilters: false,
    searchShowFilters: true,
    searchShowSeriesInfo: 'expanded',
    searchShowRecentHistory: true,
    dashShowStats: true,
    dashShowLiveWatch: true,
    dashShowContinueWatching: true,
    dashShowUpcoming: true,
    dashShowRecommendations: true,
    dashShowTrending: true,
    dashShowWeeklyGems: true, 
    // Added missing dashShowWeeklyPicks property
    dashShowWeeklyPicks: true,
    dashShowNewSeasons: true,
    dashShowPlanToWatch: true,
    enableAnimations: true,
    enableSpoilerShield: false,
  });

  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, {
    activityVisibility: 'public'
  });
  const [holidayAnimationsEnabled, setHolidayAnimationsEnabled] = useLocalStorage<boolean>(`holidayAnimationsEnabled_${userId}`, true);
  const [profileTheme, setProfileTheme] = useLocalStorage<ProfileTheme | null>(`profileTheme_${userId}`, null);
  const [textSize, setTextSize] = useLocalStorage<number>(`textSize_${userId}`, 16);
  const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>(`timeFormat_${userId}`, '12h');
  const [pin, setPin] = useLocalStorage<string | null>(`pin_${userId}`, null);

  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [weeklyFavorites, setWeeklyFavorites] = useLocalStorage<WeeklyPick[]>(`weekly_favorites_${userId}`, []);
  const [weeklyFavoritesWeekKey, setWeeklyFavoritesWeekKey] = useLocalStorage<string>(`weekly_favorites_week_${userId}`, '');
  const [weeklyFavoritesHistory, setWeeklyFavoritesHistory] = useLocalStorage<Record<string, WeeklyPick[]>>(`weekly_favorites_history_${userId}`, {});

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [initialLibraryStatus, setInitialLibraryStatus] = useState<WatchStatus | undefined>(undefined);

  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [isLiveWatchMinimized, setIsLiveWatchMinimized] = useState(false);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);

  // --- Welcome Modal State ---
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(!!localStorage.getItem('welcome_dismissed'));

  // --- Trash Bin Cleanup Logic ---
  useEffect(() => {
    const pruneTrashBin = () => {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const remainingItems = deletedHistory.filter(item => {
        const deletedAt = new Date(item.deletedAt).getTime();
        return deletedAt > thirtyDaysAgo;
      });
      
      if (remainingItems.length !== deletedHistory.length) {
        setDeletedHistory(remainingItems);
        console.log(`Trash Bin Purged: Removed ${deletedHistory.length - remainingItems.length} expired logs.`);
      }
    };
    
    if (deletedHistory.length > 0) {
      pruneTrashBin();
    }
  }, []);

  // --- Nostalgia & Updates Logic ---
  useEffect(() => {
    const runUpdateCheck = async () => {
        const userData: UserData = { watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites, watchProgress, history, deletedHistory, customLists, ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory };
        const result = await checkForUpdates(userData);
        if (result.notifications.length > 0) {
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id));
                const newOnes = result.notifications.filter(n => !existingIds.has(n.id));
                return [...newOnes, ...prev];
            });
        }
    };
    const timer = setTimeout(runUpdateCheck, 2000); // Check shortly after load
    return () => clearTimeout(timer);
  }, [userId]);

  // --- Android Back Button Logic ---
  const lastBackClickRef = useRef<number>(0);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (selectedShow || selectedPerson || selectedUserId) {
      setSelectedShow(null);
      setSelectedPerson(null);
      setSelectedUserId(null);
      window.history.pushState({ app: 'cinemontauge' }, '');
      return;
    }

    if (activeScreen !== 'home') {
      setActiveScreen('home');
      window.history.pushState({ app: 'cinemontauge' }, '');
      return;
    }

    const now = Date.now();
    if (now - lastBackClickRef.current < 2000) {
      window.history.back();
    } else {
      lastBackClickRef.current = now;
      confirmationService.show("Click back again to exit CineMontauge");
      window.history.pushState({ app: 'cinemontauge' }, '');
    }
  }, [selectedShow, selectedPerson, selectedUserId, activeScreen]);

  useEffect(() => {
    window.history.pushState({ app: 'cinemontauge' }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const handleLiveWatchStop = useCallback(() => {
    if (liveWatchMedia) {
        const runtimeSeconds = liveWatchMedia.runtime * 60;
        if (liveWatchElapsedSeconds < runtimeSeconds - 10) {
             setPausedLiveSessions(prev => ({
                ...prev,
                [liveWatchMedia.id]: {
                    mediaInfo: liveWatchMedia,
                    elapsedSeconds: liveWatchElapsedSeconds,
                    pausedAt: new Date().toISOString()
                }
            }));
            confirmationService.show("Progress archived to Continue Watching.");
        }
    }
    setLiveWatchMedia(null);
    setLiveWatchElapsedSeconds(0);
    setIsLiveWatchMinimized(false);
  }, [liveWatchMedia, liveWatchElapsedSeconds, setPausedLiveSessions]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    const paused = pausedLiveSessions[mediaInfo.id];
    if (paused) {
        setLiveWatchElapsedSeconds(paused.elapsedSeconds);
        setPausedLiveSessions(prev => {
            const next = { ...prev };
            delete next[mediaInfo.id];
            return next;
        });
    } else {
        setLiveWatchElapsedSeconds(0);
    }
    setLiveWatchMedia(mediaInfo);
    setLiveWatchIsPaused(false);
    setIsLiveWatchMinimized(false);
    confirmationService.show(`Live session started: ${mediaInfo.title}`);
  }, [pausedLiveSessions, setPausedLiveSessions]);

  const handleLiveWatchDiscard = useCallback(() => {
    setLiveWatchMedia(null);
    setLiveWatchElapsedSeconds(0);
    setIsLiveWatchMinimized(false);
    confirmationService.show("Live session discarded.");
  }, []);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => !prev);
  }, []);

  useEffect(() => {
    let interval: number;
    if (liveWatchMedia && !liveWatchIsPaused) {
      interval = window.setInterval(() => {
        setLiveWatchElapsedSeconds(prev => {
            const next = prev + 1;
            const runtimeSeconds = liveWatchMedia.runtime * 60;
            if (next >= runtimeSeconds) {
                handleLiveWatchStop();
                return prev;
            }
            return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [liveWatchMedia, liveWatchIsPaused, handleLiveWatchStop]);

  const allUserData: UserData = useMemo(() => ({
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites, watchProgress, history, deletedHistory, customLists, ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory
  }), [watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites, watchProgress, history, deletedHistory, customLists, ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory]);

  const currentWeekKey = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    if (weeklyFavoritesWeekKey && weeklyFavoritesWeekKey !== currentWeekKey) {
        if (weeklyFavorites.length > 0) setWeeklyFavoritesHistory(prev => ({ ...prev, [weeklyFavoritesWeekKey]: weeklyFavorites }));
        setWeeklyFavorites([]);
        setWeeklyFavoritesWeekKey(currentWeekKey);
    } else if (!weeklyFavoritesWeekKey) setWeeklyFavoritesWeekKey(currentWeekKey);
  }, [currentWeekKey, weeklyFavoritesWeekKey, weeklyFavorites, setWeeklyFavorites, setWeeklyFavoritesWeekKey, setWeeklyFavoritesHistory]);

  const handleNominateWeeklyPick = useCallback((pick: WeeklyPick, replacementId?: number) => {
    setWeeklyFavorites(prev => {
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayName = dayNames[pick.dayIndex];
        const categoryLabel = pick.category.toUpperCase();
        if (replacementId !== undefined) {
             const oldItem = prev.find(p => p.id === replacementId && p.category === pick.category && p.dayIndex === pick.dayIndex);
             const next = prev.filter(p => !(p.id === replacementId && p.category === pick.category && p.dayIndex === pick.dayIndex));
             confirmationService.show(`Replaced ${oldItem?.title} with ${pick.title} as a ${categoryLabel} gem for ${dayName}!`);
             return [...next, pick];
        }
        if (prev.some(p => p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex)) {
            confirmationService.show(`${pick.title} is already nominated for ${dayName}!`);
            return prev;
        }
        if (prev.filter(p => p.category === pick.category && p.dayIndex === pick.dayIndex).length >= 5) {
            confirmationService.show(`Limit reached for ${categoryLabel} gems on ${dayName}.`);
            return prev;
        }
        confirmationService.show(`${pick.title} nominated for ${dayName}!`);
        return [...prev, pick];
    });
  }, [setWeeklyFavorites]);

  const handleRemoveWeeklyPick = useCallback((pick: WeeklyPick) => {
      setWeeklyFavorites(prev => prev.filter(p => !(p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex)));
      confirmationService.show(`Nomination removed: ${pick.title}`);
  }, [setWeeklyFavorites]);

  useEffect(() => {
    setCustomLists(prev => {
      if (!prev.some(l => l.id === 'watchlist')) {
        const watchlist: CustomList = { id: 'watchlist', name: 'Watchlist', description: 'Your default watchlist.', items: [], createdAt: new Date().toISOString(), isPublic: false, likes: [] };
        return [watchlist, ...prev];
      }
      return prev;
    });
  }, [setCustomLists]);

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  const handleAddToList = useCallback((listId: string, item: CustomListItem) => {
    setCustomLists(prev => prev.map(list => {
      if (list.id === listId) {
        if (list.items.some(i => i.id === item.id)) {
            confirmationService.show(`"${item.title}" is already in ${list.name}.`);
            return list;
        }
        confirmationService.show(`Added "${item.title}" to ${list.name}.`);
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
      isPublic: false,
      likes: []
    };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`Created list "${listName}" and added "${item.title}".`);
  }, [setCustomLists]);

  const handleUpdateSearchHistory = useCallback((entry: string | TrackedItem) => {
    setSearchHistory(prev => {
        const timestamp = new Date().toISOString();
        let newItem: SearchHistoryItem;
        if (typeof entry === 'string') {
            const query = entry.trim();
            if (!query || (prev.length > 0 && prev[0].query === query)) return prev;
            newItem = { query, timestamp };
        } else {
            if (prev.length > 0 && prev[0].item?.id === entry.id) return prev;
            newItem = { item: entry, timestamp };
        }
        return [newItem, ...prev].slice(0, 50);
    });
  }, [setSearchHistory]);

  const handleSelectShow = (id: number, media_type: 'tv' | 'movie' | 'person', itemData?: TrackedItem) => {
    if (media_type === 'person') {
        setSelectedPerson(id);
    } else {
        setSelectedShow({ id, media_type });
        setSelectedPerson(null);
    }
    if (itemData) handleUpdateSearchHistory(itemData);
    setSelectedUserId(null);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
      setSelectedShow(null);
      setSelectedPerson(null);
      setSelectedUserId(null);
  };

  const handleTabPress = (tabId: string) => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setSelectedUserId(null);
    window.scrollTo(0, 0);
    setInitialLibraryStatus(undefined);
    const screenNames: string[] = ['home', 'search', 'calendar', 'progress', 'profile'];
    if (screenNames.includes(tabId)) {
        setActiveScreen(tabId as ScreenName);
        setProfileInitialTab(undefined);
    } else {
        setActiveScreen('profile');
        setProfileInitialTab(tabId as ProfileTab);
    }
  };

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped, allCaughtUp: setAllCaughtUp,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        
        if (newList && setters[newList]) {
            const stampedItem = { ...item, addedAt: item.addedAt || new Date().toISOString() };
            setters[newList](prev => [stampedItem, ...prev]);
        }

        const showName = item.title || (item as any).name || 'Untitled';
        if (newList === 'watching') confirmationService.show(`Added ${showName} to Watching`);
        else if (newList === 'allCaughtUp') confirmationService.show(`You are all caught up with ${showName}!`);
        else if (newList) confirmationService.show(`"${showName}" added to ${newList}`);
        else if (oldList) confirmationService.show(`Removed ${showName} from ${oldList}`);
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setAllCaughtUp]);

  const syncLibraryItem = useCallback(async (mediaId: number, mediaType: 'tv' | 'movie', updatedProgress?: WatchProgress) => {
      try {
          const details = await getMediaDetails(mediaId, mediaType);
          const currentProgress = (updatedProgress || watchProgress)[mediaId] || {};
          let manualStatusKey: WatchStatus | null = null;
          let existingItem: TrackedItem | undefined;

          if (existingItem = planToWatch.find(i => i.id === mediaId)) manualStatusKey = 'planToWatch';
          else if (existingItem = onHold.find(i => i.id === mediaId)) manualStatusKey = 'onHold';
          else if (existingItem = dropped.find(i => i.id === mediaId)) manualStatusKey = 'dropped';
          
          const autoStatus = calculateAutoStatus(details, currentProgress);
          const trackedItem: TrackedItem = {
              id: details.id, title: details.title || details.name || 'Untitled', 
              media_type: mediaType, poster_path: details.poster_path, genre_ids: details.genres?.map(g => g.id),
              addedAt: existingItem?.addedAt,
              release_date: details.release_date || details.first_air_date
          };

          if (!autoStatus) {
              if (manualStatusKey) return;
              updateLists(trackedItem, null, null);
              return;
          }
          if (mediaType === 'movie') {
              updateLists(trackedItem, null, 'completed');
              return;
          }
          updateLists(trackedItem, null, autoStatus);
      } catch (e) {
          console.error("Failed to sync library item", e);
      }
  }, [watchProgress, planToWatch, onHold, dropped, updateLists]);

  const handleMarkMovieAsWatched = useCallback((item: any, date?: string) => {
      const tracked: TrackedItem = { id: item.id, title: item.title || item.name || 'Unknown', media_type: item.media_type, poster_path: item.poster_path };
      setHistory(prev => [{ ...tracked, logId: `manual-${item.id}-${Date.now()}`, timestamp: date || new Date().toISOString() }, ...prev]);
      syncLibraryItem(item.id, item.media_type);
      setUserXp(prev => prev + (item.media_type === 'movie' ? XP_CONFIG.movie : 0));
  }, [setHistory, setUserXp, syncLibraryItem]);

  const handleFollow = useCallback((targetUserId: string, username: string) => {
    const myId = currentUser?.id || 'guest';
    setFollows(prev => {
        const myFollows = prev[myId] || [];
        if (myFollows.includes(targetUserId)) return prev;
        return { ...prev, [myId]: [...myFollows, targetUserId] };
    });
    confirmationService.show(`Following ${username}`);
  }, [currentUser, setFollows]);

  const handleUnfollow = useCallback((targetUserId: string) => {
    const myId = currentUser?.id || 'guest';
    setFollows(prev => {
        const myFollows = prev[myId] || [];
        return { ...prev, [myId]: myFollows.filter(id => id !== targetUserId) };
    });
  }, [currentUser, setFollows]);

  const handleToggleEpisode = useCallback((showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => {
    const newStatus = currentStatus === 2 ? 0 : 2;
    let nextProgress: WatchProgress;
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as 0 | 1 | 2 };
        nextProgress = next;
        return next;
    });
    if (newStatus === 2) {
        setHistory(prev => [{
            ...showInfo,
            logId: `tv-${showId}-${season}-${episode}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            seasonNumber: season,
            episodeNumber: episode,
            episodeTitle: episodeName,
            episodeStillPath,
            seasonPosterPath
        }, ...prev]);
        setUserXp(prev => prev + XP_CONFIG.episode);
    } else {
        setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
    }
    setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress), 10);
  }, [setWatchProgress, setHistory, setUserXp, syncLibraryItem]);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === item.id);
        if (isFav) {
            confirmationService.show(`Removed ${item.title} from favorites`);
            return prev.filter(f => f.id !== item.id);
        }
        confirmationService.show(`Added ${item.title} to favorites`);
        return [item, ...prev];
    });
  }, [setFavorites]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
    setRatings(prev => {
        if (rating === 0) {
            const next = { ...prev };
            delete next[mediaId];
            return next;
        }
        return { ...prev, [mediaId]: { rating, date: new Date().toISOString() } };
    });
  }, [setRatings]);

  const handlePurgeMediaFromRegistry = useCallback((mediaId: number, mediaType: 'tv' | 'movie', deleteLive: boolean = false) => {
    setHistory(prev => {
        const logsToArchive = prev.filter(h => {
            if (h.id !== mediaId) return false;
            // If deleteLive is true, we delete ALL logs.
            // If deleteLive is false, we keep the ones starting with 'live-'.
            if (deleteLive) return true;
            return !h.logId.startsWith('live-');
        });
        if (logsToArchive.length > 0) {
            setDeletedHistory(dPrev => [...logsToArchive.map(l => ({ ...l, deletedAt: new Date().toISOString() })), ...dPrev]);
        }
        return prev.filter(h => {
            if (h.id !== mediaId) return true;
            if (deleteLive) return false;
            return h.logId.startsWith('live-');
        });
    });
    
    // If deleteLive is requested, also purge from progress and paused sessions
    if (deleteLive) {
        setWatchProgress(prev => {
            const next = { ...prev };
            delete next[mediaId];
            return next;
        });
        setPausedLiveSessions(prev => {
            const next = { ...prev };
            delete next[mediaId];
            return next;
        });
    }
    
    // Force a re-sync to update library status (Completed/Watching/etc)
    setTimeout(() => syncLibraryItem(mediaId, mediaType), 50);
  }, [setHistory, setWatchProgress, setDeletedHistory, setPausedLiveSessions, syncLibraryItem]);

  const handleMarkPreviousEpisodesWatched = useCallback(async (showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
    try {
        const details = await getMediaDetails(showId, 'tv');
        const showInfo: TrackedItem = { id: showId, title: details.name || 'Untitled', media_type: 'tv', poster_path: details.poster_path };
        const newLogs: HistoryItem[] = [];
        const newProgress = { ...watchProgress };
        if (!newProgress[showId]) newProgress[showId] = {};
        const seasonsToMark = (details.seasons || []).filter(s => s.season_number > 0 && s.season_number <= seasonNumber);
        for (const s of seasonsToMark) {
            const sd = await getSeasonDetails(showId, s.season_number);
            if (!newProgress[showId][s.season_number]) newProgress[showId][s.season_number] = {};
            for (const ep of sd.episodes) {
                if (s.season_number < seasonNumber || ep.episode_number <= lastEpisodeNumber) {
                    if (newProgress[showId][s.season_number][ep.episode_number]?.status !== 2) {
                        newProgress[showId][s.season_number][ep.episode_number] = { status: 2 };
                        newLogs.push({
                            ...showInfo,
                            logId: `tv-bulk-${showId}-${s.season_number}-${ep.episode_number}-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            seasonNumber: s.season_number,
                            episodeNumber: ep.episode_number,
                            episodeTitle: ep.name
                        });
                    }
                }
            }
        }
        setWatchProgress(newProgress);
        setHistory(prev => [...newLogs, ...prev]);
        setUserXp(prev => prev + (newLogs.length * XP_CONFIG.episode));
        confirmationService.show(`Marked ${newLogs.length} episodes as watched`);
        syncLibraryItem(showId, 'tv', newProgress);
    } catch (e) { console.error(e); }
  }, [watchProgress, setWatchProgress, setHistory, setUserXp, syncLibraryItem]);

  const handleDeleteHistoryItem = useCallback((item: HistoryItem) => {
    setHistory(prev => {
        const newHistory = prev.filter(h => h.logId !== item.logId);
        if (item.media_type === 'tv' && item.seasonNumber !== undefined && item.episodeNumber !== undefined) {
            const remainingLogs = newHistory.filter(h => h.id === item.id && h.seasonNumber === item.seasonNumber && h.episodeNumber === item.episodeNumber);
            if (remainingLogs.length === 0) {
                setWatchProgress(progress => {
                    const next = { ...progress };
                    if (next[item.id]?.[item.seasonNumber!]) {
                        const season = { ...next[item.id][item.seasonNumber!] };
                        delete season[item.episodeNumber!];
                        if (Object.keys(season).length === 0) delete next[item.id][item.seasonNumber!];
                        else next[item.id][item.seasonNumber!] = season;
                    }
                    return next;
                });
            }
        } else if (item.media_type === 'movie') {
            const remainingLogs = newHistory.filter(h => h.id === item.id);
            if (remainingLogs.length === 0) setCompleted(prevCompleted => prevCompleted.filter(i => i.id !== item.id));
        }
        return newHistory;
    });
    setDeletedHistory(prev => [{ ...item, deletedAt: new Date().toISOString() }, ...prev]);
    confirmationService.show("Log moved to Trash");
    setTimeout(() => syncLibraryItem(item.id, item.media_type as 'tv' | 'movie'), 50);
  }, [setHistory, setDeletedHistory, setWatchProgress, setCompleted, syncLibraryItem]);

  const handleRestoreHistoryItem = useCallback((item: DeletedHistoryItem) => {
    setDeletedHistory(prev => prev.filter(h => h.logId !== item.logId));
    const { deletedAt, ...historyItem } = item;
    setHistory(prev => {
        const newHistory = [historyItem, ...prev];
        if (item.media_type === 'tv' && item.seasonNumber !== undefined && item.episodeNumber !== undefined) {
             setWatchProgress(progress => {
                const next = { ...progress };
                if (!next[item.id]) next[item.id] = {};
                if (!next[item.id][item.seasonNumber!]) next[item.id][item.seasonNumber!] = {};
                next[item.id][item.seasonNumber!][item.episodeNumber!] = { status: 2 };
                return next;
            });
        } else if (item.media_type === 'movie') {
            setCompleted(prevComp => {
                if (!prevComp.find(i => i.id === item.id)) {
                    return [{ id: item.id, title: item.title, media_type: 'movie', poster_path: item.poster_path }, ...prevComp];
                }
                return prevComp;
            });
        }
        return newHistory;
    });
    confirmationService.show("Log restored");
    setTimeout(() => syncLibraryItem(item.id, item.media_type as 'tv' | 'movie'), 50);
  }, [setHistory, setDeletedHistory, setWatchProgress, setCompleted, syncLibraryItem]);

  const handlePermanentDeleteHistoryItem = useCallback((logId: string) => {
    setDeletedHistory(prev => prev.filter(h => h.logId !== logId));
    confirmationService.show("Log permanently deleted");
  }, [setDeletedHistory]);

  const handleClearAllDeletedHistory = useCallback(() => {
    setDeletedHistory([]);
    confirmationService.show("Trash bin emptied permanently.");
  }, [setDeletedHistory]);

  const handleSaveComment = useCallback((commentData: any) => {
    const newComment: Comment = {
        id: `c-${Date.now()}`,
        user: { id: currentUser?.id || 'guest', username: currentUser?.username || 'Guest', profilePictureUrl: profilePictureUrl },
        timestamp: new Date().toISOString(), likes: [], ...commentData
    };
    setComments(prev => [newComment, ...prev]);
    confirmationService.show("Comment posted");
  }, [currentUser, profilePictureUrl, setComments]);

  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
    try {
        const details = await getMediaDetails(showId, 'tv');
        if (details.last_episode_to_air) handleMarkPreviousEpisodesWatched(showId, details.last_episode_to_air.season_number, details.last_episode_to_air.episode_number);
        else if (details.number_of_episodes && details.number_of_episodes > 0) handleMarkPreviousEpisodesWatched(showId, 999, 9999);
    } catch (e) { console.error(e); confirmationService.show("Failed to identify aired episodes."); }
  }, [handleMarkPreviousEpisodesWatched]);

  const handleUnmarkAllWatched = useCallback((showId: number) => {
    handlePurgeMediaFromRegistry(showId, 'tv', true);
  }, [handlePurgeMediaFromRegistry]);

  // Handle data import from Trakt
  const handleTraktImportCompleted = useCallback((data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => {
    setHistory(prev => {
        const existingIds = new Set(prev.map(h => h.logId));
        const newLogs = data.history.filter(h => !existingIds.has(h.logId));
        return [...newLogs, ...prev];
    });
    setCompleted(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = data.completed.filter(i => !existingIds.has(i.id));
        return [...newItems, ...prev];
    });
    setPlanToWatch(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = data.planToWatch.filter(i => !existingIds.has(i.id));
        return [...newItems, ...prev];
    });
    setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
    setRatings(prev => ({ ...prev, ...data.ratings }));
    confirmationService.show("Trakt data imported successfully.");
  }, [setHistory, setCompleted, setPlanToWatch, setWatchProgress, setRatings]);

  // Handle data import from TMDB
  const handleTmdbImportCompleted = useCallback((data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    favorites: TrackedItem[];
    ratings: UserRatings;
  }) => {
    setHistory(prev => {
        const existingIds = new Set(prev.map(h => h.logId));
        const newLogs = data.history.filter(h => !existingIds.has(h.logId));
        return [...newLogs, ...prev];
    });
    setCompleted(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = data.completed.filter(i => !existingIds.has(i.id));
        return [...newItems, ...prev];
    });
    setPlanToWatch(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = data.planToWatch.filter(i => !existingIds.has(i.id));
        return [...newItems, ...prev];
    });
    setFavorites(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = data.favorites.filter(i => !existingIds.has(i.id));
        return [...newItems, ...prev];
    });
    setRatings(prev => ({ ...prev, ...data.ratings }));
    confirmationService.show("TMDB data imported successfully.");
  }, [setHistory, setCompleted, setPlanToWatch, setFavorites, setRatings]);

  // Handle generic JSON library import
  const handleJsonImportCompleted = useCallback((data: any) => {
    if (data.history) setHistory(prev => {
        const existingIds = new Set(prev.map(h => h.logId));
        const newLogs = data.history.filter((h: any) => !existingIds.has(h.logId));
        return [...newLogs, ...prev];
    });
    if (data.watchProgress) setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
    if (data.ratings) setRatings(prev => ({ ...prev, ...data.ratings }));
    if (data.episodeRatings) setEpisodeRatings(prev => ({ ...prev, ...data.episodeRatings }));
    if (data.seasonRatings) setSeasonRatings(prev => ({ ...prev, ...data.seasonRatings }));
    if (data.favoriteEpisodes) setFavoriteEpisodes(prev => ({ ...prev, ...data.favoriteEpisodes }));
    if (data.customLists) setCustomLists(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const newLists = data.customLists.filter((l: any) => !existingIds.has(l.id));
        return [...newLists, ...prev];
    });
    
    const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
      favorites: setFavorites,
      watching: setWatching,
      planToWatch: setPlanToWatch,
      completed: setCompleted,
      onHold: setOnHold,
      dropped: setDropped,
      allCaughtUp: setAllCaughtUp,
    };

    Object.entries(setters).forEach(([key, setter]) => {
      const items = data[key];
      if (items && Array.isArray(items)) {
        setter((prev: TrackedItem[]) => {
          const existingIds = new Set(prev.map(i => i.id));
          const newItems = items.filter((i: any) => !existingIds.has(i.id));
          return [...newItems, ...prev];
        });
      }
    });

    const uniqueMediaIds = new Set<number>();
    if (data.history) data.history.forEach((h: any) => uniqueMediaIds.add(h.id));
    if (data.watching) data.watching.forEach((i: any) => uniqueMediaIds.add(i.id));
    
    uniqueMediaIds.forEach(id => {
      // Find media type from existing lists if available in data
      let mediaType: 'tv' | 'movie' | null = null;
      const findItem = (list: any[]) => list?.find((i: any) => i.id === id);
      const item = findItem(data.history) || findItem(data.watching) || findItem(data.completed);
      if (item) mediaType = item.media_type;

      if (mediaType === 'tv' || mediaType === 'movie') {
        setTimeout(() => syncLibraryItem(id, mediaType!), 50);
      }
    });
    
    confirmationService.show("Full library import successful.");
  }, [setHistory, setWatchProgress, setRatings, setEpisodeRatings, setSeasonRatings, setFavoriteEpisodes, setCustomLists, setFavorites, setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setAllCaughtUp, syncLibraryItem]);

  // FIX: Proper implementation for CSV/Manual imports from file
  const handleCsvImportCompleted = useCallback((newHistory: HistoryItem[], newCompleted: TrackedItem[]) => {
    setHistory(prev => {
        const existingKeys = new Set(prev.map(h => `${h.id}-${h.timestamp}`));
        const filteredNew = newHistory.filter(h => !existingKeys.has(`${h.id}-${h.timestamp}`));
        return [...filteredNew, ...prev];
    });

    // Recalculate auto-statuses for all involved items
    const uniqueIds = Array.from(new Set([...newHistory, ...newCompleted].map(i => ({ id: i.id, type: i.media_type }))));
    uniqueIds.forEach(({ id, type }) => {
        if (type === 'tv' || type === 'movie') {
            setTimeout(() => syncLibraryItem(id, type as 'tv' | 'movie'), 100);
        }
    });
    
    confirmationService.show(`Imported ${newHistory.length} logs successfully.`);
  }, [setHistory, syncLibraryItem]);

  const renderScreen = () => {
    if (selectedUserId) return <UserProfileModal userId={selectedUserId} currentUser={currentUser || { id: 'guest', username: 'Guest' }} follows={follows[currentUser?.id || 'guest'] || []} onFollow={handleFollow} onUnfollow={handleUnfollow} onClose={() => setSelectedUserId(null)} onToggleLikeList={() => {}} />;
    if (selectedShow) {
        return (
            <ShowDetail 
                id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} 
                watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode}
                onSaveJournal={(sid, s, e, entry) => {
                    setWatchProgress(prev => {
                        const next = { ...prev };
                        if (!next[sid]) next[sid] = {};
                        if (!next[sid][s]) next[sid][s] = {};
                        next[sid][s][e] = { ...next[sid][s][e], journal: entry as any };
                        return next;
                    });
                    if (entry) setUserXp(prev => prev + XP_CONFIG.journal);
                }}
                trackedLists={{ watching, planToWatch, completed, onHold, dropped, allCaughtUp }}
                onUpdateLists={updateLists} customImagePaths={customImagePaths}
                onSetCustomImage={(mid, type, path) => setCustomImagePaths(prev => ({ ...prev, [mid]: { ...prev[mid], [`${type}_path`]: path } }))}
                favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow}
                weeklyFavorites={weeklyFavorites} onToggleWeeklyFavorite={handleNominateWeeklyPick}
                onSelectShow={handleSelectShow} onOpenCustomListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                ratings={ratings} onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkMovieAsWatched}
                onUnmarkMovieWatched={(id, deleteLive) => handlePurgeMediaFromRegistry(id, 'movie', deleteLive)}
                onMarkSeasonWatched={(sid, sNum) => handleMarkPreviousEpisodesWatched(sid, sNum, 999)}
                onUnmarkSeasonWatched={(sid, sNum) => { 
                    setHistory(prev => {
                        const logsToArchive = prev.filter(h => h.id === sid && h.seasonNumber === sNum);
                        setDeletedHistory(dPrev => [...logsToArchive.map(l => ({ ...l, deletedAt: new Date().toISOString() })), ...dPrev]);
                        return prev.filter(h => !(h.id === sid && h.seasonNumber === sNum));
                    });
                    setWatchProgress(prev => { const next = { ...prev }; if (next[sid]) delete next[sid][sNum]; return next; }); 
                    setTimeout(() => syncLibraryItem(sid, 'tv'), 100);
                }}
                onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} favoriteEpisodes={favoriteEpisodes}
                onToggleFavoriteEpisode={(sid, s, e) => setFavoriteEpisodes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = !next[sid][s][e]; return next; })}
                onSelectPerson={(id) => setSelectedPerson(id)} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem}
                onClearMediaHistory={(mid, mType) => handlePurgeMediaFromRegistry(mid, mType as any, true)} episodeRatings={episodeRatings}
                onRateEpisode={(sid, s, e, r) => setEpisodeRatings(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = r; return next; })}
                onAddWatchHistory={(item, s, e, ts, nt, en) => {
                    setHistory(prev => [{ ...item, logId: `log-${item.id}-${Date.now()}`, timestamp: ts || new Date().toISOString(), seasonNumber: s, episodeNumber: e, note: nt, episodeTitle: en }, ...prev]);
                    syncLibraryItem(item.id, 'tv');
                }}
                onAddWatchHistoryBulk={(item, ids, ts, nt) => {}} onSaveComment={handleSaveComment} comments={comments} genres={genres}
                onMarkAllWatched={handleMarkAllWatched} onUnmarkAllWatched={handleUnmarkAllWatched}
                onSaveEpisodeNote={(sid, s, e, n) => setEpisodeNotes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = n; return next; })}
                showRatings={showRatings} seasonRatings={seasonRatings}
                onRateSeason={(sid, s, r) => setSeasonRatings(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = r; return next; })}
                customLists={customLists} currentUser={currentUser} allUsers={[]}
                onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} allUserData={allUserData}
                episodeNotes={episodeNotes} preferences={preferences} follows={follows} pausedLiveSessions={pausedLiveSessions} onAuthClick={onAuthClick}
            />
        );
    }

    switch (activeScreen) {
        case 'search': return <SearchScreen query={searchQuery} onQueryChange={setSearchQuery} onSelectShow={handleSelectShow} onSelectPerson={(id) => setSelectedPerson(id)} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={handleUpdateSearchHistory} onDeleteSearchHistoryItem={(timestamp) => setSearchHistory(prev => prev.filter(h => h.timestamp !== timestamp))} onClearSearchHistory={() => setSearchHistory([])} onMarkShowAsWatched={() => {}} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings} preferences={preferences} />;
        case 'calendar': return <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={(rem, id) => setReminders(prev => rem ? [...prev, rem] : prev.filter(r => r.id !== id))} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} />;
        case 'progress': return <ProgressScreen userData={allUserData} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={handleStartLiveWatch} preferences={preferences} />;
        case 'profile': return (
          <Profile 
            userData={allUserData} genres={genres} onSelectShow={handleSelectShow} initialTab={profileInitialTab} initialLibraryStatus={initialLibraryStatus}
            currentUser={currentUser} onAuthClick={onAuthClick} onLogout={onLogout} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} 
            onImportCompleted={handleCsvImportCompleted} onTraktImportCompleted={handleTraktImportCompleted} onTmdbImportCompleted={handleTmdbImportCompleted} onJsonImportCompleted={handleJsonImportCompleted} onToggleEpisode={handleToggleEpisode}
            onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={(sid, s, e) => setFavoriteEpisodes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = !next[sid][s][e]; return next; })}
            setCustomLists={setCustomLists} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={handleDeleteHistoryItem} onRestoreHistoryItem={handleRestoreHistoryItem} onPermanentDeleteHistoryItem={handlePermanentDeleteHistoryItem} onClearAllDeletedHistory={handleClearAllDeletedHistory}
            onDeleteSearchHistoryItem={(timestamp) => setSearchHistory(prev => prev.filter(h => h.timestamp !== timestamp))} onClearSearchHistory={() => setSearchHistory([])} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme}
            baseThemeId={baseThemeId} currentHolidayName={currentHolidayName} customThemes={customThemes} setCustomThemes={setCustomThemes} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset}
            setCompleted={setCompleted} follows={follows} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onSelectUser={setSelectedUserId} timezone={timezone} setTimezone={setTimezone}
            onRemoveDuplicateHistory={() => {}} notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} onMarkOneRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onAddNotifications={(notifs) => setNotifications(prev => [...notifs, ...prev])} 
            autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={holidayAnimationsEnabled} setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} profileTheme={profileTheme} setProfileTheme={setProfileTheme} textSize={textSize} setTextSize={setTextSize} onFeedbackSubmit={() => {}} levelInfo={calculateLevelInfo(userXp)} timeFormat={timeFormat} setTimeFormat={setTimeFormat} pin={pin} setPin={setPin} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} onToggleWeeklyFavorite={handleRemoveWeeklyPick} onOpenNominateModal={() => setIsNominateModalOpen(true)} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={handleStartLiveWatch} shortcutSettings={shortcutSettings} setShortcutSettings={setShortcutSettings} navSettings={navSettings} setNavSettings={setNavSettings} preferences={preferences} setPreferences={setPreferences}
          />
        );
        case 'home':
        default: return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow as any} watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} onShortcutNavigate={handleTabPress} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleLiveWatchStop} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat={timeFormat} reminders={reminders} onToggleReminder={(rem, id) => setReminders(prev => rem ? [...prev, rem] : prev.filter(r => r.id !== id))} onUpdateLists={updateLists} shortcutSettings={shortcutSettings} preferences={preferences} onRemoveWeeklyPick={handleRemoveWeeklyPick} onOpenNominateModal={() => setIsNominateModalOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <AnimationContainer />
      <ConfirmationContainer />
      <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} currentPicks={weeklyFavorites} onNominate={handleNominateWeeklyPick} onRemovePick={handleRemoveWeeklyPick} />
      <WelcomeModal 
        isOpen={!currentUser && !isWelcomeDismissed} 
        onClose={() => { localStorage.setItem('welcome_dismissed', 'true'); setIsWelcomeDismissed(true); }} 
        timezone={timezone} 
        setTimezone={setTimezone} 
        timeFormat={timeFormat}
        setTimeFormat={setTimeFormat}
      />
      <AddToListModal 
        isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} 
        onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={(id, type) => handleSelectShow(id, type)} onUpdateLists={updateLists}
      />
      <PersonDetailModal 
        isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} personId={selectedPerson} userData={allUserData} 
        onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} 
        onToggleWeeklyFavorite={handleNominateWeeklyPick} weeklyFavorites={weeklyFavorites}
      />
      <LiveWatchTracker 
        isOpen={!!liveWatchMedia} onClose={handleLiveWatchStop} onDiscard={handleLiveWatchDiscard} mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} 
        onTogglePause={handleLiveWatchTogglePause} isMinimized={isLiveWatchMinimized} onToggleMinimize={() => setIsLiveWatchMinimized(!isLiveWatchMinimized)}
        onMarkWatched={(info) => { if (info.media_type === 'movie') handleMarkMovieAsWatched(info); else handleToggleEpisode(info.id, info.seasonNumber!, info.episodeNumber!, 0, info as any, info.episodeTitle); handleLiveWatchStop(); }}
        onAddToList={(info) => setAddToListModalState({ isOpen: true, item: info as any })}
      />
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => handleTabPress('profile')} onSelectShow={handleSelectShow} onGoHome={() => handleTabPress('home')} onMarkShowAsWatched={() => {}} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} isHoliday={false} holidayName={null} />
      <main className="container mx-auto flex-grow pt-8">{renderScreen()}</main>
      <BottomTabNavigator activeTab={activeScreen} activeProfileTab={profileInitialTab} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} navSettings={navSettings} />
    </div>
  );
};

export default MainApp;