import React, { useState, useEffect } from 'react';
import { TmdbMedia, TrackedItem, UserData, AppPreferences } from '../types';
import { getTopPicksMixed, getTrending } from '../services/tmdbService';
import ActionCard from '../components/ActionCard';

interface RecommendationsProps {
  mediaType?: 'movie' | 'tv';
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  showRatings: boolean;
  preferences: AppPreferences;
  userData: UserData;
  columns?: string;
}

const Recommendations: React.FC<RecommendationsProps> = ({ 
    mediaType,
    onSelectShow, 
    onOpenAddToListModal, 
    onMarkShowAsWatched, 
    onToggleFavoriteShow, 
    favorites, 
    completed, 
    showRatings, 
    preferences,
    userData,
    columns = "grid-cols-2"
}) => {
    const [items, setItems] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (mediaType) {
                    const results = await getTrending(mediaType);
                    setItems(results.slice(0, 10));
                } else {
                    const results = await getTopPicksMixed();
                    setItems(results);
                }
            } catch (e) {
                console.error("Failed to fetch discovery items", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [mediaType]);

    if (loading) {
        return (
            <div className={`grid ${columns} gap-4`}>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-bg-secondary/40 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className={`grid ${columns} gap-4 md:gap-6`}>
                {items.map((item) => (
                    <ActionCard 
                        key={`${item.id}-${item.media_type}`} 
                        item={item} 
                        onSelect={onSelectShow}
                        onOpenAddToListModal={onOpenAddToListModal}
                        onMarkShowAsWatched={onMarkShowAsWatched}
                        onToggleFavoriteShow={onToggleFavoriteShow}
                        isFavorite={favorites.some(f => f.id === item.id)}
                        isCompleted={completed.some(c => c.id === item.id)}
                        showRatings={showRatings}
                        showSeriesInfo="hidden"
                        userRating={userData.ratings[item.id]?.rating || 0}
                        userData={userData}
                    />
                ))}
            </div>
        </div>
    );
};

export default Recommendations;