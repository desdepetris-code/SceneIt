import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, clearMediaCache, getMediaDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, CustomList, UserRatings, LiveWatchMediaInfo, EpisodeRatings, SearchHistoryItem, Comment, Theme, SeasonRatings, Reminder, NotificationSettings, CustomListItem, JournalEntry, Follows, TraktToken, Note, EpisodeProgress, WeeklyPick, ShortcutSettings, NavSettings, AppPreferences, Episode, PrivacySettings, ProfileTheme } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import ActorDetail from './screens/ActorDetail';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import UserProfileModal from './components/UserProfileModal';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import CalendarScreen from './screens/CalendarScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import AnimationContainer from './components/AnimationContainer';
import * as traktService from './services/traktService';
import { firebaseConfig } from './firebaseConfig';
import NominatePicksModal from './components/NominatePicksModal';
import PriorEpisodesModal from './components/PriorEpisodesModal';
import AllNewReleasesScreen from './screens/AllNewReleasesScreen';
import AllTrendingTVShowsScreen from './screens/AllTrendingTVShowsScreen';
import AllTrendingMoviesScreen from './screens/AllTrendingMoviesScreen';
import AllNewlyPopularEpisodesScreen from './screens/AllNewlyPopularEpisodesScreen';
import AllMediaScreen from './screens/AllMediaScreen';

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
  const [activeTheme, setTheme] = useTheme(customThemes);
  
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>(`watching_list_${userId}`, []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>(`plan_to_watch_list_${userId}`, []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>(`completed_list_${userId}`, []);
  const [onHold, setOnHold] = useLocalStorage<TrackedItem[]>(`on_hold_list_${userId}`, []);
  const [dropped, setDropped] = useLocalStorage<TrackedItem[]>(`dropped_list_${userId}`, []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>(`favorites_list_${userId}`, []);
  const [weeklyFavorites, setWeeklyFavorites] = useLocalStorage<WeeklyPick[]>(`weekly_favorites_${userId}`, []);
  const [weeklyFavoritesWeekKey, setWeeklyFavoritesWeekKey] = useLocalStorage<string>(`weekly_favorites_week_${userId}`, '');
  const [weeklyFavoritesHistory, setWeeklyFavoritesHistory] = useLocalStorage<Record<string, WeeklyPick[]>>(`weekly_favorites_history_${userId}`, {});
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>(`watch_progress_${userId}`, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(`history_${userId}`, []);
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
    tabs: ['progress', 'history', 'weeklyPicks', 'lists', 'achievements']
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
    dashShowStats: true,
    dashShowLiveWatch: true,
    dashShowContinueWatching: true,
    dashShowUpcoming: true,
    dashShowRecommendations: true,
    dashShowTrending: true,
    dashShowWeeklyGems: true,
    enableAnimations: true,
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

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);

  const [priorModalState, setPriorModalState] = useState<{
    isOpen: boolean;
    showId: number;
    season: number;
    episode: number;
    showInfo: TrackedItem;
    hasFuture: boolean;
    episodeStillPath?: string | null;
    seasonPosterPath?: string | null;
  }>({ isOpen: false, showId: 0, season: 0, episode: 0, showInfo: {} as TrackedItem, hasFuture: false });

  const allUserData: UserData = useMemo(() => ({
    watching, planToWatch, completed, onHold, dropped, favorites, weeklyFavorites, weeklyFavoritesHistory, watchProgress, history, customLists, ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes,
  }), [watching, planToWatch, completed, onHold, dropped, favorites, weeklyFavorites, weeklyFavoritesHistory, watchProgress, history, customLists, ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes]);

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
      confirmationService.show(`Gem removed: ${pick.title}`);
  }, [setWeeklyFavorites]);

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
        setSelectedShow(null);
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
            onHold: setOnHold, dropped: setDropped,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        if (newList && setters[newList]) setters[newList](prev => [item, ...prev]);
        const showName = item.title || (item as any).name || 'Untitled';
        if (newList === 'watching') confirmationService.show(`Added ${showName} to Watching`);
        else if (newList) confirmationService.show(`"${showName}" added to ${newList}`);
        else if (oldList) confirmationService.show(`Removed ${showName} from ${oldList}`);
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleMarkPreviousEpisodesWatched = useCallback(async (showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
      try {
          const sd = await getSeasonDetails(showId, seasonNumber);
          const today = new Date().toISOString().split('T')[0];
          const episodesToMark = sd.episodes.filter(ep => ep.episode_number <= lastEpisodeNumber && ep.air_date && ep.air_date <= today);
          const details = await getMediaDetails(showId, 'tv');
          const showInfo: TrackedItem = { id: showId, title: details.name || 'Untitled', media_type: 'tv', poster_path: details.poster_path };
          setWatchProgress(prev => {
              const next = { ...prev };
              if (!next[showId]) next[showId] = {};
              if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
              episodesToMark.forEach(ep => {
                  next[showId][seasonNumber][ep.episode_number] = { ...next[showId][seasonNumber][ep.episode_number], status: 2 };
              });
              return next;
          });
          const newLogs = episodesToMark.map(ep => ({ ...showInfo, logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}-${Math.random()}`, timestamp: new Date().toISOString(), seasonNumber, episodeNumber: ep.episode_number, episodeTitle: ep.name }));
          setHistory(prev => [...newLogs, ...prev]);
          setUserXp(prev => prev + (episodesToMark.length * XP_CONFIG.episode));
          confirmationService.show(`Marked ${episodesToMark.length} episodes as watched.`);
      } catch (e) { console.error(e); }
  }, [setWatchProgress, setHistory, setUserXp]);

  const handleToggleEpisode = useCallback(async (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem | TmdbMedia, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => {
      const isWatched = currentStatus === 2;
      const newStatus = isWatched ? 0 : 2;
      const showTitle = showInfo.title || (showInfo as any).name || 'Unknown Show';
      const posterPath = showInfo.poster_path || (showInfo as any).profile_path || null;
      if (!isWatched && notificationSettings.showPriorEpisodesPopup) {
          const showProgress = watchProgress[showId] || {};
          let hasGap = false;
          for (let s = 1; s <= season; s++) {
              const maxEp = (s === season) ? episode - 1 : 99; 
              for (let e = 1; e <= maxEp; e++) { if (showProgress[s]?.[e]?.status !== 2) { hasGap = true; break; } }
              if (hasGap) break;
          }
          if (hasGap) {
              let hasFuture = false;
              Object.keys(showProgress).forEach(sKey => {
                  const sNum = parseInt(sKey);
                  Object.keys(showProgress[sNum]).forEach(eKey => {
                      const eNum = parseInt(eKey);
                      if (showProgress[sNum][eNum].status === 2 && (sNum > season || (sNum === season && eNum > episode))) hasFuture = true;
                  });
              });
              setPriorModalState({ isOpen: true, showId, season, episode, showInfo: { ...showInfo, title: showTitle, poster_path: posterPath } as TrackedItem, hasFuture, episodeStillPath, seasonPosterPath });
              return;
          }
      }
      setWatchProgress(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][season]) next[showId][season] = {};
          next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as any };
          return next;
      });
      if (!isWatched) {
          const logItem: HistoryItem = { logId: `tv-${showId}-${season}-${episode}-${Date.now()}`, id: showId, media_type: 'tv', title: showTitle, poster_path: posterPath, timestamp: new Date().toISOString(), seasonNumber: season, episodeNumber: episode, episodeTitle: episodeName || 'n/a', episodeStillPath, seasonPosterPath };
          setHistory(prev => [logItem, ...prev]);
          setUserXp(prev => prev + XP_CONFIG.episode);
          confirmationService.show(`Logged S${season} E${episode}`);
          if (!watching.some(i => i.id === showId) && !completed.some(i => i.id === showId) && !dropped.some(i => i.id === showId)) updateLists({ ...showInfo, title: showTitle, poster_path: seasonPosterPath || posterPath } as TrackedItem, null, 'watching');
          else if (watching.some(i => i.id === showId)) setWatching(prev => prev.map(i => i.id === showId ? { ...i, poster_path: seasonPosterPath || i.poster_path } : i));
      } else {
          setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
          let anyEpisodesLeft = false;
          if (watchProgress[showId]) Object.values(watchProgress[showId]).forEach(s => Object.values(s).forEach(e => { if (e.status === 2) anyEpisodesLeft = true; }));
          if (!anyEpisodesLeft) { setWatching(prev => prev.filter(i => i.id !== showId)); setCompleted(prev => prev.filter(i => i.id !== showId)); setOnHold(prev => prev.filter(i => i.id !== showId)); setDropped(prev => prev.filter(i => i.id !== showId)); }
          confirmationService.show(`Unmarked S${season} E${episode}`);
      }
  }, [watchProgress, notificationSettings.showPriorEpisodesPopup, watching, completed, dropped, updateLists, setHistory, setWatchProgress, setUserXp, setWatching, setCompleted, setOnHold, setDropped]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
      setRatings(prev => {
          const next = { ...prev };
          if (rating === 0) delete next[mediaId];
          else next[mediaId] = { rating, date: new Date().toISOString() };
          return next;
      });
  }, [setRatings]);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
      setFavorites(prev => {
          const isFav = prev.some(f => f.id === item.id);
          if (isFav) { confirmationService.show(`Removed ${item.title} from favorites`); return prev.filter(f => f.id !== item.id); }
          else { confirmationService.show(`Added ${item.title} to favorites`); return [item, ...prev]; }
      });
  }, [setFavorites]);

  const handleSaveComment = useCallback((commentData: any) => {
      if (!currentUser) { onAuthClick(); return; }
      const newComment: Comment = { id: `comment-${Date.now()}-${Math.random()}`, mediaKey: commentData.mediaKey, text: commentData.text, timestamp: new Date().toISOString(), user: { id: currentUser.id, username: currentUser.username, profilePictureUrl: profilePictureUrl }, parentId: commentData.parentId, likes: [], isSpoiler: commentData.isSpoiler };
      setComments(prev => [newComment, ...prev]);
      confirmationService.show("Comment posted!");
  }, [currentUser, profilePictureUrl, setComments, onAuthClick]);

  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
      try {
          const details = await getMediaDetails(showId, 'tv');
          if (!details.seasons) return;
          confirmationService.show(`Marking all as watched...`);
          const today = new Date().toISOString().split('T')[0];
          const newWatchProgress: any = {};
          const newHistoryItems: HistoryItem[] = [];
          for (const season of details.seasons) {
              if (season.season_number === 0) continue;
              const sd = await getSeasonDetails(showId, season.season_number);
              newWatchProgress[season.season_number] = {};
              sd.episodes.forEach(ep => {
                  if (ep.air_date && ep.air_date <= today) {
                      newWatchProgress[season.season_number][ep.episode_number] = { status: 2 };
                      newHistoryItems.push({ ...showInfo, logId: `tv-${showId}-${season.season_number}-${ep.episode_number}-${Date.now()}`, timestamp: new Date().toISOString(), seasonNumber: season.season_number, episodeNumber: ep.episode_number, episodeTitle: ep.name });
                  }
              });
          }
          setWatchProgress(prev => ({ ...prev, [showId]: newWatchProgress }));
          setHistory(prev => [...newHistoryItems, ...prev]);
          setUserXp(prev => prev + (newHistoryItems.length * XP_CONFIG.episode));
          updateLists(showInfo, null, 'completed');
      } catch (e) { console.error(e); }
  }, [setWatchProgress, setHistory, setUserXp, updateLists]);

  const handleUnmarkAllWatched = useCallback((showId: number) => {
      setWatchProgress(prev => { const next = { ...prev }; delete next[showId]; return next; });
      setHistory(prev => prev.filter(h => h.id !== showId));
      setWatching(prev => prev.filter(i => i.id !== showId));
      setCompleted(prev => prev.filter(i => i.id !== showId));
      confirmationService.show("Cleared all watch progress.");
  }, [setWatchProgress, setHistory, setWatching, setCompleted]);

  const handleBulkPriorAction = useCallback(async (action: number) => {
      const { showId, season, episode, showInfo, episodeStillPath, seasonPosterPath } = priorModalState;
      if (action === 1) { setPriorModalState(p => ({ ...p, isOpen: false })); await handleMarkPreviousEpisodesWatched(showId, season, episode); handleToggleEpisode(showId, season, episode, 0, showInfo, undefined, episodeStillPath, seasonPosterPath); }
      else if (action === 2) { setPriorModalState(p => ({ ...p, isOpen: false })); }
      else if (action === 3) { setPriorModalState(p => ({ ...p, isOpen: false })); setWatchProgress(prev => { const next = { ...prev }; if (!next[showId]) next[showId] = {}; if (!next[showId][season]) next[showId][season] = {}; next[showId][season][episode] = { ...next[showId][season][episode], status: 2 }; return next; }); setHistory(prev => [{ ...showInfo, logId: `tv-${showId}-${season}-${episode}-${Date.now()}`, timestamp: new Date().toISOString(), seasonNumber: season, episodeNumber: episode, episodeStillPath, seasonPosterPath }, ...prev]); }
      else if (action === 4) { setPriorModalState(p => ({ ...p, isOpen: false })); setWatchProgress(prev => { const next = { ...prev }; if (next[showId]) { Object.keys(next[showId]).forEach(sKey => { const sNum = parseInt(sKey); Object.keys(next[showId][sNum]).forEach(eKey => { const eNum = parseInt(eKey); if (sNum > season || (sNum === season && eNum >= episode)) delete next[showId][sNum][eNum]; }); }); } return next; }); setHistory(prev => prev.filter(h => !(h.id === showId && (h.seasonNumber! > season || (h.seasonNumber === season && h.episodeNumber! >= episode))))); }
  }, [priorModalState, handleMarkPreviousEpisodesWatched, handleToggleEpisode, setWatchProgress, setHistory]);

  const handleTraktImportCompleted = useCallback((data: any) => {
    setHistory(prev => [...data.history, ...prev]);
    setCompleted(prev => [...data.completed, ...prev]);
    setPlanToWatch(prev => [...data.planToWatch, ...prev]);
    setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
    setRatings(prev => ({ ...prev, ...data.ratings }));
  }, [setHistory, setCompleted, setPlanToWatch, setWatchProgress, setRatings]);

  const handleTmdbImportCompleted = useCallback((data: any) => {
    if (data.history) setHistory(prev => [...data.history, ...prev]);
    if (data.completed) setCompleted(prev => [...data.completed, ...prev]);
    if (data.planToWatch) setPlanToWatch(prev => [...data.planToWatch, ...prev]);
    if (data.favorites) setFavorites(prev => [...data.favorites, ...prev]);
    if (data.ratings) setRatings(prev => ({ ...prev, ...data.ratings }));
  }, [setHistory, setCompleted, setPlanToWatch, setFavorites, setRatings]);

  const handleJsonImportCompleted = useCallback((data: any) => {
    if (data.history) setHistory(prev => [...data.history, ...prev]);
    if (data.customLists) setCustomLists(prev => [...data.customLists, ...prev]);
    if (data.watchProgress) setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
    if (data.ratings) setRatings(prev => ({ ...prev, ...data.ratings }));
  }, [setHistory, setCustomLists, setWatchProgress, setRatings]);

  const handleFollow = useCallback((id: string, username: string) => {
    if (!currentUser) return;
    setFollows(prev => {
        const myFollowing = prev[currentUser.id] || [];
        if (!myFollowing.includes(id)) {
            confirmationService.show(`Now following ${username}`);
            return { ...prev, [currentUser.id]: [...myFollowing, id] };
        }
        return prev;
    });
  }, [currentUser, setFollows]);

  const handleUnfollow = useCallback((id: string) => {
    if (!currentUser) return;
    setFollows(prev => {
        const myFollowing = prev[currentUser.id] || [];
        return { ...prev, [currentUser.id]: myFollowing.filter(uid => uid !== id) };
    });
  }, [currentUser, setFollows]);

  const handleToggleNotification = useCallback((setting: keyof NotificationSettings) => {
      setNotificationSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  }, [setNotificationSettings]);

  const renderScreen = () => {
    if (selectedShow) {
        return (
            <ShowDetail 
                id={selectedShow.id}
                mediaType={selectedShow.media_type}
                onBack={handleBack} 
                watchProgress={watchProgress}
                history={history}
                onToggleEpisode={handleToggleEpisode}
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
                trackedLists={{ watching, planToWatch, completed, onHold, dropped }}
                onUpdateLists={updateLists}
                customImagePaths={customImagePaths}
                onSetCustomImage={(mid, type, path) => setCustomImagePaths(prev => ({ ...prev, [mid]: { ...prev[mid], [`${type}_path`]: path } }))}
                favorites={favorites}
                onToggleFavoriteShow={handleToggleFavoriteShow}
                weeklyFavorites={weeklyFavorites}
                onToggleWeeklyFavorite={handleNominateWeeklyPick}
                onSelectShow={handleSelectShow}
                onOpenCustomListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                ratings={ratings}
                onRateItem={handleRateItem}
                onMarkMediaAsWatched={(item, date) => {
                    const tracked: TrackedItem = { id: item.id, title: item.title || item.name || 'Unknown', media_type: item.media_type, poster_path: item.poster_path };
                    setHistory(prev => [{ ...tracked, logId: `manual-${item.id}-${Date.now()}`, timestamp: date || new Date().toISOString() }, ...prev]);
                    updateLists(tracked, null, 'completed');
                    setUserXp(prev => prev + (item.media_type === 'movie' ? XP_CONFIG.movie : 0));
                }}
                onUnmarkMovieWatched={(id) => { setHistory(prev => prev.filter(h => h.id !== id)); setCompleted(prev => prev.filter(i => i.id !== id)); }}
                onMarkSeasonWatched={(sid, sNum) => handleMarkPreviousEpisodesWatched(sid, sNum, 999)}
                onUnmarkSeasonWatched={(sid, sNum) => { setHistory(prev => prev.filter(h => !(h.id === sid && h.seasonNumber === sNum))); setWatchProgress(prev => { const next = { ...prev }; if (next[sid]) delete next[sid][sNum]; return next; }); }}
                onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched}
                favoriteEpisodes={favoriteEpisodes}
                onToggleFavoriteEpisode={(sid, s, e) => setFavoriteEpisodes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = !next[sid][s][e]; return next; })}
                onSelectPerson={setSelectedPerson}
                onStartLiveWatch={() => {}}
                onDeleteHistoryItem={(item) => setHistory(prev => prev.filter(h => h.logId !== item.logId))}
                onClearMediaHistory={(mid) => setHistory(prev => prev.filter(h => h.id !== mid))}
                episodeRatings={episodeRatings}
                onRateEpisode={(sid, s, e, r) => setEpisodeRatings(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = r; return next; })}
                onAddWatchHistory={(item, s, e, ts, nt, en) => setHistory(prev => [{ ...item, logId: `log-${item.id}-${Date.now()}`, timestamp: ts || new Date().toISOString(), seasonNumber: s, episodeNumber: e, note: nt, episodeTitle: en }, ...prev])}
                onSaveComment={handleSaveComment}
                comments={comments}
                genres={genres}
                onMarkAllWatched={handleMarkAllWatched}
                onUnmarkAllWatched={handleUnmarkAllWatched}
                onSaveEpisodeNote={(sid, s, e, n) => setEpisodeNotes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = n; return next; })}
                showRatings={showRatings}
                seasonRatings={seasonRatings}
                onRateSeason={(sid, s, r) => setSeasonRatings(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = r; return next; })}
                customLists={customLists}
                currentUser={currentUser}
                allUsers={[]}
                onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                allUserData={allUserData}
                episodeNotes={episodeNotes}
            />
        );
    }
    if (selectedPerson) return <ActorDetail personId={selectedPerson} onBack={handleBack} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleNominateWeeklyPick} weeklyFavorites={weeklyFavorites} />;
    if (selectedUserId) return <UserProfileModal userId={selectedUserId} currentUser={currentUser || { id: 'guest', username: 'Guest' }} follows={follows[currentUser?.id || 'guest'] || []} onFollow={handleFollow} onUnfollow={handleUnfollow} onClose={() => setSelectedUserId(null)} onToggleLikeList={() => {}} />;

    switch (activeScreen) {
        case 'search': return <SearchScreen query={searchQuery} onQueryChange={setSearchQuery} onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={handleUpdateSearchHistory} onMarkShowAsWatched={() => {}} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings} preferences={preferences} />;
        case 'calendar': return <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={(rem, id) => setReminders(prev => rem ? [...prev, rem] : prev.filter(r => r.id !== id))} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} allTrackedItems={[]} />;
        case 'progress': return <ProgressScreen userData={allUserData} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} />;
        case 'profile': return (
          <Profile 
            userData={allUserData} 
            genres={genres} 
            onSelectShow={handleSelectShow} 
            initialTab={profileInitialTab} 
            currentUser={currentUser} 
            onAuthClick={onAuthClick} 
            onLogout={onLogout} 
            profilePictureUrl={profilePictureUrl} 
            setProfilePictureUrl={setProfilePictureUrl} 
            onImportCompleted={() => {}} 
            onTraktImportCompleted={handleTraktImportCompleted} 
            onTmdbImportCompleted={handleTmdbImportCompleted} 
            onJsonImportCompleted={handleJsonImportCompleted} 
            onToggleEpisode={handleToggleEpisode}
            onUpdateLists={updateLists}
            favoriteEpisodes={favoriteEpisodes}
            onToggleFavoriteEpisode={(sid, s, e) => setFavoriteEpisodes(prev => { const next = { ...prev }; if (!next[sid]) next[sid] = {}; if (!next[sid][s]) next[sid][s] = {}; next[sid][s][e] = !next[sid][s][e]; return next; })}
            setCustomLists={setCustomLists}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
            onDeleteHistoryItem={(item) => setHistory(prev => prev.filter(h => h.logId !== item.logId))}
            onDeleteSearchHistoryItem={(timestamp) => setSearchHistory(prev => prev.filter(h => h.timestamp !== timestamp))}
            onClearSearchHistory={() => setSearchHistory([])}
            setHistory={setHistory}
            setWatchProgress={setWatchProgress}
            setEpisodeRatings={setEpisodeRatings}
            setFavoriteEpisodes={setFavoriteEpisodes}
            setTheme={setTheme}
            customThemes={customThemes}
            setCustomThemes={setCustomThemes}
            onUpdatePassword={onUpdatePassword}
            onUpdateProfile={onUpdateProfile}
            onForgotPasswordRequest={onForgotPasswordRequest}
            onForgotPasswordReset={onForgotPasswordReset}
            setCompleted={setCompleted}
            follows={follows}
            privacySettings={privacySettings}
            setPrivacySettings={setPrivacySettings}
            onSelectUser={setSelectedUserId}
            timezone={timezone}
            setTimezone={setTimezone}
            onRemoveDuplicateHistory={() => {}}
            notifications={notifications}
            onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} 
            onMarkOneRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} 
            onAddNotifications={(notifs) => setNotifications(prev => [...notifs, ...prev])} 
            autoHolidayThemesEnabled={autoHolidayThemesEnabled} 
            setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} 
            holidayAnimationsEnabled={holidayAnimationsEnabled} 
            setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} 
            profileTheme={profileTheme} 
            setProfileTheme={setProfileTheme} 
            textSize={textSize} 
            setTextSize={setTextSize} 
            onFeedbackSubmit={() => {}} 
            levelInfo={calculateLevelInfo(userXp)} 
            timeFormat={timeFormat} 
            setTimeFormat={setTimeFormat} 
            pin={pin} 
            setPin={setPin} 
            showRatings={showRatings} 
            setShowRatings={setShowRatings} 
            setSeasonRatings={setSeasonRatings} 
            onToggleWeeklyFavorite={handleRemoveWeeklyPick} 
            onOpenNominateModal={() => setIsNominateModalOpen(true)} 
            pausedLiveSessions={pausedLiveSessions} 
            onStartLiveWatch={() => {}} 
            shortcutSettings={shortcutSettings} 
            setShortcutSettings={setShortcutSettings} 
            navSettings={navSettings} 
            setNavSettings={setNavSettings} 
            preferences={preferences}
            setPreferences={setPreferences}
          />
        );
        case 'allNewReleases': return <AllNewReleasesScreen onBack={() => setActiveScreen('home')} onSelectShow={handleSelectShow} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} completed={completed} showRatings={showRatings} />;
        case 'allTrendingTV': return <AllTrendingTVShowsScreen onBack={() => setActiveScreen('home')} onSelectShow={handleSelectShow} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} completed={completed} showRatings={showRatings} />;
        case 'allTrendingMovies': return <AllTrendingMoviesScreen onBack={() => setActiveScreen('home')} onSelectShow={handleSelectShow} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} completed={completed} showRatings={showRatings} />;
        case 'allNewlyPopularEpisodes': return <AllNewlyPopularEpisodesScreen onBack={() => setActiveScreen('home')} onSelectShow={handleSelectShow} />;
        case 'allTopRated': return <AllMediaScreen title="Top Rated" initialMediaType="movie" initialGenreId="28|12" initialSortBy="vote_average.desc" voteCountGte={300} showMediaTypeToggle={false} onBack={() => setActiveScreen('home')} onSelectShow={handleSelectShow} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} completed={completed} genres={genres} showRatings={showRatings} />;
        case 'home':
        default: return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow as any} watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} onShortcutNavigate={handleTabPress} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} liveWatchMedia={null} liveWatchElapsedSeconds={0} liveWatchIsPaused={false} onLiveWatchTogglePause={() => {}} onLiveWatchStop={() => {}} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat="12h" reminders={reminders} onToggleReminder={(rem, id) => setReminders(prev => rem ? [...prev, rem] : prev.filter(r => r.id !== id))} onUpdateLists={updateLists} onOpenNominateModal={() => setIsNominateModalOpen(true)} shortcutSettings={shortcutSettings} preferences={preferences} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <AnimationContainer />
      <ConfirmationContainer />
      <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} currentPicks={weeklyFavorites} onNominate={handleNominateWeeklyPick} />
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={(id, type) => handleSelectShow(id, type)} onUpdateLists={updateLists} />
      <PriorEpisodesModal isOpen={priorModalState.isOpen} onClose={() => setPriorModalState(p => ({ ...p, isOpen: false }))} showTitle={priorModalState.showInfo.title} season={priorModalState.season} episode={priorModalState.episode} hasFuture={priorModalState.hasFuture} onSelectAction={handleBulkPriorAction} onDisablePopup={() => handleToggleNotification('showPriorEpisodesPopup')} />
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => handleTabPress('profile')} onSelectShow={handleSelectShow} onGoHome={() => handleTabPress('home')} onMarkShowAsWatched={() => {}} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} isHoliday={false} holidayName={null} hoverReveal={navSettings.hoverRevealHeader} />
      <main className="container mx-auto flex-grow pt-8">{renderScreen()}</main>
      <BottomTabNavigator activeTab={activeScreen} activeProfileTab={profileInitialTab} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} navSettings={navSettings} />
    </div>
  );
};

export default MainApp;