
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, LiveWatchMediaInfo, JournalEntry, FavoriteEpisodes, TrackedItem, EpisodeRatings, EpisodeProgress, Comment, SeasonRatings, Reminder, ReminderType } from '../types';
import { ChevronDownIcon, CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, ClockIcon, LogWatchIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, PencilSquareIcon, InformationCircleIcon, BellIcon } from './Icons';
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
import ReminderOptionsModal from './ReminderOptionsModal';

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
  episodeNotes?: Record<number, Record<number, Record<number, string>>>;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
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

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({
  season, showId, isExpanded, onToggle, seasonDetails, watchProgress, onToggleEpisode, onMarkPreviousEpisodesWatched, onOpenEpisodeDetail, onOpenJournal, showDetails, showPosterPath, favoriteEpisodes, onToggleFavoriteEpisode, onStartLiveWatch, onSaveJournal, onMarkSeasonWatched, onUnmarkSeasonWatched, episodeRatings, onOpenEpisodeRatingModal, onAddWatchHistory, isCollapsible = true, onDiscussEpisode, comments, onImageClick, episodeNotes = {}, onSaveEpisodeNote, showRatings, seasonRatings, onRateSeason, reminders, onToggleReminder
}) => {
  const [logDateModalState, setLogDateModalState] = useState<{ isOpen: boolean; episode: Episode | null; scope: LogWatchScope }>({ isOpen: false, episode: null, scope: 'single' });
  const [notesModalState, setNotesModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
  const [seasonRatingModalOpen, setSeasonRatingModalOpen] = useState(false);
  const [reminderModalState, setReminderModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
  
  const { seasonProgressPercent, unwatchedCount, totalAiredEpisodesInSeason } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const progressForSeason = watchProgress[showId]?.[season.season_number] || {};

    if (!seasonDetails?.episodes) {
      const totalInSeason = season.episode_count;
      if (totalInSeason === 0) return { seasonProgressPercent: 0, unwatchedCount: 0, totalAiredEpisodesInSeason: 0 };
      const watchedCount = Object.values(progressForSeason).filter(ep => (ep as EpisodeProgress).status === 2).length;
      return { seasonProgressPercent: totalInSeason > 0 ? (watchedCount / totalInSeason) * 100 : 0, unwatchedCount: Math.max(0, totalInSeason - watchedCount), totalAiredEpisodesInSeason: 0 };
    }

    const airedEpisodes = seasonDetails.episodes.filter(ep => ep.air_date && ep.air_date <= today);
    const totalAired = airedEpisodes.length;
    if (totalAired === 0) return { seasonProgressPercent: 0, unwatchedCount: season.episode_count, totalAiredEpisodesInSeason: 0 };
    const watchedCount = airedEpisodes.filter(ep => progressForSeason[ep.episode_number]?.status === 2).length;
    return { seasonProgressPercent: (watchedCount / totalAired) * 100, unwatchedCount: totalAired - watchedCount, totalAiredEpisodesInSeason: totalAired };
  }, [season.episode_count, seasonDetails, watchProgress, showId, season.season_number]);

  const ageRating = useMemo(() => {
    if (!showDetails) return null;
    const usRating = showDetails.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
    return usRating?.rating || null;
  }, [showDetails]);

  const getAgeRatingColor = (rating: string) => {
    const r = rating.toUpperCase();
    if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
    if (r === 'TV-Y') return 'bg-[#008000] text-white';
    if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
    if (r === 'PG-13') return 'bg-[#00008B] text-white';
    if (r === 'TV-14') return 'bg-[#800000] text-white';
    if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
    if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
    return 'bg-stone-500 text-white';
  };

  const today = new Date().toISOString().split('T')[0];
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
            if (data.selectedEpisodeIds!.includes(ep.id)) {
                onAddWatchHistory(showInfo, ep.season_number, ep.episode_number, data.date, data.note, ep.name);
            }
        }
        confirmationService.show(`Logged ${data.selectedEpisodeIds.length} episodes of "${season.name}" for ${showDetails.name}!`);
    } catch (e) {
        console.error(e);
        confirmationService.show("Season logging failed.");
    }
  };

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

  const handleReminderSelect = (type: ReminderType) => {
      const ep = reminderModalState.episode;
      if (!ep) return;
      const reminderId = `rem-tv-${showId}-s${ep.season_number}-e${ep.episode_number}-ep`;
      const newReminder: Reminder = {
          id: reminderId, mediaId: showId, mediaType: 'tv', releaseDate: ep.air_date || 'TBD',
          title: showDetails.name || 'Untitled', poster_path: showDetails.poster_path,
          episodeInfo: `S${ep.season_number} E${ep.episode_number}: ${ep.name}`, 
          seasonNumber: ep.season_number, episodeNumber: ep.episode_number,
          reminderType: type, wasDateUnknown: !ep.air_date
      };
      onToggleReminder(newReminder, reminderId);
      setReminderModalState({ isOpen: false, episode: null });
  };

  return (
    <>
      <RatingModal isOpen={seasonRatingModalOpen} onClose={() => setSeasonRatingModalOpen(false)} onSave={(rating) => onRateSeason(showId, season.season_number, rating)} currentRating={userSeasonRating} mediaTitle={season.name} />
      <ReminderOptionsModal isOpen={reminderModalState.isOpen} onClose={() => setReminderModalState({ isOpen: false, episode: null })} onSelect={handleReminderSelect} />
      <NotesModal
        isOpen={notesModalState.isOpen} onClose={() => setNotesModalState({ isOpen: false, episode: null })}
        onSave={(note) => notesModalState.episode && onSaveEpisodeNote(showId, notesModalState.episode.season_number, notesModalState.episode.episode_number, note)}
        mediaTitle={notesModalState.episode ? `Note for S${notesModalState.episode.season_number} E${notesModalState.episode.episode_number}: ${notesModalState.episode.name}` : ''}
        initialNotes={(notesModalState.episode && episodeNotes[showId]?.[notesModalState.episode.season_number]?.[notesModalState.episode.episode_number]) ? [{ id: 'manual', text: episodeNotes[showId][notesModalState.episode.season_number][notesModalState.episode.episode_number], timestamp: new Date().toISOString() }] : []}
      />
      <MarkAsWatchedModal
        isOpen={logDateModalState.isOpen} onClose={() => setLogDateModalState({ isOpen: false, episode: null, scope: 'single' })}
        mediaTitle={logDateModalState.episode ? `S${logDateModalState.episode.season_number} E${logDateModalState.episode.episode_number}: ${logDateModalState.episode.name}` : season.name}
        onSave={handleBulkLogSave} initialScope={logDateModalState.scope} mediaType="tv" showDetails={showDetails} seasonDetails={seasonDetails}
      />
      <div id={`season-${season.season_number}`} className="bg-card-gradient rounded-lg shadow-md overflow-hidden border border-primary-accent/10">
        {isCollapsible && (
             <div className="p-4">
                <div className="flex items-start justify-between cursor-pointer" onClick={onToggle}>
                    <div className="flex items-start flex-grow min-w-0">
                        <FallbackImage 
                            srcs={[getImageUrl(season.poster_path, 'w92'), getImageUrl(showPosterPath, 'w92')]} 
                            placeholder={PLACEHOLDER_POSTER} alt={season.name} 
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
                            <button onClick={handleLogSeasonWatch} className="group flex items-center space-x-2 text-primary-accent hover:text-primary-accent/80 transition-colors bg-primary-accent/10 px-4 py-1.5 rounded-full border border-primary-accent/20">
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
                        <button onClick={(e) => { e.stopPropagation(); setSeasonRatingModalOpen(true); }} className={`relative p-2 rounded-full transition-colors border border-primary-accent/10 ${userSeasonRating > 0 ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`}>
                            <StarIcon filled={userSeasonRating > 0} className="h-5 w-5" />
                        </button>
                        <button onClick={handleMarkUnmarkSeason} className={`p-2 rounded-full transition-colors border border-primary-accent/10 ${isSeasonWatched ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}>
                            {isSeasonWatched ? <XMarkIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isExpanded && (
          <div className={`${isCollapsible ? 'border-t border-bg-secondary' : ''}`}>
            {!seasonDetails ? <div className="p-4 text-center text-text-secondary">Loading episodes...</div> : (
              <ul className="divide-y divide-bg-secondary">
                  {(seasonDetails?.episodes || []).filter(Boolean).map(ep => {
                    const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
                    const isWatched = epProgress?.status === 2;
                    const isFuture = (ep.air_date && ep.air_date > today) || !ep.air_date;
                    const tag = getEpisodeTag(ep, season, showDetails, seasonDetails);
                    const reminderId = `rem-tv-${showId}-s${ep.season_number}-e${ep.episode_number}-ep`;
                    const isReminderSet = reminders.some(r => r.id === reminderId);

                    return (
                        <li key={ep.id} className={`relative group p-3 transition-colors hover:bg-bg-secondary/50 cursor-pointer ${isWatched ? 'opacity-70' : ''}`} onClick={() => !isFuture && onOpenEpisodeDetail(ep)}>
                            <div className="flex items-start md:items-center space-x-4">
                                <div className={`w-32 flex-shrink-0 relative ${isFuture ? 'opacity-60' : ''}`}>
                                    <img src={getImageUrl(ep.still_path, 'w300', 'still')} alt={ep.name} className="w-full aspect-video object-cover rounded-md bg-bg-secondary" />
                                </div>
                                <div className="flex-grow min-w-0 grid grid-cols-1 md:grid-cols-2 gap-x-4 items-center">
                                    <div className={`flex flex-col ${isFuture ? 'opacity-80' : ''}`}>
                                        <div className="flex items-center flex-wrap gap-x-2">
                                            <p className="font-semibold text-text-primary text-sm truncate">{ep.episode_number}. {ep.name}</p>
                                            {showRatings && ep.vote_average > 0 && <ScoreStar score={ep.vote_average} size="xs" />}
                                            {isNewRelease(ep.air_date) && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">New</span>}
                                            {tag && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tag.className}`}>{tag.text}</span>}
                                        </div>
                                        <div className="flex items-center flex-wrap gap-2 text-xs text-text-secondary/80 mt-1">
                                            <span>{isFuture ? (ep.air_date ? 'Airs: ' : 'TBA: ') : ''}{ep.air_date ? new Date(ep.air_date + 'T00:00:00').toLocaleDateString() : 'TBD'}</span>
                                            {ep.runtime > 0 && <span>&bull; {formatRuntime(ep.runtime)}</span>}
                                            {ageRating && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                                                    {ageRating}
                                                </span>
                                            )}
                                            {isFuture && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); isReminderSet ? onToggleReminder(null, reminderId) : setReminderModalState({ isOpen: true, episode: ep }); }}
                                                    className={`p-1.5 rounded-full transition-all flex items-center gap-1 ${isReminderSet ? 'bg-primary-accent/20 text-primary-accent border border-primary-accent/30' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}`}
                                                >
                                                    <BellIcon filled={isReminderSet} className="w-3.5 h-3.5" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{isReminderSet ? 'Reminder Set' : 'Remind Me'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-1 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                        <ActionButton label={isWatched ? 'Not Watched' : 'Watch'} onClick={() => onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0, showDetails as TrackedItem, ep.name)} disabled={isFuture} isActive={isWatched}><CheckCircleIcon className="w-5 h-5" /></ActionButton>
                                        <ActionButton label="Live" onClick={() => onStartLiveWatch({ id: showId, media_type: 'tv', title: showDetails.name!, poster_path: showDetails.poster_path!, runtime: showDetails.episode_run_time?.[0] || 45, seasonNumber: ep.season_number, episodeNumber: ep.episode_number, episodeTitle: ep.name })} disabled={isFuture}><PlayCircleIcon className="h-5 w-5" /></ActionButton>
                                        <ActionButton label="Journal" onClick={() => onOpenJournal(season.season_number, ep)} isActive={!!epProgress?.journal}><BookOpenIcon className="w-5 h-5" /></ActionButton>
                                        <ActionButton label="Favorite" onClick={() => onToggleFavoriteEpisode(showId, season.season_number, ep.episode_number)} isActive={!!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number]}><HeartIcon filled={!!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number]} className="w-5 h-5" /></ActionButton>
                                        <ActionButton label="Log" onClick={() => setLogDateModalState({ isOpen: true, episode: ep, scope: 'single' })} disabled={isFuture}><LogWatchIcon className="w-5 h-5" /></ActionButton>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SeasonAccordion;
