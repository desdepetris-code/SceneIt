
import React from 'react';
import { TrackedItem } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

interface ListsWidgetProps {
    watching: TrackedItem[];
    planToWatch: TrackedItem[];
    onNavigate: () => void;
}

const ListPreview: React.FC<{ title: string; items: TrackedItem[] }> = ({ title, items }) => (
    <div>
        <h4 className="font-semibold text-text-primary">{title} ({items.length})</h4>
        <div className="flex -space-x-4 mt-2">
            {items.slice(0, 5).map((item, index) => (
                <img 
                    key={item.id}
                    src={getImageUrl(item.poster_path, 'w92')}
                    alt={item.title}
                    className="w-10 h-15 object-cover rounded-md border-2 border-bg-primary bg-bg-secondary"
                    style={{ zIndex: 5 - index }}
                />
            ))}
        </div>
    </div>
);

const ListsWidget: React.FC<ListsWidgetProps> = ({ watching, planToWatch, onNavigate }) => {
    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-4">
            <h3 className="text-xl font-bold text-text-primary mb-4">My Lists</h3>
            <div className="space-y-4">
                <ListPreview title="Currently Watching" items={watching} />
                <ListPreview title="Plan to Watch" items={planToWatch} />
            </div>
            <button onClick={onNavigate} className="w-full mt-4 text-center text-sm font-semibold text-primary-accent hover:underline">
                Manage All Lists
            </button>
        </div>
    );
};

export default ListsWidget;
