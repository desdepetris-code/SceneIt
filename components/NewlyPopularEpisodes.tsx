import React, { useState, useEffect } from 'react';
import { getNewlyPopularEpisodes } from '../services/tmdbService';
import { NewlyPopularEpisode } from '../types';
import Carousel from './Carousel';
import EpisodeCard from './EpisodeCard';
import { ChevronRightIcon } from './Icons';

interface NewlyPopularEpisodesProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onViewMore?: () => void;
}

const NewlyPopularEpisodes: React.FC<NewlyPopularEpisodesProps> = ({ onSelectShow, onViewMore }) => {
    const [episodes, setEpisodes] = useState<NewlyPopularEpisode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEpisodes = async () => {
            setLoading(true);
            try {
                const results = await getNewlyPopularEpisodes();
                setEpisodes(results);
            } catch (error) {
                console.error("Failed to fetch newly popular episodes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEpisodes();
    }, []);

    if (loading) {
        return (
             <div className="my-8">
                <div className="h-8 w-3/4 bg-bg-secondary rounded-md mb-4 px-6"></div>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4 hide-scrollbar">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-64 flex-shrink-0">
                             <div className="aspect-video bg-bg-secondary rounded-lg"></div>
                             <div className="h-4 bg-bg-secondary rounded-md mt-2 w-3/4"></div>
                             <div className="h-3 bg-bg-secondary rounded-md mt-1 w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (episodes.length === 0) {
        return null;
    }

    return (
        <div className="my-8">
            <div className="flex justify-between items-center mb-4 px-6">
                <h2 className="text-2xl font-bold text-text-primary">📺 Newly Popular Episodes</h2>
                {onViewMore && (
                    <button onClick={onViewMore} className="text-sm view-more-button flex items-center rounded-full px-3 py-1 transition-colors">
                        <span>View More</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
                    </button>
                )}
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {episodes.slice(0, 10).map(item => (
                        <EpisodeCard 
                            key={`${item.showInfo.id}-${item.episode.id}`}
                            item={item}
                            onSelectShow={onSelectShow}
                        />
                    ))}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default NewlyPopularEpisodes;