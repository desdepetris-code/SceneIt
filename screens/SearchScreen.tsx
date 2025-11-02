import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { searchMediaPaginated, searchPeoplePaginated, discoverMedia } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser } from '../types';
import { HeartIcon, SearchIcon, FilterIcon, ChevronDownIcon } from '../components/Icons';
import MarkAsWatchedModal from '../components/MarkAsWatchedModal';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import { PLACEHOLDER_PROFILE } from '../constants';
import Recommendations from './Recommendations';
import TrendingSection from '../components/TrendingSection';
import RelatedRecommendations from '../components/RelatedRecommendations';
import GenericCarousel from '../components/GenericCarousel';
import ActionCard from '../components/ActionCard';
// FIX: Import getImageUrl to resolve 'Cannot find name' error.
import { getImageUrl } from '../utils/imageUtils';
// FIX: Import Carousel to resolve 'Cannot find name' error.
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
                <h2 className="text-2xl font-bold text-text-primary mb-4">Top Picks For You</h2>
                <Recommendations {...props} />
            </section>
            
            {latestWatchedItem && (
                // FIX: Pass the required `completed` prop to `RelatedRecommendations`.
                <RelatedRecommendations seedItems={[latestWatchedItem]} {...props} completed={props.userData.completed} />
            )}
        </div>
    );
};


type SearchTab = 'media' | 'people' | 'myLists' | 'communityLists' | 'users' | 'genres';

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
  const { onSelectShow, onSelectPerson, onSelectUser, searchHistory, onUpdateSearchHistory, query, onQueryChange, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites, genres, userData, currentUser, onToggleLikeList, timezone } = props;
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
        setActiveTab('media');
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
            setShowFilters(true);
            setPeopleResults(peopleData.results);
        } catch (e) {
            setError("Could not perform search. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const debounceTimer = setTimeout(performAllSearches, 500);
    return () => clearTimeout(debounceTimer);
}, [query, onUpdateSearchHistory, userData.customLists, genres, currentUser?.id]);

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
          // FIX: The 'vote_average' property does not exist on type 'TmdbMedia'. It has been added to the type definition.
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
    if (loading) return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 animate-pulse">
            {[...Array(14)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    switch (activeTab) {
        case 'media': return filteredAndSortedMedia.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {filteredAndSortedMedia.map(item => <ActionCard key={item.id} item={item} onSelect={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} isFavorite={favorites.some(f => f.id === item.id)} isCompleted={userData.completed.some(c => c.id === item.id)} />)}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No media found for the selected filters.</p>;

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
    <button onClick={() => setActiveTab(tabId)} className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${activeTab === tabId ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}>
        {label} {loading ? '...' : `(${count})`}
    </button>
  );

  return (
    <div className="px-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-text-primary">Search & Discover</h1>
           <p className="mt-1 text-text-secondary">Find your next favorite show, or see what's popular.</p>
        </header>

        <div className="my-6">
            <SearchBar 
                onSelectResult={onSelectShow} 
                onMarkShowAsWatched={onMarkShowAsWatched}
                value={query}
                onChange={onQueryChange}
                disableDropdown
            />
        </div>
        
        {query.length > 0 ? (
            <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                  <div className="border-b border-bg-secondary/50 flex-grow">
                      <Carousel>
                          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                              <TabButton tabId="media" label="Media" count={filteredAndSortedMedia.length} />
                              <TabButton tabId="people" label="People" count={peopleResults.length} />
                              <TabButton tabId="myLists" label="My Lists" count={myListResults.length} />
                              <TabButton tabId="communityLists" label="Community Lists" count={communityListResults.length} />
                              <TabButton tabId="users" label="Users" count={userResults.length} />
                              <TabButton tabId="genres" label="Genres" count={genreResults.length} />
                          </div>
                      </Carousel>
                  </div>
                  {activeTab === 'media' && (
                    <button onClick={() => setShowFilters(s => !s)} className="ml-4 flex items-center space-x-2 px-3 py-2 text-sm rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors">
                      <FilterIcon className="w-4 h-4" />
                      <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                    </button>
                  )}
              </div>
              
              {showFilters && activeTab === 'media' && (
                <div className="bg-bg-secondary/50 p-4 rounded-lg mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                  <div className="relative"><select value={mediaTypeFilter} onChange={e => setMediaTypeFilter(e.target.value as any)} className="w-full appearance-none bg-bg-primary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"><option value="all">All Types</option><option value="movie">Movies</option><option value="tv">TV Shows</option></select><ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" /></div>
                  <div className="relative"><select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className="w-full appearance-none bg-bg-primary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"><option value="">All Genres</option>{Object.entries(genres).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" /></div>
                  <input type="number" placeholder="Year (e.g., 2023)" value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="w-full bg-bg-primary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                  <div className="relative"><select value={sortFilter} onChange={e => setSortFilter(e.target.value)} className="w-full appearance-none bg-bg-primary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"><option value="popularity.desc">Popularity</option><option value="release_date.desc">Release Date</option><option value="vote_average.desc">Rating</option><option value="alphabetical.asc">Alphabetical</option></select><ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" /></div>
                </div>
              )}

              {renderSearchResults()}
            </div>
        ) : (
            <DiscoverView {...props} />
        )}
    </div>
  );
};

export default SearchScreen;
