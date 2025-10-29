import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, WatchProgress, TmdbMediaDetails, TmdbSeasonDetails, Episode, TvdbShow, EpisodeTag } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon } from './Icons';
import { getTvdbShowExtended } from '../services/tvdbService';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL, TMDB_IMAGE_BASE_URL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { isNewRelease } from '../utils/formatUtils';
import BrandedImage from './BrandedImage';

interface ContinueWatchingProgressCardProps {
    item: TrackedItem;
    watchProgress: WatchProgress;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, item: TrackedItem) => void;
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // for TVDB images
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};


const ContinueWatchingProgressCard: React.FC<ContinueWatchingProgressCardProps> = ({ item, watchProgress, onSelectShow, onToggleEpisode }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<TmdbSeasonDetails | null>(null);
    const [nextEpisodeInfo, setNextEpisodeInfo] = useState<Episode | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const nextEpisode = useMemo(() => {
        if (!details || !details.seasons) {
            return null;
        }
        
        const progressForShow = watchProgress[item.id] || {};
        const sortedSeasons = [...details.seasons]
            .filter(s => s.season_number > 0)
            .sort((a, b) => a.season_number - b.season_number);
        
        for (const season of sortedSeasons) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                    return { season: season.season_number, episode: i };
                }
            }
        }
        return null;
    }, [details, watchProgress, item.id]);

    const seasonProgressPercent = useMemo(() => {
        if (!details || !nextEpisode) {
            return 0;
        }
        
        const currentSeason = details.seasons?.find(s => s.season_number === nextEpisode.season);
        if (!currentSeason) {
            return 0;
        }
    
        const totalInSeason = currentSeason.episode_count;
        const progressForShow = watchProgress[item.id] || {};
        const progressForSeason = progressForShow[nextEpisode.season] || {};
    
        let watchedInSeason = 0;
        for (let i = 1; i <= totalInSeason; i++) {
            if (progressForSeason[i]?.status === 2) {
                watchedInSeason++;
            }
        }
    
        return totalInSeason > 0 ? (watchedInSeason / totalInSeason) * 100 : 0;
    }, [details, nextEpisode, watchProgress, item.id]);


    useEffect(() => {
        let isMounted = true;
        const fetchAllDetails = async () => {
            if (!item.id) return;
            setIsLoading(true);
            try {
                const mediaDetails = await getMediaDetails(item.id, 'tv');
                if (!isMounted) return;
                setDetails(mediaDetails);
                
                if (mediaDetails.external_ids?.tvdb_id) {
                    getTvdbShowExtended(mediaDetails.external_ids.tvdb_id)
                        .then(tvdbData => {
                           if (isMounted) setTvdbDetails(tvdbData);
                        })
                        .catch(e => console.error("Failed to get TVDB details", e));
                }

                // We need to re-calculate nextEpisode with the new details
                const progressForShow = watchProgress[item.id] || {};
                const sortedSeasons = [...(mediaDetails.seasons || [])]
                    .filter(s => s.season_number > 0)
                    .sort((a, b) => a.season_number - b.season_number);
                
                let foundNextEp = null;
                for (const season of sortedSeasons) {
                    for (let i = 1; i <= season.episode_count; i++) {
                        if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                            foundNextEp = { season: season.season_number, episode: i };
                            break;
                        }
                    }
                    if(foundNextEp) break;
                }
                
                if (foundNextEp) {
                    const seasonData = await getSeasonDetails(item.id, foundNextEp.season);
                    if (!isMounted) return;
                    setSeasonDetails(seasonData);
                    const episode = seasonData.episodes.find(e => e.episode_number === foundNextEp.episode);
                    if (isMounted) setNextEpisodeInfo(episode || null);
                }
            } catch (error) {
                console.error(`Failed to fetch details for ${item.title}`, error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchAllDetails();
        return () => {
            isMounted = false;
        };
    }, [item.id, item.title, watchProgress]);
    
    const seasonPosterSrcs = useMemo(() => {
        const nextSeasonNumber = nextEpisode?.season;
        // Find the season object from the main details to get its poster
        const tmdbSeason = details?.seasons?.find(s => s.season_number === nextSeasonNumber);

        // Prioritized list of image paths according to the specified hierarchy
        const paths = [
            tmdbSeason?.poster_path,    // 1. TMDB season image
            // 2. TVDB season image - not available without extra API calls, so skipped.
            details?.poster_path,       // 3. TMDB show poster
            tvdbDetails?.image,         // 4. TVDB show poster
            item.poster_path            // 5. Fallback to the initial item poster from list
        ];

        // Convert paths to full URLs, filtering out any null/undefined entries
        return paths.map(p => getFullImageUrl(p, 'w342'));
    }, [details, tvdbDetails, item.poster_path, nextEpisode]);
    
    const episodeStillSrcs = useMemo(() => {
        const paths = [
            nextEpisodeInfo?.still_path,
            seasonDetails?.poster_path,
            details?.poster_path,
            tvdbDetails?.image,
        ];
        return [
            getFullImageUrl(paths[0], 'w300'),
            getFullImageUrl(paths[1], 'w342'),
            getFullImageUrl(paths[2], 'w342'),
            getFullImageUrl(paths[3], 'original')
        ];
    }, [nextEpisodeInfo, seasonDetails, details, tvdbDetails]);

    const episodeTag: EpisodeTag | null = useMemo(() => {
        if (!nextEpisodeInfo || !details) return null;
        const season = details.seasons?.find(s => s.season_number === nextEpisodeInfo.season_number);
        return getEpisodeTag(nextEpisodeInfo, season, details, seasonDetails);
    }, [nextEpisodeInfo, details, seasonDetails]);

    const isNew = isNewRelease(nextEpisodeInfo?.air_date);

    if (isLoading) {
        return (
            <div className="w-full aspect-[10/16] bg-card-gradient rounded-lg shadow-md animate-pulse">
                <div className="w-full h-full bg-bg-secondary rounded-lg"></div>
            </div>
        );
    }
    
    if (!details) return null; // Or some error state

    const handleMarkWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nextEpisode) {
            onToggleEpisode(item.id, nextEpisode.season, nextEpisode.episode, 0, item);
        }
    };

    return (
        <div 
            className="w-full aspect-[10/16] bg-card-gradient rounded-lg shadow-lg flex flex-col relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-2"
            onClick={() => onSelectShow(item.id, 'tv')}
        >
            <BrandedImage title={item.title}>
                <FallbackImage 
                    srcs={seasonPosterSrcs}
                    placeholder={PLACEHOLDER_POSTER}
                    noPlaceholder={true}
                    alt={`${item.title} season poster`} 
                    className="absolute inset-0 w-full h-full object-cover" 
                />
            </BrandedImage>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            
            <div className="absolute top-2 right-2 flex items-center space-x-2">
                {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                {episodeTag && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm ${episodeTag.className}`}>
                        {episodeTag.text}
                    </div>
                )}
            </div>

            {nextEpisodeInfo && (
              <FallbackImage 
                srcs={episodeStillSrcs} 
                placeholder={PLACEHOLDER_STILL}
                noPlaceholder={true}
                alt="Next episode thumbnail" 
                className="absolute bottom-[28%] right-3 w-28 aspect-video object-cover rounded-md border-2 border-white/20 shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 pl-8 mt-auto">
                <h3 className="font-bold text-white text-lg truncate [text-shadow:0_1px_3px_#000]">{item.title}</h3>
                {nextEpisode && nextEpisodeInfo ? (
                    <p className="text-sm text-white/80 truncate [text-shadow:0_1px_3px_#000]">
                        {`S${nextEpisode.season} E${nextEpisode.episode}: ${nextEpisodeInfo.name}`}
                    </p>
                ) : (
                    <p className="text-sm text-green-400 font-semibold">All caught up!</p>
                )}
            </div>

            {nextEpisode && (
              <div
                onClick={handleMarkWatched}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Mark next episode watched"
              >
                  <div className="p-4 bg-backdrop rounded-full">
                      <PlayIcon className="w-8 h-8 text-white" />
                  </div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/20">
                <div className="h-full bg-accent-gradient transition-all duration-500" style={{ width: `${seasonProgressPercent}%` }}></div>
            </div>
        </div>
    );
};

export default ContinueWatchingProgressCard;