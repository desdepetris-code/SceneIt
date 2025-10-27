import React, { useState, useEffect, useCallback } from 'react';
import { getMediaDetails, getNewSeasons as getGeneralNewSeasons } from '../services/tmdbService';
import { TmdbMediaDetails, TrackedItem } from '../types';
import { ArrowPathIcon } from './Icons';

interface NewSeasonsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  trackedShows: TrackedItem[];
}

const NewSeasons: React.FC<NewSeasonsProps> = ({ onSelectShow, trackedShows }) => {
    const [newSeasonShows, setNewSeasonShows] = useState<TmdbMediaDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const isPersonalized = trackedShows.length > 0;

    const fetchReleases = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        try {
            let shows: TmdbMediaDetails[] = [];
            if (isPersonalized) {
                // Check user's tracked shows for new seasons
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();
                const todayEndTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

                const trackedShowPromises = trackedShows
                    .map(item => getMediaDetails(item.id, 'tv').catch(() => null));
                
                const trackedShowDetails = (await Promise.all(trackedShowPromises))
                    .filter((d): d is TmdbMediaDetails => d !== null);

                const newSeasonsFromTracked = trackedShowDetails.filter(show => {
                    const lastEp = show.last_episode_to_air;
                    if (!lastEp || !lastEp.air_date) return false;
                    const airDate = new Date(lastEp.air_date + 'T00:00:00').getTime();
                    return airDate >= sevenDaysAgoTimestamp && airDate <= todayEndTimestamp;
                });

                // Sort by most recent air date
                newSeasonsFromTracked.sort((a, b) => {
                    const dateA = new Date(a.last_episode_to_air?.air_date || 0).getTime();
                    const dateB = new Date(b.last_episode_to_air?.air_date || 0).getTime();
                    return dateB - dateA;
                });
                shows = newSeasonsFromTracked;
            } else {
                // Fetch general new seasons if user has no tracked shows
                shows = await getGeneralNewSeasons(forceRefresh);
            }
            setNewSeasonShows(shows);
        } catch (error) {
            console.error("Failed to fetch new seasons", error);
        } finally {
            setLoading(false);
        }
    }, [trackedShows, isPersonalized]);

    useEffect(() => {
        fetchReleases();
    }, [fetchReleases]);

    const title = isPersonalized ? "📺 Premieres From Your Lists" : "📺 New Seasons & Premieres";
    const subtitle = !isPersonalized ? "Add shows to your lists to get personalized recommendations here." : null;

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
                <div className="bg-card-gradient rounded-lg shadow-md p-4 animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-bg-secondary/50 rounded-lg"></div>
                    ))}
                </div>
            ) : newSeasonShows.length > 0 ? (
                <div className="bg-card-gradient rounded-lg shadow-md max-h-80 overflow-y-auto">
                    <ul className="divide-y divide-bg-secondary">
                        {newSeasonShows.map(item => {
                            const lastEp = item.last_episode_to_air;
                            return (
                                <li key={item.id}>
                                    <div 
                                        onClick={() => onSelectShow(item.id, 'tv')}
                                        className="flex justify-between items-center p-3 hover:bg-bg-secondary/50 cursor-pointer transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-text-primary truncate">{item.name}</p>
                                            <p className="text-sm text-text-secondary truncate">{lastEp ? `S${lastEp.season_number} E${lastEp.episode_number}: ${lastEp.name}` : 'Recently Aired'}</p>
                                        </div>
                                        {item.last_episode_to_air?.air_date && (
                                            <p className="text-sm text-text-secondary flex-shrink-0 ml-4">
                                                {new Date(item.last_episode_to_air.air_date + 'T00:00:00').toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <div className="bg-card-gradient rounded-lg shadow-md p-8 text-center">
                    <p className="text-text-secondary">
                        {isPersonalized
                            ? "No new premieres from your tracked shows in the last 7 days."
                            : "No new premieres found in the last 7 days."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default NewSeasons;