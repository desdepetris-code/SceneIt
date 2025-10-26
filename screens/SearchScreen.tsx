import React, { useState, useEffect, useRef, useCallback } from 'react';
import { discoverMediaPaginated } from '../services/tmdbService';
import { TmdbMedia } from '../types';
import MediaCard from '../components/MediaCard';
import { ChevronDownIcon } from '../components/Icons';

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  genres: Record<number, string>;
}

const popularGenres = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" }, { id: 35, name: "Comedy" }, { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" }, { id: 18, name: "Drama" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" }, { id: 36, name: "History" },
  { id: 27, name: "Horror" }, { id: 10402, name: "Music" }, { id: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" }, { id: 10752, name: "War" }, { id: 37, name: "Western" }
];

const SearchScreen: React.FC<SearchScreenProps> = ({ onSelectShow, genres }) => {
  const [mediaType, setMediaType] = useState<'tv' | 'movie'>('tv');
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const observer = useRef<IntersectionObserver>();
  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < totalPages) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, page, totalPages]);

  useEffect(() => {
    // Reset results and page when filters change
    setResults([]);
    setPage(1);
    setTotalPages(1);
  }, [mediaType, selectedGenre, selectedYear]);

  useEffect(() => {
    const fetchDiscover = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);
      try {
        const filters = { genre: selectedGenre, year: selectedYear };
        const data = await discoverMediaPaginated(mediaType, filters, page);
        setResults(prev => (page === 1 ? data.results : [...prev, ...data.results]));
        setTotalPages(data.total_pages);
      } catch (e) {
        console.error(e);
        setError("Could not perform search. Please try again later.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchDiscover();
  }, [mediaType, selectedGenre, selectedYear, page]);
  
  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="animate-fade-in px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Discover</h1>
        <p className="mt-2 text-text-secondary">Find new shows and movies to watch.</p>
      </header>

      <div className="flex p-1 bg-bg-secondary rounded-md max-w-xs mb-4">
          <button onClick={() => setMediaType('tv')} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${mediaType === 'tv' ? 'bg-accent-gradient text-on-accent font-semibold' : 'text-text-secondary'}`}>
              TV Shows
          </button>
          <button onClick={() => setMediaType('movie')} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${mediaType === 'movie' ? 'bg-accent-gradient text-on-accent font-semibold' : 'text-text-secondary'}`}>
              Movies
          </button>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
            <button onClick={() => setSelectedGenre(undefined)} className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${!selectedGenre ? 'bg-accent-gradient text-on-accent font-semibold' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}>
                All Genres
            </button>
            {popularGenres.map(genre => (
                <button key={genre.id} onClick={() => setSelectedGenre(genre.id)} className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${selectedGenre === genre.id ? 'bg-accent-gradient text-on-accent font-semibold' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}>
                    {genre.name}
                </button>
            ))}
        </div>
      </div>
      
      <div className="relative max-w-xs mb-8">
        <select value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)} className="appearance-none w-full bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 animate-pulse">
            {[...Array(12)].map((_, i) => <div key={i} className="w-full aspect-[2/3] bg-bg-secondary rounded-lg"></div>)}
        </div>
      )}
      {error && <div className="text-center p-8 text-red-500">{error}</div>}
      
      {!loading && !error && results.length > 0 && (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {results.map((item, index) => {
                    if (results.length === index + 1) {
                        return <div ref={lastElementRef} key={item.id}><MediaCard item={item} onSelect={onSelectShow} /></div>
                    }
                    return <MediaCard key={item.id} item={item} onSelect={onSelectShow} />;
                })}
            </div>
            {loadingMore && <div className="text-center p-8">Loading more...</div>}
        </>
      )}

      {!loading && !error && results.length === 0 && (
         <div className="text-center py-20 px-6">
          <h2 className="text-2xl font-bold text-text-primary">No Results Found</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            Try adjusting your filters to find different shows or movies.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchScreen;