import React, { useState, useMemo, useEffect } from 'react';
import { UserData, TmdbMedia, WatchStatus, CustomList, LiveWatchMediaInfo, TrackedItem, Reminder, ShortcutSettings, AppPreferences } from '../types';
import HeroBanner from '../components/HeroBanner';
import ShortcutNavigation from '../components/ShortcutNavigation';
import ContinueWatching from '../components/ContinueWatching';
import NewSeasons from '../components/NewSeasons';
import { discoverMedia } from '../services/tmdbService';
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
import UpcomingMoviesCarousel from '../components/UpcomingMoviesCarousel';
import { getEnrichedMediaFromBackend } from '../services/backendService';

interface DashboardProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
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
  shortcutSettings: ShortcutSettings;
  preferences: AppPreferences;
  onRemoveWeeklyPick: (pick: any) => void;
  onOpenNominateModal: () => void;
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center">
        <h3 className="font-bold text-lg">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm">The content carousels on this page cannot be loaded.</p>
    </div>
);

interface DiscoverContentProps extends Pick<DashboardProps, 'onSelectShow' | 'onOpenAddToListModal' | 'onMarkShowAsWatched' | 'onToggleFavoriteShow' | 'favorites' | 'userData' | 'timezone' | 'onShortcutNavigate' | 'genres' | 'reminders' | 'onToggleReminder' | 'onUpdateLists' | 'preferences'> {}

