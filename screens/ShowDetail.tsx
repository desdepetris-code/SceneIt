
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, getShowAggregateCredits, clearMediaCache } from '../services/tmdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, WatchProviderResponse, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, EpisodeRatings, Comment, SeasonRatings, PublicUser, Note, EpisodeProgress, UserData } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, CalendarIcon, LogWatchIcon, PencilSquareIcon, PhotoIcon, BadgeIcon, VideoCameraIcon, SparklesIcon, QuestionMarkCircleIcon, TrophyIcon, InformationCircleIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from '../components/FallbackImage';
import SeasonAccordion from '../components/SeasonAccordion';
import NextUpWidget from '../components/NextUpWidget';
import HistoryModal from '../components/HistoryModal';
import RatingModal from '../components/RatingModal';
import EpisodeDetailModal from '../components/EpisodeDetailModal';
import OverallProgress from '../components/OverallProgress';
import ScoreStar from '../components/ScoreStar';
import { getShowStatus } from '../utils/statusUtils';
import CastAndCrew from '../components/CastAndCrew';
import MoreInfo from '../components/MoreInfo';
import WhereToWatch from '../components/WhereToWatch';
import RecommendedMedia from '../components/RecommendedMedia';
import CustomizeTab from '../components/CustomizeTab';
import ImageSelectorModal from '../components/ImageSelectorModal';
import ShowAchievementsTab from '../components/ShowAchievementsTab';
import CommentsTab from '../components/CommentsTab';
import MarkAsWatchedModal, { LogWatchScope } from '../components/MarkAsWatchedModal';
import MovieCollection from '../components/MovieCollection';
import NotesModal from '../components/NotesModal';
import JournalModal from '../components/JournalModal';
import WatchlistModal from '../components/WatchlistModal';
import ReportIssueModal from '../components/ReportIssueModal';
import CommentModal from '../components/CommentModal';
import { confirmationService } from '../services/confirmationService';
import NominationModal from '../components/NominationModal';

interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[], onHold: TrackedItem[], dropped: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  weeklyFavorites: any[];
  weeklyFavoritesHistory?: Record<string, any[]>;
  onToggleWeeklyFavorite: (item: any, replacementId?: number) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
  onOpenCustomListModal: (item: any) => void;
  ratings: UserRatings;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: any, date?: string) => void;
  onUnmarkMovieWatched: (mediaId: number) => void;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onSelectPerson: (personId: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onClearMediaHistory: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  episodeRatings: EpisodeRatings;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onSaveComment: (commentData: any) => void;
  comments: Comment[];
  genres: Record<number, string>;
  onMarkAllWatched: (showId: number, showInfo: TrackedItem) => void;
  onUnmarkAllWatched: (showId: number) => void;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  customLists: CustomList[];
  currentUser: any;
  allUsers: PublicUser[];
  mediaNotes?: Record<number, Note[]>;
  onSaveMediaNote: (mediaId: number, notes: Note[]) => void;
  allUserData: UserData;
  episodeNotes?: Record<number, Record<number, Record<number, string>>>;
  onOpenAddToListModal: (item: any) => void;
}

type TabType = 'seasons' | 'info' | 'cast' | 'media' | 'customize' | 'achievements' | 'discovery' | 'discussion';

const DetailedActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
}> = ({ icon, label, onClick, className = "", isActive }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all group relative ${className} ${isActive ? 'bg-primary-accent/20 border-primary-accent shadow-[0_0_10px_rgba(var(--color-accent-primary-rgb),0.3)]' : 'border-primary-accent/20 bg-bg-secondary/40 hover:bg-bg-secondary/60 hover:border-primary-accent/50'}`}
  >
    <div className="relative flex items-center justify-center">
        <div className={`transition-colors ${isActive ? 'text-primary-accent' : 'text-text-primary group-hover:text-primary-accent'}`}>
            {icon}
        </div>
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 text-center leading-tight transition-colors ${isActive ? 'text-primary-accent' : 'text-text-secondary group-hover:text-text-primary'}`}>{label}</span>
  </button>
);

