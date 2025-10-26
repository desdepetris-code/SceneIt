import React, { useState, useEffect, useMemo } from 'react';
import { UserData, TmdbMedia } from '../types';
import { discoverMedia } from '../services/tmdbService';
import SuggestionCard from './SuggestionCard';

interface MyListSuggestionsProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia) => void;
}

const MyListSuggestions: React.FC<MyListSuggestionsProps> = ({ userData, onSelectShow, onOpenAddToListModal }) => {
    const [suggestions, setSuggestions] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    const allUserMediaIds = useMemo(() => {
        const ids = new Set<number>();
        userData.watching.forEach(i => ids.add(i.id));
        userData.planToWatch.forEach(i => ids.add(i.id));
        userData.completed.forEach(i => ids.add(i.id));
        userData.favorites.forEach(i => ids.add(i.id));
        userData.customLists.forEach(list => list.items.forEach(i => ids.add(i.id)));
        return ids;
    }, [userData]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const [movies, tv] = await Promise.all([
                    discoverMedia('movie', { sortBy: 'popularity.desc' }),
                    discoverMedia('tv', { sortBy: 'popularity.desc' })
                ]);
                const combined = [...movies, ...tv].sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
                const filtered = combined.filter(item => !allUserMediaIds.has(item.id));
                setSuggestions(filtered.slice(0, 12));
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, [allUserMediaIds]);

    if (loading) {
        return (
             <div className="my-8 px-6">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Add to Your Lists</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 animate-pulse">
                    {[...Array(12)].map((_, i) => <div key={i} className="aspect-[2/3] bg-bg-secondary rounded-lg"></div>)}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="my-8 px-6">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Add to Your Lists</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {suggestions.map(item => (
                    <SuggestionCard 
                        key={item.id} 
                        item={item} 
                        onSelect={onSelectShow} 
                        onAddClick={onOpenAddToListModal} 
                    />
                ))}
            </div>
        </div>
    );
};

export default MyListSuggestions;
