
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import AuthModal from './components/AuthModal';
import { UserData, WatchProgress, Theme, HistoryItem, TrackedItem, UserRatings, 
  EpisodeRatings, SeasonRatings, CustomList, AppNotification, FavoriteEpisodes, 
  LiveWatchMediaInfo, SearchHistoryItem, Comment, Note, ScreenName, ProfileTab, 
  WatchStatus, WeeklyPick, DeletedHistoryItem, CustomImagePaths, Reminder, 
  NotificationSettings, ShortcutSettings, NavSettings, AppPreferences, 
  PrivacySettings, ProfileTheme, TmdbMedia, Follows, CustomListItem, DeletedNote, EpisodeProgress, CommentVisibility,
  JournalEntry
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
import AirtimeManagement from './screens/AirtimeManagement';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import { getAllUsers } from './utils/userUtils';
import { supabase } from './services/supabaseClient';

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
  const [deletedNotes, setDeletedNotes] = useLocalStorage<DeletedNote[]>(`deleted_notes_${userId}`, []);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`search_history_${userId}`, []);
  const [comments, setComments] = useLocalStorage<Comment[]>(`comments_${userId}`, []);
  const [mediaNotes, setMediaNotes] = useLocalStorage<Record<number, Note[]>>(`media_notes_${userId}`, {});
  const [episodeNotes, setEpisodeNotes] = useLocalStorage<Record<number, Record<number, Record<number, Note[]>>>>(`episode_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [customEpisodeImages, setCustomEpisodeImages] = useLocalStorage<Record<number, Record<number, Record<number, string>>>>(`custom_episode_images_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [seasonRatings, setSeasonRatings] = useLocalStorage<SeasonRatings>(`season_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [globalPlaceholders, setGlobalPlaceholders] = useLocalStorage<UserData['globalPlaceholders']>(`globalPlaceholders_${userId}`, {});
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true, newEpisodes: true, movieReleases: true, sounds: true, newFollowers: true, listLikes: true, appUpdates: true, importSyncCompleted: true, showWatchedConfirmation: true, showPriorEpisodesPopup: true,
  });

  const [manualPresets, setManualPresets] = useLocalStorage<Record<number, WatchStatus>>(`manual_presets_${userId}`, {});

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

  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string; startTime?: string; pauseCount?: number }>>(`paused_live_sessions_${userId}`, {});
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [weeklyFavorites, setWeeklyFavorites] = useLocalStorage<WeeklyPick[]>(`weekly_favorites_${userId}`, []);
  const [weeklyFavoritesWeekKey, setWeeklyFavoritesWeekKey] = useLocalStorage<string>(`weekly_favorites_week_${userId}`, '');
  const [weeklyFavoritesHistory, setWeeklyFavoritesHistory] = useLocalStorage<Record<string, WeeklyPick[]>>(`weekly_favorites_history_${userId}`, {});

  const [activeScreen, setActiveScreen] = useState<string>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [initialLibraryStatus, setInitialLibraryStatus] = useState<WatchStatus | undefined>(undefined);

  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [liveWatchStartTime, setLiveWatchStartTime] = useState<string | null>(null);
  const [liveWatchPauseCount, setLiveWatchPauseCount] = useState(0);
  const [isLiveWatchMinimized, setIsLiveWatchMinimized] = useState(false);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(!!localStorage.getItem('welcome_dismissed'));

  const isSyncingRef = useRef(false);

  // --- SUPABASE SYNC LOGIC ---

  // 1. Initial Load from Supabase
  useEffect(() => {
    if (!currentUser) return;

    const loadSupabaseData = async () => {
        isSyncingRef.current = true;
        
        // Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        if (profile) {
            if (profile.timezone) setTimezone(profile.timezone);
            if (profile.user_xp) setUserXp(profile.user_xp);
            if (profile.avatar_url) setProfilePictureUrl(profile.avatar_url);
        }

        // Library
        const { data: libraryItems } = await supabase.from('library').select('*').eq('User_id', currentUser.id);
        if (libraryItems) {
            const watchingList: TrackedItem[] = [];
            const planList: TrackedItem[] = [];
            const compList: TrackedItem[] = [];
            const holdList: TrackedItem[] = [];
            const dropList: TrackedItem[] = [];
            const catchList: TrackedItem[] = [];

            for (const item of libraryItems) {
                // We need to resolve basic info (title/poster) either from local cache or TMDB
                // For a robust sync, we'd fetch them here if not in localStorage
                const details = await getMediaDetails(item.tmdb_id, 'tv').catch(() => getMediaDetails(item.tmdb_id, 'movie')).catch(() => null);
                if (details) {
                    const tracked: TrackedItem = { id: details.id, title: details.title || details.name || 'Untitled', media_type: details.media_type, poster_path: details.poster_path, addedAt: item.added_at };
                    if (item.status === 'watching') watchingList.push(tracked);
                    else if (item.status === 'planToWatch') planList.push(tracked);
                    else if (item.status === 'completed') compList.push(tracked);
                    else if (item.status === 'onHold') holdList.push(tracked);
                    else if (item.status === 'dropped') dropList.push(tracked);
                    else if (item.status === 'allCaughtUp') catchList.push(tracked);
                }
            }
            setWatching(watchingList);
            setPlanToWatch(planList);
            setCompleted(compList);
            setOnHold(holdList);
            setDropped(dropList);
            setAllCaughtUp(catchList);
        }

        // Watch Progress
        const { data: progress } = await supabase.from('watch_progress').select('*').eq('User_id', currentUser.id);
        if (progress) {
            const newProgress: WatchProgress = {};
            progress.forEach(p => {
                newProgress[p.tmdb_id] = p.progress_data;
            });
            setWatchProgress(newProgress);
        }

        // Custom Lists
        const { data: lists } = await supabase.from('custom_lists').select('*, custom_list_items(*)').eq('User_id', currentUser.id);
        if (lists) {
            const finalLists: CustomList[] = await Promise.all(lists.map(async (l: any) => {
                const items: CustomListItem[] = await Promise.all(l.custom_list_items.map(async (li: any) => {
                    const d = await getMediaDetails(li.tmdb_id, 'tv').catch(() => getMediaDetails(li.tmdb_id, 'movie')).catch(() => null);
                    return { id: li.tmdb_id, title: d?.title || d?.name || 'Item', media_type: d?.media_type || 'movie', poster_path: d?.poster_path, addedAt: li.added_at };
                }));
                return { id: l.id, name: l.name, description: l.description, items, createdAt: l.created_at, visibility: l.Visibility || 'private', likes: [] };
            }));
            setCustomLists(finalLists);
        }

        isSyncingRef.current = false;
    };

    loadSupabaseData();
  }, [currentUser]);

  // 2. Sync State Changes to Supabase
  const syncToSupabase = useCallback(async () => {
    if (!currentUser || isSyncingRef.current) return;

    // This is an expensive operation if triggered too often. 
    // In a production app, we would sync specific tables on specific actions.
    // For this prototype, we'll sync key metrics periodically or on distinct changes.
    
    // Sync Library
    const libraryPayload = [
        ...watching.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'watching', added_at: i.addedAt || new Date().toISOString() })),
        ...planToWatch.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'planToWatch', added_at: i.addedAt || new Date().toISOString() })),
        ...completed.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'completed', added_at: i.addedAt || new Date().toISOString() })),
        ...onHold.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'onHold', added_at: i.addedAt || new Date().toISOString() })),
        ...dropped.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'dropped', added_at: i.addedAt || new Date().toISOString() })),
        ...allCaughtUp.map(i => ({ User_id: currentUser.id, tmdb_id: i.id, status: 'allCaughtUp', added_at: i.addedAt || new Date().toISOString() })),
    ];

    if (libraryPayload.length > 0) {
        await supabase.from('library').upsert(libraryPayload, { onConflict: 'User_id,tmdb_id' });
    }

    // Sync Progress
    const progressPayload = Object.entries(watchProgress).map(([id, data]) => ({
        User_id: currentUser.id,
        tmdb_id: parseInt(id),
        progress_data: data
    }));
    if (progressPayload.length > 0) {
        await supabase.from('watch_progress').upsert(progressPayload, { onConflict: 'User_id,tmdb_id' });
    }

    // Sync Profile
    await supabase.from('profiles').upsert({
        id: currentUser.id,
        username: currentUser.username,
        timezone: timezone,
        user_xp: userXp,
        avatar_url: profilePictureUrl
    });

  }, [currentUser, watching, planToWatch, completed, onHold, dropped, allCaughtUp, watchProgress, timezone, userXp, profilePictureUrl]);

  // Debounced Sync
  useEffect(() => {
      const timer = setTimeout(syncToSupabase, 5000);
      return () => clearTimeout(timer);
  }, [syncToSupabase]);


  const allUserData: UserData = useMemo(() => ({
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists, ratings,
    episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments,
    mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat
  }), [
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists, ratings,
    episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments,
    mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat
  ]);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);
  const allUsers = useMemo(() => getAllUsers(), []);

  useEffect(() => {
    getGenres().then(setGenres).catch(console.error);
  }, []);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (selectedShow || selectedPerson || selectedUserId) {
      setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null);
      window.history.pushState({ app: 'cinemontauge' }, ''); return;
    }
    if (activeScreen !== 'home') {
      setActiveScreen('home'); window.history.pushState({ app: 'cinemontauge' }, ''); return;
    }
    window.history.back();
  }, [selectedShow, selectedPerson, selectedUserId, activeScreen]);

  useEffect(() => {
    window.history.pushState({ app: 'cinemontauge' }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const onUpdateSearchHistory = useCallback((queryOrItem: string | TrackedItem) => {
    setSearchHistory(prev => {
        const timestamp = new Date().toISOString();
        let newItem: SearchHistoryItem;
        if (typeof queryOrItem === 'string') {
            newItem = { query: queryOrItem, timestamp };
        } else {
            newItem = { item: queryOrItem, timestamp };
        }
        const filtered = prev.filter(h => {
            if (newItem.query) return h.query !== newItem.query;
            if (newItem.item) return h.item?.id !== newItem.item.id;
            return true;
        });
        return [newItem, ...filtered].slice(0, 20);
    });
  }, [setSearchHistory]);

  const handleLiveWatchStop = useCallback(() => {
    if (liveWatchMedia) {
        const runtimeSeconds = liveWatchMedia.runtime * 60;
        if (liveWatchElapsedSeconds < runtimeSeconds - 10) {
             setPausedLiveSessions(prev => ({
                ...prev,
                [liveWatchMedia.id]: {
                    mediaInfo: liveWatchMedia, elapsedSeconds: liveWatchElapsedSeconds,
                    pausedAt: new Date().toISOString(), startTime: liveWatchStartTime || undefined, pauseCount: liveWatchPauseCount
                }
            }));
            confirmationService.show("Progress archived to Continue Watching.");
        }
    }
    setLiveWatchMedia(null); setLiveWatchElapsedSeconds(0); setLiveWatchStartTime(null); setLiveWatchPauseCount(0); setIsLiveWatchMinimized(false);
  }, [liveWatchMedia, liveWatchElapsedSeconds, liveWatchStartTime, liveWatchPauseCount, setPausedLiveSessions]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    const paused = pausedLiveSessions[mediaInfo.id];
    if (paused) {
        setLiveWatchElapsedSeconds(paused.elapsedSeconds);
        setLiveWatchStartTime(paused.startTime || new Date().toISOString());
        setLiveWatchPauseCount(paused.pauseCount || 0);
        setPausedLiveSessions(prev => {
            const next = { ...prev }; delete next[mediaInfo.id]; return next;
        });
    } else {
        setLiveWatchElapsedSeconds(0); setLiveWatchStartTime(new Date().toISOString()); setLiveWatchPauseCount(0);
    }
    setLiveWatchMedia(mediaInfo); setLiveWatchIsPaused(false); setIsLiveWatchMinimized(false);
    confirmationService.show(`Live session started: ${mediaInfo.title}`);
  }, [pausedLiveSessions, setPausedLiveSessions]);

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped, allCaughtUp: setAllCaughtUp,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        if (newList && setters[newList]) {
            const stampedItem = { ...item, addedAt: item.addedAt || new Date().toISOString() };
            setters[newList](prev => [stampedItem, ...prev]);
            if (['planToWatch', 'onHold', 'dropped'].includes(newList)) {
                setManualPresets(prev => ({ ...prev, [item.id]: newList }));
            }
        }
        const showName = item.title || (item as any).name || 'Untitled';
        if (newList === 'watching') confirmationService.show(`Added ${showName} to Watching`);
        else if (newList === 'allCaughtUp') confirmationService.show(`You are all caught up with ${showName}!`);
        else if (newList) confirmationService.show(`"${showName}" added to ${newList}`);
        else if (oldList) {
            confirmationService.show(`Removed ${showName} from ${oldList}`);
        }
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setAllCaughtUp, setManualPresets]);

  const syncLibraryItem = useCallback(async (mediaId: number, mediaType: 'tv' | 'movie', updatedProgress?: WatchProgress, watchActionJustHappened: boolean = false) => {
      try {
          const details = await getMediaDetails(mediaId, mediaType);
          
          // Ensure metadata is cached in Supabase media_items
          await supabase.from('media_items').upsert({
              tmdb_id: details.id,
              media_type: mediaType,
              title: details.title || details.name,
              poster_path: details.poster_path,
              backdrop_path: details.backdrop_path,
              first_air_date: details.release_date || details.first_air_date,
              metadata_last_updated: new Date().toISOString()
          });

          const currentProgress = (updatedProgress || watchProgress)[mediaId] || {};
          let totalWatched = 0;
          Object.values(currentProgress).forEach(s => {
              Object.values(s).forEach(e => { if ((e as EpisodeProgress).status === 2) totalWatched++; });
          });

          let currentManualPreset = manualPresets[mediaId];
          
          if (watchActionJustHappened && (currentManualPreset === 'dropped' || currentManualPreset === 'onHold')) {
              setManualPresets(prev => {
                  const next = { ...prev }; delete next[mediaId]; return next;
              });
              currentManualPreset = undefined;
          }

          const autoStatus = calculateAutoStatus(details, currentProgress);
          const trackedItem: TrackedItem = {
              id: details.id, title: details.title || details.name || 'Untitled', 
              media_type: mediaType, poster_path: details.poster_path, genre_ids: details.genres?.map(g => g.id),
              release_date: details.release_date || details.first_air_date
          };

          if (mediaType === 'movie') {
              const movieHistory = history.filter(h => h.id === mediaId);
              if (movieHistory.some(h => !h.logId.startsWith('live-'))) updateLists(trackedItem, null, 'completed');
              else if (currentManualPreset) updateLists(trackedItem, null, currentManualPreset);
              else updateLists(trackedItem, null, null);
              return;
          }

          if (totalWatched === 0) {
              if (currentManualPreset) updateLists(trackedItem, null, currentManualPreset);
              else updateLists(trackedItem, null, null);
          } else {
              updateLists(trackedItem, null, currentManualPreset || autoStatus);
          }
      } catch (e) { console.error(e); }
  }, [watchProgress, history, manualPresets, updateLists, setManualPresets]);

  const handleToggleEpisode = useCallback((showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => {
    const newStatus = currentStatus === 2 ? 0 : 2;
    let nextProgress: WatchProgress;
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as 0 | 1 | 2 };
        nextProgress = next; return next;
    });
    if (newStatus === 2) {
        const endTime = new Date().toISOString();
        const historyTitle = showInfo.title || (showInfo as any).name || 'Untitled';
        setHistory(prev => [{
            ...showInfo, 
            title: historyTitle,
            logId: `tv-${showId}-${season}-${episode}-${Date.now()}`, 
            timestamp: endTime,
            seasonNumber: season, episodeNumber: episode, episodeTitle: episodeName,
            episodeStillPath, seasonPosterPath, startTime: liveWatchStartTime || undefined,
            endTime: endTime, pauseCount: liveWatchPauseCount || undefined
        }, ...prev]);
        setUserXp(prev => prev + XP_CONFIG.episode);
    } else setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
    
    setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress, true), 10);
  }, [setWatchProgress, setHistory, setUserXp, syncLibraryItem, liveWatchStartTime, liveWatchPauseCount]);

  const handleSelectShow = useCallback((id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    window.scrollTo(0, 0);
  }, []);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === item.id);
        if (isFav) {
            confirmationService.show(`Removed ${item.title} from favorites.`);
            return prev.filter(f => f.id !== item.id);
        } else {
            confirmationService.show(`Added ${item.title} to favorites!`);
            return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
        }
    });
  }, [setFavorites]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
    setRatings(prev => {
        const next = { ...prev };
        if (rating === 0) delete next[mediaId];
        else next[mediaId] = { rating, date: new Date().toISOString() };
        return next;
    });
    setUserXp(prev => prev + XP_CONFIG.journal);
    confirmationService.show(rating === 0 ? "Rating removed." : `Rated ${rating}/10!`);
  }, [setRatings, setUserXp]);

  const handleRateEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, rating: number) => {
      setEpisodeRatings(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
          if (rating === 0) delete next[showId][seasonNumber][episodeNumber];
          else next[showId][seasonNumber][episodeNumber] = rating;
          return next;
      });
      setUserXp(prev => prev + XP_CONFIG.journal);
      confirmationService.show(rating === 0 ? "Episode rating removed." : `Rated episode ${rating}/10!`);
  }, [setEpisodeRatings, setUserXp]);

  const handleNominateWeeklyPick = useCallback((pick: WeeklyPick, replacementId?: number) => {
      setWeeklyFavorites(prev => {
          let next = [...prev];
          if (replacementId) {
              next = next.filter(p => !(p.id === replacementId && p.category === pick.category && p.dayIndex === pick.dayIndex));
          }
          const currentCount = next.filter(p => p.dayIndex === pick.dayIndex && p.category === pick.category).length;
          if (currentCount >= 5 && !replacementId) {
              confirmationService.show("Limit reached for this category today.");
              return prev;
          }
          confirmationService.show(`Nominated ${pick.title} as a Gem!`);
          return [pick, ...next];
      });
  }, [setWeeklyFavorites]);

  const handleRemoveWeeklyPick = useCallback((pick: WeeklyPick) => {
      setWeeklyFavorites(prev => prev.filter(p => !(p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex)));
      confirmationService.show("Nomination removed.");
  }, [setWeeklyFavorites]);

  const handleAddToList = useCallback((listId: string, item: CustomListItem) => {
    setCustomLists(prev => prev.map(l => {
        if (l.id === listId) {
            if (l.items.some(i => i.id === item.id)) return l;
            return { ...l, items: [item, ...l.items] };
        }
        return l;
    }));
    confirmationService.show(`Added to collection.`);
  }, [setCustomLists]);

  const handleCreateAndAddToList = useCallback((listName: string, item: CustomListItem) => {
    const newList: CustomList = {
        id: `cl-${Date.now()}`,
        name: listName,
        description: '',
        items: [item],
        createdAt: new Date().toISOString(),
        visibility: 'private',
        likes: []
    };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`Collection "${listName}" created.`);
  }, [setCustomLists]);

  const handleLiveWatchDiscard = useCallback(() => {
    if (window.confirm("Discard this session? Your progress will not be saved.")) {
        setLiveWatchMedia(null);
        setLiveWatchElapsedSeconds(0);
        setLiveWatchStartTime(null);
        setLiveWatchPauseCount(0);
        setIsLiveWatchMinimized(false);
    }
  }, []);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => {
        if (!prev) setLiveWatchPauseCount(c => c + 1);
        return !prev;
    });
  }, []);

  const handleMarkMovieAsWatched = useCallback(async (item: any, date?: string) => {
      const timestamp = date || new Date().toISOString();
      const trackedItem: TrackedItem = {
          id: item.id,
          title: item.title || item.name || 'Untitled',
          media_type: 'movie',
          poster_path: item.poster_path,
          genre_ids: item.genre_ids,
          release_date: item.release_date
      };
      
      setHistory(prev => [{
          ...trackedItem,
          logId: `movie-${item.id}-${Date.now()}`,
          timestamp,
          startTime: liveWatchStartTime || undefined,
          endTime: timestamp,
          pauseCount: liveWatchPauseCount || undefined
      }, ...prev]);
      
      setUserXp(prev => prev + XP_CONFIG.movie);
      updateLists(trackedItem, null, 'completed');
  }, [liveWatchStartTime, liveWatchPauseCount, setHistory, setUserXp, updateLists]);

  const handleSaveJournal = useCallback((showId: number, season: number, episode: number, entry: JournalEntry | null) => {
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], journal: entry || undefined };
        return next;
    });
    if (entry) setUserXp(prev => prev + XP_CONFIG.journal);
    confirmationService.show(entry ? "Journal entry saved." : "Journal entry removed.");
  }, [setWatchProgress, setUserXp]);

  const handleSetCustomImage = useCallback((mediaId: number, type: 'poster' | 'backdrop', path: string) => {
    setCustomImagePaths(prev => ({
        ...prev,
        [mediaId]: { ...prev[mediaId], [`${type}_path`]: path }
    }));
  }, [setCustomImagePaths]);

  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
    setFavoriteEpisodes(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
        const current = !!next[showId][seasonNumber][episodeNumber];
        next[showId][seasonNumber][episodeNumber] = !current;
        return next;
    });
  }, [setFavoriteEpisodes]);

  const handleUnmarkMovieWatched = useCallback((mediaId: number, deleteLive?: boolean) => {
      setHistory(prev => prev.filter(h => {
          if (h.id !== mediaId) return true;
          if (deleteLive) return false;
          return h.logId.startsWith('live-');
      }));
      syncLibraryItem(mediaId, 'movie');
  }, [setHistory, syncLibraryItem]);

  const handleMarkSeasonWatched = useCallback(async (showId: number, seasonNumber: number, showInfo: TrackedItem) => {
      try {
          const sd = await getSeasonDetails(showId, seasonNumber);
          const today = new Date().toISOString().split('T')[0];
          const aired = sd.episodes.filter(ep => ep.air_date && ep.air_date <= today);
          
          let nextProgress: WatchProgress;
          setWatchProgress(prev => {
              const next = { ...prev };
              if (!next[showId]) next[showId] = {};
              if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
              aired.forEach(ep => {
                  next[showId][seasonNumber][ep.episode_number] = { ...next[showId][seasonNumber][ep.episode_number], status: 2 };
              });
              nextProgress = next; return next;
          });
          
          const historyTitle = showInfo.title || (showInfo as any).name || 'Untitled';
          setHistory(prev => {
              const timestamp = new Date().toISOString();
              const newLogs = aired.map(ep => ({
                  ...showInfo, 
                  title: historyTitle,
                  logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                  timestamp, seasonNumber, episodeNumber: ep.episode_number, episodeTitle: ep.name
              }));
              return [...newLogs, ...prev];
          });
          
          setUserXp(prev => prev + (aired.length * XP_CONFIG.episode));
          setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress), 10);
      } catch (e) { console.error(e); }
  }, [setWatchProgress, setHistory, setUserXp, syncLibraryItem]);

  const handleUnmarkSeasonWatched = useCallback((showId: number, seasonNumber: number) => {
      setWatchProgress(prev => {
          const next = { ...prev };
          if (next[showId] && next[showId][seasonNumber]) {
              Object.keys(next[showId][seasonNumber]).forEach(eNum => {
                  next[showId][seasonNumber][Number(eNum)].status = 0;
              });
          }
          return next;
      });
      setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber)));
      syncLibraryItem(showId, 'tv');
  }, [setWatchProgress, setHistory, syncLibraryItem]);

  const handleMarkPreviousEpisodesWatched = useCallback(async (showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
      try {
          const details = await getMediaDetails(showId, 'tv');
          let nextProgress: WatchProgress;
          setWatchProgress(prev => {
              const next = { ...prev };
              if (!next[showId]) next[showId] = {};
              for (let s = 1; s <= seasonNumber; s++) {
                  if (!next[showId][s]) next[showId][s] = {};
                  const seasonMeta = details.seasons?.find(sm => sm.season_number === s);
                  const maxEp = s === seasonNumber ? lastEpisodeNumber : (seasonMeta?.episode_count || 0);
                  for (let e = 1; e <= maxEp; e++) {
                      next[showId][s][e] = { ...next[showId][s][e], status: 2 };
                  }
              }
              nextProgress = next; return next;
          });
          syncLibraryItem(showId, 'tv', nextProgress);
      } catch (e) { console.error(e); }
  }, [setWatchProgress, syncLibraryItem]);

  const handleDeleteHistoryItem = useCallback((item: HistoryItem) => {
      setHistory(prev => prev.filter(h => h.logId !== item.logId));
      setDeletedHistory(prev => [{ ...item, deletedAt: new Date().toISOString() }, ...prev]);
      confirmationService.show("Watch log moved to trash.");
      syncLibraryItem(item.id, item.media_type);
  }, [setHistory, setDeletedHistory, syncLibraryItem]);

  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => {
      const logTime = timestamp || new Date().toISOString();
      const historyTitle = item.title || (item as any).name || 'Untitled';
      setHistory(prev => [{
          ...item, 
          title: historyTitle,
          logId: `log-${item.id}-${Date.now()}`, 
          timestamp: logTime,
          seasonNumber, episodeNumber, episodeTitle: episodeName, note
      }, ...prev]);
      setUserXp(prev => prev + XP_CONFIG.episode);
      
      setWatchProgress(prev => {
          const next = { ...prev };
          if (!next[item.id]) next[item.id] = {};
          if (!next[item.id][seasonNumber]) next[item.id][seasonNumber] = {};
          next[item.id][seasonNumber][episodeNumber] = { ...next[item.id][seasonNumber][episodeNumber], status: 2 };
          return next;
      });
      syncLibraryItem(item.id, 'tv');
  }, [setHistory, setUserXp, setWatchProgress, syncLibraryItem]);

  const handleAddWatchHistoryBulk = useCallback((item: TrackedItem, episodeIds: number[], timestamp: string, note: string) => {
      confirmationService.show("Bulk logging processing...");
  }, []);

  const handleSaveComment = useCallback((commentData: any) => {
      const newComment: Comment = {
          id: `c-${Date.now()}`,
          mediaKey: commentData.mediaKey,
          text: commentData.text,
          timestamp: new Date().toISOString(),
          user: {
              id: currentUser?.id || 'guest',
              username: currentUser?.username || 'Guest',
              profilePictureUrl: profilePictureUrl
          },
          parentId: commentData.parentId || null,
          likes: [],
          isSpoiler: commentData.isSpoiler || false,
          visibility: commentData.visibility || 'public'
      };
      setComments(prev => [newComment, ...prev]);
      confirmationService.show("Comment posted!");
  }, [currentUser, profilePictureUrl, setComments]);

  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
      try {
          const details = await getMediaDetails(showId, 'tv');
          let nextProgress: WatchProgress;
          setWatchProgress(prev => {
              const next = { ...prev };
              if (!next[showId]) next[showId] = {};
              details.seasons?.forEach(s => {
                  if (s.season_number <= 0) return;
                  if (!next[showId][s.season_number]) next[showId][s.season_number] = {};
                  for (let i = 1; i <= s.episode_count; i++) {
                      next[showId][s.season_number][i] = { ...next[showId][s.season_number][i], status: 2 };
                  }
              });
              nextProgress = next; return next;
          });
          syncLibraryItem(showId, 'tv', nextProgress);
          confirmationService.show(`Marked all of ${showInfo.title} as watched.`);
      } catch (e) { console.error(e); }
  }, [setWatchProgress, syncLibraryItem]);

  const handleUnmarkAllWatched = useCallback((showId: number) => {
      setWatchProgress(prev => {
          const next = { ...prev };
          delete next[showId];
          return next;
      });
      setHistory(prev => prev.filter(h => h.id !== showId));
      syncLibraryItem(showId, 'tv');
      confirmationService.show("Progress cleared.");
  }, [setWatchProgress, setHistory, syncLibraryItem]);

  const handleSaveEpisodeNote = useCallback((showId: number, seasonNumber: number, episodeNumber: number, notes: Note[]) => {
      setEpisodeNotes(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
          next[showId][seasonNumber][episodeNumber] = notes;
          return next;
      });
  }, [setEpisodeNotes]);

  const handleRateSeason = useCallback((showId: number, seasonNumber: number, rating: number) => {
      setSeasonRatings(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (rating === 0) delete next[showId][seasonNumber];
          else next[showId][seasonNumber] = rating;
          return next;
      });
  }, [setSeasonRatings]);

  const handleSaveMediaNote = useCallback((mediaId: number, notes: Note[]) => {
      setMediaNotes(prev => ({ ...prev, [mediaId]: notes }));
  }, [setMediaNotes]);

  const handleNoteDeleted = useCallback((note: Note, mediaTitle: string, context: string) => {
      setDeletedNotes(prev => [{ ...note, deletedAt: new Date().toISOString(), mediaTitle, context }, ...prev]);
  }, [setDeletedNotes]);

  const handleDiscardRequest = useCallback((item: DeletedHistoryItem) => {
      setDeletedHistory(prev => [item, ...prev]);
  }, [setDeletedHistory]);

  const handleSetCustomEpisodeImage = useCallback((showId: number, season: number, episode: number, imagePath: string) => {
      setCustomEpisodeImages(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][season]) next[showId][season] = {};
          next[showId][season][episode] = imagePath;
          return next;
      });
  }, [setCustomEpisodeImages]);

  const handleClearMediaHistory = useCallback((mediaId: number, mediaType: 'tv' | 'movie') => {
      setHistory(prev => prev.filter(h => h.id !== mediaId));
      syncLibraryItem(mediaId, mediaType);
  }, [setHistory, syncLibraryItem]);

  const handleImportCompleted = useCallback((historyItems: HistoryItem[], completedItems: TrackedItem[]) => {
      setHistory(prev => [...historyItems, ...prev]);
      completedItems.forEach(item => updateLists(item, null, 'completed'));
  }, [setHistory, updateLists]);

  const handleTraktImportCompleted = useCallback((data: any) => {
      setHistory(prev => [...data.history, ...prev]);
      setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
      setRatings(prev => ({ ...prev, ...data.ratings }));
      data.completed.forEach((i: TrackedItem) => updateLists(i, null, 'completed'));
  }, [setHistory, setWatchProgress, setRatings, updateLists]);

  const handleTmdbImportCompleted = useCallback((data: any) => {
      setHistory(prev => [...data.history, ...prev]);
      setRatings(prev => ({ ...prev, ...data.ratings }));
      data.completed.forEach((i: TrackedItem) => updateLists(i, null, 'completed'));
      data.favorites.forEach((i: TrackedItem) => handleToggleFavoriteShow(i));
  }, [setHistory, setRatings, updateLists, handleToggleFavoriteShow]);

  const handleJsonImportCompleted = useCallback((data: any) => {
      if (data.history) setHistory(prev => [...data.history, ...prev]);
      if (data.watchProgress) setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
      if (data.ratings) setRatings(prev => ({ ...prev, ...data.ratings }));
      if (data.customLists) setCustomLists(prev => [...data.customLists, ...prev]);
  }, [setHistory, setWatchProgress, setRatings, setCustomLists]);

  const handleRestoreHistoryItem = useCallback((item: DeletedHistoryItem) => {
      const { deletedAt, ...historyItem } = item;
      setHistory(prev => [historyItem, ...prev]);
      setDeletedHistory(prev => prev.filter(h => h.logId !== item.logId));
      syncLibraryItem(item.id, item.media_type);
  }, [setHistory, setDeletedHistory, syncLibraryItem]);

  const handlePermanentDeleteHistoryItem = useCallback((logId: string) => {
      setDeletedHistory(prev => prev.filter(h => h.logId !== logId));
  }, [setDeletedHistory]);

  const handleClearAllDeletedHistory = useCallback(() => {
      setDeletedHistory([]);
      setDeletedNotes([]);
  }, [setDeletedHistory, setDeletedNotes]);

  const handleDeleteSearchHistoryItem = useCallback((timestamp: string) => {
      setSearchHistory(prev => prev.filter(h => h.timestamp !== timestamp));
  }, [setSearchHistory]);

  const handleClearSearchHistory = useCallback(() => {
      setSearchHistory([]);
  }, [setSearchHistory]);

  const handleRemoveDuplicateHistory = useCallback(() => {
      setHistory(prev => {
          const seen = new Set();
          return prev.filter(h => {
              const key = `${h.id}-${h.timestamp}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
      });
  }, [setHistory]);

  const handleMarkAllNotificationsRead = useCallback(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotifications]);

  const handleMarkOneNotificationRead = useCallback((id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotifications]);

  const handlePermanentDeleteNote = useCallback((noteId: string) => {
      setDeletedNotes(prev => prev.filter(n => n.id !== noteId));
  }, [setDeletedNotes]);

  const handleRestoreNote = useCallback((note: DeletedNote) => {
      setDeletedNotes(prev => prev.filter(n => n.id !== note.id));
  }, [setDeletedNotes]);

  const handleToggleLikeList = useCallback((ownerId: string, listId: string, listName: string) => {
      confirmationService.show(`Liked "${listName}"`);
  }, []);

  const handleTabPress = (tabId: string) => {
    setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null);
    window.scrollTo(0, 0); setInitialLibraryStatus(undefined);
    const screenNames: string[] = ['home', 'search', 'calendar', 'progress', 'profile'];
    if (screenNames.includes(tabId)) { setActiveScreen(tabId); setProfileInitialTab(undefined); }
    else if (tabId === 'airtime_management') setActiveScreen('airtime_management');
    else { setActiveScreen('profile'); setProfileInitialTab(tabId as ProfileTab); }
  };

  const handleToggleReminder = useCallback((newReminder: Reminder | null, reminderId: string) => {
    setReminders(prev => {
        if (newReminder) {
            confirmationService.show("Reminder scheduled!");
            return [newReminder, ...prev];
        } else {
            confirmationService.show("Reminder removed.");
            return prev.filter(r => r.id !== reminderId);
        }
    });
  }, [setReminders]);

  const renderScreen = () => {
    if (selectedShow) {
        return (
            <ShowDetail
                id={selectedShow.id}
                mediaType={selectedShow.media_type}
                onBack={() => setSelectedShow(null)}
                watchProgress={watchProgress}
                history={history}
                onToggleEpisode={handleToggleEpisode}
                onSaveJournal={handleSaveJournal}
                trackedLists={{ watching, planToWatch, completed, onHold, dropped, allCaughtUp }}
                onUpdateLists={updateLists}
                customImagePaths={customImagePaths}
                onSetCustomImage={handleSetCustomImage}
                favorites={favorites}
                onToggleFavoriteShow={handleToggleFavoriteShow}
                weeklyFavorites={weeklyFavorites}
                weeklyFavoritesHistory={weeklyFavoritesHistory}
                onToggleWeeklyFavorite={handleNominateWeeklyPick}
                onSelectShow={handleSelectShow}
                onOpenCustomListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                ratings={ratings}
                onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                onRateItem={handleRateItem}
                onMarkMediaAsWatched={handleMarkMovieAsWatched}
                onUnmarkMovieWatched={handleUnmarkMovieWatched}
                onMarkSeasonWatched={handleMarkSeasonWatched}
                onUnmarkSeasonWatched={handleUnmarkSeasonWatched}
                onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched}
                favoriteEpisodes={favoriteEpisodes}
                onSelectPerson={setSelectedPerson}
                onSelectShowInModal={handleSelectShow}
                onStartLiveWatch={handleStartLiveWatch}
                onDeleteHistoryItem={handleDeleteHistoryItem}
                onAddWatchHistory={handleAddWatchHistory}
                onAddWatchHistoryBulk={handleAddWatchHistoryBulk}
                onSaveComment={handleSaveComment}
                comments={comments}
                genres={genres}
                onMarkAllWatched={handleMarkAllWatched}
                onUnmarkAllWatched={handleUnmarkAllWatched}
                onSaveEpisodeNote={handleSaveEpisodeNote}
                showRatings={showRatings}
                seasonRatings={seasonRatings}
                onRateSeason={handleRateSeason}
                onRateEpisode={handleRateEpisode}
                customLists={customLists}
                currentUser={currentUser}
                allUsers={allUsers}
                mediaNotes={mediaNotes}
                onSaveMediaNote={handleSaveMediaNote}
                allUserData={allUserData}
                episodeNotes={episodeNotes}
                onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                preferences={preferences}
                follows={follows}
                pausedLiveSessions={pausedLiveSessions}
                onAuthClick={onAuthClick}
                onNoteDeleted={handleNoteDeleted}
                onDiscardRequest={handleDiscardRequest}
                onSetCustomEpisodeImage={handleSetCustomEpisodeImage}
                onClearMediaHistory={handleClearMediaHistory}
                episodeRatings={episodeRatings}
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
            />
        );
    }

    if (activeScreen === 'airtime_management') {
        return <AirtimeManagement onBack={() => setActiveScreen('home')} userData={allUserData} />;
    }

    switch (activeScreen) {
      case 'home':
        return (
          <Dashboard
            userData={allUserData}
            onSelectShow={handleSelectShow}
            onSelectShowInModal={handleSelectShow}
            watchProgress={watchProgress}
            onToggleEpisode={handleToggleEpisode}
            onShortcutNavigate={handleTabPress}
            onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })}
            setCustomLists={setCustomLists}
            liveWatchMedia={liveWatchMedia}
            liveWatchElapsedSeconds={liveWatchElapsedSeconds}
            liveWatchIsPaused={liveWatchIsPaused}
            onLiveWatchTogglePause={handleLiveWatchTogglePause}
            onLiveWatchStop={handleLiveWatchStop}
            onMarkShowAsWatched={handleMarkMovieAsWatched}
            onToggleFavoriteShow={handleToggleFavoriteShow}
            favorites={favorites}
            pausedLiveSessions={pausedLiveSessions}
            timezone={timezone}
            genres={genres}
            timeFormat={timeFormat}
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onUpdateLists={updateLists}
            shortcutSettings={shortcutSettings}
            preferences={preferences}
            onRemoveWeeklyPick={handleRemoveWeeklyPick}
            onOpenNominateModal={() => setIsNominateModalOpen(true)}
          />
        );
      case 'search':
        return (
          <SearchScreen
            onSelectShow={handleSelectShow}
            onSelectPerson={setSelectedPerson}
            onSelectUser={setSelectedUserId}
            searchHistory={searchHistory}
            onUpdateSearchHistory={onUpdateSearchHistory}
            onDeleteSearchHistoryItem={handleDeleteSearchHistoryItem}
            onClearSearchHistory={handleClearSearchHistory}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onMarkShowAsWatched={handleMarkMovieAsWatched}
            onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })}
            onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched}
            onToggleFavoriteShow={handleToggleFavoriteShow}
            favorites={favorites}
            genres={genres}
            userData={allUserData}
            currentUser={currentUser}
            onToggleLikeList={handleToggleLikeList}
            timezone={timezone}
            showRatings={showRatings}
            preferences={preferences}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            userData={allUserData}
            onSelectShow={handleSelectShow}
            timezone={timezone}
            timeFormat={timeFormat}
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onToggleEpisode={handleToggleEpisode}
            watchProgress={watchProgress}
          />
        );
      case 'progress':
        return (
          <ProgressScreen
            userData={allUserData}
            onToggleEpisode={handleToggleEpisode}
            onUpdateLists={updateLists}
            favoriteEpisodes={favoriteEpisodes}
            onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
            onSelectShow={handleSelectShow}
            currentUser={currentUser}
            onAuthClick={onAuthClick}
            pausedLiveSessions={pausedLiveSessions}
            onStartLiveWatch={handleStartLiveWatch}
            preferences={preferences}
          />
        );
      case 'profile':
        return (
          <Profile
            userData={allUserData}
            genres={genres}
            onSelectShow={handleSelectShow}
            onImportCompleted={handleImportCompleted}
            onTraktImportCompleted={handleTraktImportCompleted}
            onTmdbImportCompleted={handleTmdbImportCompleted}
            onJsonImportCompleted={handleJsonImportCompleted}
            onToggleEpisode={handleToggleEpisode}
            onUpdateLists={updateLists}
            favoriteEpisodes={favoriteEpisodes}
            onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
            setCustomLists={setCustomLists}
            initialTab={profileInitialTab}
            initialLibraryStatus={initialLibraryStatus}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onRestoreHistoryItem={handleRestoreHistoryItem}
            onPermanentDeleteHistoryItem={handlePermanentDeleteHistoryItem}
            onClearAllDeletedHistory={handleClearAllDeletedHistory}
            onDeleteSearchHistoryItem={handleDeleteSearchHistoryItem}
            onClearSearchHistory={handleClearSearchHistory}
            setHistory={setHistory}
            setWatchProgress={setWatchProgress}
            setEpisodeRatings={setEpisodeRatings}
            setFavoriteEpisodes={setFavoriteEpisodes}
            setTheme={setTheme}
            baseThemeId={baseThemeId}
            currentHolidayName={currentHolidayName}
            customThemes={customThemes}
            setCustomThemes={setCustomThemes}
            onLogout={onLogout}
            onUpdatePassword={onUpdatePassword}
            onUpdateProfile={onUpdateProfile}
            currentUser={currentUser}
            onAuthClick={onAuthClick}
            onForgotPasswordRequest={onForgotPasswordRequest}
            onForgotPasswordReset={onForgotPasswordReset}
            profilePictureUrl={profilePictureUrl}
            setProfilePictureUrl={setProfilePictureUrl}
            setCompleted={setCompleted}
            follows={follows}
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
            onSelectUser={setSelectedUserId}
            timezone={timezone}
            setTimezone={setTimezone}
            onRemoveDuplicateHistory={handleRemoveDuplicateHistory}
            notifications={notifications}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onMarkOneRead={handleMarkOneNotificationRead}
            onAddNotifications={(notifs) => setNotifications(prev => [...notifs, ...prev])}
            autoHolidayThemesEnabled={autoHolidayThemesEnabled}
            setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled}
            holidayAnimationsEnabled={holidayAnimationsEnabled}
            setHolidayAnimationsEnabled={setHolidayAnimationsEnabled}
            profileTheme={profileTheme}
            setProfileTheme={setProfileTheme}
            textSize={textSize}
            setTextSize={setTextSize}
            onFeedbackSubmit={() => setUserXp(prev => prev + XP_CONFIG.feedback)}
            levelInfo={levelInfo}
            timeFormat={timeFormat}
            setTimeFormat={setTimeFormat}
            pin={pin}
            setPin={setPin}
            showRatings={showRatings}
            setShowRatings={setShowRatings}
            setSeasonRatings={setSeasonRatings}
            onToggleWeeklyFavorite={handleNominateWeeklyPick}
            onOpenNominateModal={() => setIsNominateModalOpen(true)}
            pausedLiveSessions={pausedLiveSessions}
            onStartLiveWatch={handleStartLiveWatch}
            shortcutSettings={shortcutSettings}
            setShortcutSettings={setShortcutSettings}
            navSettings={navSettings}
            setNavSettings={setNavSettings}
            preferences={preferences}
            setPreferences={setPreferences}
            onPermanentDeleteNote={handlePermanentDeleteNote}
            onRestoreNote={handleRestoreNote}
            onTabNavigate={handleTabPress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <BackgroundParticleEffects effect={activeTheme.colors.particleEffect} enabled={holidayAnimationsEnabled} />
      <AnimationContainer />
      <ConfirmationContainer />
      <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} currentPicks={weeklyFavorites} onNominate={handleNominateWeeklyPick} onRemovePick={handleRemoveWeeklyPick} />
      <WelcomeModal isOpen={!currentUser && !isWelcomeDismissed} onClose={() => { localStorage.setItem('welcome_dismissed', 'true'); setIsWelcomeDismissed(true); }} timezone={timezone} setTimezone={setTimezone} timeFormat={timeFormat} setTimeFormat={setTimeFormat} />
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={(id, type) => handleSelectShow(id, type)} onUpdateLists={updateLists} />
      <PersonDetailModal isOpen={selectedPerson !== null} onClose={() => setSelectedPerson(null)} personId={selectedPerson} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleNominateWeeklyPick} weeklyFavorites={weeklyFavorites} />
      <LiveWatchTracker isOpen={!!liveWatchMedia} onClose={handleLiveWatchStop} onDiscard={handleLiveWatchDiscard} mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={handleLiveWatchTogglePause} isMinimized={isLiveWatchMinimized} onToggleMinimize={() => setIsLiveWatchMinimized(!isLiveWatchMinimized)} onMarkWatched={(info) => { if (info.media_type === 'movie') handleMarkMovieAsWatched(info); else handleToggleEpisode(info.id, info.seasonNumber!, info.episodeNumber!, 0, info as any, info.episodeTitle); handleLiveWatchStop(); }} onAddToList={(info) => setAddToListModalState({ isOpen: true, item: info as any })} />
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => handleTabPress('profile')} onSelectShow={handleSelectShow} onGoHome={() => handleTabPress('home')} onMarkShowAsWatched={() => {}} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} isHoliday={!!currentHolidayName} holidayName={currentHolidayName} />
      <main className="container mx-auto flex-grow pt-8">{renderScreen()}</main>
      <BottomTabNavigator activeTab={activeScreen as any} activeProfileTab={profileInitialTab} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} navSettings={navSettings} />
    </div>
  );
};

export default MainApp;
