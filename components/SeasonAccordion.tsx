import React, { useMemo, useState, useEffect, useRef } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, LiveWatchMediaInfo, JournalEntry, FavoriteEpisodes, TrackedItem, EpisodeRatings, EpisodeProgress, Comment } from '../types';
import { ChevronDownIcon, CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, ClockIcon, CalendarIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import CommentModal from './CommentModal';
import { confirmationService } from '../services/confirmationService';

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
  tvdbShowPosterPath: string | null | undefined;
  onMarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  showDetails: TmdbMediaDetails;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  episodeRatings: EpisodeRatings;
  onOpenEpisodeRatingModal: (episode: Episode) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string) => void;
  isCollapsible?: boolean;
  onSaveComment: (mediaKey: string, text: string) => void;
  comments: Comment[];
  onImageClick: (src: string) => void;
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
  tvdbShowPosterPath,
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
  onSaveComment,
  comments,
  onImageClick,
}) => {
  const [logDateModalState, setLogDateModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
  const [commentModalState, setCommentModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });
  
  const { seasonProgressPercent, unwatchedCount, totalAiredEpisodesInSeason } = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const progressForSeason = watchProgress[showId]?.[season.season_number] || {};

    if (!seasonDetails?.episodes) {
      const totalInSeason = season.episode_count;
      if (totalInSeason === 0) return { seasonProgressPercent: 100, unwatchedCount: 0, totalAiredEpisodesInSeason: 0 };
      const watchedCount = Object.values(progressForSeason).filter(ep => (ep as EpisodeProgress).status === 2).length;
      const percent = totalInSeason > 0 ? (watchedCount / totalInSeason) * 100 : 100;
      return { seasonProgressPercent: percent, unwatchedCount: Math.max(0, totalInSeason - watchedCount), totalAiredEpisodesInSeason: 0 };
    }

    const airedEpisodes = seasonDetails.episodes.filter(ep => ep.air_date && ep.air_date <= today);
    const totalAired = airedEpisodes.length;
    
    if (totalAired === 0) return { seasonProgressPercent: 100, unwatchedCount: 0, totalAiredEpisodesInSeason: 0 };
    
    const watchedCount = airedEpisodes.filter(ep => progressForSeason[ep.episode_number]?.status === 2).length;
    
    const percent = (watchedCount / totalAired) * 100;
    const unwatched = totalAired - watchedCount;
    return { seasonProgressPercent: percent, unwatchedCount: unwatched, totalAiredEpisodesInSeason: totalAired };
  }, [season.episode_count, seasonDetails, watchProgress, showId, season.season_number]);


  const seasonPosterSrcs = useMemo(() => {
    const paths = [
        season.poster_path,
        showPosterPath,
        tvdbShowPosterPath,
    ];
    return paths
        .filter(p => !!p)
        .map(p => getImageUrl(p, 'w92'));
  }, [season.poster_path, showPosterPath, tvdbShowPosterPath]);

  const today = new Date().toISOString().split('T')[0];
  
  const handleMarkUnmarkSeason = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSeasonWatched) {
        onUnmarkSeasonWatched(showId, season.season_number);
    } else {
        onMarkSeasonWatched(showId, season.season_number);
        confirmationService.show(`✅ “${showDetails.name} – ${season.name} has been marked as watched.”`);
    }
  };

  const isSeasonWatched = unwatchedCount === 0 && totalAiredEpisodesInSeason > 0;

  const episodeMediaKey = commentModalState.episode ? `tv-${showId}-s${commentModalState.episode.season_number}-e${commentModalState.episode.episode_number}` : '';
  const initialCommentText = comments.find(c => c.mediaKey === episodeMediaKey)?.text;
  
  return (
    <>
      <MarkAsWatchedModal
        isOpen={logDateModalState.isOpen}
        onClose={() => setLogDateModalState({ isOpen: false, episode: null })}
        mediaTitle={logDateModalState.episode ? `S${logDateModalState.episode.season_number} E${logDateModalState.episode.episode_number}: ${logDateModalState.episode.name}` : ''}
        onSave={(data) => {
            if (logDateModalState.episode) {
                const trackedItem: TrackedItem = {
                    id: showDetails.id,
                    title: showDetails.name || 'Untitled',
                    media_type: 'tv',
                    poster_path: showDetails.poster_path,
                    genre_ids: showDetails.genres.map(g => g.id),
                };
                onAddWatchHistory(trackedItem, logDateModalState.episode.season_number, logDateModalState.episode.episode_number, data.date, data.note);
            }
        }}
      />
      <CommentModal
        isOpen={commentModalState.isOpen}
        onClose={() => setCommentModalState({ isOpen: false, episode: null })}
        mediaTitle={commentModalState.episode ? `S${commentModalState.episode.season_number} E${commentModalState.episode.episode_number}: ${commentModalState.episode.name}` : ''}
        initialText={initialCommentText}
        onSave={(text) => onSaveComment(episodeMediaKey, text)}
      />
      <div id={`season-${season.season_number}`} className="bg-card-gradient rounded-lg shadow-md overflow-hidden">
        {isCollapsible && (
            <div className="flex items-center p-4">
            <div className="flex items-center flex-grow min-w-0 cursor-pointer" onClick={onToggle}>
                <FallbackImage 
                    srcs={seasonPosterSrcs} 
                    placeholder={PLACEHOLDER_POSTER} 
                    alt={season.name} 
                    className="w-12 h-18 object-cover rounded-md flex-shrink-0 cursor-pointer" 
                    onClick={(e) => { e.stopPropagation(); onImageClick(getImageUrl(season.poster_path, 'original')); }}
                />
                <div className="flex-grow ml-4 min-w-0">
                <h3 className="font-bold text-lg text-text-primary truncate">{season.name}</h3>
                <p className="text-sm text-text-secondary">{season.episode_count} Episodes</p>
                <div className="w-full bg-bg-secondary rounded-full h-1.5 mt-2">
                        <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${seasonProgressPercent}%` }}></div>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center flex-shrink-0 ml-2 space-x-1">
                <button
                    onClick={handleMarkUnmarkSeason}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${isSeasonWatched ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    aria-label={isSeasonWatched ? "Unmark season as watched" : "Mark all episodes in this season as watched"}
                    title={isSeasonWatched ? "Unmark Season" : "Mark Season Watched"}
                >
                    {isSeasonWatched ? <XMarkIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                    <span>{isSeasonWatched ? 'Unmark All' : 'Mark All'}</span>
                </button>
                <button onClick={onToggle} className="p-2 rounded-full text-text-secondary" aria-label="Toggle season details">
                <ChevronDownIcon className={`h-6 w-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>
            </div>
        )}

        {isExpanded && (
          <div className={`${isCollapsible ? 'border-t border-bg-secondary' : ''}`}>
            {!seasonDetails ? (
              <div className="p-4 text-center text-text-secondary">Loading episodes...</div>
            ) : (
              <>
                <ul className="divide-y divide-bg-secondary">
                    {(seasonDetails?.episodes || []).filter(Boolean).map(ep => {
                    const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
                    const isWatched = epProgress?.status === 2;
                    const isFuture = ep.air_date && ep.air_date > today;
                    const isFavorited = !!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number];
                    const tag = getEpisodeTag(ep, season, showDetails, seasonDetails);
                    const isNew = isNewRelease(ep.air_date);
                    const epRating = episodeRatings[showId]?.[season.season_number]?.[ep.episode_number];
                    const totalEpisodesInSeason = seasonDetails?.episodes?.length || season.episode_count;
                    const isLastEpisode = ep.episode_number === totalEpisodesInSeason;
                    const episodeMediaKey = `tv-${showId}-s${ep.season_number}-e${ep.episode_number}`;
                    const existingComment = comments.find(c => c.mediaKey === episodeMediaKey);

                    const handleToggleWatched = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (isFuture) return;
                        const currentlyWatched = epProgress?.status === 2;
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
                                onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0, showDetails, ep.name);
                            }
                        } else {
                            onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0, showDetails, ep.name);
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
                        <li key={ep.id} className="relative group p-3 transition-colors hover:bg-bg-secondary/50 cursor-pointer" onClick={() => !isFuture && onOpenEpisodeDetail(ep)}>
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
                                            {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                                            {tag && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${tag.className}`}>{typeof tag === 'object' ? tag.text : tag}</span>}
                                        </div>
                                        <div className="flex items-center space-x-2 text-xs text-text-secondary/80 mt-1">
                                            {!isFuture && ep.air_date && <span>{new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                            {isFuture && ep.air_date && <span>Airs: {new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                            {ep.runtime && ep.runtime > 0 && ep.air_date && <span>&bull;</span>}
                                            {ep.runtime && ep.runtime > 0 && <span>{formatRuntime(ep.runtime)}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-start md:justify-end gap-1 mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                        <ActionButton label={isWatched ? 'Watched' : 'Watch'} onClick={handleToggleWatched} disabled={isFuture} isActive={isWatched}>
                                            <CheckCircleIcon className={`w-5 h-5 ${isWatched ? 'text-green-500' : ''}`} />
                                        </ActionButton>
                                        <ActionButton label="Live" onClick={handleLiveWatch} disabled={isFuture}>
                                            <PlayCircleIcon className="h-5 w-5" />
                                        </ActionButton>
                                        <ActionButton label="Journal" onClick={(e) => { onOpenJournal(season.season_number, ep); }}>
                                            <BookOpenIcon className="w-5 h-5" />
                                        </ActionButton>
                                        <ActionButton label="Favorite" onClick={(e) => { onToggleFavoriteEpisode(showId, season.season_number, ep.episode_number); }} isActive={isFavorited}>
                                            <HeartIcon filled={isFavorited} className={`w-5 h-5 ${isFavorited ? 'text-yellow-400' : ''}`} />
                                        </ActionButton>
                                        <ActionButton label="Rate" onClick={(e) => { onOpenEpisodeRatingModal(ep); }} isActive={epRating > 0}>
                                            <StarIcon className={`w-5 h-5 ${epRating ? 'text-yellow-400' : ''}`} />
                                        </ActionButton>
                                        <ActionButton label="Comment" onClick={(e) => { e.stopPropagation(); setCommentModalState({ isOpen: true, episode: ep }); }} isActive={!!existingComment}>
                                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                                        </ActionButton>
                                        <ActionButton label="Log" onClick={(e) => { e.stopPropagation(); setLogDateModalState({ isOpen: true, episode: ep }); }} disabled={isFuture}>
                                            <CalendarIcon className="w-5 h-5" />
                                        </ActionButton>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                    })}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SeasonAccordion;