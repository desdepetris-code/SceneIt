import React, { useState, useMemo } from 'react';
import { UserData, WatchStatus } from '../types';
import ListGrid from '../components/ListGrid';
import GenreFilter from '../components/GenreFilter';
import Carousel from '../components/Carousel';

interface LibraryScreenProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ userData, genres, onSelectShow }) => {
  const [activeTab, setActiveTab] = useState<WatchStatus>('watching');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);

  const tabs: { id: WatchStatus, label: string }[] = [
    { id: 'watching', label: 'Watching' },
    { id: 'planToWatch', label: 'Plan to Watch' },
    { id: 'completed', label: 'Completed' },
    { id: 'onHold', label: 'On Hold' },
    { id: 'dropped', label: 'Dropped' },
  ];

  const itemsForTab = userData[activeTab] || [];

  const filteredItems = useMemo(() => {
    if (!selectedGenreId) return itemsForTab;
    return itemsForTab.filter(item => item.genre_ids?.includes(selectedGenreId));
  }, [itemsForTab, selectedGenreId]);

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-text-primary mb-4">Library</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-bg-secondary/50">
        <Carousel>
          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent-gradient text-on-accent'
                    : 'bg-bg-secondary text-text-secondary hover:brightness-125'
                }`}
              >
                {tab.label} ({userData[tab.id]?.length || 0})
              </button>
            ))}
          </div>
        </Carousel>
      </div>

      <GenreFilter genres={genres} selectedGenreId={selectedGenreId} onSelectGenre={setSelectedGenreId} />

      <ListGrid items={filteredItems} onSelect={onSelectShow} />
    </div>
  );
};

export default LibraryScreen;
