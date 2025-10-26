import React, { useState, useEffect } from 'react';
import { getNewSeasons } from '../services/tmdbService';
import { TmdbMediaDetails } from '../types';

interface NewSeasonsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const NewSeasons: React.FC<NewSeasonsProps> = ({ onSelectShow }) => {
    const [newSeasonShows, setNewSeasonShows] = useState<TmdbMediaDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReleases = async () => {
            setLoading(true);
            try {
                const shows = await getNewSeasons();
                setNewSeasonShows(shows);
            } catch (error) {
                console.error("Failed to fetch new seasons", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    if (loading) {
        return (
             <div className="my-8 px-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">📺 New Seasons & Premieres</h2>
                <div className="bg-card-gradient rounded-lg shadow-md p-4 animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-bg-secondary/50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }
    
    if (newSeasonShows.length === 0) {
        return null;
    }

    return (
        <div className="my-8 px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">📺 New Seasons & Premieres</h2>
            <div className="bg-card-gradient rounded-lg shadow-md max-h-80 overflow-y-auto">
                <ul className="divide-y divide-bg-secondary">
                    {newSeasonShows.map(item => {
                        const latestSeason = item.seasons?.find(s => s.season_number === item.last_episode_to_air?.season_number);
                        return (
                            <li key={item.id}>
                                <div 
                                    onClick={() => onSelectShow(item.id, 'tv')}
                                    className="flex justify-between items-center p-3 hover:bg-bg-secondary/50 cursor-pointer transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-text-primary truncate">{item.name}</p>
                                        <p className="text-sm text-text-secondary truncate">{latestSeason?.name || `Season ${item.last_episode_to_air?.season_number}`}</p>
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
        </div>
    );
};

export default NewSeasons;
