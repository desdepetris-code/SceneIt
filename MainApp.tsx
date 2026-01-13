
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, clearMediaCache } from './services/tmdbService';
import { TrackedItem, WatchProgress, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, CustomList, UserRatings, LiveWatchMediaInfo, EpisodeRatings, SearchHistoryItem, Comment, Theme, SeasonRatings, Reminder, NotificationSettings, CustomListItem, JournalEntry, Follows, TraktToken } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
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
  const [weeklyFavorites, setWeeklyFavorites] = useLocalStorage<TrackedItem[]>(`weekly_favorites_${userId}`, []);
  const [weeklyFavoritesWeekKey, setWeeklyFavoritesWeekKey] = useLocalStorage<string>(`weekly_favorites_week_${userId}`, '');
  const [weeklyFavoritesHistory, setWeeklyFavoritesHistory] = useLocalStorage<Record<string, TrackedItem[]>>(`weekly_favorites_history_${userId}`, {});
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
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true, newEpisodes: true, movieReleases: true, sounds: true, newFollowers: true, listLikes: true, appUpdates: true, importSyncCompleted: true, showWatchedConfirmation: true,
  });
  // FIX: Added missing pausedLiveSessions state to store incomplete watch sessions.
  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const currentWeekKey = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
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

  const handleToggleWeeklyFavorite = useCallback((item: TrackedItem) => {
    setWeeklyFavorites(prev => {
        const exists = prev.some(f => f.id === item.id);
        if (exists) {
            confirmationService.show(`${item.title} removed from Weekly Picks`);
            return prev.filter(f => f.id !== item.id);
        }
        if (prev.length >= 5) {
            confirmationService.show("Max 5 weekly picks allowed!");
            return prev;
        }
        confirmationService.show(`${item.title} added to Weekly Picks!`);
        return [...prev, item];
    });
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
  
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
    setSelectedUserId(null);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setSelectedShow(null);
  const handleTabPress = (tab: TabName) => { setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null); setActiveScreen(tab); window.scrollTo(0, 0); };

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        if (newList && setters[newList]) setters[newList](prev => [item, ...prev]);
        confirmationService.show(`${item.title} added to ${newList || 'Library'}`);
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleToggleEpisode = useCallback((showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => {
      const isWatched = currentStatus === 2;
      const newStatus = isWatched ? 0 : 2;
      
      setWatchProgress(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][season]) next[showId][season] = {};
          next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as any };
          return next;
      });

      if (!isWatched) {
          const logItem: HistoryItem = {
              logId: `tv-${showId}-${season}-${episode}-${Date.now()}`,
              id: showId,
              media_type: 'tv',
              title: showInfo.title,
              poster_path: showInfo.poster_path,
              timestamp: new Date().toISOString(),
              seasonNumber: season,
              episodeNumber: episode,
              episodeTitle: episodeName
          };
          setHistory(prev => [logItem, ...prev]);
          setUserXp(prev => prev + XP_CONFIG.episode);
          confirmationService.show(`Logged S${season} E${episode}: ${episodeName}`);
      }
  }, [setWatchProgress, setHistory, setUserXp]);

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
      if (!currentUser) return;
      const newComment: Comment = {
          id: `comment-${Date.now()}`,
          mediaKey: data.mediaKey,
          text: data.text,
          timestamp: new Date().toISOString(),
          user: {
              id: currentUser.id,
              username: currentUser.username,
              profilePictureUrl: profilePictureUrl
          },
          parentId: data.parentId,
          likes: [],
          isSpoiler: data.isSpoiler
      };
      setComments(prev => [newComment, ...prev]);
  }, [currentUser, profilePictureUrl, setComments]);

  const handleAddToList = (listId: string, item: CustomListItem) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              if (list.items.some(i => i.id === item.id)) return list;
              return { ...list, items: [...list.items, item] };
          }
          return list;
      }));
      confirmationService.show(`${item.title} added to list.`);
  };

  const handleCreateAndAddToList = (listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`,
          name: listName,
          description: '',
          items: [item],
          createdAt: new Date().toISOString(),
          isPublic: false
      };
      setCustomLists(prev => [newList, ...prev]);
      confirmationService.show(`List created and ${item.title} added.`);
  };

  const handleFollow = (uid: string, uname: string) => {
    if (!currentUser) return;
    setFollows(prev => ({
        ...prev,
        [currentUser.id]: [...(prev[currentUser.id] || []), uid]
    }));
  };

  const handleUnfollow = (uid: string) => {
    if (!currentUser) return;
    setFollows(prev => ({
        ...prev,
        [currentUser.id]: (prev[currentUser.id] || []).filter(id => id !== uid)
    }));
  };
  
  const handleTraktImportCompleted = useCallback((data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => {
      setHistory(prev => [...data.history, ...prev]);
      setCompleted(prev => [...data.completed, ...prev]);
      setPlanToWatch(prev => [...data.planToWatch, ...prev]);
      setWatchProgress(prev => ({ ...prev, ...data.watchProgress }));
      setRatings(prev => ({ ...prev, ...data.ratings }));
      confirmationService.show(`Trakt import complete! Added ${data.history.length} history items.`);
  }, [setHistory, setCompleted, setPlanToWatch, setWatchProgress, setRatings]);

  return (
    <>
      <ConfirmationContainer />
      <AnimationContainer />
      <AddToListModal 
          isOpen={addToListModalState.isOpen} 
          onClose={() => setAddToListModalState({ isOpen: false, item: null })} 
          itemToAdd={addToListModalState.item} 
          customLists={customLists} 
          onAddToList={handleAddToList} 
          onCreateAndAddToList={handleCreateAndAddToList} 
          onGoToDetails={handleSelectShow} 
          onUpdateLists={updateLists} 
      />
      <NominatePicksModal 
          isOpen={isNominateModalOpen}
          onClose={() => setIsNominateModalOpen(false)}
          userData={allUserData}
          onNominate={handleToggleWeeklyFavorite}
          currentPicks={weeklyFavorites}
      />
      
      {selectedUserId && currentUser && (
          <UserProfileModal 
              userId={selectedUserId} 
              currentUser={currentUser} 
              onClose={() => setSelectedUserId(null)} 
              follows={follows[currentUser.id] || []} 
              onFollow={handleFollow} 
              onUnfollow={handleUnfollow} 
              onToggleLikeList={() => {}}
          />
      )}
      
      <Header 
          currentUser={currentUser} 
          profilePictureUrl={profilePictureUrl} 
          onAuthClick={onAuthClick} 
          onGoToProfile={() => setActiveScreen('profile')} 
          onSelectShow={handleSelectShow} 
          onGoHome={() => setActiveScreen('home')} 
          onMarkShowAsWatched={() => {}} 
          query={searchQuery} 
          onQueryChange={setSearchQuery} 
          isOnSearchScreen={activeScreen === 'search'} 
          isHoliday={false}
          holidayName={null}
      />

      <main className="pb-20">
        {selectedShow ? (
            <ShowDetail 
                id={selectedShow.id} 
                mediaType={selectedShow.media_type} 
                onBack={handleBack} 
                watchProgress={watchProgress} 
                history={history} 
                onToggleEpisode={handleToggleEpisode} 
                onSaveJournal={(id, s, e, entry) => {
                    setWatchProgress(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = { ...next[id][s][e], journal: entry as any };
                        return next;
                    });
                    if (entry) setUserXp(prev => prev + XP_CONFIG.journal);
                }} 
                trackedLists={{ watching, planToWatch, completed, onHold, dropped }} 
                onUpdateLists={updateLists} 
                customImagePaths={customImagePaths} 
                onSetCustomImage={(id, type, path) => setCustomImagePaths(prev => ({...prev, [id]: {...prev[id], [type === 'poster' ? 'poster_path' : 'backdrop_path']: path}}))} 
                favorites={favorites} 
                onToggleFavoriteShow={handleToggleFavoriteShow} 
                weeklyFavorites={weeklyFavorites}
                onToggleWeeklyFavorite={handleToggleWeeklyFavorite}
                onSelectShow={handleSelectShow} 
                onOpenCustomListModal={(item) => setAddToListModalState({ isOpen: true, item })} 
                ratings={ratings} 
                onRateItem={handleRateItem} 
                onMarkMediaAsWatched={() => {}} 
                onUnmarkMovieWatched={() => {}} 
                onMarkSeasonWatched={() => {}} 
                onUnmarkSeasonWatched={() => {}} 
                onMarkPreviousEpisodesWatched={() => {}} 
                favoriteEpisodes={favoriteEpisodes} 
                onToggleFavoriteEpisode={(id, s, e) => {
                    setFavoriteEpisodes(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = !next[id][s][e];
                        return next;
                    });
                }} 
                onSelectPerson={(pid) => { setSelectedPerson(pid); setSelectedShow(null); }} 
                onStartLiveWatch={() => {}} 
                onDeleteHistoryItem={(item) => setHistory(prev => prev.filter(h => h.logId !== item.logId))} 
                onClearMediaHistory={(mid) => setHistory(prev => prev.filter(h => h.id !== mid))} 
                episodeRatings={episodeRatings} 
                onRateEpisode={() => {}} 
                onAddWatchHistory={handleToggleEpisode as any} 
                onSaveComment={handleSaveComment} 
                comments={comments} 
                genres={genres} 
                onMarkAllWatched={() => {}} 
                onUnmarkAllWatched={() => {}} 
                onSaveEpisodeNote={(id, s, e, note) => {
                    setEpisodeNotes(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = note;
                        return next;
                    });
                }} 
                showRatings={showRatings} 
                seasonRatings={seasonRatings} 
                onRateSeason={(id, s, r) => setSeasonRatings(prev => ({ ...prev, [id]: { ...prev[id], [s]: r } }))} 
                customLists={customLists} 
                currentUser={currentUser} 
                allUsers={[]} 
            />
        ) : selectedPerson ? (
            <ActorDetail 
                personId={selectedPerson} 
                onBack={() => setSelectedPerson(null)} 
                userData={allUserData} 
                onSelectShow={handleSelectShow} 
                onToggleFavoriteShow={handleToggleFavoriteShow} 
                onRateItem={handleRateItem} 
                ratings={ratings} 
                favorites={favorites} 
            />
        ) : (
            <>
                {activeScreen === 'home' && <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} onShortcutNavigate={(s, t) => { setActiveScreen(s); }} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} liveWatchMedia={null} liveWatchElapsedSeconds={0} liveWatchIsPaused={false} onLiveWatchTogglePause={() => {}} onLiveWatchStop={() => {}} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat="12h" reminders={reminders} onToggleReminder={() => {}} onUpdateLists={updateLists} onOpenNominateModal={() => setIsNominateModalOpen(true)} />}
                {activeScreen === 'search' && <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={() => {}} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={() => {}} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings}/>}
                {activeScreen === 'calendar' && <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={() => {}} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} allTrackedItems={[...watching, ...planToWatch, ...completed]} />}
                {activeScreen === 'progress' && <ProgressScreen userData={allUserData} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} />}
                {activeScreen === 'profile' && <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={() => {}} onTraktImportCompleted={handleTraktImportCompleted} onTmdbImportCompleted={() => {}} onToggleEpisode={handleToggleEpisode} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} setCustomLists={setCustomLists} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={(item) => setHistory(prev => prev.filter(h => h.logId !== item.logId))} onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={{activityVisibility: 'public'}} onSelectUser={setSelectedUserId} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={() => {}} notifications={[]} onMarkAllRead={() => {}} onMarkOneRead={() => {}} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={false} setHolidayAnimationsEnabled={() => {}} profileTheme={null} setProfileTheme={() => {}} textSize={1} setTextSize={() => {}} onFeedbackSubmit={() => {}} levelInfo={calculateLevelInfo(userXp)} timeFormat="12h" setTimeFormat={() => {}} pin={null} setPin={() => {}} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} onToggleWeeklyFavorite={handleToggleWeeklyFavorite} onOpenNominateModal={() => setIsNominateModalOpen(true)} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={() => {}} />}
            </>
        )}
      </main>
      <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} />
    </>
  );
};
