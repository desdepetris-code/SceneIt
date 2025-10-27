import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { searchMedia } from '../services/tmdbService';
import { TmdbMedia } from '../types';
import { SearchIcon, CheckCircleIcon, CalendarIcon, ChevronRightIcon } from './Icons';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER_SMALL } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';

interface SearchBarProps {
  onSelectResult: (id: number, media_type: 'tv' | 'movie') => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  value: string;
  onChange: (query: string) => void;
  disableDropdown?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectResult, onMarkShowAsWatched, value, onChange, disableDropdown }) => {
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length > 0) {
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

  useEffect(() => {
    debouncedSearch(value);
  }, [value, debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = (item: TmdbMedia) => {
    onSelectResult(item.id, item.media_type);
    onChange('');
    setResults([]);
    setIsFocused(false);
    setError(null);
  };
  
  const handleMarkWatched = (e: React.MouseEvent, item: TmdbMedia) => {
    e.stopPropagation();
    onMarkShowAsWatched(item);
    onChange('');
    setIsFocused(false);
  };
  
  const handleOpenCalendar = (e: React.MouseEvent, item: TmdbMedia) => {
    e.stopPropagation();
    setMarkAsWatchedModalState({ isOpen: true, item: item });
  };
  
  const handleSaveWatchedDate = (data: { date: string; note: string }) => {
    if (markAsWatchedModalState.item) {
        onMarkShowAsWatched(markAsWatchedModalState.item, data.date);
    }
    setMarkAsWatchedModalState({ isOpen: false, item: null });
    onChange('');
    setIsFocused(false);
  };

  return (
    <>
        <MarkAsWatchedModal
            isOpen={markAsWatchedModalState.isOpen}
            onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
            mediaTitle={markAsWatchedModalState.item?.title || markAsWatchedModalState.item?.name || ''}
            onSave={handleSaveWatchedDate}
        />
        <div className="relative w-full max-w-md mx-auto" onBlur={() => setTimeout(() => setIsFocused(false), 200)}>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              placeholder="Search shows & movies..."
              className="w-full pl-10 pr-4 py-2 bg-bg-secondary text-text-primary placeholder-text-secondary rounded-lg border border-transparent focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-primary/70" />
          </div>
          {!disableDropdown && isFocused && (value.length > 0 || results.length > 0 || error) && (
            <div className="absolute z-10 w-full mt-2 bg-bg-primary border border-bg-secondary rounded-lg shadow-xl max-h-96 flex flex-col">
              {loading && <div className="p-4 text-center text-text-secondary">Loading...</div>}
              {error && <div className="p-4 text-center text-red-500">{error}</div>}
              <ul className="divide-y divide-bg-secondary/50 overflow-y-auto">
                {results.map(item => (
                  <li key={`${item.id}-${item.media_type}`} className="p-3 hover:bg-bg-secondary">
                    <div className="flex items-center space-x-3">
                        <img
                            src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : PLACEHOLDER_POSTER_SMALL}
                            alt={item.title || item.name}
                            className="w-12 h-18 object-cover rounded-md cursor-pointer flex-shrink-0"
                            onClick={() => handleSelect(item)}
                        />
                        <div className="flex-grow min-w-0 cursor-pointer" onClick={() => handleSelect(item)}>
                            <p className="font-semibold text-text-primary truncate">{item.title || item.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}</span>
                                <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${item.media_type === 'tv' ? 'bg-teal-500/20 text-teal-300' : 'bg-sky-500/20 text-sky-300'}`}>
                                    {item.media_type === 'tv' ? 'TV' : 'Movie'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-0.5">
                            <button onClick={(e) => { e.stopPropagation(); handleSelect(item) }} className="p-2 rounded-full hover:bg-bg-primary" title="Go to details">
                                <ChevronRightIcon className="w-5 h-5 text-text-secondary"/>
                            </button>
                            <button onClick={(e) => handleMarkWatched(e, item)} className="p-2 rounded-full hover:bg-bg-primary" title="Mark as watched">
                                <CheckCircleIcon className="w-5 h-5 text-text-secondary"/>
                            </button>
                            <button onClick={(e) => handleOpenCalendar(e, item)} className="p-2 rounded-full hover:bg-bg-primary" title="Mark as watched on date">
                                <CalendarIcon className="w-5 h-5 text-text-secondary"/>
                            </button>
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
              {!loading && !error && results.length === 0 && value.length > 2 && (
                <div className="p-4 text-center text-text-secondary">No results found.</div>
              )}
            </div>
          )}
        </div>
    </>
  );
};

export default SearchBar;