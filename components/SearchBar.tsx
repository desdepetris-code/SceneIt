import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { searchMedia, getMediaDetails } from '../services/tmdbService';
import { TmdbMedia, TmdbMediaDetails } from '../types';
import { SearchIcon, CheckCircleIcon, CalendarIcon, ChevronRightIcon } from './Icons';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER_SMALL } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';

interface SearchBarProps {
  onSelectResult: (id: number, media_type: 'tv' | 'movie') => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  value: string;
  onChange: (query: string) => void;
  disableDropdown?: boolean;
  dropdownWider?: boolean;
}

const SearchResultItem: React.FC<{
    item: TmdbMedia;
    onSelect: (item: TmdbMedia) => void;
    onMarkWatched: (e: React.MouseEvent, item: TmdbMedia) => void;
    onOpenCalendar: (e: React.MouseEvent, item: TmdbMedia) => void;
}> = ({ item, onSelect, onMarkWatched, onOpenCalendar }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        let isMounted = true;
        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) setDetails(data);
        }).catch(() => {});
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);

    const rating = React.useMemo(() => {
        if (!details) return null;
        if (item.media_type === 'tv') {
          return details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')?.rating || null;
        } else {
          return details.release_dates?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.find(d => d.certification)?.certification || null;
        }
    }, [details, item.media_type]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
        return 'bg-stone-500 text-white';
    };

    return (
        <li className="p-3 hover:bg-bg-secondary transition-colors">
            <div className="flex items-center space-x-3">
                <img
                    src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : PLACEHOLDER_POSTER_SMALL}
                    alt={item.title || item.name}
                    className="w-12 h-[4.5rem] object-contain bg-slate-900 rounded-md cursor-pointer flex-shrink-0"
                    onClick={() => onSelect(item)}
                />
                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onSelect(item)}>
                    <p className="font-semibold text-text-primary truncate">{item.title || item.name}</p>
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                        <span>{item.release_date?.substring(0, 4) || item.first_air_date?.substring(0, 4)}</span>
                        <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 text-[10px] font-black rounded ${item.media_type === 'tv' ? 'bg-teal-500/20 text-teal-300' : 'bg-sky-500/20 text-sky-300'}`}>
                                {item.media_type === 'tv' ? 'TV' : 'MOVIE'}
                            </span>
                            {rating && (
                                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase shadow-sm ${getAgeRatingColor(rating)}`}>
                                    {rating}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-0.5">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(item) }} className="p-2 rounded-full hover:bg-bg-primary text-text-secondary transition-colors" title="Go to details">
                        <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={(e) => onMarkWatched(e, item)} className="p-2 rounded-full hover:bg-bg-primary text-text-secondary transition-colors" title="Mark as watched">
                        <CheckCircleIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={(e) => onOpenCalendar(e, item)} className="p-2 rounded-full hover:bg-bg-primary text-text-secondary transition-colors" title="Mark as watched on date">
                        <CalendarIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </li>
    );
};

const SearchBar: React.FC<SearchBarProps> = ({ onSelectResult, onMarkShowAsWatched, value, onChange, disableDropdown, dropdownWider }) => {
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });

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
              className="w-full pl-10 pr-4 py-3 bg-bg-secondary text-text-primary placeholder-text-secondary/50 rounded-xl border border-white/5 focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all shadow-inner font-semibold"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
          </div>
          {!disableDropdown && isFocused && (value.length > 0 || results.length > 0 || error) && (
            <div className={`absolute z-50 mt-2 bg-bg-primary border border-bg-secondary rounded-xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden ${dropdownWider ? 'w-[calc(100vw-2rem)] sm:w-[32rem] left-1/2 -translate-x-1/2' : 'w-full'}`}>
              {loading && <div className="p-4 text-center text-text-secondary animate-pulse font-bold uppercase tracking-widest text-xs">Loading...</div>}
              {error && <div className="p-4 text-center text-red-500 text-sm font-bold">{error}</div>}
              <ul className="divide-y divide-bg-secondary/50 overflow-y-auto custom-scrollbar">
                {results.map(item => (
                  <SearchResultItem 
                    key={`${item.id}-${item.media_type}`} 
                    item={item} 
                    onSelect={handleSelect} 
                    onMarkWatched={handleMarkWatched} 
                    onOpenCalendar={handleOpenCalendar} 
                  />
                ))}
              </ul>
              {!loading && !error && results.length === 0 && value.length > 2 && (
                <div className="p-6 text-center text-text-secondary font-bold uppercase tracking-widest text-xs">No matching results found.</div>
              )}
            </div>
          )}
        </div>
    </>
  );
};

export default SearchBar;