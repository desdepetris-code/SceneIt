import React, { useState, useEffect } from 'react';
import { getNewlyPopularEpisodes } from '../services/tmdbService';
import { NewlyPopularEpisode } from '../types';
import { ChevronLeftIcon } from '../components/Icons';
import EpisodeCard from '../components/EpisodeCard';

interface AllNewlyPopularEpisodesScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const AllNewlyPopularEpisodesScreen: React.FC<AllNewlyPopularEpisodesScreenProps> = ({ onBack, onSelectShow }) => {
    const [episodes, setEpisodes] = useState<NewlyPopularEpisode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            setLoading(true);
            try {
                const results = await getNewlyPopularEpisodes();
                setEpisodes(results);
            } catch (error) {
                console.error("Failed to fetch all newly popular episodes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEpisodes();
    }, []);

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
            <header className="flex items-center mb-6 relative">
                <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-3xl font-bold text-text-primary text-center w-full">Newly Popular Episodes</h1>
            </header>
            
            {loading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-pulse">
                    {[...Array(15)].map((_, i) => (
                        <div key={i}>
                            <div className="aspect-video bg-bg-secondary rounded-lg"></div>
                            <div className="h-4 bg-bg-secondary rounded-md mt-2 w-3/4"></div>
                            <div className="h-3 bg-bg-secondary rounded-md mt-1 w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {episodes.map(item => (
                        <EpisodeCard 
                            key={`${item.showInfo.id}-${item.episode.id}`} 
                            item={item} 
                            onSelectShow={onSelectShow}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllNewlyPopularEpisodesScreen;