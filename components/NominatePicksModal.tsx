
import React, { useState, useMemo } from 'react';
import { TrackedItem, UserData, TmdbMedia, HistoryItem } from '../types';
import { XMarkIcon, SearchIcon, TvIcon, FilmIcon } from './Icons';
import { searchMedia } from '../services/tmdbService';
import { TMDB_IMAGE_BASE_URL } from '../constants';

interface NominatePicksModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserData;
    onNominate: (item: TrackedItem) => void;
    currentPicks: TrackedItem[];
}

const NominatePicksModal: React.FC<NominatePicksModalProps> = ({ isOpen, onClose, userData, onNominate, currentPicks }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbMedia[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setIsLoading(true);
            try {
                const results = await searchMedia(query);
                setSearchResults(results.slice(0, 10));
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const recentItems = useMemo(() => {
        const history = userData.history || [];
        const shows: HistoryItem[] = [];
        const movies: HistoryItem[] = [];
        const seenIds = new Set<number>();

        for (const item of history) {
            if (seenIds.has(item.id)) continue;
            if (item.media_type === 'tv' && shows.length < 5) {
                shows.push(item);
                seenIds.add(item.id);
            } else if (item.media_type === 'movie' && movies.length < 5) {
                movies.push(item);
                seenIds.add(item.id);
            }
            if (shows.length === 5 && movies.length === 5) break;
        }

        return { shows, movies };
    }, [userData.history]);

    if (!isOpen) return null;

    const handleSelect = (item: TmdbMedia | HistoryItem) => {
        const trackedItem: TrackedItem = {
            id: item.id,
            title: item.title || (item as any).name || 'Untitled',
            media_type: item.media_type,
            poster_path: item.poster_path,
        };
        onNominate(trackedItem);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-white/10 flex justify-between items-center bg-card-gradient">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Nominate Picks</h2>
                        <p className="text-sm text-text-secondary">What have you been enjoying this week?</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-6 bg-bg-secondary/30">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search for a show or movie..." 
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-bg-primary text-text-primary placeholder-text-secondary/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-accent border border-white/10 shadow-inner"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    {searchQuery.length > 2 ? (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Search Results</h3>
                            {isLoading ? <p className="text-sm animate-pulse">Searching...</p> : (
                                <div className="grid grid-cols-1 gap-2">
                                    {searchResults.map(item => {
                                        const isPicked = currentPicks.some(p => p.id === item.id);
                                        return (
                                            <button 
                                                key={`${item.id}-${item.media_type}`}
                                                onClick={() => handleSelect(item)}
                                                disabled={isPicked}
                                                className={`flex items-center space-x-3 p-2 rounded-lg text-left transition-colors ${isPicked ? 'opacity-50 grayscale' : 'hover:bg-bg-secondary'}`}
                                            >
                                                <img src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : ''} alt="" className="w-10 h-14 object-cover rounded bg-bg-secondary" />
                                                <div className="min-w-0 flex-grow">
                                                    <p className="font-bold text-text-primary truncate">{item.title || item.name}</p>
                                                    <p className="text-xs text-text-secondary uppercase">{item.media_type}</p>
                                                </div>
                                                {isPicked && <span className="text-[10px] font-black text-yellow-500 uppercase">Picked</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section>
                                <div className="flex items-center space-x-2 mb-4">
                                    <TvIcon className="w-4 h-4 text-red-400" />
                                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Recent Shows</h3>
                                </div>
                                <div className="space-y-3">
                                    {recentItems.shows.length > 0 ? recentItems.shows.map(item => {
                                        const isPicked = currentPicks.some(p => p.id === item.id);
                                        return (
                                            <button 
                                                key={item.logId} 
                                                onClick={() => handleSelect(item)}
                                                disabled={isPicked}
                                                className={`flex items-center space-x-3 w-full text-left p-2 rounded-xl transition-all ${isPicked ? 'opacity-50' : 'hover:bg-bg-secondary group'}`}
                                            >
                                                <img src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : ''} alt="" className="w-12 h-18 object-cover rounded-lg shadow-md" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-text-primary truncate text-sm">{item.title}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase">{isPicked ? 'Already Picked' : 'Nominate'}</p>
                                                </div>
                                            </button>
                                        );
                                    }) : <p className="text-xs text-text-secondary/50">No shows watched yet.</p>}
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center space-x-2 mb-4">
                                    <FilmIcon className="w-4 h-4 text-blue-400" />
                                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Recent Movies</h3>
                                </div>
                                <div className="space-y-3">
                                    {recentItems.movies.length > 0 ? recentItems.movies.map(item => {
                                        const isPicked = currentPicks.some(p => p.id === item.id);
                                        return (
                                            <button 
                                                key={item.logId} 
                                                onClick={() => handleSelect(item)}
                                                disabled={isPicked}
                                                className={`flex items-center space-x-3 w-full text-left p-2 rounded-xl transition-all ${isPicked ? 'opacity-50' : 'hover:bg-bg-secondary group'}`}
                                            >
                                                <img src={item.poster_path ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path}` : ''} alt="" className="w-12 h-18 object-cover rounded-lg shadow-md" />
                                                <div className="min-w-0">
                                                    <p className="font-bold text-text-primary truncate text-sm">{item.title}</p>
                                                    <p className="text-[10px] text-text-secondary uppercase">{isPicked ? 'Already Picked' : 'Nominate'}</p>
                                                </div>
                                            </button>
                                        );
                                    }) : <p className="text-xs text-text-secondary/50">No movies watched yet.</p>}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NominatePicksModal;
