
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HistoryItem, TmdbMedia } from '../types';
import { getMediaDetails, getNewlyPopularEpisodes, getNewReleases } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { TMDB_API_KEY } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface HeroBannerProps {
  history: HistoryItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ history, onSelectShow }) => {
  const [items, setItems] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);

  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (isApiKeyMissing) { setLoading(false); return; }
      setLoading(true);
      try {
        let fetchedItems: (TmdbMedia | null)[] = [];
        if (history.length > 0) {
          const uniqueItems = Array.from(new Map(history.map(item => [item.id, item])).values());
          const recentItems = uniqueItems.slice(0, 10).map((h: HistoryItem) => ({ id: h.id, media_type: h.media_type }));
          fetchedItems = await Promise.all(recentItems.map(item => getMediaDetails(item.id, item.media_type).catch(() => null)));
        } else {
          const [popularEpisodes, popularMovies] = await Promise.all([getNewlyPopularEpisodes(), getNewReleases('movie')]);
          const combined = [...popularEpisodes.slice(0, 5).map(ep => ep.showInfo as TmdbMedia), ...popularMovies.slice(0, 5)];
          fetchedItems = await Promise.all(combined.map(item => getMediaDetails(item.id, item.media_type).catch(() => null)));
        }
        setItems(fetchedItems.filter((d): d is TmdbMedia => d !== null));
      } catch (error) {
        console.error("Failed to fetch hero banner items", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [history, isApiKeyMissing]);
  
  useEffect(() => {
      if (isHoveringRef.current || items.length <= 1) return;
      resetTimeout();
      timeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((prevIndex) => prevIndex === items.length - 1 ? 0 : prevIndex + 1);
      }, 5000);
      return () => resetTimeout();
  }, [currentIndex, items.length, resetTimeout]);

  if (loading) return <div className="w-full h-56 md:h-72 bg-bg-secondary rounded-lg mb-8 animate-pulse"></div>;

  if (items.length === 0) {
    return (
        <div className="w-full h-56 md:h-72 rounded-lg mb-8 overflow-hidden relative group bg-card-gradient">
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-text-primary mt-4 text-center">Welcome to cinemontauge</h2>
                <p className="text-text-secondary text-center">Start tracking your shows to see them here!</p>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full h-56 md:h-72 rounded-lg mb-8 overflow-hidden relative group">
      <div className="w-full h-full flex transition-transform ease-out duration-1000" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((item) => (
          <div key={item.id} onClick={() => onSelectShow(item.id, item.media_type)} className="w-full h-full flex-shrink-0 relative cursor-pointer">
            <img src={getImageUrl(item.backdrop_path || item.poster_path, 'w1280', 'backdrop')} alt={item.title || item.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20"></div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto">
        <h3 className="text-white text-xl md:text-3xl font-bold [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">{items[currentIndex]?.title || items[currentIndex]?.name}</h3>
      </div>
       <div className="absolute top-2 left-4 px-3 py-1 bg-black/50 text-white text-sm font-semibold rounded-full backdrop-blur-sm">
        {history.length > 0 ? "Recently Watched" : "Popular on cinemontauge"}
      </div>
    </div>
  );
};

export default HeroBanner;
