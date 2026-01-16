import React, { useState, useMemo } from 'react';
import { UserData, CustomList, CustomListItem } from '../types';
import ListGrid from '../components/ListGrid';
// Added ListBulletIcon to imports to fix 'Cannot find name' error
import { PlusIcon, GlobeAltIcon, LockClosedIcon, SearchIcon, ChevronDownIcon, XMarkIcon, FilterIcon, ListBulletIcon } from '../components/Icons';
// Added confirmationService import to fix 'Cannot find name' error
import { confirmationService } from '../services/confirmationService';

// --- Reusable Components ---

const ListModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (name: string, description: string, isPublic: boolean) => void; listToEdit?: CustomList | null }> = ({ isOpen, onClose, onSave, listToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setName(listToEdit?.name || '');
            setDescription(listToEdit?.description || '');
            setIsPublic(listToEdit?.isPublic || false);
        }
    }, [isOpen, listToEdit]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        if (!name.trim()) return alert("List name cannot be empty.");
        onSave(name, description, isPublic);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-4">{listToEdit ? 'Edit List' : 'Create New List'}</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="List Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" disabled={listToEdit?.id === 'watchlist'} />
                    <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                    <div className="flex items-center justify-between p-3 bg-bg-secondary rounded-md">
                        <label htmlFor="is-public-toggle" className="text-text-primary font-medium">
                            Make List Public
                            <p className="text-xs text-text-secondary font-normal">Public lists can be discovered by other users.</p>
                        </label>
                        <input 
                            type="checkbox" 
                            id="is-public-toggle"
                            checked={isPublic} 
                            onChange={e => setIsPublic(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-primary-accent focus:ring-primary-accent" 
                        />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity">Save</button>
                </div>
            </div>
        </div>
    );
};

interface ListWithFiltersProps {
    list: CustomList;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onEdit: (list: CustomList) => void;
    onDelete: (id: string) => void;
    onRemoveItem: (listId: string, itemId: number) => void;
    genres: Record<number, string>;
}

const ListWithFilters: React.FC<ListWithFiltersProps> = ({ list, onSelectShow, onEdit, onDelete, onRemoveItem, genres }) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
    const [genreFilter, setGenreFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

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
        <div className="bg-bg-secondary/20 p-6 rounded-3xl border border-white/5 shadow-inner">
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                    <div className="flex items-center space-x-3">
                        {list.isPublic 
                            ? <span title="Public"><GlobeAltIcon className="w-5 h-5 text-sky-400 flex-shrink-0" /></span>
                            : <span title="Private"><LockClosedIcon className="w-5 h-5 text-text-secondary flex-shrink-0" /></span>
                        }
                        <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">{list.name}</h3>
                    </div>
                    {list.description && <p className="text-sm text-text-secondary mt-1 pl-8 italic">{list.description}</p>}
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => onEdit(list)} className="text-xs font-black uppercase tracking-widest text-primary-accent hover:underline">Edit</button>
                    {!isWatchlist && (
                        <button onClick={() => onDelete(list.id)} className="text-xs font-black uppercase tracking-widest text-red-500 hover:underline">Delete</button>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-grow">
                    <input 
                        type="text" 
                        placeholder={`Search in ${list.name}...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-bg-primary text-text-primary text-sm rounded-xl border border-white/5 focus:border-primary-accent focus:outline-none"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                </div>
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all ${showFilters ? 'bg-primary-accent text-on-accent' : 'bg-bg-primary text-text-secondary hover:text-text-primary border border-white/5'}`}
                >
                    <FilterIcon className="w-4 h-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Filters</span>
                </button>
            </div>

            {showFilters && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-bg-primary/40 rounded-2xl border border-white/5 animate-fade-in">
                    <div className="relative">
                        <select 
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as any)}
                            className="w-full appearance-none bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-text-primary focus:outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="movie">Movies</option>
                            <option value="tv">TV Shows</option>
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select 
                            value={genreFilter}
                            onChange={e => setGenreFilter(e.target.value)}
                            className="w-full appearance-none bg-bg-primary border border-white/5 rounded-xl py-2 px-3 text-xs font-bold text-text-primary focus:outline-none"
                        >
                            <option value="">All Genres</option>
                            {Object.entries(genres).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                </div>
            )}

            <div className="min-h-[100px]">
                {filteredItems.length > 0 ? (
                    <ListGrid items={filteredItems} onSelect={onSelectShow} listId={list.id} onRemoveItem={onRemoveItem} />
                ) : (
                    <div className="py-10 text-center opacity-40">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary">No items found matching criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Screen ---

interface MyListsScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  genres?: Record<number, string>;
}

const MyListsScreen: React.FC<MyListsScreenProps> = ({ userData, onSelectShow, setCustomLists, genres = {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<CustomList | null>(null);

  const handleCreateList = (name: string, description: string, isPublic: boolean) => {
    const newList: CustomList = { id: `cl-${Date.now()}`, name, description, items: [], createdAt: new Date().toISOString(), isPublic, likes: [] };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`List "${name}" created.`);
  };
    
  const handleEditList = (name: string, description: string, isPublic: boolean) => {
    if (!listToEdit) return;
    setCustomLists(prev => prev.map(l => l.id === listToEdit.id ? { ...l, name, description, isPublic } : l));
    confirmationService.show(`List "${name}" updated.`);
  };

  const handleDeleteList = (listId: string) => {
    if (listId === 'watchlist') return;
    if (window.confirm("Are you sure you want to delete this list? This cannot be undone.")) {
        setCustomLists(prev => prev.filter(l => l.id !== listId));
        confirmationService.show("List deleted.");
    }
  };

  const handleRemoveItem = (listId: string, itemId: number) => {
    setCustomLists(prev => prev.map(l => {
        if (l.id === listId) {
            return { ...l, items: l.items.filter(i => i.id !== itemId) };
        }
        return l;
    }));
  };
  
  return (
    <div className="animate-fade-in px-4">
        <ListModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setListToEdit(null); }} onSave={listToEdit ? handleEditList : handleCreateList} listToEdit={listToEdit} />
        
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
            <div>
                <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Your Collections</h1>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-60">Personalized curation for your viewing journey</p>
            </div>
             <button onClick={() => { setListToEdit(null); setIsModalOpen(true); }} className="flex items-center px-8 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-all shadow-2xl">
                <PlusIcon className="w-5 h-5 mr-2" /> New List
            </button>
        </header>

        <div className="space-y-12">
            {(userData.customLists || []).length > 0 ? (
                (userData.customLists || []).map(list => (
                    <ListWithFilters 
                        key={list.id} 
                        list={list} 
                        onSelectShow={onSelectShow} 
                        onEdit={setListToEdit} 
                        onDelete={handleDeleteList} 
                        onRemoveItem={handleRemoveItem}
                        genres={genres}
                    />
                ))
            ) : (
                <div className="text-center py-32 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
                    <ListBulletIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-6" />
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Library Empty</h2>
                    <p className="mt-2 text-sm text-text-secondary max-w-xs mx-auto uppercase tracking-widest font-bold italic">Start adding titles or create custom lists to build your montage.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default MyListsScreen;