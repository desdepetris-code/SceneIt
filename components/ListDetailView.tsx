import React, { useState, useMemo, useEffect } from 'react';
import { CustomList, AppPreferences, TrackedItem } from '../types';
import ListGrid from './ListGrid';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronLeftIcon, TvIcon, FilmIcon } from './Icons';

interface ListDetailViewProps {
    list: CustomList;
    onBack: () => void;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onEdit: (list: CustomList) => void;
    onDelete: (id: string) => void;
    onRemoveItem: (listId: string, itemId: number) => void;
    genres: Record<number, string>;
    preferences: AppPreferences;
}

const ListDetailView: React.FC<ListDetailViewProps> = ({ list, onBack, onSelectShow, onEdit, onDelete, onRemoveItem, genres, preferences }) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
    const [genreFilter, setGenreFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(preferences?.searchAlwaysExpandFilters || false);

    const stats = useMemo(() => {
        const tvCount = list.items.filter(i => i.media_type === 'tv').length;
        const movieCount = list.items.filter(i => i.media_type === 'movie').length;
        return { tvCount, movieCount };
    }, [list.items]);

    const filteredItems = useMemo(() => {
        return list.items.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === 'all' || item.media_type === typeFilter;
            const matchesGenre = !genreFilter || item.genre_ids?.includes(Number(genreFilter));
            return matchesSearch && matchesType && matchesGenre;
        });
    }, [list.items, search, typeFilter, genreFilter]);

    const isWatchlist = list.id === 'watchlist';

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="p-4 bg-bg-secondary/40 rounded-2xl text-text-primary hover:text-primary-accent hover:bg-bg-secondary transition-all border border-white/5 shadow-xl group"
                    >
                        <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter leading-none">{list.name}</h1>
                            <span className="px-2 py-0.5 bg-primary-accent text-on-accent text-[9px] font-black rounded uppercase tracking-widest">{list.items.length}</span>
                        </div>
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60 truncate max-w-lg">
                            {list.description || "Personal curated collection"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-bg-secondary/30 px-4 py-2 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <TvIcon className="w-4 h-4 text-red-400 opacity-60" />
                            <span className="text-[10px] font-black text-text-primary">{stats.tvCount} <span className="text-text-secondary opacity-40">Shows</span></span>
                        </div>
                        <div className="w-px h-4 bg-white/5"></div>
                        <div className="flex items-center gap-2">
                            <FilmIcon className="w-4 h-4 text-blue-400 opacity-60" />
                            <span className="text-[10px] font-black text-text-primary">{stats.movieCount} <span className="text-text-secondary opacity-40">Movies</span></span>
                        </div>
                    </div>
                    <button onClick={() => onEdit(list)} className="p-3 bg-bg-secondary/40 rounded-2xl text-primary-accent hover:brightness-125 transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest px-6">Edit</button>
                    {!isWatchlist && (
                        <button onClick={() => onDelete(list.id)} className="p-3 bg-red-500/10 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all border border-red-500/10 text-[10px] font-black uppercase tracking-widest px-6">Delete</button>
                    )}
                </div>
            </header>

            {/* Local Search and Filter Section */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <input
                            type="text"
                            placeholder={`Search items in ${list.name}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-bg-secondary/40 border border-white/5 rounded-2xl font-black uppercase text-xs focus:border-primary-accent focus:outline-none shadow-xl"
                        />
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl transition-all border ${showFilters ? 'bg-primary-accent text-on-accent shadow-lg border-transparent' : 'bg-bg-secondary/40 text-text-secondary hover:text-text-primary border-white/5 shadow-xl'}`}
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-bg-secondary/20 rounded-3xl border border-white/5 animate-fade-in shadow-inner">
                        <div className="relative">
                            <select 
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value as any)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="all">All Media Types</option>
                                <option value="movie">Movies Only</option>
                                <option value="tv">TV Shows Only</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none opacity-40" />
                        </div>
                        <div className="relative">
                            <select 
                                value={genreFilter}
                                onChange={e => setGenreFilter(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="">All Genres</option>
                                {Object.entries(genres).sort((a,b) => (a[1] as string).localeCompare(b[1] as string)).map(([id, name]) => <option key={id} value={id}>{name as string}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none opacity-40" />
                        </div>
                        <button 
                            onClick={() => { setSearch(''); setTypeFilter('all'); setGenreFilter(''); }}
                            className="px-6 py-3 bg-bg-primary text-text-secondary hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-white/5"
                        >
                            Reset Results
                        </button>
                    </div>
                )}
            </section>

            <div className="pt-4">
                {filteredItems.length > 0 ? (
                    <ListGrid items={filteredItems} onSelect={onSelectShow} listId={list.id} onRemoveItem={onRemoveItem} />
                ) : (
                    <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5">
                        <p className="text-xl font-black text-text-secondary/30 uppercase tracking-[0.2em]">No results found in this collection</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListDetailView;