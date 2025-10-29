import React, { useState, useMemo } from 'react';
import { UserData, ProfileTab, ScreenName, TmdbMedia, WatchStatus, CustomList, CustomListItem, LiveWatchMediaInfo, TrackedItem, HistoryItem } from '../types';
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
import LiveWatchControls from '../components/LiveWatchControls';
import DateTimeDisplay from '../components/DateTimeDisplay';
import PlanToWatch from '../components/PlanToWatch';

interface DashboardProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onSelectShowInModal: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: UserData['watchProgress'];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onShortcutNavigate: (screen: ScreenName, profileTab?: ProfileTab) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  liveWatchMedia: LiveWatchMediaInfo | null;
  liveWatchElapsedSeconds: number;
  liveWatchIsPaused: boolean;
  onLiveWatchTogglePause: () => void;
  onLiveWatchStop: () => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  timezone: string;
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center">
        <h3 className="font-bold text-lg">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm">
            The content carousels on this page cannot be loaded. Please add your TMDB API key to the `constants.ts` file to enable this feature.
        </p>
    </div>
);

const fetchPopularAndTopRatedTV = async (): Promise<TmdbMedia[]> => {
    const [popular, topRated] = await Promise.all([
        discoverMedia('tv', { sortBy: 'popularity.desc' }),
        discoverMedia('tv', { sortBy: 'vote_average.desc', vote_count_gte: 200 })
    ]);
    const combined = new Map<number, TmdbMedia>();
    popular.forEach(item => combined.set(item.id, item));
    topRated.forEach(item => combined.set(item.id, item));
    return Array.from(combined.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
};

const fetchPopularAndTopRatedMovies = async (): Promise<TmdbMedia[]> => {
    const [popular, topRated] = await Promise.all([
        discoverMedia('movie', { sortBy: 'popularity.desc' }),
        discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300 })
    ]);
    const combined = new Map<number, TmdbMedia>();
    popular.forEach(item => combined.set(item.id, item));
    topRated.forEach(item => combined.set(item.id, item));
    return Array.from(combined.values()).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
};

const Dashboard: React.FC<DashboardProps> = ({
    userData, onSelectShow, onSelectShowInModal, watchProgress, onToggleEpisode, onShortcutNavigate, onOpenAddToListModal, setCustomLists,
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, onToggleFavoriteShow, favorites, pausedLiveSessions, timezone
}) => {
  // Cast TMDB_API_KEY to string to prevent TypeScript error on constant comparison.
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';

  const trackedShowsForNewSeasons = useMemo(() => {
    const allItems = new Map<number, TrackedItem>();

    // From standard lists
    [
        ...userData.watching,
        ...userData.planToWatch,
        ...userData.completed,
        ...userData.onHold,
        ...userData.dropped,
        ...userData.favorites,
    ].forEach(item => {
        if (item.media_type === 'tv' && !allItems.has(item.id)) {
            allItems.set(item.id, item);
        }
    });

    // From custom lists
    (userData.customLists || []).forEach(list => {
        (list.items || []).forEach((item: CustomListItem) => {
            if (item.media_type === 'tv' && !allItems.has(item.id)) {
                allItems.set(item.id, {
                    id: item.id,
                    media_type: 'tv',
                    title: item.title,
                    poster_path: item.poster_path,
                    genre_ids: [], // Not available in CustomListItem, but optional
                });
            }
        });
    });

    // From history
    (userData.history || []).forEach((item: HistoryItem) => {
        if (item.media_type === 'tv' && !allItems.has(item.id)) {
            allItems.set(item.id, {
                id: item.id,
                media_type: 'tv',
                title: item.title,
                poster_path: item.poster_path,
                genre_ids: [], // Not available in HistoryItem, but optional
            });
        }
    });

    return Array.from(allItems.values());
  }, [userData]);

  return (
    <div className="animate-fade-in space-y-8">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <DateTimeDisplay timezone={timezone} />
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
        onHold={userData.onHold}
        watchProgress={watchProgress}
        history={userData.history}
        onSelectShow={onSelectShow}
        onToggleEpisode={onToggleEpisode}
        pausedLiveSessions={pausedLiveSessions}
      />

      <PlanToWatch items={userData.planToWatch} onSelectShow={onSelectShow} />
      
      {/* Discovery Carousels */}
      {isApiKeyMissing ? <ApiKeyWarning /> : (
        <>
            <NewSeasons onSelectShow={onSelectShow} trackedShows={trackedShowsForNewSeasons} timezone={timezone} />
            <NewReleases mediaType="movie" title="🍿 New Movie Releases" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} timezone={timezone} />
            <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <TrendingSection mediaType="movie" title="🔥 Trending Movies" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <GenericCarousel title="📺 Popular & Top Rated TV Shows" fetcher={fetchPopularAndTopRatedTV} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <GenericCarousel title="🎬 Popular & Top Rated Movies" fetcher={fetchPopularAndTopRatedMovies} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <GenericCarousel title="💥 Top Rated Action & Adventure" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300, genre: '28|12' })} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <GenericCarousel title="🎭 Binge-Worthy TV Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', genre: 18, vote_count_gte: 100 })} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <GenericCarousel title="📅 Upcoming Movies" fetcher={getUpcomingMovies} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} />
            <MyListSuggestions
                userData={userData}
                onSelectShow={onSelectShow}
                onOpenAddToListModal={onOpenAddToListModal}
            />
        </>
      )}
    </div>
  );
};

export default Dashboard;
