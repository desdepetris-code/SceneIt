import React, { useState, useMemo } from 'react';
import { UserData, WatchStatus, TrackedItem, WatchProgress, TmdbMedia } from '../types';
import ShowCard from '../components/ShowCard';
import GenreFilter from '../components/GenreFilter';
import StatusFilter from '../components/StatusFilter';
import ContinueWatchingProgressCard from '../components/ContinueWatchingProgressCard';
import NewReleases from '../components/NewReleases';
import NewSeasons from '../components/NewSeasons';
import TrendingPopular from '../components/TrendingPopular';
import HistoryScreen from './HistoryScreen';
import AchievementsScreen from './AchievementsScreen';
import { BadgeIcon, ClockIcon, CogIcon, FilmIcon } from '../components/Icons';


interface HomeScreenProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onAddItemToList: (item: TmdbMedia, list: WatchStatus) => void;
  onShowSettings: () => void;
}

type HomeTab = 'progress' | 'history' | 'achievements';

const HomeScreen: React.FC<HomeScreenProps> = ({ userData, genres, onSelectShow, watchProgress, onToggleEpisode, onAddItemToList, onShowSettings }) => {
  const { watching, planToWatch, completed, favorites } = userData;
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus | null>(null);
  const [activeTab, setActiveTab] = useState<HomeTab>('progress');

  const allItems = useMemo(() => {
    const all = [...watching, ...planToWatch, ...completed];
    const uniqueItems = new Map<number, TrackedItem>();
    all.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });
    return Array.from(uniqueItems.values());
  }, [watching, planToWatch, completed]);

  const filteredItems = useMemo(() => {
    let itemsToFilter = allItems;

    if (selectedStatus) {
      const statusToListMap = {
        watching: watching,
        planToWatch: planToWatch,
        completed: completed,
        favorites: favorites,
      };
      const listForStatus = statusToListMap[selectedStatus];
      const idsInList = new Set(listForStatus.map(item => item.id));
      itemsToFilter = allItems.filter(item => idsInList.has(item.id));
    }

    if (selectedGenreId) {
      return itemsToFilter.filter(item => item.genre_ids?.includes(selectedGenreId));
    }

    return itemsToFilter;
  }, [allItems, selectedGenreId, selectedStatus, watching, planToWatch, completed, favorites]);
  
  const continueWatchingItems = useMemo(() => {
    return userData.watching.filter(item => item.media_type === 'tv');
  }, [userData.watching]);

  const tabs: { id: HomeTab | 'settings', label: string, icon: React.ReactNode }[] = [
    { id: 'progress', label: 'Progress', icon: <FilmIcon className="w-6 h-6" /> },
    { id: 'history', label: 'History', icon: <ClockIcon className="w-6 h-6" /> },
    { id: 'achievements', label: 'Achievements', icon: <BadgeIcon className="w-6 h-6" /> },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-6 h-6" /> },
  ];

  const renderProgressContent = () => (
    <>
      {continueWatchingItems.length > 0 && !selectedStatus && !selectedGenreId && (
          <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary px-6 mb-2">Continue Watching</h2>
              <div className="flex overflow-x-auto py-2 -mx-2 px-6">
                  {(continueWatchingItems || []).map(item => (
                      <div key={item.id} className="w-64 flex-shrink-0 px-2">
                           <ContinueWatchingProgressCard
                              item={item}
                              watchProgress={watchProgress}
                              onSelectShow={onSelectShow}
                              onToggleEpisode={onToggleEpisode}
                          />
                      </div>
                  ))}
              </div>
          </div>
        )}

        <NewReleases onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
        <NewSeasons onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
        <TrendingPopular onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />

        <h2 className="text-2xl font-bold text-text-primary px-6 mb-2">My Lists</h2>
        <StatusFilter selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />
        <GenreFilter genres={genres} selectedGenreId={selectedGenreId} onSelectGenre={setSelectedGenreId} />

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-6">
            {filteredItems.map(item => (
              <ShowCard key={item.id} item={item} onSelect={onSelectShow} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-6">
            <h2 className="text-2xl font-bold text-text-primary">No Items Found</h2>
            <p className="mt-4 text-text-secondary max-w-md mx-auto">
              Your lists are empty or no items match the current filters. Try adding a show or movie using the search bar!
            </p>
          </div>
        )}
    </>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'progress':
        return renderProgressContent();
      case 'history':
        return <HistoryScreen history={userData.history} onSelectShow={onSelectShow} onBack={() => setActiveTab('progress')} />;
      case 'achievements':
        return <AchievementsScreen userData={userData} onBack={() => setActiveTab('progress')} />;
      default:
        return renderProgressContent();
    }
  }

  return (
    <div className="animate-fade-in">
        <div className="px-6 mb-8">
            <div className="flex justify-around items-stretch p-2 bg-bg-secondary rounded-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (tab.id === 'settings') {
                                onShowSettings();
                            } else {
                                setActiveTab(tab.id as HomeTab);
                            }
                        }}
                        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 ${
                        activeTab === tab.id
                            ? 'bg-accent-gradient text-white shadow-lg'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab.icon}
                        <span className="text-xs font-semibold mt-1">{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {renderTabContent()}
    </div>
  );
};

export default HomeScreen;
