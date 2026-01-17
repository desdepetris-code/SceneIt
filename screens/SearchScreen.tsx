import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { searchMediaPaginated, searchPeoplePaginated, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser, AppPreferences } from '../types';
import { HeartIcon, SearchIcon, FilterIcon, ChevronDownIcon, XMarkIcon } from '../components/Icons';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import Recommendations from './Recommendations';
import RelatedRecommendations from '../components/RelatedRecommendations';
import ActionCard from '../components/ActionCard';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from '../components/Carousel';

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie', itemData?: TrackedItem) => void;
  onSelectPerson: (personId: number) => void;
  onSelectUser: (userId: string) => void;
  searchHistory: SearchHistoryItem[];
  onUpdateSearchHistory: (queryOrItem: string | TrackedItem) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  genres: Record<number, string>;
  userData: UserData;
  currentUser: { id: string, username: string, email: string } | null;
  onToggleLikeList: (ownerId: string, listId: string, listName: string) => void;
  timezone: string;
  showRatings: boolean;
  preferences: AppPreferences;
}

const DiscoverView: React.FC<Omit<SearchScreenProps, 'query' | 'onQueryChange' | 'onUpdateSearchHistory' | 'searchHistory'>> = (props) => {
    const latestWatchedItem = useMemo(() => {
        return [...props.userData.history]
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .find(h => !h.logId.startsWith('live-'));
    }, [props.userData.history]);
    
    return (
        <div className="space-y-12 animate-fade-in">
            <section>
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest mb-6">Top Picks For You</h2>
                <Recommendations {...props} />
            </section>
            {latestWatchedItem && <RelatedRecommendations seedItems={[latestWatchedItem]} {...props} completed={props.userData.completed} />}
        </div>
    );
};

