
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, clearMediaCache, getMediaDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, CustomList, UserRatings, LiveWatchMediaInfo, EpisodeRatings, SearchHistoryItem, Comment, Theme, SeasonRatings, Reminder, NotificationSettings, CustomListItem, JournalEntry, Follows, TraktToken, Note, EpisodeProgress, WeeklyPick, ShortcutSettings, NavSettings } from './types';
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
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_ episedes_${userId}`, {});
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

  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [priorModalState, setPriorModalState] = useState<{
    isOpen: boolean;
    showId: number;
    season: number;
    episode: number;
    showInfo: TrackedItem;
    hasFuture: boolean;
  }>({ isOpen: false, showId: 0, season: 0, episode: 0, showInfo: {} as TrackedItem, hasFuture: false });

  const handleToggleNotification = useCallback((setting: keyof NotificationSettings) => {
    setNotificationSettings(prev => {
        const newState = { ...prev, [setting]: !prev[setting] };
        if (setting === 'masterEnabled' && !newState.masterEnabled) {
            return Object.fromEntries(Object.keys(prev).map(k => [k, false])) as unknown as NotificationSettings;
        }
        if (setting === 'masterEnabled' && newState.masterEnabled) {
            return Object.fromEntries(Object.keys(prev).map(k => [k, true])) as unknown as NotificationSettings;
        }
        return newState;
    });
  }, [setNotificationSettings]);

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
        if (weeklyFavorites.length > 0) {
            setWeeklyFavoritesHistory(prev => ({
                ...prev,
                [weeklyFavoritesWeekKey]: weeklyFavorites
            }));
        }
        setWeeklyFavorites([]);
        setWeeklyFavoritesWeekKey(currentWeekKey);
    } else if (!weeklyFavoritesWeekKey) {
        setWeeklyFavoritesWeekKey(currentWeekKey);
    }
  }, [currentWeekKey, weeklyFavoritesWeekKey, weeklyFavorites, setWeeklyFavorites, setWeeklyFavoritesWeekKey, setWeeklyFavoritesHistory]);

  const handleNominateWeeklyPick = useCallback((pick: WeeklyPick, replacementId?: number) => {
    setWeeklyFavorites(prev => {
        const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayName = dayNames[pick.dayIndex];
        const categoryLabel = pick.category.toUpperCase();

        // Check if we are explicitly replacing an existing pick
        if (replacementId !== undefined) {
             const oldItem = prev.find(p => p.id === replacementId && p.category === pick.category && p.dayIndex === pick.dayIndex);
             const next = prev.filter(p => !(p.id === replacementId && p.category === pick.category && p.dayIndex === pick.dayIndex));
             confirmationService.show(`Replaced ${oldItem?.title} with ${pick.title} as a ${categoryLabel} gem for ${dayName}!`);
             return [...next, pick];
        }

        // Check if this item is already picked for this specific day and category
        if (prev.some(p => p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex)) {
            confirmationService.show(`${pick.title} is already nominated as a ${categoryLabel} gem for ${dayName}!`);
            return prev;
        }

        // Limit check: 5 per category per day
        const existingCount = prev.filter(p => p.category === pick.category && p.dayIndex === pick.dayIndex).length;
        if (existingCount >= 5) {
            // This fallback is mostly for search-based adds that might bypass the detail page check
            confirmationService.show(`Limit reached: You already have 5 ${categoryLabel} gems for ${dayName}. Replace one or pick a different day.`);
            return prev;
        }

        confirmationService.show(`${pick.title} nominated as a ${categoryLabel} gem for ${dayName}!`);
        return [...prev, pick];
    });
  }, [setWeeklyFavorites]);

  const handleRemoveWeeklyPick = useCallback((pick: WeeklyPick) => {
      setWeeklyFavorites(prev => prev.filter(p => !(p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex)));
      confirmationService.show(`Gem removed: ${pick.title}`);
  }, [setWeeklyFavorites]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        const exchangeToken = async () => {
            setActiveScreen('profile');
            confirmationService.show("Trakt linked! Initiating secure token exchange...");
            try {
                const functionUrl = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/traktAuth`;
                await traktService.exchangeCodeForToken(code, functionUrl);
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
                confirmationService.show("Authentication successful! Head to Import & Sync to bring in your data.");
            } catch (e: any) {
                console.error("Trakt Auth Error:", e);
                confirmationService.show("Failed to link Trakt: " + (e.message || "Unknown error"));
            }
        };
        exchangeToken();
    }
  }, []);
  
  useEffect(() => { getGenres().then(setGenres); }, []);

  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, weeklyFavorites, weeklyFavoritesHistory, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings
  }), [watching, planToWatch, completed, onHold, dropped, favorites, weeklyFavorites, weeklyFavoritesHistory, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings]);
  
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie' | 'person') => {
    if (media_type === 'person') {
        setSelectedPerson(id);
        setSelectedShow(null);
    } else {
        setSelectedShow({ id, media_type });
        setSelectedPerson(null);
    }
    setSelectedUserId(null);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setSelectedShow(null);

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
        if (newList === 'watching') {
            confirmationService.show(`Added ${showName} to Watching`);
        } else if (newList) {
            confirmationService.show(`"${showName}" added to ${newList}`);
        } else if (oldList) {
            confirmationService.show(`Removed ${showName} from ${oldList}`);
        }
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleToggleEpisode = useCallback(async (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem | TmdbMedia, episodeName?: string) => {
      const isWatched = currentStatus === 2;
      const newStatus = isWatched ? 0 : 2;
      
      const showTitle = showInfo.title || (showInfo as any).name || 'Unknown Show';
      const posterPath = showInfo.poster_path || (showInfo as any).profile_path || null;

      if (!isWatched && notificationSettings.showPriorEpisodesPopup) {
          const showProgress = watchProgress[showId] || {};
          let hasGap = false;
          for (let s = 1; s <= season; s++) {
              const maxEp = (s === season) ? episode - 1 : 99; 
              for (let e = 1; e <= maxEp; e++) {
                  if (showProgress[s]?.[e]?.status !== 2) {
                      hasGap = true;
                      break;
                  }
              }
              if (hasGap) break;
          }

          if (hasGap) {
              let hasFuture = false;
              Object.keys(showProgress).forEach(sKey => {
                  const sNum = parseInt(sKey);
                  Object.keys(showProgress[sNum]).forEach(eKey => {
                      const eNum = parseInt(eKey);
                      if (showProgress[sNum][eNum].status === 2) {
                          if (sNum > season || (sNum === season && eNum > episode)) {
                              hasFuture = true;
                          }
                      }
                  });
              });

              setPriorModalState({ isOpen: true, showId, season, episode, showInfo: { ...showInfo, title: showTitle, poster_path: posterPath } as TrackedItem, hasFuture });
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

      const epTitle = episodeName || 'n/a';

      if (!isWatched) {
          const logItem: HistoryItem = {
              logId: `tv-${showId}-${season}-${episode}-${Date.now()}`,
              id: showId,
              media_type: 'tv',
              title: showTitle,
              poster_path: posterPath,
              timestamp: new Date().toISOString(),
              seasonNumber: season,
              episodeNumber: episode,
              episodeTitle: epTitle
          };
          setHistory(prev => [logItem, ...prev]);
          setUserXp(prev => prev + XP_CONFIG.episode);
          
          confirmationService.show(`Logged ${showTitle} S${season} E${episode}: ${epTitle}`);
          
          const isInWatching = watching.some(i => i.id === showId);
          const isInCompleted = completed.some(i => i.id === showId);
          const isInDropped = dropped.some(i => i.id === showId);
          
          if (!isInWatching && !isInCompleted && !isInDropped) {
              updateLists({ ...showInfo, title: showTitle, poster_path: posterPath } as TrackedItem, null, 'watching');
          }
      } else {
          setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
          setWatchProgress(prev => {
              const next = { ...prev };
              if (next[showId]?.[season]) {
                  delete next[showId][season][episode];
              }
              return next;
          });
          
          let anyEpisodesLeft = false;
          const currentShowProgress = watchProgress[showId];
          if (currentShowProgress) {
              Object.values(currentShowProgress).forEach(s => {
                  Object.values(s).forEach(e => { if (e.status === 2) anyEpisodesLeft = true; });
              });
          }

          if (!anyEpisodesLeft) {
              setWatching(prev => prev.filter(i => i.id !== showId));
              setCompleted(prev => prev.filter(i => i.id !== showId));
              setOnHold(prev => prev.filter(i => i.id !== showId));
              setDropped(prev => prev.filter(i => i.id !== showId));
          }
          
          confirmationService.show(`Unmarked ${showTitle} S${season} E${episode}: ${epTitle}`);
      }
  }, [watchProgress, notificationSettings.showPriorEpisodesPopup, watching, completed, dropped, updateLists, setHistory, setWatchProgress, setUserXp, setWatching, setOnHold, setDropped]);

  const handleBulkPriorAction = async (action: number) => {
    const { showId, season, episode, showInfo } = priorModalState;
    setPriorModalState(p => ({ ...p, isOpen: false }));

    if (action === 2) return; 

    const showTitle = showInfo.title || (showInfo as any).name || 'Unknown Show';
    const posterPath = showInfo.poster_path || (showInfo as any).profile_path || null;

    if (action === 1) {
        confirmationService.show("Marking prior episodes...");
        try {
            const today = new Date().toISOString().split('T')[0];
            const newProgressUpdates: Record<number, Record<number, EpisodeProgress>> = {};
            const currentShowProgress = watchProgress[showId] || {};
            const newHistoryItems: HistoryItem[] = [];

            for (let s = 1; s <= season; s++) {
                const seasonDetails = await getSeasonDetails(showId, s);
                for (const ep of seasonDetails.episodes) {
                    if (s === season && ep.episode_number >= episode) break;
                    
                    const alreadyWatched = currentShowProgress[s]?.[ep.episode_number]?.status === 2;
                    const hasAired = ep.air_date && ep.air_date <= today;

                    if (!alreadyWatched && hasAired) {
                        if (!newProgressUpdates[s]) newProgressUpdates[s] = {};
                        newProgressUpdates[s][ep.episode_number] = { status: 2 };
                        newHistoryItems.push({
                            logId: `tv-${showId}-${s}-${ep.episode_number}-${Date.now()}`,
                            id: showId, media_type: 'tv', title: showTitle, poster_path: posterPath,
                            timestamp: new Date().toISOString(), seasonNumber: s, episodeNumber: ep.episode_number, episodeTitle: ep.name
                        });
                    }
                }
            }

            if (!newProgressUpdates[season]) newProgressUpdates[season] = {};
            newProgressUpdates[season][episode] = { status: 2 };
            newHistoryItems.push({
                logId: `tv-${showId}-${season}-${episode}-${Date.now()}`,
                id: showId, media_type: 'tv', title: showTitle, poster_path: posterPath,
                timestamp: new Date().toISOString(), seasonNumber: season, episodeNumber: episode, episodeTitle: 'n/a'
            });

            setWatchProgress(prev => ({
                ...prev,
                [showId]: {
                    ...(prev[showId] || {}),
                    ...Object.keys(newProgressUpdates).reduce((acc, sNum) => {
                        const s = parseInt(sNum);
                        acc[s] = { ...(prev[showId]?.[s] || {}), ...newProgressUpdates[s] };
                        return acc;
                    }, {} as Record<number, Record<number, EpisodeProgress>>)
                }
            }));
            setHistory(prev => [...newHistoryItems, ...prev]);
            
            if (!watching.some(i => i.id === showId) && !completed.some(i => i.id === showId)) {
                updateLists({ ...showInfo, title: showTitle, poster_path: posterPath } as TrackedItem, null, 'watching');
            }
            confirmationService.show(`Marked all prior and current episodes of ${showTitle} as watched.`);
        } catch (e) { console.error(e); }
    }

    if (action === 3) {
        handleToggleEpisode(showId, season, episode, 0, showInfo);
    }

    if (action === 4) {
        setWatchProgress(prev => {
            const next = { ...prev };
            const showP = { ...next[showId] };
            Object.keys(showP).forEach(sKey => {
                const sNum = parseInt(sKey);
                if (sNum >= season) {
                    const seasonP = { ...showP[sNum] };
                    Object.keys(seasonP).forEach(eKey => {
                        const eNum = parseInt(eKey);
                        if (sNum > season || eNum >= episode) {
                            setHistory(hPrev => hPrev.filter(h => !(h.id === showId && h.seasonNumber === sNum && h.episodeNumber === eNum)));
                            delete seasonP[eNum];
                        }
                    });
                    showP[sNum] = seasonP;
                }
            });
            next[showId] = showP;
            return next;
        });
        confirmationService.show(`Unmarked S${season} E${episode} and all future marked episodes for ${showTitle}.`);
    }
  };

  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
    const showTitle = showInfo.title || (showInfo as any).name || 'Unknown Show';
    const posterPath = showInfo.poster_path || (showInfo as any).profile_path || null;

    confirmationService.show(`Marking ${showTitle} as fully watched...`);
    try {
        const details = await getMediaDetails(showId, 'tv');
        if (!details.seasons) return;
        
        const today = new Date().toISOString().split('T')[0];
        const newProgressUpdates: Record<number, Record<number, EpisodeProgress>> = {};
        const newHistoryLogs: HistoryItem[] = [];
        const currentShowProgress = watchProgress[showId] || {};

        for (const season of details.seasons) {
            if (season.season_number === 0) continue;
            const seasonDetails = await getSeasonDetails(showId, season.season_number);
            for (const ep of seasonDetails.episodes) {
                const alreadyWatched = currentShowProgress[season.season_number]?.[ep.episode_number]?.status === 2;
                const hasAired = ep.air_date && ep.air_date <= today;
                if (!alreadyWatched && hasAired) {
                    if (!newProgressUpdates[season.season_number]) newProgressUpdates[season.season_number] = {};
                    newProgressUpdates[season.season_number][ep.episode_number] = { status: 2 };
                    newHistoryLogs.push({
                        logId: `tv-bulk-${showId}-${season.season_number}-${ep.episode_number}-${Date.now()}`,
                        id: showId, media_type: 'tv', title: showTitle, poster_path: posterPath,
                        timestamp: new Date().toISOString(), seasonNumber: season.season_number, episodeNumber: ep.episode_number, episodeTitle: ep.name
                    });
                }
            }
        }

        if (newHistoryLogs.length > 0) {
            setWatchProgress(prev => ({
                ...prev,
                [showId]: {
                    ...(prev[showId] || {}),
                    ...Object.keys(newProgressUpdates).reduce((acc, sNum) => {
                        const seasonNum = parseInt(sNum);
                        acc[seasonNum] = { ...(prev[showId]?.[seasonNum] || {}), ...newProgressUpdates[seasonNum] };
                        return acc;
                    }, {} as Record<number, Record<number, EpisodeProgress>>)
                }
            }));
            setHistory(prev => [...newHistoryLogs, ...prev]);
            setUserXp(prev => prev + (newHistoryLogs.length * XP_CONFIG.episode));
            updateLists({ ...showInfo, title: showTitle, poster_path: posterPath } as TrackedItem, null, 'completed');
            confirmationService.show(`Marked entire show "${showTitle}" as watched!`);
        } else {
            confirmationService.show("All aired episodes are already watched.");
        }
    } catch (e) {
        console.error(e);
        confirmationService.show("Bulk update failed.");
    }
  }, [watchProgress, setWatchProgress, setHistory, setUserXp, updateLists]);

  const handleUnmarkAllWatched = useCallback((showId: number) => {
      setHistory(prev => prev.filter(h => h.id !== showId));
      setWatchProgress(prev => {
          const next = { ...prev };
          delete next[showId];
          return next;
      });
      setWatching(prev => prev.filter(i => i.id !== showId));
      setCompleted(prev => prev.filter(i => i.id !== showId));
      setOnHold(prev => prev.filter(i => i.id !== showId));
      setDropped(prev => prev.filter(i => i.id !== showId));
      confirmationService.show("Erased all progress and history for this title.");
  }, [setWatchProgress, setHistory, setWatching, setCompleted, setOnHold, setDropped]);

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
          const exists = prev.some(f => f.id === item.id);
          if (exists) return prev.filter(f => f.id !== item.id);
          return [item, ...prev];
      });
  }, [setFavorites]);

  const handleSaveComment = useCallback((data: { mediaKey: string; text: string; parentId: string | null; isSpoiler: boolean; }) => {
      const userObj = currentUser ? {
          id: currentUser.id, username: currentUser.username, profilePictureUrl: profilePictureUrl
      } : {
          id: `guest-${Date.now()}`, username: 'Guest User', profilePictureUrl: null
      };
      const newComment: Comment = {
          id: `comment-${Date.now()}`, mediaKey: data.mediaKey, text: data.text, timestamp: new Date().toISOString(),
          user: userObj, parentId: data.parentId, likes: [], isSpoiler: data.isSpoiler
      };
      setComments(prev => [newComment, ...prev]);
      confirmationService.show(`Comment posted by ${userObj.username}`);
  }, [currentUser, profilePictureUrl, setComments]);

  const handleAddToList = (listId: string, item: CustomListItem) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              if (list.items.some(i => i.id === item.id)) return list;
              return { ...list, items: [...list.items, item] };
          }
          return list;
      }));
      const showId = item.id;
      const isInTracking = watching.some(i => i.id === showId) || completed.some(i => i.id === showId) || onHold.some(i => i.id === showId) || dropped.some(i => i.id === showId) || planToWatch.some(i => i.id === showId);
      if (!isInTracking) {
          updateLists({ ...item, genre_ids: [] }, null, 'planToWatch');
      }
      confirmationService.show(`"${item.title}" added to list.`);
  };

  const handleCreateAndAddToList = (listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`, name: listName, description: '', items: [item], createdAt: new Date().toISOString(), isPublic: false, likes: []
      };
      setCustomLists(prev => [newList, ...prev]);
      updateLists({ ...item, genre_ids: [] }, null, 'planToWatch');
      confirmationService.show(`List "${listName}" created and "${item.title}" added.`);
  };

  const handleFollow = (uid: string, uname: string) => {
    if (!currentUser) return;
    setFollows(prev => ({ ...prev, [currentUser.id]: [...(prev[currentUser.id] || []), uid] }));
  };

  const handleUnfollow = (uid: string) => {
    if (!currentUser) return;
    setFollows(prev => ({ ...prev, [currentUser.id]: (prev[currentUser.id] || []).filter(id => id !== uid) }));
  };
  
  const handleTraktImportCompleted = useCallback((data: {
    history: HistoryItem[]; completed: TrackedItem[]; planToWatch: TrackedItem[]; watchProgress: WatchProgress; ratings: UserRatings;
  }) => {
      setHistory(prev => [...data.history, ...prev]);
      setCompleted(prev => [...data.completed, ...prev]);
      setPlanToWatch(prev => [...data.planToWatch, ...prev]);
      setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
      setRatings(prev => ({ ...prev, ...data.ratings }));
      confirmationService.show(`Trakt import complete! Added ${data.history.length} history items.`);
  }, [setHistory, setCompleted, setPlanToWatch, setWatchProgress, setRatings]);

  const handleDeleteHistoryItem = useCallback((itemToDelete: HistoryItem) => {
    setHistory(prev => {
        const nextHistory = prev.filter(h => h.logId !== itemToDelete.logId);
        if (itemToDelete.media_type === 'tv' && itemToDelete.seasonNumber !== undefined && itemToDelete.episodeNumber !== undefined) {
            const otherLogsExist = nextHistory.some(h => h.id === itemToDelete.id && h.seasonNumber === itemToDelete.seasonNumber && h.episodeNumber === itemToDelete.episodeNumber);
            if (!otherLogsExist) {
                setWatchProgress(p => {
                    const nextP = { ...p };
                    if (nextP[itemToDelete.id] && nextP[itemToDelete.id][itemToDelete.seasonNumber!]) {
                        const seasonProgress = { ...nextP[itemToDelete.id][itemToDelete.seasonNumber!] };
                        delete seasonProgress[itemToDelete.episodeNumber!];
                        nextP[itemToDelete.id][itemToDelete.seasonNumber!] = seasonProgress;
                    }
                    return nextP;
                });
            }
        }
        return nextHistory;
    });
    confirmationService.show("Log deleted.");
  }, [setHistory, setWatchProgress]);

  const handleClearMediaHistory = useCallback((mediaId: number, mediaType: 'tv' | 'movie' | 'person') => {
      setHistory(prev => prev.filter(h => h.id !== mediaId));
      confirmationService.show("All history logs cleared.");
  }, [setHistory]);

  const navOffsetClass = useMemo(() => {
    if (navSettings.position === 'left') return 'ml-16';
    if (navSettings.position === 'right') return 'mr-16';
    return '';
  }, [navSettings.position]);

  return (
    <>
      <ConfirmationContainer />
      <AnimationContainer />
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={handleSelectShow} onUpdateLists={updateLists} />
      <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} onNominate={handleNominateWeeklyPick} currentPicks={weeklyFavorites} />
      <PriorEpisodesModal isOpen={priorModalState.isOpen} onClose={() => setPriorModalState(p => ({ ...p, isOpen: false }))} showTitle={priorModalState.showInfo.title || ''} season={priorModalState.season} episode={priorModalState.episode} hasFuture={priorModalState.hasFuture} onSelectAction={handleBulkPriorAction} onDisablePopup={() => handleToggleNotification('showPriorEpisodesPopup')} />
      {selectedUserId && currentUser && (
          <UserProfileModal userId={selectedUserId} currentUser={currentUser} onClose={() => setSelectedUserId(null)} follows={follows[currentUser.id] || []} onFollow={handleFollow} onUnfollow={handleUnfollow} onToggleLikeList={() => {}} />
      )}
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => setActiveScreen('profile')} onSelectShow={handleSelectShow} onGoHome={() => setActiveScreen('home')} onMarkShowAsWatched={() => {}} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} isHoliday={false} holidayName={null} hoverReveal={navSettings.hoverRevealHeader} />
      <main className={`transition-all duration-300 ${navSettings.position === 'bottom' ? 'pb-20' : navOffsetClass}`}>
        {selectedShow ? (
            <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={(id, s, e, entry) => {
                    setWatchProgress(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = { ...next[id][s][e], journal: entry as any };
                        return next;
                    });
                    if (entry) setUserXp(prev => prev + XP_CONFIG.journal);
                }} trackedLists={{ watching, planToWatch, completed, onHold, dropped }} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={(id, type, path) => setCustomImagePaths(prev => ({...prev, [id]: {...prev[id], [type === 'poster' ? 'poster_path' : 'backdrop_path']: path}}))} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} weeklyFavorites={weeklyFavorites} weeklyFavoritesHistory={weeklyFavoritesHistory} onToggleWeeklyFavorite={handleNominateWeeklyPick} onSelectShow={handleSelectShow} onOpenCustomListModal={(item) => setAddToListModalState({ isOpen: true, item })} ratings={ratings} onRateItem={handleRateItem} onMarkMediaAsWatched={(details, date) => {
                    const title = details.title || details.name || 'Untitled';
                    const trackedItem: TrackedItem = { id: details.id, title, media_type: details.media_type, poster_path: details.poster_path };
                    updateLists(trackedItem, null, 'completed');
                    const logItem: HistoryItem = { logId: `log-${details.id}-${Date.now()}`, id: details.id, media_type: details.media_type, title, poster_path: details.poster_path, timestamp: date || new Date().toISOString() };
                    setHistory(prev => [logItem, ...prev]);
                    setUserXp(prev => prev + XP_CONFIG.movie);
                    confirmationService.show(`Logged "${title}" as watched!`);
                }} onUnmarkMovieWatched={() => {}} onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={(id, s, e) => {
                    setFavoriteEpisodes(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = !next[id][s][e];
                        return next;
                    });
                }} onSelectPerson={(pid) => { setSelectedPerson(pid); setSelectedShow(null); }} onStartLiveWatch={(mediaInfo) => { setActiveScreen('home'); confirmationService.show(`Live session started for ${mediaInfo.title}`); }} onDeleteHistoryItem={handleDeleteHistoryItem} onClearMediaHistory={handleClearMediaHistory} episodeRatings={episodeRatings} onRateEpisode={() => {}} onAddWatchHistory={handleToggleEpisode as any} onSaveComment={handleSaveComment} comments={comments} genres={genres} onMarkAllWatched={handleMarkAllWatched} onUnmarkAllWatched={handleUnmarkAllWatched} onSaveEpisodeNote={(id, s, e, note) => {
                    setEpisodeNotes(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = note;
                        return next;
                    });
                }} showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={(id, s, r) => setSeasonRatings(prev => ({ ...prev, [id]: { ...prev[id], [s]: r } }))} customLists={customLists} currentUser={currentUser} allUsers={[]} mediaNotes={mediaNotes} onSaveMediaNote={(mid, notes) => setMediaNotes(prev => ({ ...prev, [mid]: notes }))} allUserData={allUserData} episodeNotes={episodeNotes} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} />
        ) : selectedPerson ? (
            <ActorDetail personId={selectedPerson} onBack={() => setSelectedPerson(null)} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleNominateWeeklyPick} weeklyFavorites={weeklyFavorites} />
        ) : (
            <>
                {activeScreen === 'home' && <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} onShortcutNavigate={handleTabPress} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} liveWatchMedia={null} liveWatchElapsedSeconds={0} liveWatchIsPaused={false} onLiveWatchTogglePause={() => {}} onLiveWatchStop={() => {}} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat="12h" reminders={reminders} onToggleReminder={() => {}} onUpdateLists={updateLists} onOpenNominateModal={() => setIsNominateModalOpen(true)} shortcutSettings={shortcutSettings} />}
                {activeScreen === 'search' && <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={() => {}} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={() => {}} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings}/>}
                {activeScreen === 'calendar' && <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={() => {}} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} allTrackedItems={[...watching, ...planToWatch, ...completed]} />}
                {activeScreen === 'progress' && <ProgressScreen userData={allUserData} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} />}
                {activeScreen === 'profile' && <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={() => {}} onTraktImportCompleted={handleTraktImportCompleted} onTmdbImportCompleted={() => {}} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} setCustomLists={setCustomLists} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={handleDeleteHistoryItem} onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={{activityVisibility: 'public'}} onSelectUser={setSelectedUserId} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={() => {}} notifications={notifications} onMarkAllRead={() => {}} onMarkOneRead={() => {}} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={false} setHolidayAnimationsEnabled={() => {}} profileTheme={null} setProfileTheme={() => {}} textSize={1} setTextSize={() => {}} onFeedbackSubmit={() => {}} levelInfo={calculateLevelInfo(userXp)} timeFormat="12h" setTimeFormat={() => {}} pin={null} setPin={() => {}} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} onToggleWeeklyFavorite={handleRemoveWeeklyPick} onOpenNominateModal={() => setIsNominateModalOpen(true)} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} initialTab={profileInitialTab} shortcutSettings={shortcutSettings} setShortcutSettings={setShortcutSettings} navSettings={navSettings} setNavSettings={setNavSettings} />}
            </>
        )}
      </main>
      <BottomTabNavigator activeTab={activeScreen} activeProfileTab={profileInitialTab} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} navSettings={navSettings} />
    </>
  );
};
