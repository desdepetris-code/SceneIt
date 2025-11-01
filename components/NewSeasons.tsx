import React, { useState, useEffect, useCallback } from 'react';
import { getMediaDetails } from '../services/tmdbService';
import { getNewSeasons as getGeneralNewSeasons } from '../services/tmdbService';
import { TmdbMediaDetails, TrackedItem, WatchProgress, EpisodeProgress } from '../types';
import { ArrowPathIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from './Carousel';

interface NewSeasonInfo {
    showId: number;
    showTitle: string;
    showPoster: string | null;
    seasonNumber: number;
    seasonName: string;
    seasonPoster: string | null;
    airDate: string;
    isSeriesPremiere: boolean;
}

interface NewSeasonCardProps {
  item: NewSeasonInfo;
  onSelectShow: (id: number, media_type: 'tv') => void;
}

const NewSeasonCard: React.FC<NewSeasonCardProps> = ({ item, onSelectShow }) => {
    const posterUrl = getImageUrl(item.seasonPoster || item.showPoster, 'w342');
    return (
        <div onClick={() => onSelectShow(item.showId, 'tv')} className="w-48 flex-shrink-0 cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img src={posterUrl} alt={item.showTitle} className="w-full aspect-[2/3] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full self-start mb-1 text-white backdrop-blur-sm ${item.isSeriesPremiere ? 'bg-purple-600/80' : 'bg-blue-600/80'}`}>
                        {item.isSeriesPremiere ? 'Series Premiere' : 'New Season'}
                    </span>
                    <h4 className="font-bold text-white text-sm truncate">{item.showTitle}</h4>
                    <p className="text-xs text-white/80 truncate">{item.seasonName}</p>
                </div>
            </div>
        </div>
    );
}

const isSeasonFullyWatched = (seasonProgress: Record<number, EpisodeProgress> | undefined, episodeCount: number): boolean => {
    if (!seasonProgress || episodeCount === 0) return false;
    const watchedEpisodes = Object.values(seasonProgress).filter(ep => ep.status === 2).length;
    return watchedEpisodes >= episodeCount;
};


interface NewSeasonsProps {
  title: string;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  trackedShows: TrackedItem[];
  watchProgress: WatchProgress;
  timezone: string;
}

const NewSeasons: React.FC<NewSeasonsProps> = ({ title, onSelectShow, trackedShows, watchProgress, timezone }) => {
    const [newSeasons, setNewSeasons] = useState<NewSeasonInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const isPersonalized = trackedShows.length > 0;

    const fetchReleases = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            let detailedShows: TmdbMediaDetails[];

            if (isPersonalized) {
                const detailPromises = trackedShows.map(s => getMediaDetails(s.id, 'tv').catch(() => null));
                detailedShows = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);
            } else {
                detailedShows = await getGeneralNewSeasons(forceRefresh, timezone);
            }

            const foundSeasons: NewSeasonInfo[] = [];

            for (const details of detailedShows) {
                if (!details.seasons) continue;

                const sortedSeasons = [...details.seasons].sort((a,b) => b.season_number - a.season_number);

                for (const season of sortedSeasons) {
                    if (season.season_number === 0) continue; 

                    if (season.air_date) {
                        const airDate = new Date(`${season.air_date}T00:00:00Z`);
                        if (airDate >= thirtyDaysAgo && airDate <= thirtyDaysFromNow) {
                            
                            if (isPersonalized) {
                                const progressForSeason = watchProgress[details.id]?.[season.season_number];
                                if (isSeasonFullyWatched(progressForSeason, season.episode_count)) {
                                    continue;
                                }
                            }

                            foundSeasons.push({
                                showId: details.id,
                                showTitle: details.name || 'Untitled',
                                showPoster: details.poster_path,
                                seasonNumber: season.season_number,
                                seasonName: season.name,
                                seasonPoster: season.poster_path,
                                airDate: season.air_date,
                                isSeriesPremiere: season.season_number === 1,
                            });
                            break; 
                        }
                    }
                }
            }
            
            foundSeasons.sort((a, b) => new Date(b.airDate).getTime() - new Date(a.airDate).getTime());
            setNewSeasons(foundSeasons);
        } catch (error) {
            console.error("Failed to fetch new seasons/premieres", error);
        } finally {
            setLoading(false);
        }
    }, [trackedShows, isPersonalized, timezone, watchProgress]);

    useEffect(() => {
        fetchReleases();
    }, [fetchReleases]);
    
    const subtitle = !isPersonalized && title.includes("All") ? "Popular premieres from the last 30 days. Track shows to personalize this section." : null;

    return (
        <div className="my-8 px-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
                {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
              </div>
              <button
                onClick={() => fetchReleases(true)}
                disabled={loading}
                className="p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                aria-label="Refresh new seasons"
              >
                  <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {loading ? (
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4 hide-scrollbar">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="w-48 flex-shrink-0">
                             <div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div>
                        </div>
                    ))}
                </div>
            ) : newSeasons.length > 0 ? (
                <Carousel>
                    <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                        {newSeasons.map(item => (
                            <NewSeasonCard key={`${item.showId}-${item.seasonNumber}`} item={item} onSelectShow={onSelectShow as any} />
                        ))}
                        <div className="w-4 flex-shrink-0"></div>
                    </div>
                </Carousel>
            ) : (
                <div className="bg-card-gradient rounded-lg shadow-md p-8 text-center">
                    <p className="text-text-secondary">
                        {isPersonalized
                            ? "No recent premieres from your tracked shows."
                            : "No new premieres found in the last 30 days."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default NewSeasons;