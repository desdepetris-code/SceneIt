
import React, { useState, useMemo, useEffect } from 'react';
import { UserData, ProfileTab, ScreenName, TmdbMedia, WatchStatus, CustomList, CustomListItem, LiveWatchMediaInfo, TrackedItem, HistoryItem, Reminder, ReminderType, ShortcutSettings } from '../types';
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
import NewlyPopularEpisodes from '../components/NewlyPopularEpisodes';
import UpcomingPremieresCarousel from '../components/UpcomingPremieresCarousel';
import { getEnrichedMediaFromBackend } from '../services/backendService';

interface DashboardProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onSelectShowInModal: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: UserData['watchProgress'];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onShortcutNavigate: (tabId: string) => void;
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
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  onOpenNominateModal: () => void;
  shortcutSettings: ShortcutSettings;
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center">
        <h3 className="font-bold text-lg">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm">
            The content carousels on this page cannot be loaded. Please add your TMDB API key to the `constants.ts` file to enable this feature.
        </p>
    </div>
);

interface DiscoverContentProps extends Pick<DashboardProps, 'onSelectShow' | 'onOpenAddToListModal' | 'onMarkShowAsWatched' | 'onToggleFavoriteShow' | 'favorites' | 'userData' | 'timezone' | 'onShortcutNavigate' | 'genres' | 'reminders' | 'onToggleReminder' | 'onUpdateLists'> {}

