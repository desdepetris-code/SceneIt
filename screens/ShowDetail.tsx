import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, getShowAggregateCredits, clearMediaCache } from '../services/tmdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, WatchProviderResponse, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, EpisodeRatings, Comment, SeasonRatings, PublicUser, Note, EpisodeProgress, UserData, AppPreferences, Follows, CommentVisibility, WeeklyPick } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, CalendarIcon, LogWatchIcon, PencilSquareIcon, PhotoIcon, BadgeIcon, VideoCameraIcon, SparklesIcon, QuestionMarkCircleIcon, TrophyIcon, InformationCircleIcon, UsersIcon } from '../components/Icons';
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
import UserRatingStamp from '../components/UserRatingStamp';
import { getDominantColor, mixColors } from '../utils/colorUtils';
import { getAiredEpisodeCount } from '../utils/formatUtils';

interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[], onHold: TrackedItem[], dropped: TrackedItem[], allCaughtUp: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  weeklyFavorites: WeeklyPick[];
  weeklyFavoritesHistory?: Record<string, WeeklyPick[]>;
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
  onOpenCustomListModal: (item: any) => void;
  ratings: UserRatings;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: any, date?: string) => void;
  onUnmarkMovieWatched: (mediaId: number, deleteLive?: boolean) => void;
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
  onAddWatchHistoryBulk: (item: TrackedItem, episodeIds: number[], timestamp: string, note: string) => void;
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
  preferences: AppPreferences;
  follows: Follows;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  onAuthClick: () => void;
}

