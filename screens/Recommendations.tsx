import React, { useState, useEffect, useMemo } from 'react';
import { UserData, TmdbMedia, TrackedItem } from '../types';
import { getAIRecommendations } from '../services/genaiService';
import CompactShowCard from '../components/CompactShowCard';

interface RecommendationsProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
}

const Recommendations: React.FC<RecommendationsProps> = ({ userData, onSelectShow }) => {
    const [recommendations, setRecommendations] = useState<{ recommendation: any, media: TmdbMedia }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasUserData = useMemo(() => 
        userData.history.length > 0 || 
        userData.favorites.length > 0 || 
        Object.keys(userData.ratings).length > 0, 
    [userData]);

    useEffect(() => {
        const fetchRecs = async () => {
            setLoading(true);
            setError(null);
            try {
                const recs = await getAIRecommendations(userData);
                setRecommendations(recs);
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [userData]);

    return (
        <div className="animate-fade-in">
             {!hasUserData && (
              <p className="text-text-secondary mb-4">
                  Watch and rate items to get personalized AI recommendations!
              </p>
            )}
            
            {loading && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 animate-pulse">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-bg-secondary rounded-lg"></div>
                    ))}
                </div>
            )}
            
            {error && (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg text-center">
                    <h3 className="font-bold">Could not load recommendations</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {!loading && !error && recommendations.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {recommendations.map(({ media }) => (
                        <CompactShowCard
                            key={media.id}
                            item={media as TrackedItem}
                            onSelect={onSelectShow}
                        />
                    ))}
                </div>
            )}
            
            {!loading && !error && recommendations.length === 0 && hasUserData && (
                 <div className="text-center py-10 bg-bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-bold">Not enough data</h2>
                    <p className="mt-2 text-text-secondary">Watch, rate, or favorite some items to get your first recommendations!</p>
                </div>
            )}
        </div>
    );
};

export default Recommendations;