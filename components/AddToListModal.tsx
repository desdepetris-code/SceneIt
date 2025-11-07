import React, { useState } from 'react';
import { TmdbMedia, CustomList, CustomListItem, TrackedItem, WatchStatus } from '../types';
import { ChevronRightIcon, XMarkIcon } from './Icons';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToAdd: TmdbMedia | TrackedItem | null;
  customLists: CustomList[];
  onAddToList: (listId: string, item: CustomListItem) => void;
  onCreateAndAddToList: (listName: string, item: CustomListItem) => void;
  onGoToDetails: (id: number, media_type: 'tv' | 'movie') => void;
  onUpdateLists: (item: TrackedItem, oldStatus: WatchStatus | null, newStatus: WatchStatus | null) => void;
}

const AddToListModal: React.FC<AddToListModalProps> = ({ isOpen, onClose, itemToAdd, customLists, onAddToList, onCreateAndAddToList, onGoToDetails, onUpdateLists }) => {
    const [view, setView] = useState<'list' | 'create'>('list');
    const [newListName, setNewListName] = useState('');

    if (!isOpen || !itemToAdd) return null;

    const resetAndClose = () => {
        setView('list');
        setNewListName('');
        onClose();
    };
    
    const trackedItem: TrackedItem = {
        id: itemToAdd.id,
        title: itemToAdd.title || (itemToAdd as TmdbMedia).name || 'Untitled',
        media_type: itemToAdd.media_type,
        poster_path: itemToAdd.poster_path,
        genre_ids: itemToAdd.genre_ids,
    };

    const handleUpdateStandardList = (list: WatchStatus) => {
        onUpdateLists(trackedItem, null, list);
        resetAndClose();
    };

    const handleAdd = (listId: string) => {
        onAddToList(listId, trackedItem as CustomListItem);
        resetAndClose();
    };

    const handleCreate = () => {
        if (!newListName.trim()) {
            alert("Please enter a list name.");
            return;
        }
        onCreateAndAddToList(newListName.trim(), trackedItem as CustomListItem);
        resetAndClose();
    };
    
    const handleGoToDetailsClick = () => {
        onGoToDetails(itemToAdd.id, itemToAdd.media_type);
        resetAndClose();
    };

    const detailsPageText = itemToAdd.media_type === 'tv' ? 'Show Page' : 'Movie Page';

    const standardLists: { id: WatchStatus, label: string }[] = [
        { id: 'watching', label: 'Watching' },
        { id: 'planToWatch', label: 'Plan to Watch' },
        { id: 'completed', label: 'Completed' },
        { id: 'onHold', label: 'On Hold' },
        { id: 'dropped', label: 'Dropped' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={resetAndClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
                <button onClick={resetAndClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
                    <XMarkIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={handleGoToDetailsClick}
                    className="w-full flex items-center justify-between p-3 mb-4 rounded-md bg-bg-secondary hover:brightness-125 transition-colors font-semibold"
                >
                    <span>{detailsPageText}</span>
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
                <div className="w-full border-t border-bg-secondary/50 mb-4"></div>

                {view === 'list' ? (
                    <>
                        <h2 className="text-xl font-bold text-text-primary mb-4">Add to a list...</h2>
                        <div className="space-y-2 mb-4">
                            {standardLists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => handleUpdateStandardList(list.id)}
                                    className="w-full text-left p-3 rounded-md bg-bg-secondary hover:brightness-125 transition-colors"
                                >
                                    {list.label}
                                </button>
                            ))}
                        </div>
                        
                        <div className="w-full border-t border-bg-secondary/50 my-4"></div>

                        {customLists.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
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
                        )}
                        <button
                            onClick={() => setView('create')}
                            className="w-full p-3 rounded-md bg-accent-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Create a new list
                        </button>
                    </>
                ) : (
                    // Create view remains the same
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