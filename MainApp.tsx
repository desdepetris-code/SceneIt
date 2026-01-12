
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, clearMediaCache, getMediaDetails, getCollectionDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo, CustomListItem, EpisodeRatings, SearchHistoryItem, Comment, Theme, ShowProgress, TraktToken, Follows, PrivacySettings, ProfileTheme, Reminder, Episode, SeasonRatings } from './types';
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
import AllMediaScreen from './screens/AllMediaScreen';
import AllNewlyPopularEpisodesScreen from './screens/AllNewlyPopularEpisodesScreen';
import { getAchievementImage } from './utils/achievementImages';
import { allAchievements } from './achievements';
import { getAllUsers } from './utils/userUtils';

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
                    setTimeout(() => window.location.href = '/', 2000);
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
  const [episodeNotes, setEpisodeNotes] = useLocalStorage<Record<number, Record<number, Record<number, string>>>>(`episode_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [seasonRatings, setSeasonRatings] = useLocalStorage<SeasonRatings>(`season_ratings_${userId}`, {});
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
  const [pin, setPin] = useLocalStorage<string | null>(`pin_${userId}`, null);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

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
    
    const newNotification: AppNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => {
        const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
        const exists = prev.some(n => 
            n.mediaId === newNotification.mediaId && 
            n.type === newNotification.type &&
            new Date(n.timestamp).getTime() > twentyFourHoursAgo 
        );
        if (exists) return prev;
        
        if(notificationSettings.sounds) playNotificationSound();
        return [newNotification, ...prev].slice(0, 50); 
    });
  }, [setNotifications, notificationSettings]);

  const handleFeedbackSubmit = useCallback(() => {
    const oldLevel = calculateLevelInfo(userXp).level;
    const newXp = userXp + XP_CONFIG.feedback;
    setUserXp(newXp);
    confirmationService.show("Feedback received! +5 XP.");
    const newLevel = calculateLevelInfo(newXp).level;
    if (newLevel > oldLevel) {
        addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Level ${newLevel} reached!`, achievementId: `level_${newLevel}` });
    }
  }, [userXp, setUserXp, addNotification]);

  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings
  }), [watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings]);
  
  const allTrackedItems = useMemo(() => [
    ...watching, ...planToWatch, ...completed, ...onHold, ...dropped, ...favorites
  ], [watching, planToWatch, completed, onHold, dropped, favorites]);
  
  const { achievements, isLoading: achievementsLoading } = useAchievements(allUserData);
  const [prevAchievements, setPrevAchievements] = useLocalStorage<UserAchievementStatus[]>(`prev_achievements_${userId}`, []);

  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };
  
  /* Fix: Added handleSelectPerson function to handle selection of a person. */
  const handleSelectPerson = (personId: number) => {
    setSelectedPerson(personId);
    setSelectedShow(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  /* Fix: Added handleUpdateSearchHistory to store recent search queries. */
  const handleUpdateSearchHistory = (query: string) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
        const newItem: SearchHistoryItem = { query: query.trim(), timestamp: new Date().toISOString() };
        return [newItem, ...prev.filter(h => h.query !== query.trim())].slice(0, 20);
    });
  };

  /* Fix: Added handleToggleReminder to manage release reminders for future media. */
  const handleToggleReminder = (newReminder: Reminder | null, reminderId: string) => {
    setReminders(prev => {
        if (newReminder) {
            return [newReminder, ...prev.filter(r => r.id !== reminderId)];
        }
        return prev.filter(r => r.id !== reminderId);
    });
  };

  const handleSelectUser = (userId: string) => setViewingUserId(userId);
  const handleGoHome = () => { setSelectedShow(null); setSelectedPerson(null); setActiveScreen('home'); setSearchQuery(''); window.scrollTo(0, 0); };
  const handleBack = () => { setSelectedShow(null); setSelectedPerson(null); };
  
  const handleTabPress = (tab: TabName) => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setActiveScreen(tab);
    if (tab !== 'search') setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleShortcutNavigate = (screen: ScreenName, profileTab?: ProfileTab) => {
    setSelectedShow(null);
    setActiveScreen(screen);
    if (screen === 'profile' && profileTab) setInitialProfileTab(profileTab);
    window.scrollTo(0, 0);
  };

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        if (newList && setters[newList]) setters[newList](prev => [item, ...prev]);
        if (newList) animationService.show('flyToNav', { posterPath: item.poster_path });
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleToggleEpisode = useCallback(async (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => {
        const wasWatched = currentStatus === 2;
        const newStatus = wasWatched ? 0 : 2;

        setWatchProgress(prev => {
            const newProgress = { ...prev };
            const showProgress = { ...(newProgress[showId] || {}) };
            const seasonProgress = { ...(showProgress[seasonNumber] || {}) };
            const epProgress = { ...(seasonProgress[episodeNumber] || { status: 0 }) };
            epProgress.status = newStatus;
            seasonProgress[episodeNumber] = epProgress;
            showProgress[seasonNumber] = seasonProgress;
            newProgress[showId] = showProgress;
            return newProgress;
        });
        
        clearMediaCache(showId, 'tv');

        if (!wasWatched) {
            animationService.show('flyToNav', { posterPath: showInfo.poster_path });
            const historyEntry: HistoryItem = {
                logId: `tv-${showId}-${seasonNumber}-${episodeNumber}-${Date.now()}`,
                id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                timestamp: new Date().toISOString(), seasonNumber, episodeNumber, episodeTitle: episodeName
            };
            setHistory(prev => [historyEntry, ...prev]);
            confirmationService.show(`Marked S${seasonNumber}E${episodeNumber} as watched.`);
            setUserXp(xp => xp + XP_CONFIG.episode);
        } else { 
            setHistory(prev => prev.filter(item => !(item.id === showId && item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber)));
        }
    }, [setWatchProgress, setHistory, userXp, setUserXp]);

  const handleMarkShowAsWatched = useCallback((itemToMark: TmdbMedia | TrackedItem, date?: string) => {
        const trackedItem: TrackedItem = { id: itemToMark.id, title: itemToMark.title || (itemToMark as TmdbMedia).name || 'Untitled', media_type: itemToMark.media_type, poster_path: itemToMark.poster_path, genre_ids: itemToMark.genre_ids };
        if (trackedItem.media_type === 'movie') {
            const historyEntry: HistoryItem = { logId: `movie-${trackedItem.id}-${Date.now()}`, id: trackedItem.id, media_type: 'movie', title: trackedItem.title, poster_path: trackedItem.poster_path, timestamp: date || new Date().toISOString() };
            setHistory(prev => [historyEntry, ...prev]);
            updateLists(trackedItem, null, 'completed');
            confirmationService.show(`Marked "${trackedItem.title}" as watched.`);
            setUserXp(xp => xp + XP_CONFIG.movie);
        }
    }, [setHistory, updateLists, setUserXp]);

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
  if (window.location.pathname === '/auth/trakt/callback') return <TraktCallbackHandler />;
  
  const commonListScreenProps = {
    onSelectShow: handleSelectShow,
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => setAddToListModalState({isOpen: true, item}),
    onMarkShowAsWatched: handleMarkShowAsWatched,
    onToggleFavoriteShow: (item: TrackedItem) => setFavorites(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [item, ...prev]),
    favorites, completed, showRatings
  };

  const screenContent = () => {
    if (selectedShow) return <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={(showId, s, e, entry) => {setWatchProgress(prev => { const n = JSON.parse(JSON.stringify(prev)); if(!n[showId]) n[showId]={}; if(!n[showId][s]) n[showId][s]={}; if(!n[showId][s][e]) n[showId][s][e]={status:0}; n[showId][s][e].journal=entry||undefined; return n; });}} trackedLists={{ watching, planToWatch, completed, onHold, dropped }} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={(mediaId, type, path) => setCustomImagePaths(prev => ({ ...prev, [mediaId]: { ...prev[mediaId], [type === 'poster' ? 'poster_path' : 'backdrop_path']: path } }))} favorites={favorites} onToggleFavoriteShow={(item) => setFavorites(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [item, ...prev])} onSelectShow={handleSelectShow} onOpenCustomListModal={(item) => setAddToListModalState({isOpen: true, item: item})} ratings={ratings} onRateItem={(mediaId, rating) => setRatings(prev => ({ ...prev, [mediaId]: {rating, date: new Date().toISOString()}}))} onMarkMediaAsWatched={handleMarkShowAsWatched} onUnmarkMovieWatched={() => {}} onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectPerson={handleSelectPerson} onStartLiveWatch={() => {}} onDeleteHistoryItem={() => {}} onClearMediaHistory={() => {}} episodeRatings={episodeRatings} onRateEpisode={() => {}} onAddWatchHistory={() => {}} onSaveComment={() => {}} comments={comments} onToggleLikeComment={() => {}} onDeleteComment={() => {}} onMarkRemainingWatched={() => {}} genres={genres} onMarkAllWatched={() => {}} onUnmarkAllWatched={() => {}} onSaveNote={() => {}} mediaNotes={mediaNotes} episodeNotes={episodeNotes} onSaveEpisodeNote={() => {}} showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={() => {}} customLists={customLists} currentUser={currentUser} allUsers={[]} />;
    
    /* Fix: Added conditional rendering for ActorDetail screen. */
    if (selectedPerson) return <ActorDetail personId={selectedPerson} onBack={handleBack} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={(item) => setFavorites(prev => prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [item, ...prev])} onRateItem={(mediaId, rating) => setRatings(prev => ({ ...prev, [mediaId]: {rating, date: new Date().toISOString()}}))} ratings={ratings} favorites={favorites} />;

    switch (activeScreen) {
      case 'home': return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={(item) => setAddToListModalState({isOpen: true, item: item})} setCustomLists={setCustomLists} liveWatchMedia={null} liveWatchElapsedSeconds={0} liveWatchIsPaused={false} onLiveWatchTogglePause={() => {}} onLiveWatchStop={() => {}} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={() => {}} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat={timeFormat} reminders={reminders} onToggleReminder={handleToggleReminder} onUpdateLists={updateLists} />;
      case 'search': return <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={handleSelectPerson} onSelectUser={handleSelectUser} searchHistory={searchHistory} onUpdateSearchHistory={handleUpdateSearchHistory} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={handleMarkShowAsWatched} onOpenAddToListModal={(item) => setAddToListModalState({isOpen: true, item: item})} onToggleFavoriteShow={() => {}} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings}/>;
      case 'calendar': return <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={handleToggleReminder} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} allTrackedItems={allTrackedItems} />;
      case 'progress': return <ProgressScreen userData={allUserData} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} />;
      case 'profile': return <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={() => {}} onTraktImportCompleted={() => {}} onTmdbImportCompleted={() => {}} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} setCustomLists={setCustomLists} initialTab={initialProfileTab} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={() => {}} onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={handleGoHome} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onSelectUser={handleSelectUser} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={() => {}} notifications={notifications} onMarkAllRead={() => {}} onMarkOneRead={() => {}} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={holidayAnimationsEnabled} setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} profileTheme={profileTheme} setProfileTheme={setProfileTheme} textSize={textSize} setTextSize={setTextSize} onFeedbackSubmit={handleFeedbackSubmit} levelInfo={levelInfo} timeFormat={timeFormat} setTimeFormat={setTimeFormat} pin={pin} setPin={setPin} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} />;
      default: return null;
    }
  };

  return (
    <>
      <ConfirmationContainer />
      <AnimationContainer />
      {holidayInfo.isHoliday && holidayAnimationsEnabled && <BackgroundParticleEffects effect={activeTheme.colors.particleEffect} />}
      {transitionEffect && <ThemeTransitionAnimation effect={transitionEffect[0]} onAnimationEnd={() => setTransitionEffect(null)} />}
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={() => {}} onCreateAndAddToList={() => {}} onGoToDetails={handleSelectShow} onUpdateLists={updateLists} />
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} timezone={timezone} setTimezone={setTimezone} />
      {viewingUserId && <UserProfileModal userId={viewingUserId} currentUser={currentUser!} follows={[]} onFollow={() => {}} onUnfollow={() => {}} onClose={() => setViewingUserId(null)} onToggleLikeList={() => {}} />}
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => handleShortcutNavigate('profile')} onSelectShow={handleSelectShow} onGoHome={handleGoHome} onMarkShowAsWatched={handleMarkShowAsWatched} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} isHoliday={holidayInfo.isHoliday} holidayName={holidayInfo.holidayName} />
      <main className="pb-20">{screenContent()}</main>
      <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} />
    </>
  );
};
