import React, { useState, useMemo } from 'react';
import { UserData, WatchStatus, TrackedItem, CustomList, CustomListItem } from '../types';
import CompactShowCard from '../components/CompactShowCard';
import ListFilterBar from '../components/ListFilterBar';
import { PlusIcon, TrashIcon } from '../components/Icons';

// --- Reusable Components ---

const ListGrid: React.FC<{ items: TrackedItem[]; onSelect: (id: number, media_type: 'tv' | 'movie') => void; listId?: string, onRemoveItem?: (listId: string, itemId: number) => void }> = ({ items, onSelect, listId, onRemoveItem }) => {
    if (items.length === 0) return <p className="text-text-secondary text-center py-4">This list is empty.</p>;
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {items.map(item => (
                 <div key={item.id} className="relative group">
                    <CompactShowCard item={item} onSelect={onSelect} />
                    {listId && onRemoveItem && (
                         <button onClick={() => onRemoveItem(listId, item.id)} className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-3 h-3"/>
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

const ListSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">{title}</h2>
        {children}
    </section>
);

const ListModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (name: string, description: string) => void; listToEdit?: CustomList | null }> = ({ isOpen, onClose, onSave, listToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setName(listToEdit?.name || '');
            setDescription(listToEdit?.description || '');
        }
    }, [isOpen, listToEdit]);

    if (!isOpen) return null;
    
    const handleSave = () => {
        if (!name.trim()) return alert("List name cannot be empty.");
        onSave(name, description);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-lg p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-text-primary mb-4">{listToEdit ? 'Edit List' : 'Create New List'}</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="List Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                    <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">Cancel</button>
                    <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity">Save</button>
                </div>
            </div>
        </div>
    );
};


// --- Main Screen ---

interface MyListsScreenProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
}

const MyListsScreen: React.FC<MyListsScreenProps> = ({ userData, genres, onSelectShow, setCustomLists }) => {
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus | null>(null);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<CustomList | null>(null);
  
  const filteredLists = useMemo(() => {
    const applyFilter = (items: TrackedItem[]) => {
      if (!selectedGenreId) return items;
      return items.filter(item => item.genre_ids?.includes(selectedGenreId));
    };

    return {
      watching: applyFilter(userData.watching),
      planToWatch: applyFilter(userData.planToWatch),
      completed: applyFilter(userData.completed),
      favorites: applyFilter(userData.favorites),
      customLists: (userData.customLists || []).map(list => ({
          ...list,
          items: applyFilter(list.items as TrackedItem[]) as CustomListItem[],
      }))
    };
  }, [userData, selectedGenreId]);

  const handleCreateList = (name: string, description: string) => {
    const newList: CustomList = { id: `cl-${Date.now()}`, name, description, items: [], createdAt: new Date().toISOString() };
    setCustomLists(prev => [newList, ...prev]);
  };
    
  const handleEditList = (name: string, description: string) => {
    if (!listToEdit) return;
    setCustomLists(prev => prev.map(l => l.id === listToEdit.id ? { ...l, name, description } : l));
  };

  const handleDeleteList = (listId: string) => {
    if (window.confirm("Are you sure you want to delete this list? This cannot be undone.")) {
        setCustomLists(prev => prev.filter(l => l.id !== listId));
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
    <div className="animate-fade-in">
        <ListModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setListToEdit(null); }} onSave={listToEdit ? handleEditList : handleCreateList} listToEdit={listToEdit} />
        <ListFilterBar
            genres={genres}
            selectedGenreId={selectedGenreId}
            onSelectGenre={setSelectedGenreId}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
        />

        {(!selectedStatus || selectedStatus === 'watching') && <ListSection title="Watching" children={<ListGrid items={filteredLists.watching} onSelect={onSelectShow} />} />}
        {(!selectedStatus || selectedStatus === 'planToWatch') && <ListSection title="Plan to Watch" children={<ListGrid items={filteredLists.planToWatch} onSelect={onSelectShow} />} />}
        {(!selectedStatus || selectedStatus === 'completed') && <ListSection title="Completed" children={<ListGrid items={filteredLists.completed} onSelect={onSelectShow} />} />}
        {(!selectedStatus || selectedStatus === 'favorites') && <ListSection title="Favorites" children={<ListGrid items={filteredLists.favorites} onSelect={onSelectShow} />} />}

        {!selectedStatus && (
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient">Custom Lists</h2>
                     <button onClick={() => { setListToEdit(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-opacity">
                        <PlusIcon className="w-5 h-5 mr-1" /> Create List
                    </button>
                </div>
                 <div className="space-y-8">
                    {filteredLists.customLists.map(list => (
                        <div key={list.id}>
                            <div className="flex justify-between items-baseline">
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary">{list.name}</h3>
                                    {list.description && <p className="text-sm text-text-secondary mt-1">{list.description}</p>}
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => { setListToEdit(list); setIsModalOpen(true); }} className="text-xs font-semibold text-primary-accent hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteList(list.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <ListGrid items={list.items as TrackedItem[]} onSelect={onSelectShow} listId={list.id} onRemoveItem={handleRemoveItem} />
                            </div>
                        </div>
                    ))}
                 </div>
            </section>
        )}
    </div>
  );
};

export default MyListsScreen;