type SearchTab = 'media' | 'people' | 'myLists' | 'communityLists' | 'users' | 'genres';

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
  const { onSelectShow, onSelectPerson, onSelectUser, searchHistory, onUpdateSearchHistory, query, onQueryChange, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites, genres, userData, currentUser, onToggleLikeList, timezone, showRatings, preferences } = props;
  const [activeTab, setActiveTab] = useState<SearchTab>('media');
  const [mediaResults, setMediaResults] = useState<TmdbMedia[]>([]);
  const [peopleResults, setPeopleResults] = useState<TmdbPerson[]>([]);
  const [myListResults, setMyListResults] = useState<CustomList[]>([]);
  const [communityListResults, setCommunityListResults] = useState<PublicCustomList[]>([]);
  const [userResults, setUserResults] = useState<PublicUser[]>([]);
  const [genreResults, setGenreResults] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize filter visibility based on preference
  const [showFiltersToggle, setShowFiltersToggle] = useState(preferences.searchAlwaysExpandFilters);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<string>('popularity.desc');

  // Sync state if preference changes in settings
  useEffect(() => {
    if (preferences.searchAlwaysExpandFilters) {
        setShowFiltersToggle(true);
    }
  }, [preferences.searchAlwaysExpandFilters]);

  useEffect(() => {
    if (query.length < 1) {
        setMediaResults([]);
        setPeopleResults([]);
        setMyListResults([]);
        setCommunityListResults([]);
        setUserResults([]);
        setGenreResults([]);
        // Don't reset if preference says stay open
        if (!preferences.searchAlwaysExpandFilters) setShowFiltersToggle(false);
        return;
    }

    const performAllSearches = async () => {
        setLoading(true);
        setError(null);
        const mediaPromise = searchMediaPaginated(query, 1);
        const peoplePromise = searchPeoplePaginated(query, 1);
        const lowerCaseQuery = query.toLowerCase();
        setMyListResults(userData.customLists.filter(list => list.name.toLowerCase().includes(lowerCaseQuery)));
        setCommunityListResults(searchPublicLists(query, currentUser?.id || null));
        setUserResults(searchUsers(query, currentUser?.id || null));
        const genreArray = Object.entries(genres).map(([id, name]) => ({id: Number(id), name}));
        setGenreResults(genreArray.filter(g => String(g.name).toLowerCase().includes(lowerCaseQuery)));

        try {
            const [mediaData, peopleData] = await Promise.all([mediaPromise, peoplePromise]);
            setMediaResults(mediaData.results);
            setPeopleResults(peopleData.results);
        } catch (e) { setError("Could not perform search."); } finally { setLoading(false); }
    };

    const debounceTimer = setTimeout(performAllSearches, 500);
    return () => clearTimeout(debounceTimer);
}, [query, userData.customLists, genres, currentUser?.id, preferences.searchAlwaysExpandFilters]);

  const filteredAndSortedMedia = useMemo(() => {
    let results = [...mediaResults];
    if (mediaTypeFilter !== 'all') results = results.filter(item => item.media_type === mediaTypeFilter);
    if (genreFilter) results = results.filter(item => item.genre_ids?.includes(Number(genreFilter)));
    if (yearFilter && yearFilter.length === 4) results = results.filter(i => (i.release_date || i.first_air_date || '').substring(0, 4) === yearFilter);
    results.sort((a, b) => {
      switch (sortFilter) {
        case 'release_date.desc': return new Date(b.release_date || b.first_air_date || 0).getTime() - new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'vote_average.desc': return (b.vote_average || 0) - (a.vote_average || 0);
        case 'alphabetical.asc': return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'popularity.desc': default: return (b.popularity || 0) - (a.popularity || 0);
      }
    });
    return results;
  }, [mediaResults, mediaTypeFilter, genreFilter, yearFilter, sortFilter]);

  const handleItemSelect = (id: number, media_type: 'tv' | 'movie', item: TmdbMedia) => {
    const tracked: TrackedItem = { id: item.id, title: item.title || item.name || 'Untitled', media_type: item.media_type, poster_path: item.poster_path, genre_ids: item.genre_ids };
    onSelectShow(id, media_type, tracked);
  };

  const renderSearchResults = () => {
    if (loading && mediaResults.length === 0) return (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 animate-pulse">
            {[...Array(14)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div></div>)}
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500 font-bold">{error}</div>;

    switch (activeTab) {
        case 'media': return (
            <div className="space-y-6">
                {(preferences.searchShowFilters || preferences.searchAlwaysExpandFilters) && (
                    <div className="flex justify-end items-center mb-4">
                        {!preferences.searchAlwaysExpandFilters && (
                            <button 
                                onClick={() => setShowFiltersToggle(!showFiltersToggle)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${showFiltersToggle ? 'bg-primary-accent text-on-accent' : 'bg-bg-secondary/40 text-text-primary border border-white/5'}`}
                            >
                                <FilterIcon className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                            </button>
                        )}
                    </div>
                )}

                {(showFiltersToggle || preferences.searchAlwaysExpandFilters) && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-bg-secondary/20 rounded-2xl border border-white/5 animate-fade-in">
                        <div className="relative">
                            <select 
                                value={mediaTypeFilter}
                                onChange={e => setMediaTypeFilter(e.target.value as any)}
                                className="w-full appearance-none bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-text-primary focus:outline-none"
                            >
                                <option value="all">All Media</option>
                                <option value="movie">Movies Only</option>
                                <option value="tv">TV Shows Only</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={genreFilter}
                                onChange={e => setGenreFilter(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-text-primary focus:outline-none"
                            >
                                <option value="">All Genres</option>
                                {/* Fix: Added explicit casting to string for genre name comparison to fix TS error 'localeCompare does not exist on type unknown' */}
                                {Object.entries(genres).sort((a,b) => (a[1] as string).localeCompare(b[1] as string)).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>
                        <div className="relative">
                            <input 
                                type="text"
                                maxLength={4}
                                placeholder="Year (e.g. 2024)"
                                value={yearFilter}
                                onChange={e => setYearFilter(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-text-primary focus:outline-none"
                            />
                        </div>
                        <div className="relative">
                            <select 
                                value={sortFilter}
                                onChange={e => setSortFilter(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-[10px] font-black uppercase text-text-primary focus:outline-none"
                            >
                                <option value="popularity.desc">Most Popular</option>
                                <option value="release_date.desc">Newest First</option>
                                <option value="vote_average.desc">Highest Rated</option>
                                <option value="alphabetical.asc">A to Z</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                        </div>
                    </div>
                )}

                {filteredAndSortedMedia.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 animate-fade-in">
                        {filteredAndSortedMedia.map(item => <ActionCard key={item.id} item={item} onSelect={(id, type) => handleItemSelect(id, type, item)} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} isFavorite={favorites.some(f => f.id === item.id)} isCompleted={userData.completed.some(c => c.id === item.id)} showRatings={showRatings} showSeriesInfo={preferences.searchShowSeriesInfo} />)}
                    </div>
                ) : query.length > 0 ? <p className="text-center py-16 text-text-secondary">No media found.</p> : null}
            </div>
        );

        case 'people': return peopleResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
                {peopleResults.map(p => (
                    <div key={p.id} className="text-center group cursor-pointer" onClick={() => onSelectPerson(p.id)}>
                        <img src={getImageUrl(p.profile_path, 'w185', 'profile')} alt={p.name} className="w-24 h-24 mx-auto rounded-full object-cover shadow-2xl border-2 border-white/5 transition-all group-hover:scale-110" />
                        <p className="mt-3 text-sm font-black text-text-primary uppercase">{p.name}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-16 text-text-secondary">No people found.</p>;
        default: return null;
    }
  };

  const TabButton: React.FC<{ tabId: SearchTab; label: string; count: number }> = ({ tabId, label, count }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-full transition-all border ${activeTab === tabId ? 'bg-accent-gradient text-on-accent border-transparent' : 'bg-bg-secondary/40 text-text-primary/60 border-white/5'}`}>
        {label} ({count})
    </button>
  );

  return (
    <div className="px-6 relative min-h-screen pb-40">
        <header className="mb-6">
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Search</h1>
        </header>
        {query.length > 0 ? renderSearchResults() : <DiscoverView {...props} />}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
            <div className="nav-spectral-bg animate-spectral-flow rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 border border-white/20 backdrop-blur-xl">
                <div className="absolute inset-0 bg-black/40 rounded-3xl pointer-events-none"></div>
                <div className="relative z-10 flex flex-col space-y-4">
                    {query.length > 0 && (
                        <Carousel>
                            <div className="flex space-x-2 overflow-x-auto pb-1 hide-scrollbar">
                                <TabButton tabId="media" label="Media" count={filteredAndSortedMedia.length} />
                                <TabButton tabId="people" label="People" count={peopleResults.length} />
                                <TabButton tabId="users" label="Users" count={userResults.length} />
                                <TabButton tabId="myLists" label="My Lists" count={myListResults.length} />
                                <TabButton tabId="communityLists" label="Public Lists" count={communityListResults.length} />
                                <TabButton tabId="genres" label="Genres" count={genreResults.length} />
                            </div>
                        </Carousel>
                    )}
                    <SearchBar 
                        onSelectResult={(id, type) => {
                            const matched = filteredAndSortedMedia.find(m => m.id === id);
                            if (matched) handleItemSelect(id, type, matched);
                            else onSelectShow(id, type);
                        }} 
                        onMarkShowAsWatched={onMarkShowAsWatched}
                        value={query}
                        onChange={onQueryChange}
                        disableDropdown
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

export default SearchScreen;