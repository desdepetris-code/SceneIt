import React, { useState, useMemo } from 'react';
import { UserData, ProfileTab, ScreenName, TmdbMedia, WatchStatus, CustomList, CustomListItem, LiveWatchMediaInfo, TrackedItem, HistoryItem } from '../types';
import HeroBanner from '../components/HeroBanner';
import ShortcutNavigation from '../components/ShortcutNavigation';
import ContinueWatching from '../components/ContinueWatching';
import NewSeasons from '../components/NewSeasons';
import { getUpcomingMovies, discoverMedia } from '../services/tmdbService';
import { TMDB_API_KEY } from '../constants';
import MyListSuggestions from '../components/MyListSuggestions';
import LiveWatchControls from '../components/LiveWatchControls';
import DateTimeDisplay from '../components/DateTimeDisplay';
import PlanToWatch from '../components/PlanToWatch';
import StatsWidget from '../components/StatsWidget';
import RelatedRecommendations from '../components/RelatedRecommendations';
import NewReleases from '../components/NewReleases';
import TrendingSection from '../components/TrendingSection';
import GenericCarousel from '../components/GenericCarousel';
import UpcomingCalendar from '../components/UpcomingCalendar';

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
  genres: Record<number, string>;
  timeFormat: '12h' | '24h';
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center">
        <h3 className="font-bold text-lg">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm">
            The content carousels on this page cannot be loaded. Please add your TMDB API key to the `constants.ts` file to enable this feature.
        </p>
    </div>
);

