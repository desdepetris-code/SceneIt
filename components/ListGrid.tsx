import React from 'react';
import { TrackedItem, CustomListItem } from '../types';
import CompactShowCard from './CompactShowCard';
import { TrashIcon } from './Icons';

interface ListGridProps {
    items: (TrackedItem | CustomListItem)[];
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    listId?: string;
    onRemoveItem?: (listId: string, itemId: number) => void;
    showAddedAt?: boolean;
}

const ListGrid: React.FC<ListGridProps> = ({ items, onSelect, listId, onRemoveItem, showAddedAt }) => {
    if (items.length === 0) return <p className="text-text-secondary text-center py-4">This list is empty.</p>;
    
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {items.map(item => (
                <div key={item.id} className="relative group">
                    <CompactShowCard item={item as TrackedItem} onSelect={onSelect} showAddedAt={showAddedAt} />
                    {listId && onRemoveItem && (
                        <button onClick={() => onRemoveItem(listId, item.id)} className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ListGrid;