type TabType = 'seasons' | 'info' | 'cast' | 'discussion' | 'media' | 'recs' | 'customize' | 'achievements';

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
  const { 
    id, mediaType, onBack, watchProgress, history, trackedLists, onUpdateLists, customImagePaths, 
    favorites, onToggleFavoriteShow, onRateItem, ratings, showRatings, currentUser, customLists, 
    episodeRatings, favoriteEpisodes, comments, seasonRatings, genres, mediaNotes = {}, onSaveMediaNote, 
    weeklyFavorites, onToggleWeeklyFavorite, allUserData, episodeNotes, preferences, follows,
    onMarkMediaAsWatched, onAddWatchHistory, onStartLiveWatch, onUnmarkAllWatched, onMarkAllWatched,
    onRateEpisode, onToggleFavoriteEpisode, onSaveComment, onMarkPreviousEpisodesWatched,
    onMarkSeasonWatched, onUnmarkSeasonWatched, onSaveEpisodeNote, onRateSeason, onOpenAddToListModal,
    onSelectShow, onSelectPerson, onDeleteHistoryItem, onClearMediaHistory, pausedLiveSessions, onAuthClick
  } = props;
  
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

  const [selectedJournalEpisode, setSelectedJournalEpisode] = useState<{ season: number; ep: Episode } | null>(null);
  const [selectedRatingEpisode, setSelectedRatingEpisode] = useState<Episode | null>(null);
  const [selectedCommentEpisode, setSelectedCommentEpisode] = useState<Episode | null>(null);

  const backdropUrl = customImagePaths[id]?.backdrop_path 
    ? getImageUrl(customImagePaths[id].backdrop_path, 'w1280', 'backdrop')
    : getImageUrl(details?.backdrop_path, 'w1280', 'backdrop');
  
  const posterUrl = customImagePaths[id]?.poster_path
    ? getImageUrl(customImagePaths[id].poster_path, 'w500', 'poster')
    : getImageUrl(details?.poster_path, 'w500', 'poster');

  useEffect(() => {
    if (!details) return;
    let isMounted = true;
    const originalStyles = {
        primary: document.documentElement.style.getPropertyValue('--color-accent-primary'),
        secondary: document.documentElement.style.getPropertyValue('--color-accent-secondary'),
        gradient: document.documentElement.style.getPropertyValue('--accent-gradient'),
    };

    const applyChameleon = async () => {
        const colors = await getDominantColor(backdropUrl);
        if (!colors || !isMounted) return;
        const { primary, secondary } = colors;
        const root = document.documentElement;
        root.style.setProperty('--color-accent-primary', primary);
        root.style.setProperty('--color-accent-secondary', secondary);
        root.style.setProperty('--accent-gradient', `linear-gradient(to right, ${primary}, ${secondary})`);
    };

    applyChameleon();

    return () => {
        isMounted = false;
        const root = document.documentElement;
        root.style.setProperty('--color-accent-primary', originalStyles.primary);
        root.style.setProperty('--color-accent-secondary', originalStyles.secondary);
        root.style.setProperty('--accent-gradient', originalStyles.gradient);
    };
  }, [details, backdropUrl, posterUrl]);

  const tabs: { id: TabType, label: string, icon: any }[] = useMemo(() => [
    ...(mediaType === 'tv' ? [{ id: 'seasons', label: 'Seasons', icon: ListBulletIcon }] as any : []),
    { id: 'info', label: 'Info', icon: BookOpenIcon },
    { id: 'cast', label: 'Cast and Crew', icon: UsersIcon },
    { id: 'discussion', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
    { id: 'media', label: 'Gallery', icon: VideoCameraIcon },
    { id: 'recs', label: 'Recs', icon: SparklesIcon },
    { id: 'customize', label: 'Customize', icon: PhotoIcon },
    { id: 'achievements', label: 'Badges', icon: BadgeIcon },
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id, mediaType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
      clearMediaCache(id, mediaType);
      await fetchData();
  };

  const handleToggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) setExpandedSeason(null);
    else {
      setExpandedSeason(seasonNumber);
      if (!seasonDetailsMap[seasonNumber]) {
        try {
          const sd = await getSeasonDetails(id, seasonNumber);
          setSeasonDetailsMap(prev => ({ ...prev, [seasonNumber]: sd }));
        } catch (e) { console.error(e); }
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

  const showStatus = useMemo(() => details ? getShowStatus(details) : null, [details]);

  const handleLogWatchSave = async (data: { date: string; note: string; scope: LogWatchScope; selectedEpisodeIds?: number[] }) => {
    const showTitle = details?.title || details?.name || 'Unknown Show';
    if (mediaType === 'movie' || data.scope === 'single') {
        onMarkMediaAsWatched(details, data.date);
        return;
    }

    if (!data.selectedEpisodeIds || data.selectedEpisodeIds.length === 0) {
        confirmationService.show("No content selected to log.");
        return;
    }

    confirmationService.show(`Logging ${data.selectedEpisodeIds.length} episodes for "${showTitle}"...`);
    
    try {
        const showInfo: TrackedItem = { id: details!.id, title: showTitle, media_type: 'tv', poster_path: details!.poster_path };
        
        for (const season of (details!.seasons || [])) {
            if (season.season_number === 0) continue;
            const sd = await getSeasonDetails(details!.id, season.season_number);
            for (const ep of sd.episodes) {
                if (data.selectedEpisodeIds.includes(ep.id)) {
                    onAddWatchHistory(showInfo, ep.season_number, ep.episode_number, data.date, data.note, ep.name);
                }
            }
        }
        confirmationService.show(`Successfully logged selection for "${showTitle}"!`);
    } catch (e) {
        console.error(e);
        confirmationService.show("Bulk logging failed.");
    }
  };

  const handleReportIssue = (option: string) => {
    const subject = `SceneIt Page Change Request: ${details?.title || details?.name} (ID: ${details?.id})`;
    const body = `Issue Type: ${option}\n\nDetails:\n[Please describe the issue here]`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsReportIssueModalOpen(false);
  };

  const handleStartLiveWatch = () => {
    const mediaInfo: LiveWatchMediaInfo = {
      id: details!.id,
      media_type: details!.media_type,
      title: details!.title || details!.name || 'Untitled',
      poster_path: details!.poster_path,
      runtime: details!.runtime || 120,
    };
    onStartLiveWatch(mediaInfo);
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status.includes('Ended')) return 'bg-slate-900 text-slate-300 border-slate-700';
    if (status.includes('Canceled')) return 'bg-blue-900/60 text-blue-200 border-blue-800';
    if (status.includes('in season')) return 'bg-red-900/60 text-red-100 border-red-800';
    if (status.includes('off season') || status.includes('Undetermined') || status.includes('Hiatus')) return 'bg-purple-900/60 text-purple-200 border-purple-800';
    if (status.includes('Upcoming')) return 'bg-teal-900/60 text-teal-100 border-teal-800';
    return 'bg-bg-secondary text-text-secondary border-primary-accent/20';
  }

  const handleJournalOpen = (seasonNum: number, ep: Episode) => {
      setSelectedJournalEpisode({ season: seasonNum, ep });
      setIsJournalModalOpen(true);
  };

  const handleRatingOpen = (ep: Episode) => {
      setSelectedRatingEpisode(ep);
      setIsRatingModalOpen(true);
  };

  const handleCommentOpen = (ep: Episode) => {
      setSelectedCommentEpisode(ep);
      setIsCommentModalOpen(true);
  };

  const handleRatingSave = (rating: number) => {
      if (selectedRatingEpisode) {
          onRateEpisode(id, selectedRatingEpisode.season_number, selectedRatingEpisode.episode_number, rating);
          setSelectedRatingEpisode(null);
      } else {
          onRateItem(id, rating);
      }
  };

  const handleJournalSave = (entry: JournalEntry | null, season: number, episode: number) => {
      props.onSaveJournal(id, season, episode, entry);
      setSelectedJournalEpisode(null);
  };

  const handleCommentSave = (text: string, visibility: CommentVisibility) => {
    const key = selectedCommentEpisode 
        ? `tv-${id}-s${selectedCommentEpisode.season_number}-e${selectedCommentEpisode.episode_number}`
        : mediaKey;
    onSaveComment({ mediaKey: key, text, parentId: null, isSpoiler: false, visibility });
    setSelectedCommentEpisode(null);
    // Switch to discussion tab to show the new comment
    setActiveTab('discussion');
    setActiveCommentThread(selectedCommentEpisode ? key : 'general');
  };

  const handleUnmarkMovie = () => {
    const movieHistory = history.filter(h => h.id === id);
    const hasLiveSessionRecord = movieHistory.some(h => h.logId.startsWith('live-'));
    
    if (hasLiveSessionRecord) {
        if (window.confirm("You have a live watch session record for this movie. Would you like to delete its history and progress as well?\n\nSelecting 'Cancel' will keep your live watch history but remove other manual logs.")) {
            props.onUnmarkMovieWatched(id, true);
        } else {
            props.onUnmarkMovieWatched(id, false);
        }
    } else {
        props.onUnmarkMovieWatched(id, false);
    }
  };

  const handleCommentsAction = () => {
    if (!currentUser) {
        onAuthClick();
        return;
    }
    setSelectedCommentEpisode(null);
    setIsCommentModalOpen(true);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-text-secondary">Loading Cinematic Experience...</div>;
  if (!details) return <div className="p-20 text-center text-red-500">Failed to load content.</div>;

  const userRating = ratings[id]?.rating || 0;
  const isFavorited = favorites.some(f => f.id === id);
  const mediaKey = `${details.media_type}-${details.id}`;
  const hasComment = comments.some(c => c.mediaKey === mediaKey);

  const getLibraryButtonText = () => {
      if (isAllWatched || currentStatus === 'completed') return 'Completed';
      if (currentStatus === 'allCaughtUp') return 'All Caught Up';
      if (currentStatus === 'watching') return 'Watching';
      if (currentStatus === 'planToWatch') return 'Plan to Watch';
      if (currentStatus === 'onHold') return 'On Hold';
      if (currentStatus === 'dropped') return 'Dropped';
      return 'Add to Library';
  };

  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const isWeeklyFavorite = weeklyFavorites.some(p => p.id === id && p.category === mediaType && p.dayIndex === todayIndex);

  return (
    <div className="animate-fade-in relative">
      <RatingModal 
        isOpen={isRatingModalOpen} 
        onClose={() => { setIsRatingModalOpen(false); setSelectedRatingEpisode(null); }} 
        onSave={handleRatingSave} 
        currentRating={selectedRatingEpisode ? (episodeRatings[id]?.[selectedRatingEpisode.season_number]?.[selectedRatingEpisode.episode_number] || 0) : userRating} 
        mediaTitle={selectedRatingEpisode ? `S${selectedRatingEpisode.season_number} E${selectedRatingEpisode.episode_number}: ${selectedRatingEpisode.name}` : (details.title || details.name || '')} 
      />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history.filter(h => h.id === id)} mediaTitle={details.title || details.name || ''} mediaDetails={details} onDeleteHistoryItem={onDeleteHistoryItem} onClearMediaHistory={onClearMediaHistory} />
      <NominationModal 
        isOpen={isNominationModalOpen} onClose={() => setIsNominationModalOpen(false)} item={details as any} 
        category={mediaType} onNominate={onToggleWeeklyFavorite} currentPicks={weeklyFavorites} 
      />
      <MarkAsWatchedModal 
        isOpen={isLogWatchModalOpen} onClose={() => setIsLogWatchModalOpen(false)} mediaTitle={details.title || details.name || ''} 
        onSave={handleLogWatchSave} initialScope={mediaType === 'tv' ? 'show' : 'single'} mediaType={mediaType} showDetails={details}
      />
      <ImageSelectorModal isOpen={isPosterSelectorOpen} onClose={() => setIsPosterSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="posters" />
      <ImageSelectorModal isOpen={isBackdropSelectorOpen} onClose={() => setIsBackdropSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="backdrops" />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} onSave={(notes) => onSaveMediaNote(id, notes)} mediaTitle={details.title || details.name || ''} initialNotes={mediaNotes[id] || []} />
      <JournalModal 
        isOpen={isJournalModalOpen} 
        onClose={() => { setIsJournalModalOpen(false); setSelectedJournalEpisode(null); }} 
        onSave={handleJournalSave} 
        mediaDetails={details} 
        initialSeason={selectedJournalEpisode?.season}
        initialEpisode={selectedJournalEpisode?.ep}
        watchProgress={watchProgress} 
      />
      <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} onUpdateList={(newList) => { onUpdateLists(details as any, currentStatus, newList as WatchStatus); }} currentList={currentStatus} customLists={customLists} mediaType={mediaType} />
      <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)} onSelect={handleReportIssue} options={["Wrong Details", "Insufficient Info", "Incorrect Poster", "Missing Content", "Other Error"]} />
      <CommentModal 
        isOpen={isCommentModalOpen} 
        onClose={() => { setIsCommentModalOpen(false); setSelectedCommentEpisode(null); }} 
        mediaTitle={selectedCommentEpisode ? `S${selectedCommentEpisode.season_number} E${selectedCommentEpisode.episode_number}: ${selectedCommentEpisode.name}` : (details.title || details.name || '')} 
        onSave={handleCommentSave} 
      />
      
      <EpisodeDetailModal 
        isOpen={!!selectedEpisodeForDetail} onClose={() => setSelectedEpisodeForDetail(null)} episode={selectedEpisodeForDetail} showDetails={details} 
        seasonDetails={seasonDetailsMap[selectedEpisodeForDetail?.season_number || 0] || { episodes: [] }} isWatched={watchProgress[id]?.[selectedEpisodeForDetail?.season_number || 0]?.[selectedEpisodeForDetail?.episode_number || 0]?.status === 2}
        onToggleWatched={() => selectedEpisodeForDetail && props.onToggleEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number, watchProgress[id]?.[selectedEpisodeForDetail.season_number]?.[selectedEpisodeForDetail.episode_number]?.status || 0, details as any, selectedEpisodeForDetail.name, selectedEpisodeForDetail.still_path, seasonDetailsMap[selectedEpisodeForDetail.season_number]?.poster_path)}
        onOpenJournal={() => selectedEpisodeForDetail && handleJournalOpen(selectedEpisodeForDetail.season_number, selectedEpisodeForDetail)} isFavorited={!!props.favoriteEpisodes[id]?.[selectedEpisodeForDetail?.season_number || 0]?.[selectedEpisodeForDetail?.episode_number || 0]}
        onToggleFavorite={() => selectedEpisodeForDetail && props.onToggleFavoriteEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number)}
        onStartLiveWatch={handleStartLiveWatch} onSaveJournal={handleJournalSave} watchProgress={watchProgress} onNext={() => {}} onPrevious={() => {}} onAddWatchHistory={onAddWatchHistory} onRate={() => selectedEpisodeForDetail && handleRatingOpen(selectedEpisodeForDetail)} episodeRating={selectedEpisodeForDetail ? episodeRatings[id]?.[selectedRatingEpisode.season_number]?.[selectedRatingEpisode.episode_number] || 0 : 0}
        onDiscuss={() => selectedEpisodeForDetail && handleCommentOpen(selectedEpisodeForDetail)} showRatings={showRatings} episodeNotes={episodeNotes} preferences={preferences}
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
              <UserRatingStamp rating={userRating} size="lg" className="absolute -top-4 -left-4" />
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
                <span className="uppercase tracking-widest">{getLibraryButtonText()}</span>
                <ChevronDownIcon className="w-5 h-5 text-text-secondary" />
              </button>
              
              <div className="grid grid-cols-4 gap-2">
                {mediaType === 'tv' ? (
                  <DetailedActionButton 
                      label={isAllWatched ? "Unmark All" : "Mark All"}
                      className="col-span-2"
                      isActive={isAllWatched}
                      icon={isAllWatched ? <XMarkIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />} 
                      onClick={() => isAllWatched ? onUnmarkAllWatched(id) : onMarkAllWatched(id, details as any)} 
                  />
                ) : (
                  <DetailedActionButton 
                      label={currentStatus === 'completed' ? "Unmark Watched" : "Mark Watched"} 
                      className="col-span-2"
                      isActive={currentStatus === 'completed'}
                      icon={currentStatus === 'completed' ? <XMarkIcon className="w-6 h-6" /> : <CheckCircleIcon className="w-6 h-6" />} 
                      onClick={() => currentStatus === 'completed' ? handleUnmarkMovie() : onMarkMediaAsWatched(details)} 
                  />
                )}
                <DetailedActionButton 
                    label="Weekly Gem" 
                    icon={<TrophyIcon className="w-6 h-6" />} 
                    isActive={isWeeklyFavorite}
                    onClick={() => setIsNominationModalOpen(true)} 
                />
                <DetailedActionButton 
                    label="Favorite" 
                    icon={<HeartIcon filled={isFavorited} className="w-6 h-6" />} 
                    isActive={isFavorited}
                    onClick={() => onToggleFavoriteShow(details as any)} 
                />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <DetailedActionButton label="Rate" icon={<StarIcon filled={userRating > 0} className="w-6 h-6" />} onClick={() => setIsRatingModalOpen(true)} />
                <DetailedActionButton label="History" icon={<ClockIcon className="w-6 h-6" />} onClick={() => setIsHistoryModalOpen(true)} />
                <DetailedActionButton label="Add to List" icon={<ListBulletIcon className="w-6 h-6" />} onClick={() => onOpenAddToListModal(details)} />
                <DetailedActionButton label="Comments" icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />} isActive={hasComment} onClick={handleCommentsAction} />

                {mediaType === 'tv' ? (
                  <>
                    <DetailedActionButton label="Journal" icon={<BookOpenIcon className="w-6 h-6" />} onClick={() => setIsJournalModalOpen(true)} />
                    <DetailedActionButton label="Notes" icon={<PencilSquareIcon className="w-6 h-6" />} onClick={() => setIsNotesModalOpen(true)} />
                    <DetailedActionButton label="Refresh" icon={<ArrowPathIcon className="w-6 h-6" />} onClick={handleRefresh} />
                    <DetailedActionButton label="Log a Watch" icon={<LogWatchIcon className="w-6 h-6" />} onClick={() => setIsLogWatchModalOpen(true)} />
                  </>
                ) : (
                  <>
                    <DetailedActionButton label="Log Watch" icon={<LogWatchIcon className="w-6 h-6" />} onClick={() => setIsLogWatchModalOpen(true)} />
                    <DetailedActionButton label="Live Watch" icon={<PlayCircleIcon className="w-6 h-6" />} onClick={handleStartLiveWatch} />
                    <DetailedActionButton label="Journal" icon={<BookOpenIcon className="w-6 h-6" />} onClick={() => setIsJournalModalOpen(true)} />
                    <DetailedActionButton label="Notes" icon={<PencilSquareIcon className="w-6 h-6" />} onClick={() => setIsNotesModalOpen(true)} />
                  </>
                )}
                <DetailedActionButton label="Refresh" icon={<ArrowPathIcon className="w-6 h-6" />} onClick={handleRefresh} />
                <DetailedActionButton label="Report Issue" icon={<QuestionMarkCircleIcon className="w-6 h-6" />} onClick={() => setIsReportIssueModalOpen(true)} />
              </div>
            </div>
          </div>

          <div className="flex-grow space-y-8 min-w-0">
            <header>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {showStatus && <span className={`px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadgeStyle(showStatus.text)}`}>{showStatus.text}</span>}
                <span className="text-text-secondary font-bold flex items-center">
                    <span className="mx-1"> • </span>
                    <span className="mx-1">{details.genres?.slice(0, 3).map(g => g.name.toLowerCase()).join(', ')}</span>
                    <span className="mx-1"> • </span>
                    <span className="mx-1">{details.release_date?.substring(0, 4) || details.first_air_date?.substring(0, 4)}</span>
                </span>
                {mediaType === 'tv' && (
                  <button onClick={() => setIsDescriptionModalOpen(true)} className="ml-auto group flex items-center space-x-2 text-primary-accent hover:text-primary-accent/80 transition-colors bg-primary-accent/10 px-4 py-1.5 rounded-full border border-primary-accent/20">
                    <InformationCircleIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">Show Description</span>
                  </button>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-4">{details.title || details.name}</h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-3xl italic line-clamp-2">"{details.tagline || details.overview}"</p>
            </header>

            {nextEpisodeToWatch && (
              <section className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4 flex items-center"><PlayCircleIcon className="w-6 h-6 mr-2 text-primary-accent" />Continue Journey</h2>
                <NextUpWidget {...props} details={details} showId={id} nextEpisodeToWatch={nextEpisodeToWatch} onOpenJournal={handleJournalOpen} onOpenCommentModal={handleCommentOpen} onSelectShow={onSelectShow} />
              </section>
            )}

            {mediaType === 'tv' && <OverallProgress details={details} watchProgress={watchProgress} />}

            <div className="border-b border-primary-accent/10 sticky top-16 bg-bg-primary/80 backdrop-blur-md z-20 -mx-4 px-4 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-8 whitespace-nowrap min-w-max">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                    <span className="flex items-center gap-2"><tab.icon className="w-4 h-4" />{tab.label}</span>
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
                        key={season.id} season={season} showId={id} isExpanded={expandedSeason === season.season_number} onToggle={() => handleToggleSeason(season.season_number)} 
                        seasonDetails={seasonDetailsMap[season.season_number]} watchProgress={watchProgress} onToggleEpisode={props.onToggleEpisode} onMarkPreviousEpisodesWatched={onMarkPreviousEpisodesWatched} 
                        onOpenJournal={handleJournalOpen} onOpenEpisodeDetail={setSelectedEpisodeForDetail} showPosterPath={details.poster_path} onMarkSeasonWatched={onMarkSeasonWatched} onUnmarkSeasonWatched={onUnmarkSeasonWatched} 
                        showDetails={details} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={onToggleFavoriteEpisode} onStartLiveWatch={onStartLiveWatch} onSaveJournal={handleJournalSave} episodeRatings={episodeRatings} 
                        onOpenEpisodeRatingModal={handleRatingOpen} onAddWatchHistory={onAddWatchHistory} onOpenCommentModal={handleCommentOpen} comments={comments} onImageClick={(src) => {}} onSaveEpisodeNote={onSaveEpisodeNote} 
                        showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={onRateSeason} episodeNotes={episodeNotes} preferences={preferences}
                      />
                   ))}
                </div>
              )}
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-8"><section><h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4">Overview</h2><p className="text-text-secondary leading-relaxed">{details.overview}</p></section><WhereToWatch providers={providers} /></div>
                   <MoreInfo details={details} onSelectShow={onSelectShow} />
                </div>
              )}
              {activeTab === 'cast' && <CastAndCrew aggregateCredits={aggregateCredits} tmdbCredits={details.credits} onSelectPerson={onSelectPerson} />}
              {activeTab === 'discussion' && (
                <CommentsTab 
                  details={details} 
                  comments={comments} 
                  currentUser={currentUser} 
                  allUsers={props.allUsers} 
                  seasonDetailsMap={seasonDetailsMap} 
                  onFetchSeasonDetails={handleToggleSeason as any} 
                  onSaveComment={onSaveComment} 
                  onToggleLikeComment={() => {}} 
                  onDeleteComment={() => {}} 
                  activeThread={activeCommentThread} 
                  setActiveThread={setActiveCommentThread} 
                  follows={follows} 
                />
              )}
              {activeTab === 'recs' && <div className="space-y-12">{details.belongs_to_collection && <MovieCollection collectionId={details.belongs_to_collection.id} currentMovieId={id} onSelectMovie={(mid) => onSelectShow(mid, 'movie')} />}<RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} /></div>}
              {activeTab === 'customize' && <div className="space-y-4"><h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Customize</h2><CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenPosterSelector={() => setIsPosterSelectorOpen(true)} onOpenBackdropSelector={() => setIsBackdropSelectorOpen(true)} /></div>}
              {activeTab === 'achievements' && <ShowAchievementsTab details={details} userData={allUserData} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;