const DiscoverContent: React.FC<Pick<DashboardProps, 'onSelectShow' | 'onOpenAddToListModal' | 'onMarkShowAsWatched' | 'onToggleFavoriteShow' | 'favorites' | 'userData' | 'timezone' | 'onShortcutNavigate' | 'genres'>> = 
({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData, timezone, onShortcutNavigate, genres }) => {
    
    const { genreId, genreName } = useMemo(() => {
        const genreIds = Object.keys(genres).filter(id => !['10770', '10767', '10763'].includes(id));
        if (genreIds.length === 0) return { genreId: null, genreName: null };
        const randomGenreId = genreIds[Math.floor(Math.random() * genreIds.length)];
        return { genreId: Number(randomGenreId), genreName: genres[Number(randomGenreId)] };
    }, [genres]);

    const carouselProps = {
        onSelectShow: onSelectShow,
        onOpenAddToListModal: onOpenAddToListModal,
        onMarkShowAsWatched: onMarkShowAsWatched,
        onToggleFavoriteShow: onToggleFavoriteShow,
        favorites: favorites,
        completed: userData.completed
    };

    return (
        <div className="space-y-8">
          <NewReleases mediaType="movie" title="🍿 New Popular Movie Releases" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} timezone={timezone} recommendationReason="Fresh from the big screen" onViewMore={() => onShortcutNavigate('allNewReleases')} />
          <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} recommendationReason="What everyone's talking about" onViewMore={() => onShortcutNavigate('allTrendingTV')} />
          <TrendingSection mediaType="movie" title="🔥 Trending Movies" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} recommendationReason="Popular in theaters & streaming" onViewMore={() => onShortcutNavigate('allTrendingMovies')} />
          <GenericCarousel title="💥 Top Rated Action & Adventure" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300, genre: '28|12' })} {...carouselProps} recommendationReason="For fans of Action & Adventure" />
          <GenericCarousel title="🎭 Binge-Worthy TV Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', genre: 18, vote_count_gte: 100 })} {...carouselProps} recommendationReason="For fans of Drama" />
          <GenericCarousel 
              title="💎 Hidden Gems"
              fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 20, vote_count_lte: 400 })}
              {...carouselProps}
              recommendationReason="Highly-rated & under the radar"
          />
          {genreId && genreName && (
              <GenericCarousel
                  title={`🔦 Genre Spotlight: ${genreName}`}
                  fetcher={() => discoverMedia(Math.random() > 0.5 ? 'movie' : 'tv', { genre: genreId, sortBy: 'popularity.desc' })}
                  {...carouselProps}
                  recommendationReason={`For fans of ${genreName}`}
              />
          )}
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({
    userData, onSelectShow, onSelectShowInModal, watchProgress, onToggleEpisode, onShortcutNavigate, onOpenAddToListModal, setCustomLists,
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, onToggleFavoriteShow, favorites, pausedLiveSessions, timezone, genres, timeFormat
}) => {
  // Cast TMDB_API_KEY to string to prevent TypeScript error on constant comparison.
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';

  const trackedShowsForNewSeasons = useMemo(() => {
    const allItems = new Map<number, TrackedItem>();

    // From standard lists
    [
        ...userData.watching,
        ...userData.planToWatch,
    ].forEach(item => {
        if (item.media_type === 'tv' && !allItems.has(item.id)) {
            allItems.set(item.id, item);
        }
    });

    return Array.from(allItems.values());
  }, [userData]);

  const recommendationSeedItems = useMemo(() => {
    // Items that have progress and are in the 'watching' list
    return [...userData.watching].filter(item => {
        const progress = userData.watchProgress[item.id];
        return progress && Object.keys(progress).length > 0 && !userData.onHold.some(onHoldItem => onHoldItem.id === item.id);
    });
  }, [userData.watching, userData.watchProgress, userData.onHold]);

  return (
    <div className="animate-fade-in space-y-8">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <DateTimeDisplay timezone={timezone} timeFormat={timeFormat} />
      <ShortcutNavigation onShortcutNavigate={onShortcutNavigate} />
      <StatsWidget userData={userData} genres={genres} />

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

      {!isApiKeyMissing && (
        <>
            {/* FIX: Removed the 'title' prop as it's not supported by the 'NewSeasons' component. */}
            <NewSeasons title="New Seasons from Your Watchlist" onSelectShow={onSelectShow} trackedShows={trackedShowsForNewSeasons} watchProgress={userData.watchProgress} timezone={timezone} />
            {/* FIX: Removed the 'title' prop as it's not supported by the 'NewSeasons' component. */}
            <NewSeasons title="All New Premieres" onSelectShow={onSelectShow} trackedShows={[]} watchProgress={userData.watchProgress} timezone={timezone} />
            <UpcomingCalendar userData={userData} onSelectShow={onSelectShow} timezone={timezone} onViewFullCalendar={() => onShortcutNavigate('calendar')} />
        </>
      )}

      {!isApiKeyMissing && recommendationSeedItems.length > 0 && (
        <RelatedRecommendations
            seedItems={recommendationSeedItems}
            userData={userData}
            onSelectShow={onSelectShow}
            onOpenAddToListModal={onOpenAddToListModal}
            onMarkShowAsWatched={onMarkShowAsWatched}
            onToggleFavoriteShow={onToggleFavoriteShow}
            favorites={favorites}
            completed={userData.completed}
        />
      )}

      <PlanToWatch items={userData.planToWatch} onSelectShow={onSelectShow} />
      
      {!isApiKeyMissing && (
        <DiscoverContent 
          onSelectShow={onSelectShow} 
          onOpenAddToListModal={onOpenAddToListModal} 
          onMarkShowAsWatched={onMarkShowAsWatched} 
          onToggleFavoriteShow={onToggleFavoriteShow} 
          favorites={favorites} 
          userData={userData} 
          timezone={timezone} 
          onShortcutNavigate={onShortcutNavigate}
          genres={genres}
        />
      )}

      {!isApiKeyMissing && (
        <MyListSuggestions
            userData={userData}
            onSelectShow={onSelectShow}
            onOpenAddToListModal={onOpenAddToListModal}
        />
      )}

      {isApiKeyMissing && <ApiKeyWarning />}
    </div>
  );
};

export default Dashboard;