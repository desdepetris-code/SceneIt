import React, { useState, useMemo } from 'react';
import { UserData, WatchStatus, TrackedItem, CustomList, CustomListItem } from '../types';
import ListGrid from '../components/ListGrid';
import ListFilterBar from '../components/ListFilterBar';
import { PlusIcon, TrashIcon, GlobeAltIcon, LockClosedIcon } from '../components/Icons';

// --- Reusable Components ---

const ListSection: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <section className="mb-8">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">{title}</h2>
        {children}
    </section>
);

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
                    <input type="text" placeholder="List Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent" />
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
    const applyFilter = (items: (TrackedItem | CustomListItem)[]) => {
      if (!selectedGenreId) return items;
      return items.filter(item => (item as TrackedItem).genre_ids?.includes(selectedGenreId));
    };

    return {
      watching: applyFilter(userData.watching),
      planToWatch: applyFilter(userData.planToWatch),
      completed: applyFilter(userData.completed),
      onHold: applyFilter(userData.onHold),
      dropped: applyFilter(userData.dropped),
      favorites: applyFilter(userData.favorites),
      customLists: (userData.customLists || []).map(list => ({
          ...list,
          items: applyFilter(list.items),
      }))
    };
  }, [userData, selectedGenreId]);

  const handleCreateList = (name: string, description: string, isPublic: boolean) => {
    const newList: CustomList = { id: `cl-${Date.now()}`, name, description, items: [], createdAt: new Date().toISOString(), isPublic };
    setCustomLists(prev => [newList, ...prev]);
  };
    
  const handleEditList = (name: string, description: string, isPublic: boolean) => {
    if (!listToEdit) return;
    setCustomLists(prev => prev.map(l => l.id === listToEdit.id ? { ...l, name, description, isPublic } : l));
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
        {(!selectedStatus || selectedStatus === 'onHold') && <ListSection title="On Hold" children={<ListGrid items={filteredLists.onHold} onSelect={onSelectShow} />} />}
        {(!selectedStatus || selectedStatus === 'dropped') && <ListSection title="Dropped" children={<ListGrid items={filteredLists.dropped} onSelect={onSelectShow} />} />}
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
                                <div className="flex items-center space-x-2">
                                    {/* FIX: Wrapped icons in a span with a title attribute to provide tooltip text without causing a type error. */}
                                    {list.isPublic 
                                        ? <span title="Public"><GlobeAltIcon className="w-5 h-5 text-sky-400 flex-shrink-0" /></span>
                                        : <span title="Private"><LockClosedIcon className="w-5 h-5 text-text-secondary flex-shrink-0" /></span>
                                    }
                                    <h3 className="text-xl font-bold text-text-primary">{list.name}</h3>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <button onClick={() => { setListToEdit(list); setIsModalOpen(true); }} className="text-xs font-semibold text-primary-accent hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteList(list.id)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                                </div>
                            </div>
                            {list.description && <p className="text-sm text-text-secondary mt-1 pl-7">{list.description}</p>}
                            <div className="mt-3">
                                <ListGrid items={list.items} onSelect={onSelectShow} listId={list.id} onRemoveItem={handleRemoveItem} />
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