const DiscoverContent: React.FC<DiscoverContentProps> = 
({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData, timezone, onShortcutNavigate, genres, reminders, onToggleReminder, onUpdateLists }) => {
    
    const carouselProps = {
        onSelectShow: onSelectShow,
        onOpenAddToListModal: onOpenAddToListModal,
        onMarkShowAsWatched: onMarkShowAsWatched,
        onToggleFavoriteShow: onToggleFavoriteShow,
        favorites: favorites,
        completed: userData.completed,
        onUpdateLists: onUpdateLists,
    };
    

    return (
        <div className="space-y-8">
          <UpcomingPremieresCarousel
            title="📺 Upcoming TV Premieres"
            onSelectShow={onSelectShow}
            completed={userData.completed}
            reminders={reminders}
            onToggleReminder={onToggleReminder}
            onViewMore={() => onShortcutNavigate('calendar')}
            onUpdateLists={onUpdateLists}
            onOpenAddToListModal={onOpenAddToListModal}
          />
          <NewReleases mediaType="movie" title="🍿 New Popular Movie Releases" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} timezone={timezone} onViewMore={() => onShortcutNavigate('allNewReleases')} onUpdateLists={onUpdateLists} />
          <NewlyPopularEpisodes onSelectShow={onSelectShow} onViewMore={() => onShortcutNavigate('allNewlyPopularEpisodes')} />
          <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} onViewMore={() => onShortcutNavigate('allTrendingTV')} onUpdateLists={onUpdateLists} />
          <TrendingSection mediaType="movie" title="🔥 Trending Movies" onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} completed={userData.completed} onViewMore={() => onShortcutNavigate('allTrendingMovies')} onUpdateLists={onUpdateLists} />
          <GenericCarousel title="💥 Top Rated Action & Adventure" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300, genre: '28|12' })} {...carouselProps} onViewMore={() => onShortcutNavigate('allTopRated')} />
          <GenericCarousel title="🎭 Binge-Worthy TV Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', genre: 18, vote_count_gte: 100 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allBingeWorthy')} />
          <GenericCarousel 
              title="💎 Hidden Gems"
              fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 20, vote_count_lte: 400 })}
              {...carouselProps}
              onViewMore={() => onShortcutNavigate('allHiddenGems')}
          />
          <GenericCarousel title="😂 Top Comedy Shows" fetcher={() => discoverMedia('tv', { genre: 35, sortBy: 'popularity.desc', vote_count_gte: 100 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allTopComedy')} />
          <GenericCarousel title="🤠 For Western Fans" fetcher={() => discoverMedia('movie', { genre: 37, sortBy: 'popularity.desc' })} {...carouselProps} onViewMore={() => onShortcutNavigate('allWestern')} />
          <GenericCarousel title="🚀 Sci-Fi Universe" fetcher={async () => {
              const [movies, tv] = await Promise.all([
                  discoverMedia('movie', { genre: 878, sortBy: 'popularity.desc' }),
                  discoverMedia('tv', { genre: 10765, sortBy: 'popularity.desc' }) // 10765 is Sci-Fi & Fantasy for TV
              ]);
              return [...movies, ...tv].sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
          }} {...carouselProps} onViewMore={() => onShortcutNavigate('allSciFi')} />
          <GenericCarousel title="🎬 Critically Acclaimed 80s Movies" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', 'primary_release_date.gte': '1980-01-01', 'primary_release_date.lte': '1989-12-31', vote_count_gte: 500 })} {...carouselProps} />
          <GenericCarousel title="🎭 Iconic 2000s Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', 'first_air_date.gte': '2000-01-01', 'first_air_date.lte': '2009-12-31', genre: 18, vote_count_gte: 300 })} {...carouselProps} />
          <GenericCarousel title="✨ Cult Sci-Fi & Fantasy Classics" fetcher={() => discoverMedia('tv', { sortBy: 'vote_average.desc', 'first_air_date.lte': '2010-01-01', genre: '10765', vote_count_gte: 250 })} {...carouselProps} />
          <GenericCarousel title="🎞️ Timeless Animated Movies" fetcher={() => discoverMedia('movie', { genre: 16, 'primary_release_date.lte': '1999-12-31', vote_count_gte: 200 })} {...carouselProps} />
          <GenericCarousel title="🎬 Golden Age of Hollywood" fetcher={() => discoverMedia('movie', { 'primary_release_date.gte': '1930-01-01', 'primary_release_date.lte': '1960-12-31', vote_count_gte: 100, sortBy: 'vote_average.desc' })} {...carouselProps} />
          <GenericCarousel title="📺 Groundbreaking 70s TV" fetcher={() => discoverMedia('tv', { 'first_air_date.gte': '1970-01-01', 'first_air_date.lte': '1979-12-31', vote_count_gte: 50, sortBy: 'popularity.desc' })} {...carouselProps} />
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({
    userData, onSelectShow, onSelectShowInModal, watchProgress, onToggleEpisode, onShortcutNavigate, onOpenAddToListModal, setCustomLists,
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, onToggleFavoriteShow, favorites, pausedLiveSessions, timezone, genres, timeFormat,
    reminders, onToggleReminder, onUpdateLists, onOpenNominateModal, shortcutSettings
}) => {
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';

  const [backendMovies, setBackendMovies] = useState<TmdbMedia[]>([]);
  const [backendShows, setBackendShows] = useState<TmdbMedia[]>([]);
  const [backendLoading, setBackendLoading] = useState(true);

  useEffect(() => {
    const fetchBackendData = async () => {
        if (isApiKeyMissing) {
            setBackendLoading(false);
            return;
        }
        try {
            const { movies, shows } = await getEnrichedMediaFromBackend();
            setBackendMovies(movies);
            setBackendShows(shows);
        } catch (e) {
            console.error("Failed to load data from custom backend", e);
        } finally {
            setBackendLoading(false);
        }
    };
    fetchBackendData();
  }, [isApiKeyMissing]);
  
  const backendCarouselProps = useMemo(() => ({
    onSelectShow: onSelectShow,
    onOpenAddToListModal: onOpenAddToListModal,
    onMarkShowAsWatched: onMarkShowAsWatched,
    onToggleFavoriteShow: onToggleFavoriteShow,
    favorites: favorites,
    completed: userData.completed,
    onUpdateLists: onUpdateLists,
  }), [onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData.completed, onUpdateLists]);

  const trackedShowsForNewSeasons = useMemo(() => {
    const allItems = new Map<number, TrackedItem>();
    [...userData.watching, ...userData.onHold].forEach(item => {
        if (item.media_type === 'tv' && !allItems.has(item.id)) {
            allItems.set(item.id, item);
        }
    });
    userData.customLists.forEach(list => {
        list.items.forEach(item => {
            if (item.media_type === 'tv' && !allItems.has(item.id)) {
                allItems.set(item.id, item as TrackedItem);
            }
        });
    });
    return Array.from(allItems.values());
  }, [userData.watching, userData.onHold, userData.customLists]);

  const recommendationSeedItems = useMemo(() => {
    return [...userData.watching].filter(item => {
        const progress = userData.watchProgress[item.id];
        return progress && Object.keys(progress).length > 0 && !userData.onHold.some(onHoldItem => onHoldItem.id === item.id);
    });
  }, [userData.watching, userData.watchProgress, userData.onHold]);

  return (
    <div className="animate-fade-in space-y-8">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <DateTimeDisplay timezone={timezone} timeFormat={timeFormat} />
      
      {shortcutSettings.show && (
          <ShortcutNavigation 
            onShortcutNavigate={onShortcutNavigate} 
            selectedTabs={shortcutSettings.tabs}
          />
      )}
      
      <StatsWidget userData={userData} genres={genres} />

      {backendLoading && (
        <div className="px-6 mb-8">
            <div className="h-8 w-1/2 bg-bg-secondary rounded-md mb-4 animate-pulse"></div>
            <div className="flex space-x-4 overflow-x-hidden">
                {[...Array(5)].map((_, i) => <div key={i} className="w-72 h-48 bg-bg-secondary rounded-lg flex-shrink-0 animate-pulse"></div>)}
            </div>
        </div>
      )}
      {!backendLoading && backendMovies.length > 0 && (
          <GenericCarousel 
              title="Featured Movies"
              fetcher={() => Promise.resolve(backendMovies)}
              {...backendCarouselProps}
          />
      )}
      {!backendLoading && backendShows.length > 0 && (
          <GenericCarousel 
              title="Featured TV Shows"
              fetcher={() => Promise.resolve(backendShows)}
              {...backendCarouselProps}
          />
      )}

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
        trackedShowsForNewSeasons.length > 0 ? (
            <NewSeasons 
                title="New Seasons From Your Lists" 
                onSelectShow={onSelectShow} 
                trackedShows={trackedShowsForNewSeasons} 
                watchProgress={userData.watchProgress} 
                timezone={timezone} 
            />
        ) : (
            <div className="px-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">New Seasons From Your Lists</h2>
                <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center">
                    <p className="text-text-secondary">This section is personalized! Add TV shows to your "Watching" list or custom lists to see upcoming seasons here.</p>
                </div>
            </div>
        )
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
          reminders={reminders}
          onToggleReminder={onToggleReminder}
          onUpdateLists={onUpdateLists}
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
