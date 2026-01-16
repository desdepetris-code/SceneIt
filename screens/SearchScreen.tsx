import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { searchMediaPaginated, searchPeoplePaginated, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser, AppPreferences } from '../types';
import { HeartIcon, SearchIcon, FilterIcon, ChevronDownIcon, XMarkIcon } from '../components/Icons';
import MarkAsWatchedModal from '../components/MarkAsWatchedModal';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import { PLACEHOLDER_PROFILE } from '../constants';
import Recommendations from './Recommendations';
import TrendingSection from '../components/TrendingSection';
import RelatedRecommendations from '../components/RelatedRecommendations';
import GenericCarousel from '../components/GenericCarousel';
import ActionCard from '../components/ActionCard';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from '../components/Carousel';

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onSelectPerson: (personId: number) => void;
  onSelectUser: (userId: string) => void;
  searchHistory: SearchHistoryItem[];
  onUpdateSearchHistory: (query: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
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
            
            {latestWatchedItem && (
                <RelatedRecommendations seedItems={[latestWatchedItem]} {...props} completed={props.userData.completed} />
            )}
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
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
  const [genreFilter, setGenreFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [sortFilter, setSortFilter] = useState<string>('popularity.desc');

  useEffect(() => {
    if (query.length < 1) {
        setMediaResults([]);
        setPeopleResults([]);
        setMyListResults([]);
        setCommunityListResults([]);
        setUserResults([]);
        setGenreResults([]);
        setShowFilters(false);
        return;
    }

    const performAllSearches = async () => {
        setLoading(true);
        setError(null);
        onUpdateSearchHistory(query);

        const mediaPromise = searchMediaPaginated(query, 1);
        const peoplePromise = searchPeoplePaginated(query, 1);
        
        const lowerCaseQuery = query.toLowerCase();
        const myLists = userData.customLists.filter(list => list.name.toLowerCase().includes(lowerCaseQuery));
        const communityLists = searchPublicLists(query, currentUser?.id || null);
        const users = searchUsers(query, currentUser?.id || null);
        const genreArray = Object.entries(genres).map(([id, name]) => ({id: Number(id), name}));
        const matchingGenres = genreArray.filter(g => String(g.name).toLowerCase().includes(lowerCaseQuery));

        setMyListResults(myLists);
        setCommunityListResults(communityLists);
        setUserResults(users);
        setGenreResults(matchingGenres);

        try {
            const [mediaData, peopleData] = await Promise.all([mediaPromise, peoplePromise]);
            setMediaResults(mediaData.results);
            if (preferences.searchShowFilters && !preferences.searchAlwaysExpandFilters) {
                setShowFilters(true);
            }
            setPeopleResults(peopleData.results);
        } catch (e) {
            setError("Could not perform search. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const debounceTimer = setTimeout(performAllSearches, 500);
    return () => clearTimeout(debounceTimer);
}, [query, onUpdateSearchHistory, userData.customLists, genres, currentUser?.id, preferences.searchShowFilters, preferences.searchAlwaysExpandFilters]);

  const filteredAndSortedMedia = useMemo(() => {
    let results = [...mediaResults];

    if (mediaTypeFilter !== 'all') {
      results = results.filter(item => item.media_type === mediaTypeFilter);
    }
    if (genreFilter) {
      results = results.filter(item => item.genre_ids?.includes(Number(genreFilter)));
    }
    if (yearFilter && yearFilter.length === 4) {
      results = results.filter(item => {
        const year = (item.release_date || item.first_air_date || '').substring(0, 4);
        return year === yearFilter;
      });
    }

    results.sort((a, b) => {
      switch (sortFilter) {
        case 'release_date.desc':
          return new Date(b.release_date || b.first_air_date || 0).getTime() - new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'vote_average.desc':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'alphabetical.asc':
            return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'popularity.desc':
        default:
          return (b.popularity || 0) - (a.popularity || 0);
      }
    });

    return results;
  }, [mediaResults, mediaTypeFilter, genreFilter, yearFilter, sortFilter]);


  const handleLike = (list: PublicCustomList) => {
      onToggleLikeList(list.user.id, list.id, list.name);
      setCommunityListResults(prev => prev.map(l => {
        if (l.id === list.id) {
            const likes = l.likes || [];
            if (!currentUser) return l;
            const userIndex = likes.indexOf(currentUser.id);
            if (userIndex > -1) {
                likes.splice(userIndex, 1);
            } else {
                likes.push(currentUser.id);
            }
            return { ...l, likes };
        }
        return l;
      }));
  };
  
  const renderSearchResults = () => {
    if (loading && mediaResults.length === 0) return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 animate-pulse">
            {[...Array(14)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    switch (activeTab) {
        case 'media': return filteredAndSortedMedia.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {filteredAndSortedMedia.map(item => <ActionCard key={item.id} item={item} onSelect={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} isFavorite={favorites.some(f => f.id === item.id)} isCompleted={userData.completed.some(c => c.id === item.id)} showRatings={showRatings} showSeriesInfo={preferences.searchShowSeriesInfo} />)}
            </div>
        ) : query.length > 0 ? <p className="text-center py-8 text-text-secondary">No media found for the selected filters.</p> : null;

        case 'people': return peopleResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {peopleResults.map(person => (
                    <div key={person.id} className="text-center group cursor-pointer" onClick={() => onSelectPerson(person.id)}>
                        <img src={getImageUrl(person.profile_path, 'w185', 'profile')} alt={person.name} className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg transition-transform group-hover:scale-110" />
                        <p className="mt-2 text-sm font-semibold text-text-primary">{person.name}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No people found.</p>;

        case 'myLists': return myListResults.length > 0 ? (
            <div className="space-y-4">
                {myListResults.map(list => <div key={list.id} className="bg-bg-secondary p-4 rounded-lg"> <h3 className="font-bold text-text-primary">{list.name}</h3> <p className="text-sm text-text-secondary">{list.items.length} items</p> </div>)}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No matching lists in your library.</p>;
        
        case 'communityLists': return communityListResults.length > 0 ? (
            <div className="space-y-4">
                {communityListResults.map(list => {
                  const hasLiked = currentUser && list.likes?.includes(currentUser.id);
                  return (
                    <div key={list.id} className="bg-bg-secondary p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-text-primary">{list.name}</h3>
                            <p className="text-sm text-text-secondary">by <span className="font-semibold cursor-pointer hover:underline" onClick={() => onSelectUser(list.user.id)}>{list.user.username}</span> &bull; {list.items.length} items</p>
                        </div>
                        <button onClick={() => handleLike(list)} className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-md transition-colors bg-bg-primary text-text-primary hover:brightness-125 font-semibold">
                            <HeartIcon className={`w-4 h-4 ${hasLiked ? 'text-primary-accent' : 'text-text-secondary'}`} filled={hasLiked} />
                            <span>{list.likes?.length || 0}</span>
                        </button>
                    </div>
                  );
                })}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No matching public lists found.</p>;
        
        case 'users': return userResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userResults.map(user => (
                    <div key={user.id} className="text-center group cursor-pointer" onClick={() => onSelectUser(user.id)}>
                        <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg bg-bg-secondary" />
                        <p className="mt-2 text-sm font-semibold text-text-primary">{user.username}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No users found.</p>;
        
        case 'genres': return genreResults.length > 0 ? (
            <div className="flex flex-wrap gap-3">
                {genreResults.map(g => <button key={g.id} className="px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-primary-accent hover:text-white transition-colors">{g.name}</button>)}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No genres found.</p>;
        
        default: return null;
    }
  };

  const TabButton: React.FC<{ tabId: SearchTab; label: string; count: number }> = ({ tabId, label, count }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-full transition-all ${activeTab === tabId ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>
        {label} {loading ? '...' : `(${count})`}
    </button>
  );

  const filterInputClass = "w-full appearance-none bg-white border border-white/20 rounded-xl py-2 px-4 text-xs font-black uppercase tracking-widest text-black focus:outline-none focus:ring-2 focus:ring-primary-accent shadow-lg";

  const filtersVisible = preferences.searchAlwaysExpandFilters || (preferences.searchShowFilters && showFilters);

  return (
    <div className="px-6 relative min-h-screen pb-40">
        <header className="mb-4">
          <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Search</h1>
           <p className="mt-1 text-sm font-bold text-text-secondary uppercase tracking-widest opacity-60">Find your next favorite montage</p>
        </header>

        {query.length > 0 ? (
            <div className="animate-fade-in">
              {preferences.searchShowFilters && filtersVisible && activeTab === 'media' && (
                <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in shadow-2xl backdrop-blur-md">
                  <div className="relative">
                    <select 
                        value={mediaTypeFilter} 
                        onChange={e => setMediaTypeFilter(e.target.value as any)} 
                        className={filterInputClass}
                    >
                        <option value="all">All Types</option>
                        <option value="movie">Movies</option>
                        <option value="tv">TV Shows</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select 
                        value={genreFilter} 
                        onChange={e => setGenreFilter(e.target.value)} 
                        className={filterInputClass}
                    >
                        <option value="">All Genres</option>
                        {Object.entries(genres).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
                  </div>
                  <input 
                    type="number" 
                    placeholder="Year" 
                    value={yearFilter} 
                    onChange={e => setYearFilter(e.target.value)} 
                    className={filterInputClass + " placeholder:text-black/40"} 
                  />
                  <div className="relative">
                    <select 
                        value={sortFilter} 
                        onChange={e => setSortFilter(e.target.value)} 
                        className={filterInputClass}
                    >
                        <option value="popularity.desc">Popularity</option>
                        <option value="release_date.desc">Release Date</option>
                        <option value="vote_average.desc">Rating</option>
                        <option value="alphabetical.asc">Alphabetical</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black pointer-events-none" />
                  </div>
                </div>
              )}

              {renderSearchResults()}
            </div>
        ) : (
            <DiscoverView {...props} />
        )}

        {/* Floating Bottom Search Island */}
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-40">
            <div className="nav-spectral-bg animate-spectral-flow rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 border border-white/20 backdrop-blur-xl">
                <div className="absolute inset-0 bg-black/40 rounded-3xl pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col space-y-4">
                    {/* Only show categories when query has content */}
                    {query.length > 0 && (
                        <div className="animate-slide-in-up">
                            <div className="flex justify-between items-center mb-2 px-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">Search Categories</span>
                                {activeTab === 'media' && preferences.searchShowFilters && !preferences.searchAlwaysExpandFilters && (
                                    <button onClick={() => setShowFilters(s => !s)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                        <FilterIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
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
                        </div>
                    )}
                    
                    <div className="relative group">
                        <SearchBar 
                            onSelectResult={onSelectShow} 
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            value={query}
                            onChange={onQueryChange}
                            disableDropdown
                        />
                        {query.length > 0 && (
                            <button 
                                onClick={() => onQueryChange('')}
                                className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SearchScreen;