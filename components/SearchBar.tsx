import React, { useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { searchMedia } from '../services/tmdbService';
import { TmdbMedia } from '../types';
import { SearchIcon } from './Icons';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER_SMALL } from '../constants';

interface SearchBarProps {
  onSelectResult: (id: number, media_type: 'tv' | 'movie') => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length > 2) {
        setLoading(true);
        setError(null);
        try {
            const mediaResults = await searchMedia(searchQuery);
            setResults(mediaResults);
        } catch (e) {
            setError('Could not perform search. Please try again later.');
            console.error(e);
        } finally {
            setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 500),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    debouncedSearch(newQuery);
  };

  const handleSelect = (item: TmdbMedia) => {
    onSelectResult(item.id, item.media_type);
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setError(null);
  };

  return (
    <div className="relative w-full max-w-md mx-auto" onBlur={() => setTimeout(() => setIsFocused(false), 200)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Search shows & movies..."
          className="w-full pl-10 pr-4 py-2 bg-gradient-to-r from-bg-secondary to-bg-secondary/80 text-black placeholder-black rounded-lg border border-transparent focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-primary/70" />
      </div>
      {isFocused && (query.length > 0 || results.length > 0 || error) && (
        <div className="absolute z-10 w-full mt-2 bg-card-gradient border border-bg-secondary rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {loading && <div className="p-4 text-center text-text-secondary">Loading...</div>}
          {error && <div className="p-4 text-center text-red-500">{error}</div>}
          {!loading && !error && results.length === 0 && query.length > 2 && (
            <div className="p-4 text-center text-text-secondary">No results found.</div>
          )}
          <ul className="divide-y divide-bg-secondary/50">
            {results.map(item => (
              <li key={item.id} className="flex items-center p-3 hover:bg-bg-secondary cursor-pointer" onClick={() => handleSelect(item)}>
                <img
                  src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : PLACEHOLDER_POSTER_SMALL}
                  alt={item.title || item.name}
                  className="w-12 h-18 object-cover rounded-md"
                  loading="lazy"
                />
                <div className="ml-4 flex-grow min-w-0">
                  <p className="font-semibold text-text-primary truncate">{item.title || item.name}</p>
                  <p className="text-sm text-text-secondary">
                    {item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;