import React, { useState, useEffect, useMemo } from 'react';
import { searchMediaPaginated, searchPeoplePaginated } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser, AppPreferences } from '../types';
import { HeartIcon, SearchIcon, FilterIcon, ChevronDownIcon, XMarkIcon, TvIcon, FilmIcon, UserIcon, UsersIcon, SparklesIcon, TrashIcon, ClockIcon, EyeSlashIcon, EyeIcon } from '../components/Icons';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import RelatedRecommendations from '../components/RelatedRecommendations';
import ActionCard from '../components/ActionCard';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from '../components/Carousel';
import Recommendations from './Recommendations';

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie', itemData?: TrackedItem) => void;
  onSelectPerson: (personId: number) => void;
  onSelectUser: (userId: string) => void;
  searchHistory: SearchHistoryItem[];
  onUpdateSearchHistory: (queryOrItem: string | TrackedItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
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

const DiscoverView: React.FC<SearchScreenProps> = (props) => {
    const { 
        userData, searchHistory, preferences, onClearSearchHistory, 
        onDeleteSearchHistoryItem, onSelectShow, onQueryChange,
        onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow,
        favorites, showRatings
    } = props;

    const latestWatchedItem = useMemo(() => {
        if (!userData.history || userData.history.length === 0) return null;
        return [...userData.history]
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .find(h => !h.logId.startsWith('live-'));
    }, [userData.history]);
    
    const showRecentHistory = preferences.searchShowRecentHistory !== false;

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {showRecentHistory && searchHistory && searchHistory.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-6 h-6 text-primary-accent" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">Recent Searches</h2>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClearSearchHistory(); }}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                    <Carousel>
                        <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
                            {searchHistory.map((h) => (
                                <div key={h.timestamp} className="relative group/h flex-shrink-0 w-48">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSearchHistoryItem(h.timestamp); }}
                                        className="absolute -top-1 -right-1 z-20 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-500 transition-all scale-90"
                                        title="Delete search from history"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    {h.item ? (
                                        <div className="w-full">
                                            <ActionCard 
                                                item={h.item as any} 
                                                onSelect={() => onSelectShow(h.item!.id, h.item!.media_type as any)} 
                                                onOpenAddToListModal={onOpenAddToListModal} 
                                                onMarkShowAsWatched={onMarkShowAsWatched} 
                                                onToggleFavoriteShow={onToggleFavoriteShow} 
                                                isFavorite={favorites.some(f => f.id === h.item!.id)} 
                                                isCompleted={userData.completed.some(c => c.id === h.item!.id)} 
                                                showRatings={showRatings} 
                                                showSeriesInfo="hidden" 
                                                userData={userData}
                                            />
                                        </div>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={() => onQueryChange(h.query || '')}
                                            className="w-full h-full bg-bg-secondary/40 border border-white/5 rounded-2xl p-4 text-left hover:bg-bg-secondary transition-all min-h-[100px] flex flex-col justify-center"
                                        >
                                            <p className="text-xs font-black text-text-primary uppercase tracking-tight line-clamp-2">"{h.query}"</p>
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-50">{new Date(h.timestamp).toLocaleDateString()}</p>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className="w-4 flex-shrink-0"></div>
                        </div>
                    </Carousel>
                </section>
            )}

            <section>
                <div className="flex items-center gap-3 mb-8">
                    <SparklesIcon className="w-8 h-8 text-primary-accent" />
                    <div>
                        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Top Picks For You</h2>
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mt-2 opacity-60">Separated by category for your convenience</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <FilmIcon className="w-5 h-5 text-sky-400" />
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">Top Movies</h3>
                        </div>
                        <Recommendations 
                            mediaType="movie"
                            onSelectShow={onSelectShow}
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            onOpenAddToListModal={onOpenAddToListModal}
                            onToggleFavoriteShow={onToggleFavoriteShow}
                            favorites={favorites}
                            completed={userData.completed}
                            showRatings={showRatings}
                            preferences={preferences}
                            userData={userData}
                            columns="grid-cols-1 md:grid-cols-2"
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <TvIcon className="w-5 h-5 text-rose-500" />
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">Top Shows</h3>
                        </div>
                        <Recommendations 
                            mediaType="tv"
                            onSelectShow={onSelectShow}
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            onOpenAddToListModal={onOpenAddToListModal}
                            onToggleFavoriteShow={onToggleFavoriteShow}
                            favorites={favorites}
                            completed={userData.completed}
                            showRatings={showRatings}
                            preferences={preferences}
                            userData={userData}
                            columns="grid-cols-1 md:grid-cols-2"
                        />
                    </div>
                </div>
            </section>

            {latestWatchedItem && (
                <section className="pt-4">
                    <RelatedRecommendations seedItems={[latestWatchedItem]} {...props} />
                </section>
            )}
        </div>
    );
};

