import React, { useState } from 'react';
import { UserData, CustomList } from '../types';
import ListGrid from '../components/ListGrid';
import { PlusIcon, GlobeAltIcon, LockClosedIcon } from '../components/Icons';

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
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
}

const MyListsScreen: React.FC<MyListsScreenProps> = ({ userData, onSelectShow, setCustomLists }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<CustomList | null>(null);

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
        
        <section>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Custom Lists</h1>
                 <button onClick={() => { setListToEdit(null); setIsModalOpen(true); }} className="flex items-center px-4 py-2 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-opacity">
                    <PlusIcon className="w-5 h-5 mr-1" /> Create List
                </button>
            </div>
             <div className="space-y-8">
                {(userData.customLists || []).length > 0 ? (
                    (userData.customLists || []).map(list => (
                        <div key={list.id}>
                            <div className="flex justify-between items-baseline">
                                <div className="flex items-center space-x-2">
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
                    ))
                ) : (
                    <div className="text-center py-20 bg-bg-secondary/30 rounded-lg">
                        <h2 className="text-xl font-bold">No Custom Lists Yet</h2>
                        <p className="mt-2 text-text-secondary">Click "Create List" to start organizing your favorites.</p>
                    </div>
                )}
             </div>
        </section>
    </div>
  );
};

export default MyListsScreen;