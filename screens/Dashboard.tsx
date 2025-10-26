





import React, { useState } from 'react';
import { UserData, ProfileTab, ScreenName, TmdbMedia, WatchStatus, CustomList, CustomListItem, LiveWatchMediaInfo } from '../types';
import HeroBanner from '../components/HeroBanner';
import ShortcutNavigation from '../components/ShortcutNavigation';
import ContinueWatching from '../components/ContinueWatching';
import NewSeasons from '../components/NewSeasons';
import NewReleases from '../components/NewReleases';
import TrendingSection from '../components/TrendingSection';
import GenericCarousel from '../components/GenericCarousel';
import { discoverMedia, getUpcomingMovies } from '../services/tmdbService';
import { TMDB_API_KEY } from '../constants';
import MyListSuggestions from '../components/MyListSuggestions';
import AddToListModal from '../components/AddToListModal';
import LiveWatchControls from '../components/LiveWatchControls';

interface DashboardProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onSelectShowInModal: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: UserData['watchProgress'];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onShortcutNavigate: (screen: ScreenName, profileTab?: ProfileTab) => void;
  onAddItemToList: (item: TmdbMedia, list: WatchStatus) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  liveWatchMedia: LiveWatchMediaInfo | null;
  liveWatchElapsedSeconds: number;
  liveWatchIsPaused: boolean;
  onLiveWatchTogglePause: () => void;
  onLiveWatchStop: () => void;
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center">
        <h3 className="font-bold text-lg">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm">
            The content carousels on this page cannot be loaded. Please add your TMDB API key to the `constants.ts` file to enable this feature.
        </p>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({
    userData, onSelectShow, onSelectShowInModal, watchProgress, onToggleEpisode, onShortcutNavigate, onAddItemToList, setCustomLists,
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop
}) => {
  // FIX: Cast TMDB_API_KEY to string to prevent TypeScript error on constant comparison.
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';
  
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAddToList, setItemToAddToList] = useState<TmdbMedia | null>(null);

  const handleOpenAddToListModal = (item: TmdbMedia) => {
      setItemToAddToList(item);
      setIsAddToListModalOpen(true);
  };

  const handleAddToList = (listId: string, item: CustomListItem) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              if (list.items.some(i => i.id === item.id)) return list; // Already exists
              return { ...list, items: [item, ...list.items] };
          }
          return list;
      }));
  };
  
  const handleCreateAndAddToList = (listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`,
          name: listName,
          description: '',
          items: [item],
          createdAt: new Date().toISOString()
      };
      setCustomLists(prev => [newList, ...prev]);
  };


  return (
    <div className="animate-fade-in space-y-8">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <ShortcutNavigation onShortcutNavigate={onShortcutNavigate} />

      {/* Live Watch Section */}
      <section className="px-6">
        {liveWatchMedia ? (
          <LiveWatchControls
            mediaInfo={liveWatchMedia}
            elapsedSeconds={liveWatchElapsedSeconds}
            isPaused={liveWatchIsPaused}
            onTogglePause={onLiveWatchTogglePause}
            onStop={onLiveWatchStop}
            isDashboardWidget={true}
          />
        ) : (
          <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center">
            <h3 className="text-xl font-bold text-text-primary">No Live Session Active</h3>
            <p className="text-text-secondary mt-2">Start a live watch session from any show or movie page to see controls here.</p>
          </div>
        )}
      </section>

      <ContinueWatching
        watching={userData.watching}
        watchProgress={watchProgress}
        history={userData.history}
        onSelectShow={onSelectShow}
        onToggleEpisode={onToggleEpisode}
      />
      
      {/* Discovery Carousels */}
      {isApiKeyMissing ? <ApiKeyWarning /> : (
        <>
            <NewSeasons onSelectShow={onSelectShowInModal} />
            <NewReleases mediaType="movie" title="🍿 New Movie Releases" onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <TrendingSection mediaType="movie" title="🔥 Trending Movies" onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <GenericCarousel title="✨ Popular Movies" fetcher={() => discoverMedia('movie', { sortBy: 'popularity.desc' })} onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <GenericCarousel title="🌟 Top Rated TV Shows" fetcher={() => discoverMedia('tv', { sortBy: 'vote_average.desc', vote_count_gte: 200 })} onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <GenericCarousel title="📅 Upcoming Movies" fetcher={getUpcomingMovies} onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
            <MyListSuggestions
                userData={userData}
                onSelectShow={onSelectShow}
                onOpenAddToListModal={handleOpenAddToListModal}
            />
        </>
      )}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        itemToAdd={itemToAddToList}
        customLists={userData.customLists}
        onAddToList={handleAddToList}
        onCreateAndAddToList={handleCreateAndAddToList}
    />
    </div>
  );
};

export default Dashboard;