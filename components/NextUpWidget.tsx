import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, Episode, LiveWatchMediaInfo, FavoriteEpisodes, WatchProgress, JournalEntry, Comment, TvdbShow } from '../types';
import { getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, ChatBubbleOvalLeftEllipsisIcon } from './Icons';
import CommentModal from './CommentModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';

interface NextUpWidgetProps {
    showId: number;
    details: TmdbMediaDetails;
    tvdbDetails: TvdbShow | null;
    nextEpisodeToWatch: { seasonNumber: number; episodeNumber: number } | null;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
    onOpenJournal: (season: number, episode: Episode) => void;
    favoriteEpisodes: FavoriteEpisodes;
    onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
    watchProgress: WatchProgress;
    onSaveJournal: (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => void;
    onSaveComment: (mediaKey: string, text: string) => void;
    comments: Comment[];
}

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; disabled?: boolean; isActive?: boolean; }> = ({ icon, label, onClick, disabled, isActive }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full p-2 rounded-lg border transition-all ${disabled ? 'text-text-secondary/50 cursor-not-allowed bg-bg-secondary/30 border-bg-secondary' : (isActive ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary border border-bg-secondary/80 text-text-primary hover:border-primary-accent hover:bg-bg-secondary/70')}`}
    >
        {icon}
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
);

const NextUpWidget: React.FC<NextUpWidgetProps> = (props) => {
    const { showId, details, tvdbDetails, nextEpisodeToWatch, onToggleEpisode, onOpenJournal, favoriteEpisodes, onToggleFavoriteEpisode, onStartLiveWatch, watchProgress, onSaveJournal, onSaveComment, comments } = props;
    
    const [episodeDetails, setEpisodeDetails] = useState<Episode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchNextEpisode = async () => {
            if (!nextEpisodeToWatch) {
                setEpisodeDetails(null);
                return;
            }
            setIsLoading(true);
            try {
                const seasonData = await getSeasonDetails(showId, nextEpisodeToWatch.seasonNumber);
                if (isMounted) {
                    const nextEp = seasonData.episodes.find(e => e.episode_number === nextEpisodeToWatch.episodeNumber);
                    setEpisodeDetails(nextEp || null);
                }
            } catch (error) {
                console.error("Failed to fetch next episode details", error);
                if (isMounted) setEpisodeDetails(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchNextEpisode();
        return () => { isMounted = false; };
    }, [showId, nextEpisodeToWatch]);

    const imageSrcs = useMemo(() => {
        if (!episodeDetails) return { still: [], backdrop: [getImageUrl(details.backdrop_path, 'w500', 'backdrop')] };

        const season = details.seasons?.find(s => s.season_number === episodeDetails.season_number);
        const stillSrcs = [
            getImageUrl(episodeDetails.still_path, 'w500', 'still'),
            getImageUrl(season?.poster_path, 'w500', 'poster'),
            getImageUrl(details.poster_path, 'w500', 'poster'),
            getImageUrl(tvdbDetails?.image, 'original'),
        ];
        return {
            still: stillSrcs,
            backdrop: [getImageUrl(details.backdrop_path, 'w500', 'backdrop')]
        };
    }, [episodeDetails, details, tvdbDetails]);
    
    if (isLoading) {
        return (
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-bg-secondary"></div>
                <div className="p-4 space-y-3">
                    <div className="h-4 bg-bg-secondary rounded w-3/4"></div>
                    <div className="h-3 bg-bg-secondary rounded w-1/2"></div>
                    <div className="h-10 bg-bg-secondary rounded w-full"></div>
                </div>
            </div>
        );
    }
    
    if (!episodeDetails) {
        return null;
    }

    const epProgress = watchProgress[showId]?.[episodeDetails.season_number]?.[episodeDetails.episode_number];
    const isWatched = epProgress?.status === 2;
    const isFavorited = favoriteEpisodes[showId]?.[episodeDetails.season_number]?.[episodeDetails.episode_number] || false;

    const episodeMediaKey = `tv-${showId}-s${episodeDetails.season_number}-e${episodeDetails.episode_number}`;
    const existingComment = comments.find(c => c.mediaKey === episodeMediaKey);

    const handleMarkWatched = () => onToggleEpisode(showId, episodeDetails.season_number, episodeDetails.episode_number, isWatched ? 2 : 0);
    const handleOpenJournal = () => onOpenJournal(episodeDetails.season_number, episodeDetails);
    const handleToggleFavorite = () => onToggleFavoriteEpisode(showId, episodeDetails.season_number, episodeDetails.episode_number);
    const handleLiveWatch = () => {
        const mediaInfo: LiveWatchMediaInfo = {
            id: showId, media_type: 'tv', title: details.name || 'Show',
            poster_path: details.poster_path, runtime: details.episode_run_time?.[0] || 45,
            seasonNumber: episodeDetails.season_number, episodeNumber: episodeDetails.episode_number,
            episodeTitle: episodeDetails.name,
        };
        onStartLiveWatch(mediaInfo);
    };
    
    return (
        <>
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                mediaTitle={`S${episodeDetails.season_number} E${episodeDetails.episode_number}: ${episodeDetails.name}`}
                initialText={existingComment?.text}
                onSave={(text) => onSaveComment(episodeMediaKey, text)}
            />
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden">
                {/* Image container with blurred backdrop */}
                <div 
                    className="h-40 w-full bg-cover bg-center flex items-center justify-center relative"
                    style={{ backgroundImage: `url(${imageSrcs.backdrop[0]})` }}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
                     <FallbackImage
                        srcs={imageSrcs.still}
                        placeholder={PLACEHOLDER_STILL}
                        alt={`Still from ${episodeDetails.name}`}
                        className="relative h-full w-auto object-contain"
                    />
                </div>
                
                <div className="p-4">
                    <div>
                        <p className="text-sm font-semibold text-text-secondary">
                            S{episodeDetails.season_number} E{episodeDetails.episode_number}
                        </p>
                        <h4 className="font-bold text-lg text-text-primary truncate">{episodeDetails.name}</h4>
                    </div>
                    
                    <p className="text-xs text-text-secondary line-clamp-2 mt-2">{episodeDetails.overview}</p>
                    
                    <div className="grid grid-cols-5 gap-2 mt-4">
                        <ActionButton 
                            icon={<CheckCircleIcon className={`w-6 h-6 ${isWatched ? 'text-green-400' : ''}`} />} 
                            label={isWatched ? "Watched" : "Watch"} 
                            onClick={handleMarkWatched} 
                            isActive={isWatched}
                        />
                        <ActionButton 
                            icon={<PlayCircleIcon className="w-6 h-6" />} 
                            label="Live" 
                            onClick={handleLiveWatch} 
                        />
                        <ActionButton 
                            icon={<BookOpenIcon className="w-6 h-6" />} 
                            label="Journal" 
                            onClick={handleOpenJournal} 
                        />
                        <ActionButton 
                            icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />} 
                            label="Comment" 
                            onClick={() => setIsCommentModalOpen(true)}
                            isActive={!!existingComment}
                        />
                        <ActionButton 
                            icon={<StarIcon filled={isFavorited} className={`w-6 h-6 ${isFavorited ? 'text-yellow-400' : ''}`} />} 
                            label="Favorite" 
                            onClick={handleToggleFavorite} 
                            isActive={isFavorited}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default NextUpWidget;
