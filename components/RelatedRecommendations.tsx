import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryItem, TmdbMedia, UserData, TrackedItem } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import GenericCarousel from './GenericCarousel';

interface RelatedRecommendationsProps {
  seedItems: TrackedItem[];
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
}

const RelatedRecommendations: React.FC<RelatedRecommendationsProps> = (props) => {
  const { seedItems, userData, ...carouselProps } = props;
  const [recommendations, setRecommendations] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const allUserMediaIds = useMemo(() => {
    const ids = new Set<number>();
    userData.watching.forEach(i => ids.add(i.id));
    userData.planToWatch.forEach(i => ids.add(i.id));
    userData.completed.forEach(i => ids.add(i.id));
    return ids;
  }, [userData]);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const lastWatchedMap = new Map<number, number>();
        userData.history.forEach(h => {
            if (!lastWatchedMap.has(h.id)) {
                lastWatchedMap.set(h.id, new Date(h.timestamp).getTime());
            }
        });

        const sortedSeedItems = [...seedItems].sort((a, b) => {
            const timeA = lastWatchedMap.get(a.id) || 0;
            const timeB = lastWatchedMap.get(b.id) || 0;
            return timeB - timeA;
        });

        const recPromises = sortedSeedItems
            .slice(0, 3) // Limit to 3 most recently watched from the list
            .map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
            
        const detailsResults = await Promise.all(recPromises);

        const allRecs = new Map<number, TmdbMedia>();
        detailsResults.forEach(details => {
            if (details?.recommendations?.results) {
                details.recommendations.results.forEach(rec => {
                    if (!allUserMediaIds.has(rec.id) && rec.poster_path && rec.backdrop_path) {
                        allRecs.set(rec.id, rec);
                    }
                });
            }
        });
        
        const sortedRecs = Array.from(allRecs.values()).sort((a,b) => (b.popularity || 0) - (a.popularity || 0));

        setRecommendations(sortedRecs);
      } catch (error) {
        console.error(`Failed to fetch recommendations`, error);
      } finally {
        setLoading(false);
      }
    };
    if (seedItems.length > 0) {
        fetchRecs();
    } else {
        setLoading(false);
        setRecommendations([]);
    }
  }, [seedItems, allUserMediaIds, userData.history]);

  const fetcher = useCallback(() => Promise.resolve(recommendations), [recommendations]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <GenericCarousel
      title="Based on what you've watched"
      fetcher={fetcher}
      recommendationReason="From your watchlist"
      {...carouselProps}
    />
  );
};

export default RelatedRecommendations;