const ShowDetail: React.FC<ShowDetailProps> = (props) => {
  const { id, mediaType, onBack, watchProgress, history, trackedLists, onUpdateLists, customImagePaths, favorites, onToggleFavoriteShow, onRateItem, ratings, showRatings, currentUser, customLists, episodeRatings, favoriteEpisodes, comments, seasonRatings, genres, mediaNotes = {}, onSaveMediaNote, weeklyFavorites, onToggleWeeklyFavorite, allUserData, episodeNotes } = props;
  
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
  const [aggregateCredits, setAggregateCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(mediaType === 'tv' ? 'seasons' : 'info');
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonDetailsMap, setSeasonDetailsMap] = useState<Record<number, TmdbSeasonDetails>>({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isPosterSelectorOpen, setIsPosterSelectorOpen] = useState(false);
  const [isBackdropSelectorOpen, setIsBackdropSelectorOpen] = useState(false);
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedEpisodeForDetail, setSelectedEpisodeForDetail] = useState<Episode | null>(null);
  const [activeCommentThread, setActiveCommentThread] = useState('general');
  const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);

  const tabs: { id: TabType, label: string, icon: any }[] = useMemo(() => [
    ...(mediaType === 'tv' ? [{ id: 'seasons', label: 'Seasons', icon: ListBulletIcon }] as any : []),
    { id: 'info', label: 'Info', icon: BookOpenIcon },
    { id: 'cast', label: 'Cast', icon: PlayCircleIcon },
    { id: 'media', label: 'Gallery', icon: VideoCameraIcon },
    { id: 'discovery', label: 'Discovery', icon: SparklesIcon },
    { id: 'customize', label: 'Customize', icon: PhotoIcon },
    { id: 'achievements', label: 'Badges', icon: BadgeIcon },
    { id: 'discussion', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
  ], [mediaType]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mediaDetails, watchProviders] = await Promise.all([
        getMediaDetails(id, mediaType),
        getWatchProviders(id, mediaType)
      ]);
      setDetails(mediaDetails);
      setProviders(watchProviders);

      if (mediaType === 'tv' && mediaDetails.seasons) {
          const firstSeason = mediaDetails.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
              setExpandedSeason(firstSeason.season_number);
              const sd = await getSeasonDetails(id, firstSeason.season_number);
              setSeasonDetailsMap(prev => ({ ...prev, [firstSeason.season_number]: sd }));
          }
          getShowAggregateCredits(id, mediaDetails.seasons).then(setAggregateCredits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
      clearMediaCache(id, mediaType);
      await fetchData();
  };

  const handleToggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
      if (!seasonDetailsMap[seasonNumber]) {
        try {
          const sd = await getSeasonDetails(id, seasonNumber);
          setSeasonDetailsMap(prev => ({ ...prev, [seasonNumber]: sd }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const currentStatus = useMemo(() => {
    for (const [status, list] of Object.entries(trackedLists) as [WatchStatus, TrackedItem[]][]) {
      if (list.some(item => item.id === id)) return status;
    }
    return null;
  }, [trackedLists, id]);

  const isAllWatched = useMemo(() => {
    if (mediaType !== 'tv' || !details?.number_of_episodes) return false;
    const progress = watchProgress[id] || {};
    let watchedCount = 0;
    Object.values(progress).forEach(s => {
      Object.values(s).forEach(e => { if ((e as EpisodeProgress).status === 2) watchedCount++; });
    });
    return watchedCount >= details.number_of_episodes;
  }, [id, mediaType, details, watchProgress]);

  const nextEpisodeToWatch = useMemo(() => {
    if (mediaType !== 'tv' || !details?.seasons) return null;
    const progress = watchProgress[id] || {};
    const sortedSeasons = [...details.seasons].filter(s => s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    for (const season of sortedSeasons) {
      for (let i = 1; i <= season.episode_count; i++) {
        if (progress[season.season_number]?.[i]?.status !== 2) return { seasonNumber: season.season_number, episodeNumber: i };
      }
    }
    return null;
  }, [mediaType, details, watchProgress, id]);

  const backdropUrl = customImagePaths[id]?.backdrop_path 
    ? getImageUrl(customImagePaths[id].backdrop_path, 'w1280', 'backdrop')
    : getImageUrl(details?.backdrop_path, 'w1280', 'backdrop');

  const posterUrl = customImagePaths[id]?.poster_path
    ? getImageUrl(customImagePaths[id].poster_path, 'w500', 'poster')
    : getImageUrl(details?.poster_path, 'w500', 'poster');

  const showStatus = useMemo(() => details ? getShowStatus(details) : null, [details]);

  const ageRating = useMemo(() => {
    if (!details) return null;
    if (mediaType === 'tv') {
      const usRating = details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
      return usRating?.rating || null;
    } else {
      const usRelease = details.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
      const theatrical = usRelease?.release_dates?.find(d => d.certification);
      return theatrical?.certification || null;
    }
  }, [details, mediaType]);

  const getAgeRatingColor = (rating: string) => {
    const r = rating.toUpperCase();
    if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
    if (r === 'TV-Y') return 'bg-[#008000] text-white shadow-md';
    if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black shadow-md';
    if (r === 'PG-13') return 'bg-[#00008B] text-white shadow-md';
    if (r === 'TV-14') return 'bg-[#800000] text-white shadow-md';
    if (r === 'R') return 'bg-[#FF00FF] text-black font-black shadow-md';
    if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-xl';
    return 'bg-stone-500 text-white';
  };

  const isWeeklyFavorite = useMemo(() => {
    return weeklyFavorites.some(p => p.id === id && p.category === mediaType);
  }, [weeklyFavorites, id, mediaType]);

  if (loading) return <div className="p-20 text-center animate-pulse text-text-secondary">Loading Cinematic Experience...</div>;
  if (!details) return <div className="p-20 text-center text-red-500">Failed to load content.</div>;

  const userRating = ratings[id]?.rating || 0;
  const isFavorited = favorites.some(f => f.id === id);

  const handleStartLiveWatch = () => {
    const mediaInfo: LiveWatchMediaInfo = {
      id: details.id,
      media_type: details.media_type,
      title: details.title || details.name || 'Untitled',
      poster_path: details.poster_path,
      runtime: details.runtime || 120,
    };
    props.onStartLiveWatch(mediaInfo);
  };

  const handleNominateGem = (pick: any, replacementId?: number) => {
    onToggleWeeklyFavorite(pick, replacementId);
    setIsNominationModalOpen(false);
  };

  return (
    <div className="animate-fade-in relative">
      <RatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} onSave={(r) => onRateItem(id, r)} currentRating={userRating} mediaTitle={details.title || details.name || ''} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history.filter(h => h.id === id)} mediaTitle={details.title || details.name || ''} mediaDetails={details} onDeleteHistoryItem={props.onDeleteHistoryItem} onClearMediaHistory={props.onClearMediaHistory} />
      <MarkAsWatchedModal 
        isOpen={isLogWatchModalOpen} 
        onClose={() => setIsLogWatchModalOpen(false)} 
        mediaTitle={details.title || details.name || ''} 
        onSave={(data) => props.onMarkMediaAsWatched(details, data.date)} 
        initialScope={mediaType === 'tv' ? 'show' : 'single'}
        mediaType={mediaType}
        showDetails={details}
      />
      <ImageSelectorModal isOpen={isPosterSelectorOpen} onClose={() => setIsPosterSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="posters" />
      <ImageSelectorModal isOpen={isBackdropSelectorOpen} onClose={() => setIsBackdropSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="backdrops" />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} onSave={(notes) => onSaveMediaNote(id, notes)} mediaTitle={details.title || details.name || ''} initialNotes={mediaNotes[id] || []} />
      <JournalModal isOpen={isJournalModalOpen} onClose={() => setIsJournalModalOpen(false)} onSave={(entry) => props.onSaveJournal(id, 0, 0, entry)} mediaDetails={details} watchProgress={watchProgress} />
      <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} onUpdateList={(newList) => { onUpdateLists(details as any, currentStatus, newList as WatchStatus); setIsWatchlistModalOpen(false); }} currentList={currentStatus} customLists={customLists} />
      <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)} onSelect={(o) => {}} options={["Wrong Details", "Other Error"]} />
      <CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} mediaTitle={details.title || details.name || ''} onSave={(text) => props.onSaveComment({ mediaKey: `${details.media_type}-${details.id}`, text, parentId: null, isSpoiler: false })} />
      <NominationModal 
        isOpen={isNominationModalOpen} 
        onClose={() => setIsNominationModalOpen(false)} 
        item={details} 
        category={mediaType} 
        onNominate={handleNominateGem} 
        currentPicks={weeklyFavorites} 
      />

      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
        <img src={backdropUrl} className="w-full h-full object-cover" alt="Backdrop" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent"></div>
        <button onClick={onBack} className="absolute top-6 left-6 p-3 bg-backdrop/50 backdrop-blur-sm rounded-full text-white hover:bg-bg-secondary transition-all z-20">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="relative group">
              <img src={posterUrl} className="rounded-2xl shadow-2xl w-full aspect-[2/3] object-cover border-4 border-bg-primary" alt="Poster" />
              {showRatings && details.vote_average && (
                <div className="absolute -top-4 -right-4">
                  <ScoreStar score={details.vote_average} size="md" />
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <button 
                onClick={() => setIsWatchlistModalOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-lg bg-bg-secondary/40 border border-primary-accent/30 hover:bg-bg-secondary/60 hover:border-primary-accent/50 transition-all text-text-primary shadow-lg group"
              >
                <span className="uppercase tracking-widest">{currentStatus || 'Add to Library'}</span>
                <ChevronDownIcon className="w-5 h-5 text-text-secondary" />
              </button>
              
              <div className="grid grid-cols-4 gap-2">
                <DetailedActionButton 
                    label="Gem" 
                    icon={<TrophyIcon className="w-6 h-6" />} 
                    isActive={isWeeklyFavorite}
                    onClick={() => setIsNominationModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="Favorite" 
                    icon={<HeartIcon filled={isFavorited} className="w-6 h-6" />} 
                    onClick={() => onToggleFavoriteShow(details as any)} 
                />
                <DetailedActionButton 
                    label="Rate" 
                    icon={<StarIcon filled={userRating > 0} className="w-6 h-6" />} 
                    onClick={() => setIsRatingModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="History" 
                    icon={<ClockIcon className="w-6 h-6" />} 
                    onClick={() => setIsHistoryModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="Notes" 
                    icon={<PencilSquareIcon className="w-6 h-6" />} 
                    onClick={() => setIsNotesModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="Journal" 
                    icon={<BookOpenIcon className="w-6 h-6" />} 
                    onClick={() => setIsJournalModalOpen(true)} 
                />
                 <DetailedActionButton 
                    label="Discuss" 
                    icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />} 
                    onClick={() => setIsCommentModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="Refresh" 
                    icon={<ArrowPathIcon className="w-6 h-6" />} 
                    onClick={handleRefresh} 
                />
              </div>
            </div>
          </div>

          <div className="flex-grow space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {showStatus && (
                  <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm bg-bg-secondary text-primary-accent border-primary-accent/20`}>
                    {showStatus.text}
                  </span>
                )}
                {ageRating && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${getAgeRatingColor(ageRating)}`}>
                    {ageRating}
                  </span>
                )}
                <span className="text-text-secondary font-bold flex items-center">
                    <span className="mx-1"> • </span>
                    <span className="mx-1">{details.genres?.slice(0, 3).map(g => g.name.toLowerCase()).join(', ')}</span>
                    <span className="mx-1"> • </span>
                    <span className="mx-1">{details.release_date?.substring(0, 4) || details.first_air_date?.substring(0, 4)}</span>
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-4">{details.title || details.name}</h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-3xl italic line-clamp-2">"{details.tagline || details.overview}"</p>
            </header>

            <div className="border-b border-primary-accent/10 sticky top-16 bg-bg-primary/80 backdrop-blur-md z-20 -mx-4 px-4 hide-scrollbar">
              <div className="flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    <span className="flex items-center gap-2">
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </span>
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-accent rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 min-h-[400px]">
              {activeTab === 'seasons' && mediaType === 'tv' && (
                <div className="space-y-4">
                   {details.seasons?.filter(s => s.season_number > 0).map(season => (
                      <SeasonAccordion 
                        key={season.id} 
                        season={season} 
                        showId={id} 
                        isExpanded={expandedSeason === season.season_number} 
                        onToggle={() => handleToggleSeason(season.season_number)} 
                        seasonDetails={seasonDetailsMap[season.season_number]} 
                        watchProgress={watchProgress} 
                        onToggleEpisode={props.onToggleEpisode} 
                        onMarkPreviousEpisodesWatched={props.onMarkPreviousEpisodesWatched} 
                        onOpenJournal={() => {}} 
                        onOpenEpisodeDetail={setSelectedEpisodeForDetail} 
                        showPosterPath={details.poster_path} 
                        onMarkSeasonWatched={props.onMarkSeasonWatched} 
                        onUnmarkSeasonWatched={props.onUnmarkSeasonWatched} 
                        showDetails={details} 
                        favoriteEpisodes={props.favoriteEpisodes} 
                        onToggleFavoriteEpisode={props.onToggleFavoriteEpisode} 
                        onStartLiveWatch={props.onStartLiveWatch} 
                        onSaveJournal={props.onSaveJournal as any} 
                        episodeRatings={props.episodeRatings} 
                        onOpenEpisodeRatingModal={() => {}} 
                        onAddWatchHistory={props.onAddWatchHistory} 
                        onDiscussEpisode={(s, e) => { setActiveTab('discussion'); setActiveCommentThread(`tv-${id}-s${s}-e${e}`); }} 
                        comments={props.comments} 
                        onImageClick={() => {}} 
                        onSaveEpisodeNote={props.onSaveEpisodeNote} 
                        showRatings={showRatings} 
                        seasonRatings={props.seasonRatings} 
                        onRateSeason={props.onRateSeason} 
                        episodeNotes={episodeNotes}
                      />
                   ))}
                </div>
              )}
              {/* Rest of the tab content... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
