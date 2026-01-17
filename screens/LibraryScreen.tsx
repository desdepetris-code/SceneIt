import React, { useState, useMemo, useEffect } from 'react';
import { UserData, WatchStatus, AppPreferences } from '../types';
import ListGrid from '../components/ListGrid';
import GenreFilter from '../components/GenreFilter';
import Carousel from '../components/Carousel';
import { FilterIcon } from '../components/Icons';

interface LibraryScreenProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  preferences: AppPreferences;
}

const LibraryScreen: React.FC<LibraryScreenProps> = ({ userData, genres, onSelectShow, preferences }) => {
  const [activeTab, setActiveTab] = useState<WatchStatus>('watching');
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(preferences.searchAlwaysExpandFilters);

  useEffect(() => {
    if (preferences.searchAlwaysExpandFilters) {
        setShowFilters(true);
    }
  }, [preferences.searchAlwaysExpandFilters]);

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Library</h1>
        {!preferences.searchAlwaysExpandFilters && (
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${showFilters ? 'bg-primary-accent text-on-accent' : 'bg-bg-secondary/40 text-text-primary border border-white/5'}`}
            >
                <FilterIcon className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
            </button>
        )}
      </div>
      
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

      {(showFilters || preferences.searchAlwaysExpandFilters) && (
        <div className="animate-fade-in mb-6">
            <GenreFilter genres={genres} selectedGenreId={selectedGenreId} onSelectGenre={setSelectedGenreId} />
        </div>
      )}

      <ListGrid items={filteredItems} onSelect={onSelectShow} />
    </div>
  );
};

export default LibraryScreen;