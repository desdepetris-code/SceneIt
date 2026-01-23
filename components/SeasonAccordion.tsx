/**
 * CineMontauge Season Accordion Component
 * Displays episodes with progress tracking and truth overrides.
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, LiveWatchMediaInfo, JournalEntry, FavoriteEpisodes, TrackedItem, EpisodeRatings, EpisodeProgress, Comment, SeasonRatings, Note } from '../types';
import { ChevronDownIcon, CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, ClockIcon, LogWatchIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, PencilSquareIcon, InformationCircleIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import MarkAsWatchedModal, { LogWatchScope } from './MarkAsWatchedModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { confirmationService } from '../services/confirmationService';
import NotesModal from './NotesModal';
import ScoreStar from './ScoreStar';
import RatingModal from './RatingModal';
import { getSeasonDetails } from '../services/tmdbService';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';

interface SeasonAccordionProps {
  season: TmdbMediaDetails['seasons'][0];
  showId: number;
  isExpanded: boolean;
  onToggle: () => void;
  seasonDetails: TmdbSeasonDetails | undefined;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  onOpenJournal: (season: number, episode: Episode) => void;
  onOpenEpisodeDetail: (episode: Episode) => void;
  showPosterPath: string | null | undefined;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  showDetails: TmdbMediaDetails;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  episodeRatings: EpisodeRatings;
  onOpenEpisodeRatingModal: (episode: Episode) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  isCollapsible?: boolean;
  onDiscussEpisode: (seasonNumber: number, episodeNumber: number) => void;
  comments: Comment[];
  onImageClick: (src: string) => void;
  episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, notes: Note[]) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
}

const ActionButton: React.FC<{
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
  isActive?: boolean;
}> = ({ label, onClick, disabled, children, isActive }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-1 rounded-md transition-colors text-center w-14 ${disabled ? 'cursor-not-allowed text-text-secondary/30' : `text-text-secondary/80 hover:text-text-primary hover:bg-bg-secondary ${isActive ? 'text-primary-accent' : ''}`}`}
    aria-label={label}
    title={label}
  >
    {children}
    <span className="text-[10px] font-semibold mt-1 leading-tight">{label}</span>
  </button>
);

const EpisodeItem: React.FC<{
    ep: Episode;
    showId: number;
    season: TmdbMediaDetails['seasons'][0];
    showDetails: TmdbMediaDetails;
    seasonDetails: TmdbSeasonDetails;
    watchProgress: WatchProgress;
    favoriteEpisodes: FavoriteEpisodes;
    episodeRatings: EpisodeRatings;
    episodeNotes: Record<number, Record<number, Record<number, Note[]>>>;
    showRatings: boolean;
    today: string;
    onToggleEpisode: SeasonAccordionProps['onToggleEpisode'];
    onMarkPreviousEpisodesWatched: SeasonAccordionProps['onMarkPreviousEpisodesWatched'];
    onStartLiveWatch: SeasonAccordionProps['onStartLiveWatch'];
    onOpenJournal: SeasonAccordionProps['onOpenJournal'];
    onOpenEpisodeRatingModal: SeasonAccordionProps['onOpenEpisodeRatingModal'];
    onDiscussEpisode: SeasonAccordionProps['onDiscussEpisode'];
    onOpenEpisodeDetail: SeasonAccordionProps['onOpenEpisodeDetail'];
    onToggleFavoriteEpisode: SeasonAccordionProps['onToggleFavoriteEpisode'];
    onAddWatchHistory: SeasonAccordionProps['onAddWatchHistory'];
    onSetLogDateModalState: (st: { isOpen: boolean; episode: Episode | null; scope: LogWatchScope }) => void;
    onSetNotesModalState: (st: { isOpen: boolean; episode: Episode | null }) => void;
    onSetJustWatchedEpisodeId: (id: number | null) => void;
    justWatchedEpisodeId: number | null;
    getAgeRatingColor: (rating: string) => string;
    ageRating: string | null;
}> = ({ ep, showId, season, showDetails, seasonDetails, watchProgress, favoriteEpisodes, episodeRatings, episodeNotes, showRatings, today, onToggleEpisode, onMarkPreviousEpisodesWatched, onStartLiveWatch, onOpenJournal, onOpenEpisodeRatingModal, onDiscussEpisode, onOpenEpisodeDetail, onToggleFavoriteEpisode, onAddWatchHistory, onSetLogDateModalState, onSetNotesModalState, onSetJustWatchedEpisodeId, justWatchedEpisodeId, getAgeRatingColor, ageRating }) => {
    
    const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
    const journalEntry = epProgress?.journal;
    const isWatched = epProgress?.status === 2;
    const isFuture = ep.air_date && ep.air_date > today;
    const isFavorited = !!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number];
    const tag = getEpisodeTag(ep, season, showDetails, seasonDetails);
    const isNew = isNewRelease(ep.air_date);
    const epRating = episodeRatings[showId]?.[season.season_number]?.[ep.episode_number];
    const totalEpisodesInSeason = seasonDetails?.episodes?.length || season.episode_count;
    const isLastEpisode = ep.episode_number === totalEpisodesInSeason;
    const shouldAnimateWatch = justWatchedEpisodeId === ep.id;
    const hasNote = !!(episodeNotes[showId]?.[season.season_number]?.[ep.episode_number]);

    // AIRTIME TRUTH LOGIC
    const airtimeTruth = useMemo(() => {
        const override = AIRTIME_OVERRIDES[Number(showId)];
        if (!override) return null;
        const key = `S${ep.season_number}E${ep.episode_number}`;
        const timeInfo = override.episodes?.[key] || override.time;
        if (!timeInfo) return null;
        return `${timeInfo} on ${override.provider}`;
    }, [showId, ep.season_number, ep.episode_number]);

    const handleToggleWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isFuture) return;
        const currentlyWatched = epProgress?.status === 2;
        
        if (!currentlyWatched) {
            onSetJustWatchedEpisodeId(ep.id);
        }

        if (!currentlyWatched && isLastEpisode) {
            const progressForSeason = watchProgress[showId]?.[season.season_number] || {};
            let hasUnwatched = false;
            for (let i = 1; i < ep.episode_number; i++) {
                if (progressForSeason[i]?.status !== 2) {
                    hasUnwatched = true;
                    break;
                }
            }
            if (hasUnwatched && window.confirm("You've marked the last episode. Mark all previous unwatched episodes in this season as watched?")) {
                onMarkPreviousEpisodesWatched(showId, season.season_number, ep.episode_number);
            } else {
                onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0, showDetails as TrackedItem, ep.name);
            }
        } else {
            onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0, showDetails as TrackedItem, ep.name);
        }
    };
    
    const handleLiveWatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        const mediaInfo: LiveWatchMediaInfo = {
            id: showId,
            media_type: 'tv',
            title: showDetails.name || 'Show',
            poster_path: showDetails.poster_path,
            runtime: showDetails.episode_run_time?.[0] || 45,
            seasonNumber: ep.season_number,
            episodeNumber: ep.episode_number,
            episodeTitle: ep.name,
        };
        onStartLiveWatch(mediaInfo);
    };

    return (
        <li className={`relative group p-3 transition-colors hover:bg-bg-secondary/50 cursor-pointer ${isWatched ? 'opacity-70 hover:opacity-100' : ''}`} onClick={() => !isFuture && onOpenEpisodeDetail(ep)}>
            <div className="flex items-start md:items-center space-x-4">
                <div className={`w-32 flex-shrink-0 relative ${isFuture ? 'opacity-60' : ''}`}>
                    <img 
                        src={getImageUrl(ep.still_path, 'w300', 'still')} 
                        alt={ep.name} 
                        className="w-full aspect-video object-cover rounded-md bg-bg-secondary"
                    />
                </div>
                <div className="flex-grow min-w-0 grid grid-cols-1 md:grid-cols-2 gap-x-4 items-center">
                    <div className={`flex flex-col ${isFuture ? 'opacity-60' : ''}`}>
                        <div className="flex items-center flex-wrap gap-x-2">
                            <p className="font-semibold text-text-primary text-sm truncate">
                                {ep.episode_number}. {ep.name}
                            </p>
                            {showRatings && ep.vote_average !== undefined && ep.vote_average > 0 && <ScoreStar score={ep.vote_average} voteCount={ep.vote_count} size="xs" className="-my-1" />}
                            {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                            {tag && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${tag.className}`}>{typeof tag === 'object' ? tag.text : tag}</span>}
                        </div>
                        <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center flex-wrap gap-2 text-xs text-text-secondary/80">
                                {!isFuture && ep.air_date && <span>{new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                {isFuture && ep.air_date && <span>Airs: {new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                {ep.runtime && ep.runtime > 0 && <span>&bull; {formatRuntime(ep.runtime)}</span>}
                                {ageRating && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                                        {ageRating}
                                    </span>
                                )}
                            </div>
                            {airtimeTruth && (
                                <div className="flex items-center gap-1.5 bg-primary-accent text-on-accent font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-full self-start mt-1 shadow-[0_2px_10px_rgba(var(--color-accent-primary-rgb),0.3)]">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{airtimeTruth}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-1 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                        <ActionButton label={isWatched ? 'Not Watched' : 'Watch'} onClick={handleToggleWatched} disabled={isFuture} isActive={isWatched}>
                            <CheckCircleIcon className={`w-5 h-5 ${isWatched ? 'text-green-500' : ''} ${shouldAnimateWatch ? 'animate-bounce-in' : ''}`} />
                        </ActionButton>
                        <ActionButton label="Live" onClick={handleLiveWatch} disabled={isFuture}>
                            <PlayCircleIcon className="h-5 w-5" />
                        </ActionButton>
                        <ActionButton label="Journal" onClick={(e) => { e.stopPropagation(); onOpenJournal(season.season_number, ep); }} isActive={!!journalEntry?.text || !!journalEntry?.mood}>
                            <BookOpenIcon className="w-5 h-5" />
                        </ActionButton>
                         <ActionButton label="Note" onClick={(e) => { e.stopPropagation(); onSetNotesModalState({ isOpen: true, episode: ep }); }} isActive={hasNote}>
                            <PencilSquareIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton label="Favorite" onClick={(e) => { e.stopPropagation(); onToggleFavoriteEpisode(showId, season.season_number, ep.episode_number); }} isActive={isFavorited}>
                            <HeartIcon filled={isFavorited} className={`w-5 h-5 ${isFavorited ? 'text-yellow-400' : ''}`} />
                        </ActionButton>
                        <ActionButton label="Rate" onClick={(e) => { e.stopPropagation(); onOpenEpisodeRatingModal(ep); }} isActive={epRating > 0}>
                            <StarIcon className={`w-5 h-5 ${epRating ? 'text-yellow-400' : ''}`} />
                        </ActionButton>
                        <ActionButton label="Comments" onClick={(e) => { e.stopPropagation(); onDiscussEpisode(ep.season_number, ep.episode_number); }}>
                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                        </ActionButton>
                        <ActionButton label="Log" onClick={(e) => { e.stopPropagation(); onSetLogDateModalState({ isOpen: true, episode: ep, scope: 'single' }); }} disabled={isFuture}>
                            <LogWatchIcon className="w-5 h-5" />
                        </ActionButton>
                    </div>
                </div>
            </div>
        </li>
    );
};

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({
  season,
  showId,
  isExpanded,
  onToggle,
  seasonDetails,
  watchProgress,
  onToggleEpisode,
  onMarkPreviousEpisodesWatched,
  onOpenEpisodeDetail,
  onOpenJournal,
  showDetails,
  showPosterPath,
  favoriteEpisodes,
  onToggleFavoriteEpisode,
  onStartLiveWatch,
  onSaveJournal,
  onMarkSeasonWatched,
  onUnmarkSeasonWatched,
  episodeRatings,
  onOpenEpisodeRatingModal,
  onAddWatchHistory,
  isCollapsible = true,
  onDiscussEpisode,
  comments,
  onImageClick,
  episodeNotes = {},
  onSaveEpisodeNote,
  showRatings,
  seasonRatings,
  onRateSeason
}) => {
  const [logDateModalState, setLogDateModalState] = useState<{ isOpen: boolean; episode: Episode | null; scope: LogWatchScope }>({ isOpen: false, episode: null, scope: 'single' });
  const [justWatchedEpisodeId, setJustWatchedEpisodeId] = useState<number | null>(null);
  const [notesModalState, setNotesModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
  const [seasonRatingModalOpen, setSeasonRatingModalOpen] = useState(false);
  
  const { seasonProgressPercent, unwatchedCount, totalAiredEpisodesInSeason } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const progressForSeason = watchProgress[showId]?.[season.season_number] || {};

    if (!seasonDetails?.episodes) {
      const totalInSeason = season.episode_count;
      if (totalInSeason === 0) return { seasonProgressPercent: 0, unwatchedCount: 0, totalAiredEpisodesInSeason: 0 };
      const watchedCount = Object.values(progressForSeason).filter(ep => (ep as EpisodeProgress).status === 2).length;
      const percent = totalInSeason > 0 ? (watchedCount / totalInSeason) * 100 : 0;
      return { seasonProgressPercent: percent, unwatchedCount: Math.max(0, totalInSeason - watchedCount), totalAiredEpisodesInSeason: 0 };
    }

    const airedEpisodes = seasonDetails.episodes.filter(ep => ep.air_date && ep.air_date <= today);
    const totalAired = airedEpisodes.length;
    
    if (totalAired === 0) return { seasonProgressPercent: 0, unwatchedCount: season.episode_count, totalAiredEpisodesInSeason: 0 };
    
    const watchedCount = airedEpisodes.filter(ep => progressForSeason[ep.episode_number]?.status === 2).length;
    
    const percent = (watchedCount / totalAired) * 100;
    const unwatched = totalAired - watchedCount;
    return { seasonProgressPercent: percent, unwatchedCount: unwatched, totalAiredEpisodesInSeason: totalAired };
  }, [season.episode_count, seasonDetails, watchProgress, showId, season.season_number]);

  const ageRating = useMemo(() => {
    if (!showDetails) return null;
    const usRating = showDetails.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
    return usRating?.rating || null;
  }, [showDetails]);

  const getAgeRatingColor = (rating: string) => {
    const r = rating.toUpperCase();
    if (r === 'G') return 'bg-[#FFFFFF] text-black shadow-sm border border-gray-200';
    if (r === 'TV-G') return 'bg-[#FFDAB9] text-black shadow-sm';
    if (r === 'TV-Y') return 'bg-[#4C5B35] text-white';
    if (r === 'PG') return 'bg-[#800080] text-white';
    if (r === 'TV-PG') return 'bg-[#FF00FF] text-white';
    if (r === 'TV-Y7') return 'bg-[#002366] text-white';
    if (r === 'PG-13') return 'bg-[#FF7F50] text-white font-black';
    if (r === 'TV-14') return 'bg-[#1E90FF] text-white';
    if (r === 'R') return 'bg-[#800020] text-white';
    if (r === 'TV-MA') return 'bg-[#FF0000] text-white';
    if (r === 'NC-17') return 'bg-[#000000] text-white border border-white/20';
    if (r === 'UNRATED') return 'bg-[#808080] text-white';
    if (r === 'NR') return 'bg-[#8B4513] text-white';
    return 'bg-stone-500 text-white';
  };

  const seasonPosterSrcs = useMemo(() => {
    const paths = [
        season.poster_path,
        showPosterPath,
    ];
    return paths
        .filter(p => !!p)
        .map(p => getImageUrl(p, 'w92'));
  }, [season.poster_path, showPosterPath]);

  const today = new Date().toISOString().split('T')[0];
  
  const handleMarkUnmarkSeason = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trackedItem: TrackedItem = {
        id: showDetails.id,
        title: showDetails.name || 'Untitled',
        media_type: 'tv',
        poster_path: showDetails.poster_path,
        genre_ids: showDetails.genres.map(g => g.id),
    };
    if (isSeasonWatched) {
        onUnmarkSeasonWatched(showId, season.season_number);
    } else {
        onMarkSeasonWatched(showId, season.season_number, trackedItem);
    }
  };

  const isSeasonWatched = unwatchedCount === 0 && totalAiredEpisodesInSeason > 0;
  const isUpcoming = season.air_date && season.air_date > today;
  const userSeasonRating = seasonRatings[showId]?.[season.season_number] || 0;

  const handleLogSeasonWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLogDateModalState({ isOpen: true, episode: null, scope: 'season' });
  };

  const handleBulkLogSave = async (data: { date: string; note: string; scope: LogWatchScope; selectedEpisodeIds?: number[] }) => {
    const showInfo: TrackedItem = { 
        id: showDetails.id, 
        title: showDetails.name || 'Untitled', 
        media_type: 'tv', 
        poster_path: showDetails.poster_path 
    };

    if (data.scope === 'single' && logDateModalState.episode) {
        onAddWatchHistory(showInfo, logDateModalState.episode.season_number, logDateModalState.episode.episode_number, data.date, data.note, logDateModalState.episode.name);
        return;
    }

    if (!data.selectedEpisodeIds || data.selectedEpisodeIds.length === 0) {
        confirmationService.show("No episodes selected to log.");
        return;
    }

    confirmationService.show(`Logging ${data.selectedEpisodeIds.length} episodes...`);
    try {
        const sd = seasonDetails || await getSeasonDetails(showId, season.season_number);
        const airedEpisodes = sd.episodes.filter(ep => ep.air_date && ep.air_date <= today);
        
        for (const ep of airedEpisodes) {
            if (data.selectedEpisodeIds.includes(ep.id)) {
                onAddWatchHistory(showInfo, ep.season_number, ep.episode_number, data.date, data.note, ep.name);
            }
        }
        confirmationService.show(`Logged ${data.selectedEpisodeIds.length} episodes of "${season.name}" for ${showDetails.name}!`);
    } catch (e) {
        console.error(e);
        confirmationService.show("Season logging failed.");
    }
  };

  return (
    <>
      <RatingModal 
        isOpen={seasonRatingModalOpen}
        onClose={() => setSeasonRatingModalOpen(false)}
        onSave={(rating) => onRateSeason(showId, season.season_number, rating)}
        currentRating={userSeasonRating}
        mediaTitle={season.name}
      />
      <NotesModal
        isOpen={notesModalState.isOpen}
        onClose={() => setNotesModalState({ isOpen: false, episode: null })}
        onSave={(note) => {
            if (notesModalState.episode) {
                onSaveEpisodeNote(showId, notesModalState.episode.season_number, notesModalState.episode.episode_number, note);
            }
        }}
        mediaTitle={notesModalState.episode ? `Note for S${notesModalState.episode.season_number} E${notesModalState.episode.episode_number}: ${notesModalState.episode.name}` : ''}
        initialNotes={notesModalState.episode ? (episodeNotes[showId]?.[notesModalState.episode.season_number]?.[notesModalState.episode.episode_number] ? [{ id: 'manual', text: (episodeNotes[showId][notesModalState.episode.season_number][notesModalState.episode.episode_number] as unknown as string), timestamp: new Date().toISOString() }] : []) : []}
      />
      <MarkAsWatchedModal
        isOpen={logDateModalState.isOpen}
        onClose={() => setLogDateModalState({ isOpen: false, episode: null, scope: 'single' })}
        mediaTitle={logDateModalState.episode ? `S${logDateModalState.episode.season_number} E${logDateModalState.episode.episode_number}: ${logDateModalState.episode.name}` : season.name}
        onSave={handleBulkLogSave}
        initialScope={logDateModalState.scope}
        mediaType="tv"
        showDetails={showDetails}
        seasonDetails={seasonDetails}
      />
      <div id={`season-${season.season_number}`} className="bg-card-gradient rounded-lg shadow-md overflow-hidden border border-primary-accent/10">
        {isCollapsible && (
             <div className="p-4">
                <div className="flex items-start justify-between cursor-pointer" onClick={onToggle}>
                    <div className="flex items-start flex-grow min-w-0">
                        <FallbackImage 
                            srcs={seasonPosterSrcs} 
                            placeholder={PLACEHOLDER_POSTER} 
                            alt={season.name} 
                            className="w-12 h-18 object-cover rounded-md flex-shrink-0 cursor-pointer" 
                            onClick={(e) => { e.stopPropagation(); onImageClick(getImageUrl(season.poster_path, 'original')); }}
                        />
                        <div className="flex-grow ml-4 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg text-text-primary truncate">{season.name}</h3>
                                {showRatings && season.vote_average && season.vote_average > 0 && <ScoreStar score={season.vote_average} size="xs" />}
                            </div>
                            <p className="text-sm text-text-secondary">{season.episode_count} Episodes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                        {!isUpcoming && (
                            <button 
                                onClick={handleLogSeasonWatch}
                                className="group flex items-center space-x-2 text-primary-accent hover:text-primary-accent/80 transition-colors bg-primary-accent/10 px-4 py-1.5 rounded-full border border-primary-accent/20"
                            >
                                <LogWatchIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">Log a Watch</span>
                            </button>
                        )}
                        <ChevronDownIcon className={`h-6 w-6 transition-transform text-text-secondary ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                    <div className="flex-grow">
                        {!isUpcoming && (
                            <div className="w-full bg-bg-secondary rounded-full h-2">
                                <div className="bg-accent-gradient h-2 rounded-full transition-all duration-500" style={{ width: `${seasonProgressPercent}%` }}></div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center flex-shrink-0 space-x-1" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setSeasonRatingModalOpen(true); }}
                            className={`relative p-2 rounded-full transition-colors border border-primary-accent/10 ${userSeasonRating > 0 ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`}
                            title={userSeasonRating > 0 ? `Your Rating: ${userSeasonRating}/5` : 'Rate Season'}
                        >
                            <StarIcon filled={userSeasonRating > 0} className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleMarkUnmarkSeason}
                            className={`p-2 rounded-full transition-colors border border-primary-accent/10 ${isSeasonWatched ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                            title={isSeasonWatched ? "Unmark Season" : "Mark Season Watched"}
                        >
                            {isSeasonWatched ? <XMarkIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isExpanded && (
          <div className={`${isCollapsible ? 'border-t border-bg-secondary' : ''}`}>
            {!seasonDetails ? (
              <div className="p-4 text-center text-text-secondary">Loading episodes...</div>
            ) : (
              <ul className="divide-y divide-bg-secondary">
                  {(seasonDetails?.episodes || []).filter(Boolean).map(ep => (
                      <EpisodeItem 
                        key={ep.id}
                        ep={ep}
                        showId={showId}
                        season={season}
                        showDetails={showDetails}
                        seasonDetails={seasonDetails}
                        watchProgress={watchProgress}
                        favoriteEpisodes={favoriteEpisodes}
                        episodeRatings={episodeRatings}
                        episodeNotes={episodeNotes}
                        showRatings={showRatings}
                        today={today}
                        onToggleEpisode={onToggleEpisode}
                        onMarkPreviousEpisodesWatched={onMarkPreviousEpisodesWatched}
                        onStartLiveWatch={onStartLiveWatch}
                        onOpenJournal={onOpenJournal}
                        onOpenEpisodeRatingModal={onOpenEpisodeRatingModal}
                        onDiscussEpisode={onDiscussEpisode}
                        onOpenEpisodeDetail={onOpenEpisodeDetail}
                        onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                        onAddWatchHistory={onAddWatchHistory}
                        onSetLogDateModalState={setLogDateModalState}
                        onSetNotesModalState={setNotesModalState}
                        onSetJustWatchedEpisodeId={setJustWatchedEpisodeId}
                        justWatchedEpisodeId={justWatchedEpisodeId}
                        getAgeRatingColor={getAgeRatingColor}
                        ageRating={ageRating}
                      />
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SeasonAccordion;
