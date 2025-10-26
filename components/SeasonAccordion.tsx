import React, { useMemo, useState } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, LiveWatchMediaInfo, JournalEntry, FavoriteEpisodes } from '../types';
import { ChevronDownIcon, CheckCircleIcon, EllipsisVerticalIcon, PlayCircleIcon, BookOpenIcon, StarIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatRuntime } from '../utils/formatUtils';
import MoodSelectorModal from './MoodSelectorModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER } from '../constants';

interface SeasonAccordionProps {
  season: TmdbMediaDetails['seasons'][0];
  showId: number;
  isExpanded: boolean;
  onToggle: () => void;
  seasonDetails: TmdbSeasonDetails | undefined;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onOpenJournal: (season: number, episode: Episode) => void;
  onOpenEpisodeDetail: (episode: Episode) => void;
  showPosterPath: string | null | undefined;
  tvdbShowPosterPath: string | null | undefined;
  // From {...props}
  showDetails: TmdbMediaDetails;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
}

const DropdownItem: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode; }> = ({ onClick, children }) => (
  <li>
    <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-secondary flex items-center space-x-3">
      {children}
    </button>
  </li>
);

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({
  season,
  showId,
  isExpanded,
  onToggle,
  seasonDetails,
  watchProgress,
  onToggleEpisode,
  onOpenEpisodeDetail,
  onOpenJournal,
  showDetails,
  showPosterPath,
  tvdbShowPosterPath,
  favoriteEpisodes,
  onToggleFavoriteEpisode,
  onStartLiveWatch,
  onSaveJournal,
}) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [moodModalState, setMoodModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });

  const seasonProgressPercent = useMemo(() => {
    const episodes = seasonDetails?.episodes || [];
    if (episodes.length === 0) return 0;
    
    const watchedCount = episodes.filter(ep => 
      watchProgress[showId]?.[season.season_number]?.[ep.episode_number]?.status === 2
    ).length;
    
    return (watchedCount / episodes.length) * 100;
  }, [seasonDetails, watchProgress, showId, season.season_number]);

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
  
  const handleToggleDropdown = (e: React.MouseEvent, episodeId: number) => {
    e.stopPropagation();
    setOpenDropdown(prev => (prev === episodeId ? null : episodeId));
  };
  
  const handleLiveWatch = (e: React.MouseEvent, episode: Episode) => {
    e.stopPropagation();
    const mediaInfo: LiveWatchMediaInfo = {
        id: showId,
        media_type: 'tv',
        title: showDetails.name || 'Show',
        poster_path: showDetails.poster_path,
        runtime: showDetails.episode_run_time?.[0] || 45,
        seasonNumber: episode.season_number,
        episodeNumber: episode.episode_number,
        episodeTitle: episode.name,
    };
    onStartLiveWatch(mediaInfo);
    setOpenDropdown(null);
  };
  
  const handleSaveMood = (mood: string) => {
    if (!moodModalState.episode) return;
    const { episode } = moodModalState;
    const existingJournal = watchProgress[showId]?.[episode.season_number]?.[episode.episode_number]?.journal;
    const existingText = existingJournal?.text || '';

    if (!mood && !existingText) {
        onSaveJournal(showId, episode.season_number, episode.episode_number, null);
    } else {
        const newEntry: JournalEntry = {
            text: existingText,
            mood: mood,
            timestamp: new Date().toISOString()
        };
        onSaveJournal(showId, episode.season_number, episode.episode_number, newEntry);
    }
    setMoodModalState({ isOpen: false, episode: null });
  };


  return (
    <>
      <MoodSelectorModal 
        isOpen={moodModalState.isOpen} 
        onClose={() => setMoodModalState({ isOpen: false, episode: null })} 
        onSelectMood={handleSaveMood} 
        currentMood={moodModalState.episode ? watchProgress[showId]?.[moodModalState.episode.season_number]?.[moodModalState.episode.episode_number]?.journal?.mood : undefined}
      />
      <div id={`season-${season.season_number}`} className="bg-card-gradient rounded-lg shadow-md overflow-hidden">
        <div className="flex items-center p-4 cursor-pointer" onClick={onToggle}>
          <FallbackImage 
            srcs={seasonPosterSrcs} 
            placeholder={PLACEHOLDER_POSTER} 
            alt={season.name} 
            className="w-12 h-18 object-cover rounded-md flex-shrink-0" />
          <div className="flex-grow ml-4">
            <h3 className="font-bold text-lg text-text-primary">{season.name}</h3>
            <p className="text-sm text-text-secondary">{season.episode_count} Episodes</p>
            <div className="w-full bg-bg-secondary rounded-full h-1.5 mt-2">
                  <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${seasonProgressPercent}%` }}></div>
              </div>
          </div>
          <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ml-4 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>

        {isExpanded && (
          <div className="border-t border-bg-secondary">
            {!seasonDetails ? (
              <div className="p-4 text-center text-text-secondary">Loading episodes...</div>
            ) : (
              <ul className="divide-y divide-bg-secondary">
                {(seasonDetails?.episodes || []).filter(Boolean).map(ep => {
                  const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
                  const isWatched = epProgress?.status === 2;
                  const isFuture = ep.air_date && ep.air_date > today;
                  const isFavorited = !!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number];
                  const currentMood = watchProgress[showId]?.[season.season_number]?.[ep.episode_number]?.journal?.mood;
                  
                  return (
                    <li key={ep.id} className="relative group">
                      <div className="flex items-center space-x-3 p-3 transition-colors hover:bg-bg-secondary/50">
                          <div 
                              className={`flex-grow min-w-0 flex items-center space-x-3 ${isFuture ? 'opacity-60' : 'cursor-pointer'}`}
                              onClick={() => !isFuture && onOpenEpisodeDetail(ep)}
                          >
                              <div className="text-sm text-text-secondary w-6 text-center">{ep.episode_number}</div>
                              <div className="flex-grow min-w-0">
                                  <p className="font-semibold text-text-primary truncate group-hover:text-primary-accent">{ep.name}</p>
                                  <div className="flex items-center space-x-2 text-xs text-text-secondary/80">
                                      {!isFuture && ep.air_date && <span>{new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                      {isFuture && ep.air_date && <span>Airs: {new Date(ep.air_date + 'T00:00:00').toLocaleDateString()}</span>}
                                      {ep.runtime && ep.runtime > 0 && ep.air_date && <span>&bull;</span>}
                                      {ep.runtime && ep.runtime > 0 && <span>{formatRuntime(ep.runtime)}</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="relative">
                            <button
                              disabled={isFuture}
                              onClick={(e) => handleToggleDropdown(e, ep.id)}
                              className={`p-1 rounded-full ${isFuture ? 'cursor-not-allowed' : 'hover:bg-bg-secondary'}`}
                              aria-label="More options"
                            >
                              <EllipsisVerticalIcon className="h-6 w-6 text-text-secondary/60 group-hover:text-text-secondary" />
                            </button>
                            
                            {openDropdown === ep.id && (
                              <div 
                                  className="absolute right-0 top-full mt-1 w-48 bg-card-gradient border border-bg-secondary rounded-md shadow-lg z-10 animate-fade-in"
                                  onClick={(e) => e.stopPropagation()}
                              >
                                <ul className="py-1">
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0); setOpenDropdown(null); }}>
                                      <CheckCircleIcon className={`w-5 h-5 ${isWatched ? 'text-green-500' : 'text-text-secondary'}`} />
                                      <span>{isWatched ? 'Mark Unwatched' : 'Mark Watched'}</span>
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => handleLiveWatch(e, ep)}>
                                      <PlayCircleIcon className="w-5 h-5 text-text-secondary" />
                                      <span>Live Watch</span>
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); setMoodModalState({ isOpen: true, episode: ep }); setOpenDropdown(null); }}>
                                      <span className="text-lg w-5 text-center">{currentMood || '😶'}</span>
                                      <span>Set Mood</span>
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); onOpenJournal(season.season_number, ep); setOpenDropdown(null); }}>
                                      <BookOpenIcon className="w-5 h-5 text-text-secondary" />
                                      <span>Journal</span>
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); onToggleFavoriteEpisode(showId, season.season_number, ep.episode_number); setOpenDropdown(null); }}>
                                      <StarIcon filled={isFavorited} className={`w-5 h-5 ${isFavorited ? 'text-yellow-400' : 'text-text-secondary'}`} />
                                      <span>{isFavorited ? 'Unfavorite' : 'Favorite'}</span>
                                  </DropdownItem>
                                </ul>
                              </div>
                            )}
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