type SearchTab = 'media' | 'people' | 'myLists' | 'communityLists' | 'users' | 'genres';

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
  const { onSelectShow, onSelectPerson, onSelectUser, query, onQueryChange, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites, genres, userData, currentUser, showRatings, preferences } = props;
  const [activeTab, setActiveTab] = useState<SearchTab>('media');
  const [mediaResults, setMediaResults] = useState<TmdbMedia[]>([]);
  const [peopleResults, setPeopleResults] = useState<TmdbPerson[]>([]);
  const [myListResults, setMyListResults] = useState<CustomList[]>([]);
  const [communityListResults, setCommunityListResults] = useState<PublicCustomList[]>([]);
  const [userResults, setUserResults] = useState<PublicUser[]>([]);
  const [genreResults, setGenreResults] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showFiltersToggle, setShowFiltersToggle] = useState(preferences.searchAlwaysExpandFilters);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<string>('popularity.desc');
  const [hideWatched, setHideWatched] = useState(false);

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
        const genreArray = Object.entries(genres).map(([id, name]) => ({id: Number(id), name: name as string}));
        setGenreResults(genreArray.filter(g => g.name.toLowerCase().includes(lowerCaseQuery)));

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
    
    if (hideWatched) {
        results = results.filter(i => {
            const isCompleted = userData.completed.some(c => c.id === i.id);
            const isCaughtUp = userData.allCaughtUp.some(c => c.id === i.id);
            return !isCompleted && !isCaughtUp;
        });
    }

    results.sort((a, b) => {
      switch (sortFilter) {
        case 'release_date.desc': return new Date(b.release_date || b.first_air_date || 0).getTime() - new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'vote_average.desc': return (b.vote_average || 0) - (a.vote_average || 0);
        case 'alphabetical.asc': return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'popularity.desc': default: return (b.popularity || 0) - (a.popularity || 0);
      }
    });
    return results;
  }, [mediaResults, mediaTypeFilter, genreFilter, yearFilter, sortFilter, hideWatched, userData.completed, userData.allCaughtUp]);

  const handleItemSelect = (id: number, media_type: 'tv' | 'movie', item: TmdbMedia) => {
    const tracked: TrackedItem = { id: item.id, title: item.title || item.name || 'Untitled', media_type: item.media_type, poster_path: item.poster_path, genre_ids: item.genre_ids };
    onSelectShow(id, media_type, tracked);
  };

  const renderSearchResults = () => {
    if (loading && mediaResults.length === 0) return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-pulse">
            {[...Array(12)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-2xl"></div></div>)}
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500 font-bold">{error}</div>;

    switch (activeTab) {
        case 'media': return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex-grow w-full md:w-auto">
                        <button 
                            onClick={() => setHideWatched(!hideWatched)}
                            className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all border shadow-lg ${hideWatched ? 'bg-accent-gradient text-on-accent border-transparent' : 'bg-bg-secondary/40 text-text-primary border-white/5 hover:bg-bg-secondary'}`}
                        >
                            {hideWatched ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            <span className="text-xs font-black uppercase tracking-widest">Hide Watched</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {(preferences.searchShowFilters || preferences.searchAlwaysExpandFilters) && !preferences.searchAlwaysExpandFilters && (
                            <button 
                                onClick={() => setShowFiltersToggle(!showFiltersToggle)}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all ${showFiltersToggle ? 'bg-primary-accent text-on-accent' : 'bg-bg-secondary/40 text-text-primary border border-white/5 shadow-lg'}`}
                            >
                                <FilterIcon className="w-5 h-5" />
                                <span className="text-xs font-black uppercase tracking-widest">Filters</span>
                            </button>
                        )}
                    </div>
                </div>

                {(showFiltersToggle || preferences.searchAlwaysExpandFilters) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-bg-secondary/20 rounded-3xl border border-white/5 animate-fade-in shadow-inner">
                        <div className="relative">
                            <select 
                                value={mediaTypeFilter}
                                onChange={e => setMediaTypeFilter(e.target.value as any)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="all">All Media</option>
                                <option value="movie">Movies Only</option>
                                <option value="tv">TV Shows Only</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={genreFilter}
                                onChange={e => setGenreFilter(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="">All Genres</option>
                                {Object.entries(genres).sort((a,b) => (a[1] as string).localeCompare(b[1] as string)).map(([id, name]) => <option key={id} value={id}>{name as string}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                        <div className="relative">
                            <input 
                                type="text"
                                maxLength={4}
                                placeholder="Year (e.g. 2025)"
                                value={yearFilter}
                                onChange={e => setYearFilter(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            />
                        </div>
                        <div className="relative">
                            <select 
                                value={sortFilter}
                                onChange={e => setSortFilter(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="popularity.desc">Most Popular</option>
                                <option value="release_date.desc">Newest First</option>
                                <option value="vote_average.desc">Highest Rated</option>
                                <option value="alphabetical.asc">A to Z</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>
                )}

                {filteredAndSortedMedia.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-8 animate-fade-in pb-10">
                        {filteredAndSortedMedia.map(item => (
                            <ActionCard 
                                key={item.id} 
                                item={item} 
                                onSelect={(id, type) => handleItemSelect(id, type, item)} 
                                onOpenAddToListModal={onOpenAddToListModal} 
                                onMarkShowAsWatched={onMarkShowAsWatched} 
                                onToggleFavoriteShow={onToggleFavoriteShow} 
                                isFavorite={favorites.some(f => f.id === item.id)} 
                                isCompleted={userData.completed.some(c => c.id === item.id)} 
                                showRatings={showRatings} 
                                showSeriesInfo={preferences.searchShowSeriesInfo} 
                                userRating={userData.ratings[item.id]?.rating || 0}
                                userData={userData}
                            />
                        ))}
                    </div>
                ) : query.length > 0 ? <p className="text-center py-24 text-text-secondary font-bold uppercase tracking-widest opacity-50">No media found matching your criteria.</p> : null}
            </div>
        );

        case 'people': return peopleResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10 animate-fade-in">
                {peopleResults.map(p => (
                    <div key={p.id} className="text-center group cursor-pointer" onClick={() => onSelectPerson(p.id)}>
                        <div className="relative inline-block">
                             <img src={getImageUrl(p.profile_path, 'h632', 'profile')} alt={p.name} className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover shadow-2xl border-4 border-white/5 transition-all group-hover:scale-105 group-hover:border-primary-accent" />
                             <div className="absolute inset-0 rounded-full bg-primary-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <p className="mt-4 text-base font-black text-text-primary uppercase tracking-tight group-hover:text-primary-accent transition-colors">{p.name}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-24 text-text-secondary font-bold uppercase tracking-widest opacity-50">No people found.</p>;
        default: return null;
    }
  };

  const TabButton: React.FC<{ tabId: SearchTab; label: string; count: number }> = ({ tabId, label, count }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-full transition-all border ${activeTab === tabId ? 'bg-accent-gradient text-on-accent border-transparent shadow-xl scale-105' : 'bg-bg-secondary/40 text-text-primary/60 border-white/10 hover:bg-bg-secondary hover:text-text-primary'}`}>
        {label} <span className="opacity-40 ml-1">({count})</span>
    </button>
  );

  return (
    <div className="px-6 relative min-h-screen pb-48">
        <header className="mb-10">
          <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">Exploration</h1>
          <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Discover your next obsession</p>
        </header>
        {query.length > 0 ? renderSearchResults() : (
            <DiscoverView 
                {...props} 
            />
        )}
        
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-40 group/nav">
            <div className="nav-spectral-bg animate-spectral-flow rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] p-5 border border-white/20 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-black/50 rounded-[2.5rem] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col space-y-5">
                    {query.length > 0 && (
                        <Carousel>
                            <div className="flex space-x-3 overflow-x-auto pb-1 hide-scrollbar px-2">
                                <TabButton tabId="media" label="Media" count={filteredAndSortedMedia.length} />
                                <TabButton tabId="people" label="People" count={peopleResults.length} />
                                <TabButton tabId="users" label="Users" count={userResults.length} />
                                <TabButton tabId="myLists" label="My Lists" count={myListResults.length} />
                                <TabButton tabId="communityLists" label="Community" count={communityListResults.length} />
                                <TabButton tabId="genres" label="Genres" count={genreResults.length} />
                            </div>
                        </Carousel>
                    )}
                    <div className="px-2">
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
    </div>
  );
};

export default SearchScreen;