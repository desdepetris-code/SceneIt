import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import ShowDetail from './screens/ShowDetail';
import BottomTabNavigator, { Tab } from './navigation/BottomTabNavigator';
import { starterShows, starterMovies } from './data/shows';
import { getGenres, getNewSeasons } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, DriveStatus } from './types';
import SearchScreen from './screens/SearchScreen';
import Profile from './screens/Profile';
import Recommendations from './screens/Recommendations';
import { useTheme } from './hooks/useTheme';
import NotificationsScreen from './screens/NotificationsScreen';
import * as googleDriveService from './services/googleDriveService';


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
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>('watching_list', starterShows);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>('plan_to_watch_list', starterMovies);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>('completed_list', []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>('favorites_list', []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>('watch_progress', {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('history', []);
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>('custom_image_paths', {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('notifications', []);
  
  const [activeScreen, setActiveScreen] = useState<'home' | 'detail'>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  
  const [genres, setGenres] = useState<Record<number, string>>({});
  
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

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
  // --- Storage Warning ---
   useEffect(() => {
        if (localStorage.getItem('sceneit_storage_critical') === 'true') {
            setShowStorageWarning(true);
        }
    }, []);

    // --- Notification Logic ---
    const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
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
            return [newNotification, ...prev].slice(0, 50); // Keep max 50 notifications
        });
    }, [setNotifications]);

    useEffect(() => {
        const checkForNewSeasons = async () => {
            try {
                const showsWithNewSeasons = await getNewSeasons();
                const watchingIds = new Set(watching.map(item => item.id));

                showsWithNewSeasons.forEach(show => {
                    if (watchingIds.has(show.id)) {
                        const latestSeason = show.seasons
                            ?.filter(s => s.season_number > 0)
                            .sort((a, b) => b.season_number - a.season_number)[0];
                        
                        if (latestSeason) {
                            addNotification({
                                type: 'new_season',
                                mediaId: show.id,
                                mediaType: 'tv',
                                title: show.name || 'Unknown Show',
                                description: `${latestSeason.name} just premiered!`,
                                poster_path: show.poster_path,
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to check for new season notifications", error);
            }
        };
        checkForNewSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watching, addNotification]);
    // --- End Notification Logic ---
  
  // --- Google Drive Handlers ---
  const allUserData = useMemo(() => ({
      watching, planToWatch, completed, favorites, watchProgress, history, customImagePaths, notifications
  }), [watching, planToWatch, completed, favorites, watchProgress, history, customImagePaths, notifications]);

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
          await googleDriveService.uploadData(allUserData);
          const now = new Date().toISOString();
          setDriveStatus(prev => ({ ...prev, isSyncing: false, lastSync: now }));
          localStorage.setItem('drive_last_sync', now);
      } catch (error: any) {
          console.error("Backup failed", error);
          setDriveStatus(prev => ({ ...prev, isSyncing: false, error: `Backup failed: ${error.message}` }));
      }
  }, [allUserData, driveStatus.isSignedIn]);

  const handleRestoreFromDrive = useCallback(async () => {
      if (!driveStatus.isSignedIn) return;
      
      setDriveStatus(prev => ({...prev, isSyncing: true, error: null}));
      try {
          const data = await googleDriveService.downloadData() as UserData & { customImagePaths: CustomImagePaths, notifications: AppNotification[], favorites: TrackedItem[] } | null;
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
  }, [driveStatus.isSignedIn, setWatching, setPlanToWatch, setCompleted, setFavorites, setWatchProgress, setHistory, setCustomImagePaths, setNotifications]);
  
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
                                    const isPristine = watching.length <= starterShows.length && completed.length === 0 && history.length === 0;
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
  // --- End Google Drive ---


  // Handlers
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setActiveScreen('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedShow(null);
    setActiveScreen('home');
  };
  
  const handleNavigate = (tab: Tab) => {
    setActiveTab(tab);
    setActiveScreen('home');
    window.scrollTo(0, 0);
  };

  const handleShowSettings = () => {
    setActiveTab('Profile');
  };

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
  }, [setCompleted, setFavorites, setPlanToWatch, setWatching]);


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

      // Add to history if marking as watched
      if (newStatus === 2) {
          const allItems = [...watching, ...planToWatch, ...completed, ...favorites];
          const showInfo = allItems.find(item => item.id === showId);
          if (showInfo) {
              const historyEntry: HistoryItem = {
                  id: showId,
                  media_type: showInfo.media_type,
                  title: showInfo.title,
                  poster_path: showInfo.poster_path,
                  timestamp: new Date().toISOString(),
                  seasonNumber: showInfo.media_type === 'tv' ? seasonNumber : undefined,
                  episodeNumber: showInfo.media_type === 'tv' ? episodeNumber : undefined,
              };
              setHistory(prev => [historyEntry, ...prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber))]);
          }
      }
  };

  const handleSaveJournal = (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry) => {
      setWatchProgress(prev => {
          const newProgress = { ...prev };
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const existingEntry = newProgress[showId][seasonNumber][episodeNumber];
          
          newProgress[showId][seasonNumber][episodeNumber] = {
              status: existingEntry?.status || 0,
              journal: entry,
          };
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
      // Add to history
      setHistory(prev => [...historyItems, ...prev]);

      // Add to completed list, avoiding duplicates from any list
      const existingIds = new Set([...watching, ...planToWatch, ...completed].map(i => i.id));
      const newCompletedItems = completedItems.filter(item => !existingIds.has(item.id));
      
      setCompleted(prev => [...newCompletedItems, ...prev]);
  };


  const renderContent = () => {
    if (activeScreen === 'detail' && selectedShow) {
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
        />
      );
    }
    
    switch (activeTab) {
      case 'Home':
        return (
          <HomeScreen
            userData={{ watching, planToWatch, completed, favorites, watchProgress, history }}
            genres={genres}
            onSelectShow={handleSelectShow}
            watchProgress={watchProgress}
            // FIX: Corrected typo from onToggleEpisode to handleToggleEpisode.
            onToggleEpisode={handleToggleEpisode}
            onAddItemToList={handleAddItemToList}
            onShowSettings={handleShowSettings}
          />
        );
      case 'Search':
          return <SearchScreen onSelectShow={handleSelectShow} genres={genres} />
      case 'Discover':
          return <Recommendations 
                    genres={genres}
                    onAdd={(item: TmdbMedia) => handleAddItemToList(item, 'planToWatch')}
                    onSelectShow={handleSelectShow}
                 />
      case 'Notifications':
        return <NotificationsScreen
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onMarkOneRead={handleMarkNotificationRead}
                  onSelectShow={handleSelectShow}
                />
      case 'Profile':
          return <Profile 
                    userData={{ watching, planToWatch, completed, favorites, watchProgress, history }} 
                    onSelectShow={handleSelectShow}
                    genres={genres}
                    driveStatus={driveStatus}
                    onDriveSignIn={handleDriveSignIn}
                    onDriveSignOut={handleDriveSignOut}
                    onBackupToDrive={handleBackupToDrive}
                    onRestoreFromDrive={handleRestoreFromDrive}
                    onImportCompleted={handleImportCompleted}
                 />
      default:
        return null;
    }
  };
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pb-16">
      {showStorageWarning && <StorageWarningBanner onDismiss={() => setShowStorageWarning(false)} onConnect={() => setActiveTab('Profile')} />}
      <Header onSelectShow={handleSelectShow} />
      <main className="py-6">
        <div className="container mx-auto">
          {renderContent()}
        </div>
      </main>
      <BottomTabNavigator activeTab={activeTab} setActiveTab={handleNavigate} unreadCount={unreadCount} />
    </div>
  );
};

export default App;
