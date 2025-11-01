import React, { useState, useMemo, useEffect } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { TrashIcon, ChevronDownIcon, StarIcon } from '../components/Icons';
import { getMediaDetails } from '../services/tmdbService';
import ListGrid from '../components/ListGrid';
import { formatDate, formatDateTime, formatTimeFromDate } from '../utils/formatUtils';
import Carousel from '../components/Carousel';

type HistoryTab = 'watch' | 'search' | 'ratings' | 'favorites' | 'comments';

// --- WATCH HISTORY TAB ---

const WatchHistory: React.FC<{
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onDeleteHistoryItem: (logId: string) => void;
  timezone: string;
}> = ({ history, onSelectShow, onDeleteHistoryItem, timezone }) => {
  type HistoryFilter = 'all' | 'tv' | 'movie';
  type DateFilter = 'all' | 'today' | 'week' | 'month';

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredHistory = useMemo(() => {
    let items = history;
    if (filter !== 'all') items = items.filter(item => item.media_type === filter);

    const now = new Date();
    if (dateFilter !== 'all') {
      items = items.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (dateFilter === 'today') return itemDate.toDateString() === now.toDateString();
        if (dateFilter === 'week') {
          const oneWeekAgo = new Date(); oneWeekAgo.setDate(now.getDate() - 7);
          return itemDate >= oneWeekAgo;
        }
        if (dateFilter === 'month') {
          const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
          return itemDate >= oneMonthAgo;
        }
        return true;
      });
    }
    return items;
  }, [history, filter, dateFilter]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    filteredHistory.forEach(item => {
      const groupKey = formatDate(item.timestamp, timezone, { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });
    return groups;
  }, [filteredHistory, timezone]);
  
  const groupOrder = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div className="relative">
          <select value={filter} onChange={(e) => setFilter(e.target.value as HistoryFilter)} className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
            <option value="all">All Types</option>
            <option value="tv">TV Shows</option>
            <option value="movie">Movies</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
        </div>
        <div className="relative">
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
        </div>
      </div>
      <section className="space-y-6">
        {groupOrder.length > 0 ? groupOrder.map(groupTitle => (
          <div key={groupTitle}>
            <h3 className="font-bold text-lg text-text-primary mb-3">{groupTitle}</h3>
            <div className="space-y-2">
              {groupedHistory[groupTitle].map(item => (
                <div key={item.logId} className="bg-card-gradient p-3 rounded-lg flex items-center space-x-4">
                  <img src={getImageUrl(item.poster_path, 'w92')} alt={item.title} className="w-12 h-18 rounded-md cursor-pointer flex-shrink-0" onClick={() => onSelectShow(item.id, item.media_type)} />
                  <div className="flex-grow min-w-0" onClick={() => onSelectShow(item.id, item.media_type)}>
                    <p className="font-semibold text-text-primary truncate cursor-pointer">{item.title}</p>
                    <p className="text-sm text-text-secondary cursor-pointer">{item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Movie'}</p>
                    <p className="text-xs text-text-secondary/80 mt-1">{formatTimeFromDate(item.timestamp, timezone)}</p>
                    {item.note && <p className="text-xs text-text-secondary/80 mt-1 italic truncate" title={item.note}>Note: {item.note}</p>}
                  </div>
                  <button onClick={() => onDeleteHistoryItem(item.logId)} className="ml-auto p-3 rounded-full text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors flex-shrink-0" aria-label="Delete history item"><TrashIcon className="w-6 h-6" /></button>
                </div>
              ))}
            </div>
          </div>
        )) : <div className="text-center py-20 bg-bg-secondary/30 rounded-lg"><h2 className="text-xl font-bold">No History Found</h2><p className="mt-2 text-text-secondary">Your watch history for the selected filters is empty.</p></div>}
      </section>
    </div>
  );
};

// --- SEARCH HISTORY TAB ---

const SearchHistory: React.FC<{
  searchHistory: SearchHistoryItem[];
  onDelete: (timestamp: string) => void;
  onClear: () => void;
  timezone: string;
}> = ({ searchHistory, onDelete, onClear, timezone }) => (
  <div>
    {searchHistory.length > 0 && <button onClick={onClear} className="mb-4 text-sm font-semibold text-red-500 hover:underline">Clear All Searches</button>}
    {searchHistory.length > 0 ? (
      <ul className="divide-y divide-bg-secondary/50">
        {searchHistory.map(item => (
          <li key={item.timestamp} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-text-primary">{item.query}</p>
              <p className="text-xs text-text-secondary">{formatDateTime(item.timestamp, timezone)}</p>
            </div>
            <button onClick={() => onDelete(item.timestamp)} className="p-2 rounded-full text-text-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
          </li>
        ))}
      </ul>
    ) : <div className="text-center py-20 bg-bg-secondary/30 rounded-lg"><h2 className="text-xl font-bold">No Search History</h2><p className="mt-2 text-text-secondary">Your recent searches will appear here.</p></div>}
  </div>
);

// --- MAIN SCREEN ---
interface HistoryScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onDeleteHistoryItem: (logId: string) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');

  const tabs: { id: HistoryTab, label: string }[] = [
    { id: 'watch', label: 'Watch' },
    { id: 'search', label: 'Search' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'comments', label: 'Comments' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'watch': return <WatchHistory history={props.userData.history} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />;
      case 'search': return <SearchHistory searchHistory={props.userData.searchHistory} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} timezone={props.timezone} />;
      case 'ratings': return <div className="text-center py-10"><p className="text-text-secondary">Ratings history coming soon!</p></div>;
      case 'favorites': return <ListGrid items={props.userData.favorites} onSelect={props.onSelectShow} />;
      case 'comments': return <div className="text-center py-10"><p className="text-text-secondary">Comments history coming soon!</p></div>;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-bg-secondary/50">
        <Carousel>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}
                >{tab.label}</button>
              ))}
            </div>
        </Carousel>
      </div>
      {renderContent()}
    </div>
  );
};

export default HistoryScreen;
