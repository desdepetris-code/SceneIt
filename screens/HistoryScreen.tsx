import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon } from '../components/Icons';
import ListGrid from '../components/ListGrid';
import { formatDate, formatDateTime, formatTimeFromDate } from '../utils/formatUtils';
import Carousel from '../components/Carousel';
import CompactShowCard from '../components/CompactShowCard';
import { getImageUrl } from '../utils/imageUtils';

type HistoryTab = 'watch' | 'search' | 'ratings' | 'favorites' | 'comments';

// --- WATCH HISTORY TAB ---

const WatchHistory: React.FC<{
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  timezone: string;
}> = ({ history, onSelectShow, onDeleteHistoryItem, timezone }) => {
  type HistoryFilter = 'all' | 'tv' | 'movie';
  type DateFilter = 'all' | 'today' | 'week' | 'month';

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const filteredAndGroupedHistory = useMemo(() => {
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
    
    const grouped: Record<string, HistoryItem[]> = {};
    items.forEach(item => {
        const dateKey = new Date(item.timestamp).toDateString();
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(item);
    });
    
    const sortedGroupKeys = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    const sortedGrouped: Record<string, HistoryItem[]> = {};
    sortedGroupKeys.forEach(key => {
        sortedGrouped[key] = grouped[key];
    });

    return sortedGrouped;
  }, [history, filter, dateFilter]);

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
      <section>
        {Object.keys(filteredAndGroupedHistory).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(filteredAndGroupedHistory).map(([date, items]) => (
              <div key={date}>
                <h3 className="font-bold text-text-primary mb-2">{formatDate(date, timezone, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                <ul className="divide-y divide-bg-secondary/50 bg-card-gradient rounded-lg shadow-md">
                  {/* FIX: Cast `items` to `HistoryItem[]` to resolve a type inference issue where it was being treated as `unknown`. */}
                  {(items as HistoryItem[]).map(item => (
                    <li key={item.logId} className="p-4 flex items-start space-x-6 group">
                      <img 
                        src={getImageUrl(item.poster_path, 'w342')} 
                        alt={item.title} 
                        className="w-32 h-48 object-cover rounded-lg flex-shrink-0 cursor-pointer shadow-lg"
                        onClick={() => onSelectShow(item.id, item.media_type)}
                      />
                      <div 
                        className="flex-grow min-w-0 cursor-pointer pt-2"
                        onClick={() => onSelectShow(item.id, item.media_type)}
                      >
                        <p className="font-bold text-xl text-text-primary">{item.title}</p>
                        {item.media_type === 'tv' ? (
                          <p className="text-base text-text-secondary truncate mt-1">
                            S{item.seasonNumber} E{item.episodeNumber}{item.episodeTitle ? `: ${item.episodeTitle}` : ''}
                          </p>
                        ) : (
                          <p className="text-base text-text-secondary mt-1">Movie</p>
                        )}
                        <p className="text-sm text-text-secondary/80 mt-2">{formatTimeFromDate(item.timestamp, timezone)}</p>
                      </div>
                      <button
                        onClick={() => onDeleteHistoryItem(item)}
                        className="p-2 rounded-full text-text-secondary/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete from history"
                      >
                        <TrashIcon className="w-6 h-6" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-secondary/30 rounded-lg">
            <h2 className="text-xl font-bold">No History Found</h2>
            <p className="mt-2 text-text-secondary">Your watch history for the selected filters is empty.</p>
          </div>
        )}
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
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');

  // FIX: Renamed 'tabs' to 'historyTabs' to avoid a potential name collision.
  const historyTabs: { id: HistoryTab, label: string }[] = [
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
              {historyTabs.map(tab => (
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