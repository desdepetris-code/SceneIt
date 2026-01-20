import React, { useState, useMemo, useEffect } from 'react';
import { UserData, CustomList, CustomListItem, AppPreferences } from '../types';
import ListCard from '../components/ListCard';
import ListDetailView from '../components/ListDetailView';
import { PlusIcon, ListBulletIcon } from '../components/Icons';
import { confirmationService } from '../services/confirmationService';

// --- Reusable Modal ---

const ListModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (name: string, description: string, isPublic: boolean) => void; listToEdit?: CustomList | null }> = ({ isOpen, onClose, onSave, listToEdit }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[200] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 border border-white/10" onClick={e => e.stopPropagation()}>
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-6">{listToEdit ? 'Edit Collection' : 'New Collection'}</h2>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 ml-2">Display Name</label>
                        <input type="text" placeholder="e.g. 90s Noir..." value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary focus:outline-none border border-white/5 shadow-inner font-bold" disabled={listToEdit?.id === 'watchlist'} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 ml-2">Description (Optional)</label>
                        <textarea placeholder="Tell the story of this collection..." value={description} onChange={e => setDescription(e.target.value)} className="w-full h-24 p-4 bg-bg-secondary rounded-2xl text-text-primary focus:outline-none border border-white/5 shadow-inner font-medium leading-relaxed" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-bg-secondary/40 rounded-2xl border border-white/5">
                        <div className="min-w-0 pr-4">
                            <span className="text-xs font-black uppercase tracking-widest text-text-primary block">Public Sync</span>
                            <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest opacity-60 leading-tight mt-0.5">Allow other users to discover and like this list.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={isPublic} 
                            onChange={e => setIsPublic(e.target.checked)}
                            className="h-6 w-6 rounded-lg border-white/10 text-primary-accent bg-bg-primary focus:ring-primary-accent" 
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                    <button onClick={onClose} className="px-8 py-3 rounded-full text-text-secondary font-black uppercase tracking-widest text-xs hover:text-text-primary transition-colors">Cancel</button>
                    <button onClick={handleSave} className="px-10 py-3 rounded-full text-on-accent bg-accent-gradient font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-105 transition-transform">Save Collection</button>
                </div>
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
  preferences: AppPreferences;
}

const MyListsScreen: React.FC<MyListsScreenProps> = ({ userData, onSelectShow, setCustomLists, genres = {}, preferences }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<CustomList | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const activeList = useMemo(() => {
    return userData.customLists.find(l => l.id === activeListId);
  }, [userData.customLists, activeListId]);

  const handleCreateList = (name: string, description: string, isPublic: boolean) => {
    const newList: CustomList = { id: `cl-${Date.now()}`, name, description, items: [], createdAt: new Date().toISOString(), isPublic, likes: [] };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`Collection "${name}" added.`);
  };
    
  const handleEditList = (name: string, description: string, isPublic: boolean) => {
    if (!listToEdit) return;
    setCustomLists(prev => prev.map(l => l.id === listToEdit.id ? { ...l, name, description, isPublic } : l));
    confirmationService.show(`Collection details updated.`);
  };

  const handleDeleteList = (listId: string) => {
    if (listId === 'watchlist') return;
    if (window.confirm("ARE YOU SURE?\n\nDeleting this collection is permanent and cannot be undone.")) {
        setCustomLists(prev => prev.filter(l => l.id !== listId));
        setActiveListId(null);
        confirmationService.show("Collection removed.");
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
  
  if (activeListId && activeList) {
      return (
          <ListDetailView 
            list={activeList}
            onBack={() => setActiveListId(null)}
            onSelectShow={onSelectShow}
            onEdit={(list) => { setListToEdit(list); setIsModalOpen(true); }}
            onDelete={handleDeleteList}
            onRemoveItem={handleRemoveItem}
            genres={genres}
            preferences={preferences}
          />
      );
  }

  return (
    <div className="animate-fade-in px-4 pb-20">
        <ListModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setListToEdit(null); }} onSave={listToEdit ? handleEditList : handleCreateList} listToEdit={listToEdit} />
        
        <header className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-6">
            <div>
                <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">Collections</h1>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Curated libraries of your cinematic legacy</p>
            </div>
             <button onClick={() => { setListToEdit(null); setIsModalOpen(true); }} className="flex items-center px-10 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-all shadow-2xl transform hover:scale-105 active:scale-95">
                <PlusIcon className="w-5 h-5 mr-2" /> New Collection
            </button>
        </header>

        {(userData.customLists || []).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {(userData.customLists || []).map(list => (
                    <ListCard 
                        key={list.id} 
                        list={list} 
                        onClick={() => setActiveListId(list.id)} 
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-40 bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                <ListBulletIcon className="w-20 h-20 text-text-secondary/20 mb-8" />
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">Library Empty</h2>
                <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto uppercase tracking-widest font-bold italic opacity-60 leading-relaxed">Your collections are the chapters of your viewing journey. Create your first list to start organizing.</p>
                <button 
                    onClick={() => { setListToEdit(null); setIsModalOpen(true); }}
                    className="mt-10 px-10 py-4 bg-primary-accent/10 border border-primary-accent/20 text-primary-accent font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-primary-accent/20 transition-all"
                >
                    Create Your First List
                </button>
            </div>
        )}
    </div>
  );
};

export default MyListsScreen;