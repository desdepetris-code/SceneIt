import React, { useState } from 'react';
import { TmdbMedia, CustomList, CustomListItem } from '../types';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToAdd: TmdbMedia | null;
  customLists: CustomList[];
  onAddToList: (listId: string, item: CustomListItem) => void;
  onCreateAndAddToList: (listName: string, item: CustomListItem) => void;
}

const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, itemToAdd, customLists, onAddToList, onCreateAndAddToList }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [newListName, setNewListName] = useState('');

    if (!isOpen || !itemToAdd) return null;

    const resetAndClose = () => {
        setView('list');
        setNewListName('');
        onClose();
    };

    const handleAdd = (listId: string) => {
        const item: CustomListItem = { id: itemToAdd.id, media_type: itemToAdd.media_type, title: itemToAdd.title || itemToAdd.name || 'Untitled', poster_path: itemToAdd.poster_path };
        onAddToList(listId, item);
        resetAndClose();
    };

    const handleCreate = () => {
        if (!newListName.trim()) {
            alert("Please enter a list name.");
            return;
        }
        const item: CustomListItem = { id: itemToAdd.id, media_type: itemToAdd.media_type, title: itemToAdd.title || itemToAdd.name || 'Untitled', poster_path: itemToAdd.poster_path };
        onCreateAndAddToList(newListName.trim(), item);
        resetAndClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
            <div className="bg-card-gradient rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
                {view === 'list' ? (
                    <>
                        <h2 className="text-xl font-bold text-text-primary mb-4">Add to a list...</h2>
                        {customLists.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                                {customLists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => handleAdd(list.id)}
                                        className="w-full text-left p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors"
                                    >
                                        {list.name}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-secondary text-center my-6">You don't have any custom lists yet.</p>
                        )}
                        <button
                            onClick={() => setView('create')}
                            className="w-full p-3 rounded-md bg-accent-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Create a new list
                        </button>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-bold text-text-primary mb-4">Create New List</h2>
                        <input
                            type="text"
                            placeholder="New list name..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="w-full p-3 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent mb-4"
                            autoFocus
                        />
                        <div className="flex justify-end space-x-2">
                             <button onClick={() => setView('list')} className="px-4 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">Back</button>
                            <button onClick={handleCreate} className="px-4 py-2 rounded-md bg-accent-gradient text-white font-semibold hover:opacity-90 transition-opacity">
                                Create & Add
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AddToListModal;