const DiscoverContent: React.FC<DiscoverContentProps> = 
({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData, timezone, onShortcutNavigate, genres, reminders, onToggleReminder, onUpdateLists, preferences }) => {
    const carouselProps = { onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed: userData.completed, onUpdateLists };

    return (
        <div className="space-y-8">
          {preferences.dashShowUpcoming && (
            <><UpcomingPremieresCarousel title="📺 Upcoming TV Premieres" {...carouselProps} reminders={reminders} onToggleReminder={onToggleReminder} onViewMore={() => onShortcutNavigate('calendar')} />
            <UpcomingMoviesCarousel title="🎬 Upcoming Movie Releases" {...carouselProps} reminders={reminders} onToggleReminder={onToggleReminder} onViewMore={() => onShortcutNavigate('calendar')} /></>
          )}
          {preferences.dashShowTrending && (
            <><NewReleases mediaType="movie" title="🍿 New Popular Movie Releases" {...carouselProps} timezone={timezone} onViewMore={() => onShortcutNavigate('allNewReleases')} />
            <NewlyPopularEpisodes onSelectShow={onSelectShow} onViewMore={() => onShortcutNavigate('allNewlyPopularEpisodes')} />
            <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" {...carouselProps} onViewMore={() => onShortcutNavigate('allTrendingTV')} />
            <TrendingSection mediaType="movie" title="🔥 Trending Movies" {...carouselProps} onViewMore={() => onShortcutNavigate('allTrendingMovies')} /></>
          )}
          {preferences.dashShowRecommendations && (
            <><GenericCarousel title="💥 Top Rated Action & Adventure" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300, genre: '28|12' })} {...carouselProps} onViewMore={() => onShortcutNavigate('allTopRated')} />
            <GenericCarousel title="🎭 Binge-Worthy TV Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', genre: 18, vote_count_gte: 100 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allBingeWorthy')} />
            <GenericCarousel title="💎 Hidden Gems" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 20, vote_count_lte: 400 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allHiddenGems')} />
            <GenericCarousel title="😂 Top Comedy Shows" fetcher={() => discoverMedia('tv', { genre: 35, sortBy: 'popularity.desc', vote_count_gte: 100 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allTopComedy')} />
            <GenericCarousel title="🤠 For Western Fans" fetcher={() => discoverMedia('movie', { genre: 37, sortBy: 'popularity.desc' })} {...carouselProps} onViewMore={() => onShortcutNavigate('allWestern')} />
            <GenericCarousel title="🚀 Sci-Fi Universe" fetcher={async () => { const [movies, tv] = await Promise.all([discoverMedia('movie', { genre: 878, sortBy: 'popularity.desc' }), discoverMedia('tv', { genre: 10765, sortBy: 'popularity.desc' })]); return [...movies, ...tv].sort((a,b) => (b.popularity || 0) - (a.popularity || 0)); }} {...carouselProps} onViewMore={() => onShortcutNavigate('allSciFi')} /></>
          )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({
    userData, onSelectShow, onSelectShowInModal, watchProgress, onToggleEpisode, onShortcutNavigate, onOpenAddToListModal, setCustomLists,
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, onToggleFavoriteShow, favorites, pausedLiveSessions, timezone, genres, timeFormat,
    reminders, onToggleReminder, onUpdateLists, shortcutSettings, preferences, onRemoveWeeklyPick, onOpenNominateModal
}) => {
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';
  const [backendMovies, setBackendMovies] = useState<TmdbMedia[]>([]);
  const [backendShows, setBackendShows] = useState<TmdbMedia[]>([]);
  const [backendLoading, setBackendLoading] = useState(true);

  useEffect(() => {
    const fetchBackendData = async () => {
        if (isApiKeyMissing) { setBackendLoading(false); return; }
        try {
            const { movies, shows } = await getEnrichedMediaFromBackend();
            setBackendMovies(movies);
            setBackendShows(shows);
        } catch (e) { console.error(e); } finally { setBackendLoading(false); }
    };
    fetchBackendData();
  }, [isApiKeyMissing]);
  
  const carouselProps = useMemo(() => ({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed: userData.completed, onUpdateLists }), [onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData.completed, onUpdateLists]);

  const recommendationSeedItems = useMemo(() => {
    return [...userData.watching].filter(item => {
        const progress = userData.watchProgress[item.id];
        return progress && Object.keys(progress).length > 0 && !userData.onHold.some(onHoldItem => onHoldItem.id === item.id);
    });
  }, [userData.watching, userData.watchProgress, userData.onHold]);

  const trackedShowsForNewSeasons = useMemo(() => {
    const allItems = new Map<number, TrackedItem>();
    [...userData.watching, ...userData.onHold].forEach(item => { if (item.media_type === 'tv') allItems.set(item.id, item); });
    userData.customLists.forEach(list => { list.items.forEach(item => { if (item.media_type === 'tv') allItems.set(item.id, item as TrackedItem); }); });
    return Array.from(allItems.values());
  }, [userData.watching, userData.onHold, userData.customLists]);

  return (
    <div className="animate-fade-in space-y-8">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <DateTimeDisplay timezone={timezone} timeFormat={timeFormat} />
      {shortcutSettings.show && <ShortcutNavigation onShortcutNavigate={onShortcutNavigate} selectedTabs={shortcutSettings.tabs} />}
      {preferences.dashShowStats && <StatsWidget userData={userData} genres={genres} />}
      {!backendLoading && backendMovies.length > 0 && <GenericCarousel title="Featured Movies" fetcher={() => Promise.resolve(backendMovies)} {...carouselProps} />}
      {!backendLoading && backendShows.length > 0 && <GenericCarousel title="Featured TV Shows" fetcher={() => Promise.resolve(backendShows)} {...carouselProps} />}
      {preferences.dashShowLiveWatch && (
          <section className="px-6">
            {liveWatchMedia ? <LiveWatchControls mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={onLiveWatchTogglePause} onStop={onLiveWatchStop} isDashboardWidget={true} /> : <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center"><h3 className="text-xl font-bold text-text-primary">No Live Session Active</h3><p className="text-text-secondary mt-2">Start a session from any page.</p></div>}
          </section>
      )}
      {preferences.dashShowContinueWatching && <ContinueWatching watching={userData.watching} onHold={userData.onHold} watchProgress={watchProgress} history={userData.history} onSelectShow={onSelectShow} onToggleEpisode={onToggleEpisode} pausedLiveSessions={pausedLiveSessions} />}
      
      {preferences.dashShowNewSeasons && !isApiKeyMissing && (
        trackedShowsForNewSeasons.length > 0 ? (
          <NewSeasons title="New Seasons From Your Lists" onSelectShow={onSelectShow} trackedShows={trackedShowsForNewSeasons} watchProgress={userData.watchProgress} timezone={timezone} />
        ) : (
          <div className="px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">New Seasons</h2>
            <div className="bg-card-gradient rounded-lg shadow-md p-6 text-center">
              <p className="text-text-secondary">Track shows to see upcoming seasons here.</p>
            </div>
          </div>
        )
      )}

      {preferences.dashShowRecommendations && !isApiKeyMissing && recommendationSeedItems.length > 0 && <RelatedRecommendations seedItems={recommendationSeedItems} userData={userData} {...carouselProps} />}
      
      {preferences.dashShowPlanToWatch && (
        <PlanToWatch items={userData.planToWatch} onSelectShow={onSelectShow} />
      )}

      {!isApiKeyMissing && <DiscoverContent onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} favorites={favorites} userData={userData} timezone={timezone} onShortcutNavigate={onShortcutNavigate} genres={genres} reminders={reminders} onToggleReminder={onToggleReminder} onUpdateLists={onUpdateLists} preferences={preferences} />}
      {!isApiKeyMissing && <MyListSuggestions userData={userData} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} />}
      {isApiKeyMissing && <ApiKeyWarning />}
    </div>
  );
};

export default Dashboard;