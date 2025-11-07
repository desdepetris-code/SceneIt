import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HistoryItem, TmdbMedia } from '../types';
import { discoverMedia, getMediaDetails, getNewlyPopularEpisodes, getNewReleases } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { TMDB_API_KEY } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import ScoreBadge from './ScoreBadge';

interface HeroBannerProps {
  history: HistoryItem[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  showRatings: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ history, onSelectShow, showRatings }) => {
  const [items, setItems] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const isHoveringRef = useRef(false);
  
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // FIX: Cast TMDB_API_KEY to string to prevent TypeScript error on constant comparison.
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';

  const resetTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (isApiKeyMissing) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let fetchedItems: (TmdbMedia | null)[] = [];
        if (history.length > 0) {
          const uniqueItems = Array.from(new Map(history.map(item => [item.id, item])).values());
          const recentItems = uniqueItems.slice(0, 10).map((h: HistoryItem) => ({
              id: h.id,
              media_type: h.media_type,
          }));
          const detailsPromises = recentItems.map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
          fetchedItems = await Promise.all(detailsPromises);
        } else {
          // New user logic: fetch popular episodes and movies
          const [popularEpisodes, popularMovies] = await Promise.all([
            getNewlyPopularEpisodes(),
            getNewReleases('movie')
          ]);
          
          const showsFromEpisodes = popularEpisodes.slice(0, 5).map(ep => ep.showInfo as TmdbMedia);
          const movies = popularMovies.slice(0, 5);

          const combined = [...showsFromEpisodes, ...movies];
          const detailsPromises = combined.map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
          fetchedItems = await Promise.all(detailsPromises);
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
      if (isHoveringRef.current || isTouching || items.length <= 1) return;
      resetTimeout();
      timeoutRef.current = window.setTimeout(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === items.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => {
        resetTimeout();
      };
  }, [currentIndex, items.length, resetTimeout, isTouching]);
  
  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? items.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === items.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setIsTouching(true);
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    setIsTouching(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  if (isApiKeyMissing) {
      return (
         <div className="w-full h-56 md:h-72 bg-red-500/20 rounded-lg mb-8 flex flex-col items-center justify-center text-center p-4">
            <h3 className="font-bold text-lg text-red-300">Hero Banner Disabled</h3>
            <p className="mt-2 text-sm text-red-300">Please add your TMDB API key to the `constants.ts` file to enable this feature.</p>
        </div>
      )
  }

  if (loading) {
    return (
      <div className="w-full h-56 md:h-72 bg-bg-secondary rounded-lg mb-8 animate-pulse"></div>
    );
  }

  if (items.length === 0) {
    return (
        <div className="w-full h-56 md:h-72 rounded-lg mb-8 overflow-hidden relative group bg-card-gradient">
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZy1ncmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzRGNDZFNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzMxMkU4MSIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLWJvZHktZ3JhZCIgeDE9IjAuNSIgeTE9IjAiIHgyPSIwLjUiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9vcC1jb2xvcj0iIzM3NDE1MSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFGMjkzNyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLXRvcC1ncmFkIiB4MT0iMC41IiB5MT0iMCIgeDI9IjAuNSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0QjU1NjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzNzQxNTEiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYWNjZW50LWdyYWQiIHgxPSIwLjUiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9vcC1jb2xvcj0iI0E3OEJGRiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzg4NTBGRjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjQiIHJ5PSIyNCIgZmlsbD0iIzFFMUI0QiIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgcnk9IjIwIiBmaWxsPSJ1cmwoI2JnLWdyYWQpIi8+PHJlY3QgeD0iMTgiIHk9IjE4IiB3aWR0aD0iOTIiIGhlaWdodD0iOTIiIHJ4PSIxNiIgcnk9IjE2IiBmaWxsPSIjMzEyRTgxIiBmaWxsLW9wYWNpdHk9IjAuNSIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAyOSkiPjxyZWN0IHg9IjIiIHk9IjI0IiB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjIiLz48cmVjdCB4PSIwIiB5PSIyMiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiByeD0iNSIgcnk9IjUiIGZpbGw9InVybCgjY2xhcHBlci1ib2R5LWdyYWQpIi8+PHBhdGggZD0iTTMyIDM4IEw1MiA1MCBMMyA2MiBaIiBmaWxsPSJ1cmwoI2FjY2VudC1ncmFkKSIvPjxnIHRyYW5zZm9ybT0icm90YXRlKC01IDAgOSkiPjxwYXRoIGQ9Ik0yIDIgSDgyIEw3NyAyMCBILTMgWiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjIiLz48L2c+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTUgMCA5KSI+PHBhdGggZD0iTTAgMCBIODAgTDc1IDE4IEgtNSBaIiBmaWxsPSJ1cmwoI2NsYXBwZXItdG9wLWdyYWQpIi8+PHBhdGggZD0iTTUgMiBIMTggTDEzIDE2IEgwIFoiIGZpbGw9InVybCgjYWNjZW50LWdyYWQpIi8+PHBhdGggZD0iTTI1IDIgSDM4IEwzMyAxNiBIMjAgWiIgZmlsbD0idXJsKCNhY2NlbnQtZ3JhZCkiLz48cGF0aCBkPSJNNDUgMiBINTggTDUzIDE2IEg0MCBaIiBmaWxsPSJ1cmwoI2FjY2VudC1ncmFkKSIvPjxwYXRoIGQ9Ik02NSAyIEg3OCBMNzMgMTYgSDYwIFoiIGZpbGw9InVybCgjYWNjZW50LWdyYWQpIi8+PC9nPjwvZz48L3N2Zz4=" alt="SceneIt Logo" className="h-16 w-16 opacity-50" />
                <h2 className="text-2xl font-bold text-text-primary mt-4 text-center">Welcome to SceneIt</h2>
                <p className="text-text-secondary text-center">Start tracking your shows to see them here!</p>
            </div>
        </div>
    );
  }

  return (
    <div 
        className="w-full h-56 md:h-72 rounded-lg mb-8 overflow-hidden relative group"
        onMouseEnter={() => isHoveringRef.current = true}
        onMouseLeave={() => isHoveringRef.current = false}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <div className="w-full h-full flex transition-transform ease-out duration-1000" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectShow(item.id, item.media_type)}
            className="w-full h-full flex-shrink-0 relative cursor-pointer"
          >
            <img 
                src={getImageUrl(item.backdrop_path || item.poster_path, 'w1280', 'backdrop')} 
                alt={item.title || item.name} 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/20"></div>
          </div>
        ))}
      </div>
      
      {/* --- Overlay Content --- */}
      <div className="absolute inset-0 pointer-events-none">
          {/* Title for current slide */}
          <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-auto">
             <div className="flex items-center gap-4">
                <h3 className="text-white text-xl md:text-3xl font-bold [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
                    {items[currentIndex]?.title || items[currentIndex]?.name}
                </h3>
                {showRatings && items[currentIndex]?.vote_average && items[currentIndex].vote_average > 0 && (
                  <ScoreBadge score={items[currentIndex].vote_average} voteCount={(items[currentIndex] as any).vote_count} size="sm" />
                )}
            </div>
          </div>
          
           {/* Navigation Buttons */}
          <button onClick={goToPrevious} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-white pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeftIcon className="w-6 h-6"/>
          </button>
          <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-white pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRightIcon className="w-6 h-6"/>
          </button>
          
           {/* Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 pointer-events-auto">
              {items.map((_, slideIndex) => (
                  <div key={slideIndex} onClick={() => setCurrentIndex(slideIndex)} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${currentIndex === slideIndex ? 'bg-white' : 'bg-white/50'}`}></div>
              ))}
          </div>
      </div>

       <div className="absolute top-2 left-4 px-3 py-1 bg-black/50 text-white text-sm font-semibold rounded-full backdrop-blur-sm">
        {history.length > 0 ? "Recently Watched" : "Popular on SceneIt"}
      </div>
    </div>
  );
};

export default HeroBanner;