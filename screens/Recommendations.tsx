import React, { useState, useEffect, useMemo } from 'react';
import { getMediaDetails } from '../services/tmdbService';
import { TmdbMedia, UserData, HistoryItem } from '../types';
import MediaCard from '../components/MediaCard';

interface RecommendationsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  userData: UserData;
}

const RecommendationCarousel: React.FC<{
  title: string;
  items: TmdbMedia[];
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}> = ({ title, items, onSelect }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-text-primary px-6 mb-4">{title}</h2>
    <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
      {items.map(item => (
          <div key={item.id} className="w-40 sm:w-48 flex-shrink-0">
             <MediaCard item={item} onSelect={onSelect} />
          </div>
      ))}
      <div className="w-4 flex-shrink-0"></div>
    </div>
  </section>
);

const Recommendations: React.FC<RecommendationsProps> = ({ onSelectShow, userData }) => {
  const { history } = userData;
  const [recommendationSections, setRecommendationSections] = useState<{ source: HistoryItem, recommendations: TmdbMedia[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recentUniqueItems = useMemo(() => {
    const uniqueIds = new Set<number>();
    const result: HistoryItem[] = [];
    for (const item of history) {
      if (!uniqueIds.has(item.id)) {
        uniqueIds.add(item.id);
        result.push(item);
      }
      if (result.length >= 5) break; // Get recommendations for the 5 most recent unique items
    }
    return result;
  }, [history]);

  useEffect(() => {
    if (recentUniqueItems.length === 0) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const recommendationPromises = recentUniqueItems.map(item =>
          getMediaDetails(item.id, item.media_type).then(details => ({
            source: item,
            recommendations: details.recommendations?.results || []
          }))
        );
        const results = await Promise.all(recommendationPromises);
        setRecommendationSections(results.filter(r => r.recommendations.length > 0));
      } catch (e) {
        console.error(e);
        setError("Could not load recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [recentUniqueItems]);

  if (loading) {
    return (
        <div className="animate-fade-in px-6">
            <header className="mb-8">
                <div className="h-8 bg-bg-secondary rounded w-1/2"></div>
                <div className="h-4 bg-bg-secondary rounded w-3/4 mt-3"></div>
            </header>
            {[...Array(3)].map((_, i) => (
                <div key={i} className="mb-8 animate-pulse">
                    <div className="h-6 bg-bg-secondary rounded w-1/3 mb-4"></div>
                    <div className="flex space-x-4">
                        {[...Array(5)].map((_, j) => (
                            <div key={j} className="w-48 h-[270px] flex-shrink-0 bg-bg-secondary rounded-lg"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }
  
  if (recommendationSections.length === 0) {
     return (
        <div className="text-center py-20 px-6">
          <h1 className="text-3xl font-bold">Personalized Recommendations</h1>
          <h2 className="text-2xl font-bold text-text-primary mt-8">Start Your Journey!</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            Watch a few shows or movies, and this page will fill up with personalized recommendations based on your tastes.
          </p>
        </div>
      );
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8 px-6">
        <h1 className="text-3xl font-bold">Personalized Recommendations</h1>
        <p className="mt-2 text-text-secondary">Suggestions based on your recent activity.</p>
      </header>

      {recommendationSections.map(({ source, recommendations }) => (
        <RecommendationCarousel
          key={source.id}
          title={`Because you watched ${source.title}`}
          items={recommendations}
          onSelect={onSelectShow}
        />
      ))}
    </div>
  );
};

export default Recommendations;