import React, { useState, useEffect, useRef, useCallback } from 'react';
import { discoverMediaPaginated, searchMediaPaginated, searchPeoplePaginated } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon, UserIcon } from '../components/Icons';
import FallbackImage from '../components/FallbackImage';
// FIX: Corrected the import name for TMDB_IMAGE_BASE_URL.
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER, PLACEHOLDER_PROFILE } from '../constants';
import MarkAsWatchedModal from '../components/MarkAsWatchedModal';
import GenreFilter from '../components/GenreFilter';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import { getImageUrl } from '../utils/imageUtils';

const ActionCard: React.FC<{
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
}> = ({ item, onSelect, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, isFavorite }) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    
    const posterSrcs = [getImageUrl(item.poster_path, 'w342')];
    const title = item.title || item.name;
    const releaseDate = item.release_date || item.first_air_date;

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenAddToListModal(item);
    };

    const handleMarkWatchedClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkShowAsWatched(item);
    };
    
    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const trackedItem: TrackedItem = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type,
            poster_path: item.poster_path,
            genre_ids: item.genre_ids,
        };
        onToggleFavoriteShow(trackedItem);
    };

    const handleCalendarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMarkAsWatchedModalState({ isOpen: true, item: item });
    };

    const handleSaveWatchedDate = (data: { date: string; note: string }) => {
        if (markAsWatchedModalState.item) {
            onMarkShowAsWatched(markAsWatchedModalState.item, data.date);
        }
        setMarkAsWatchedModalState({ isOpen: false, item: null });
    };

    return (
        <>
            <MarkAsWatchedModal
                isOpen={markAsWatchedModalState.isOpen}
                onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })}
                mediaTitle={markAsWatchedModalState.item?.title || markAsWatchedModalState.item?.name || ''}
                onSave={handleSaveWatchedDate}
            />
            <div className="w-full">
                <div 
                    className="relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    <div className="aspect-[2/3]">
                        <FallbackImage 
                            srcs={posterSrcs}
                            placeholder={PLACEHOLDER_POSTER}
                            noPlaceholder={true}
                            alt={`${title} poster`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                         <h3 className="text-white font-bold text-sm truncate">{title}</h3>
                         {releaseDate && <p className="text-xs text-white/80">{new Date(releaseDate).getFullYear()}</p>}
                    </div>
                </div>
                <div className="w-full mt-2 grid grid-cols-4 gap-1.5">
                    <button onClick={handleFavoriteClick} className={`flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md transition-colors ${isFavorite ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-4 h-4" />
                    </button>
                    <button onClick={handleMarkWatchedClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Mark as Watched">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleCalendarClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Set Watched Date">
                        <CalendarIcon className="w-4 h-4" />
                    </button>
                    <button onClick={handleAddClick} className="flex items-center justify-center space-x-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-bg-secondary text-text-primary hover:brightness-125 transition-colors" title="Add to List">
                        <PlusIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </>
    );
};

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onSelectPerson: (personId: number) => void;
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
}

type SearchTab = 'media' | 'people' | 'myLists' | 'communityLists' | 'users' | 'genres';

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
  const { onSelectShow, onSelectPerson, searchHistory, onUpdateSearchHistory, query, onQueryChange, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites, genres, userData, currentUser } = props;

  const [activeTab, setActiveTab] = useState<SearchTab>('media');
  
  // --- Search State ---
  const [mediaResults, setMediaResults] = useState<TmdbMedia[]>([]);
  const [peopleResults, setPeopleResults] = useState<TmdbPerson[]>([]);
  const [myListResults, setMyListResults] = useState<CustomList[]>([]);
  const [communityListResults, setCommunityListResults] = useState<PublicCustomList[]>([]);
  const [userResults, setUserResults] = useState<PublicUser[]>([]);
  const [genreResults, setGenreResults] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Discovery State ---
  const [discoveryTab, setDiscoveryTab] = useState<'tv' | 'movie'>('tv');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [discoveryItems, setDiscoveryItems] = useState<TmdbMedia[]>([]);
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [discoveryTotalPages, setDiscoveryTotalPages] = useState(1);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryLoadingMore, setDiscoveryLoadingMore] = useState(false);

  // --- Search Logic ---
  useEffect(() => {
    if (query.length < 1) {
        setMediaResults([]);
        setPeopleResults([]);
        setMyListResults([]);
        setCommunityListResults([]);
        setUserResults([]);
        setGenreResults([]);
        return;
    }

    const performAllSearches = async () => {
        setLoading(true);
        setError(null);
        setActiveTab('media');
        onUpdateSearchHistory(query);

        // API Searches
        const mediaPromise = searchMediaPaginated(query, 1);
        const peoplePromise = searchPeoplePaginated(query, 1);
        
        // Local Searches
        const lowerCaseQuery = query.toLowerCase();
        const myLists = userData.customLists.filter(list => list.name.toLowerCase().includes(lowerCaseQuery));
        const communityLists = searchPublicLists(query, currentUser?.id || null);
        const users = searchUsers(query, currentUser?.id || null);
        const genreArray = Object.entries(genres).map(([id, name]) => ({id: Number(id), name}));
        // FIX: Explicitly cast g.name to string to avoid potential 'unknown' type inference issues.
        const matchingGenres = genreArray.filter(g => String(g.name).toLowerCase().includes(lowerCaseQuery));

        setMyListResults(myLists);
        setCommunityListResults(communityLists);
        setUserResults(users);
        setGenreResults(matchingGenres);

        try {
            const [mediaData, peopleData] = await Promise.all([mediaPromise, peoplePromise]);
            setMediaResults(mediaData.results);
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


  // --- Discovery Effects & Infinite Scroll ---
  const discoveryObserver = useRef<IntersectionObserver>();
  const lastDiscoveryElementRef = useCallback(node => {
    if (discoveryLoading || discoveryLoadingMore) return;
    if (discoveryObserver.current) discoveryObserver.current.disconnect();
    discoveryObserver.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && discoveryPage < discoveryTotalPages) {
        setDiscoveryPage(prevPage => prevPage + 1);
      }
    });
    if (node) discoveryObserver.current.observe(node);
  }, [discoveryLoading, discoveryLoadingMore, discoveryPage, discoveryTotalPages]);

  useEffect(() => {
    if (query.length > 0) return;
    setDiscoveryItems([]);
    setDiscoveryPage(1);
    setDiscoveryTotalPages(1);
    setDiscoveryLoading(true);
    discoverMediaPaginated(discoveryTab, {sortBy: 'popularity.desc', genre: selectedGenre || undefined}, 1)
      .then(data => {
        setDiscoveryItems(data.results);
        setDiscoveryTotalPages(data.total_pages);
      })
      .catch(e => console.error(`Failed to fetch discovery ${discoveryTab}`, e))
      .finally(() => setDiscoveryLoading(false));
  }, [discoveryTab, query, selectedGenre]);

  useEffect(() => {
    if (query.length > 0 || discoveryPage === 1) return;
    setDiscoveryLoadingMore(true);
    discoverMediaPaginated(discoveryTab, {sortBy: 'popularity.desc', genre: selectedGenre || undefined}, discoveryPage)
      .then(data => setDiscoveryItems(prev => [...prev, ...data.results]))
      .catch(e => console.error(`Failed to fetch more discovery ${discoveryTab}`, e))
      .finally(() => setDiscoveryLoadingMore(false));
  }, [discoveryPage, discoveryTab, query, selectedGenre]);

  const handleRecentSearchClick = (recentQuery: string) => onQueryChange(recentQuery);
  const handleDiscoveryTabChange = (tab: 'tv' | 'movie') => {
      setDiscoveryTab(tab);
      setSelectedGenre(null);
  };
  
  // --- RENDER FUNCTIONS ---
  
  const renderDiscovery = () => (
    <>
      {searchHistory.length > 0 && (
          <div className="mb-8">
              <h2 className="text-lg font-semibold text-text-secondary mb-3">Recent Searches</h2>
              <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map(item => (
                      <button key={item.timestamp} onClick={() => handleRecentSearchClick(item.query)} className="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-full text-sm hover:brightness-125 transition-colors">
                          {item.query}
                      </button>
                  ))}
              </div>
          </div>
      )}
      <div className="flex p-1 bg-bg-secondary/50 rounded-lg mb-6">
          <button onClick={() => handleDiscoveryTabChange('tv')} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${discoveryTab === 'tv' ? 'bg-accent-gradient text-on-accent shadow-md' : 'text-text-secondary'}`}>
              Popular Shows
          </button>
          <button onClick={() => handleDiscoveryTabChange('movie')} className={`w-full py-1.5 text-sm font-semibold rounded-md transition-all ${discoveryTab === 'movie' ? 'bg-accent-gradient text-on-accent shadow-md' : 'text-text-secondary'}`}>
              Popular Movies
          </button>
      </div>
      
      <GenreFilter genres={genres} selectedGenreId={selectedGenre} onSelectGenre={setSelectedGenre} />

      {discoveryLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 animate-pulse">
            {[...Array(14)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
        </div>
      ) : (
        <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {discoveryItems.map((item, index) => {
                    const isFavorite = favorites.some(fav => fav.id === item.id);
                    const card = <ActionCard item={item} onSelect={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} isFavorite={isFavorite} />;
                    if (discoveryItems.length === index + 1) {
                        return <div ref={lastDiscoveryElementRef} key={item.id}>{card}</div>;
                    }
                    return <div key={item.id}>{card}</div>;
                })}
            </div>
            {discoveryLoadingMore && <div className="text-center p-8">Loading more...</div>}
        </>
      )}
    </>
  );

  const renderSearchResults = () => {
    if (loading) return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 animate-pulse">
            {[...Array(14)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-lg"></div><div className="h-9 bg-bg-secondary rounded-md mt-2"></div></div>)}
        </div>
    );
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

    switch (activeTab) {
        case 'media': return mediaResults.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {mediaResults.map(item => <ActionCard key={item.id} item={item} onSelect={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} onMarkShowAsWatched={onMarkShowAsWatched} onToggleFavoriteShow={onToggleFavoriteShow} isFavorite={favorites.some(f => f.id === item.id)} />)}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No media found.</p>;

        case 'people': return peopleResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {peopleResults.map(person => (
                    // FIX: Pass person.id to onSelectPerson, which expects one argument.
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
                {communityListResults.map(list => (
                    <div key={list.id} className="bg-bg-secondary p-4 rounded-lg">
                        <h3 className="font-bold text-text-primary">{list.name}</h3>
                        <p className="text-sm text-text-secondary">by {list.user.username} &bull; {list.items.length} items</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-8 text-text-secondary">No matching public lists found.</p>;
        
        case 'users': return userResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userResults.map(user => (
                    <div key={user.id} className="text-center group cursor-pointer">
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
    <div className="animate-fade-in px-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-text-primary">Search</h1>
           <p className="mt-1 text-text-secondary">Find your next favorite show, movie, list, or user.</p>
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
        
        {query.length > 2 ? (
            <>
              <div className="border-b border-bg-secondary/50 mb-6">
                  <div className="flex space-x-2 overflow-x-auto hide-scrollbar pb-2">
                      <TabButton tabId="media" label="Media" count={mediaResults.length} />
                      <TabButton tabId="people" label="People" count={peopleResults.length} />
                      <TabButton tabId="myLists" label="My Lists" count={myListResults.length} />
                      <TabButton tabId="communityLists" label="Community Lists" count={communityListResults.length} />
                      <TabButton tabId="users" label="Users" count={userResults.length} />
                      <TabButton tabId="genres" label="Genres" count={genreResults.length} />
                  </div>
              </div>
              {renderSearchResults()}
            </>
        ) : renderDiscovery()}
    </div>
  );
};

export default SearchScreen;