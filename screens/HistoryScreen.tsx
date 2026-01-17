import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem, Comment, UserRatings } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon, SearchIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HeartIcon, CalendarIcon, TvIcon, FilmIcon, XMarkIcon, ListBulletIcon, SparklesIcon, TrophyIcon } from '../components/Icons';
import { formatDate, formatDateTime, formatTimeFromDate } from '../utils/formatUtils';
import Carousel from '../components/Carousel';
import CompactShowCard from '../components/CompactShowCard';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from '../components/FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL } from '../constants';

type HistoryTab = 'watch' | 'search' | 'ratings' | 'favorites' | 'comments';

// --- WATCH HISTORY TAB ---

type WatchHistoryFilter = 'all' | 'shows' | 'movies' | 'seasons' | 'episodes' | 'movies_episodes' | 'movies_seasons';

const WatchHistory: React.FC<{
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  timezone: string;
}> = ({ history, onSelectShow, onDeleteHistoryItem, timezone }) => {
  const [activeFilter, setActiveFilter] = useState<WatchHistoryFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState('');

  const processedHistory = useMemo(() => {
    let items = [...history];

    // 1. Apply Date Filter (Jump to Date)
    if (selectedDate) {
        items = items.filter(item => {
            const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
            return itemDate === selectedDate;
        });
    }

    // 2. Apply Search
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        items = items.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.episodeTitle?.toLowerCase().includes(query)
        );
    }

    // Sort by timestamp desc first
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 3. Apply Category Filter & Grouping
    switch (activeFilter) {
        case 'shows': {
            const grouped = new Map<number, HistoryItem>();
            items.filter(h => h.media_type === 'tv').forEach(item => {
                if (!grouped.has(item.id)) {
                    grouped.set(item.id, {
                        ...item,
                        episodeNumber: undefined,
                        episodeTitle: 'Latest Show Activity',
                        logId: `show-group-${item.id}-${item.logId}`
                    });
                }
            });
            return Array.from(grouped.values());
        }
        case 'episodes':
            return items.filter(h => h.media_type === 'tv');
        case 'movies':
            return items.filter(h => h.media_type === 'movie');
        case 'seasons': {
            const grouped = new Map<string, HistoryItem>();
            items.filter(h => h.media_type === 'tv').forEach(item => {
                const key = `${item.id}-s${item.seasonNumber}`;
                if (!grouped.has(key)) {
                    grouped.set(key, {
                        ...item,
                        episodeNumber: undefined,
                        episodeTitle: `Season ${item.seasonNumber} activity`,
                        logId: `season-group-${key}-${item.logId}`
                    });
                }
            });
            return Array.from(grouped.values());
        }
        case 'movies_episodes':
            return items; // No grouping, just movies and episodes interleaved
        case 'movies_seasons': {
            const grouped: HistoryItem[] = [];
            const seenKeys = new Set<string>();
            items.forEach(item => {
                if (item.media_type === 'movie') {
                    grouped.push(item);
                } else {
                    const key = `${item.id}-s${item.seasonNumber}`;
                    if (!seenKeys.has(key)) {
                        seenKeys.add(key);
                        grouped.push({
                            ...item,
                            episodeNumber: undefined,
                            episodeTitle: `Season ${item.seasonNumber} activity`,
                            logId: `season-group-${key}-${item.logId}`
                        });
                    }
                }
            });
            return grouped;
        }
        case 'all':
        default:
            return items;
    }
  }, [history, activeFilter, searchQuery, selectedDate]);

  const formatHistoryDate = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const itemYear = date.getFullYear();

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = currentYear === itemYear ? null : itemYear;
    
    const fullWithTime = formatDateTime(dateString, timezone);

    return { day, month, year, fullWithTime };
  };

  const filterOptions: { id: WatchHistoryFilter; label: string; icon: React.ReactNode }[] = [
      { id: 'all', label: 'Show All', icon: <ClockIcon className="w-4 h-4" /> },
      { id: 'shows', label: 'Shows Only', icon: <TvIcon className="w-4 h-4" /> },
      { id: 'movies', label: 'Movies Only', icon: <FilmIcon className="w-4 h-4" /> },
      { id: 'seasons', label: 'Seasons', icon: <ListBulletIcon className="w-4 h-4" /> },
      { id: 'episodes', label: 'Episodes', icon: <TvIcon className="w-4 h-4" /> },
      { id: 'movies_episodes', label: 'Movies & Episodes', icon: <SparklesIcon className="w-4 h-4" /> },
      { id: 'movies_seasons', label: 'Movies & Seasons', icon: <TrophyIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {/* Search and Jump to Date */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <input
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 font-semibold shadow-inner"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
            </div>
            <div className="relative min-w-[180px]">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 shadow-inner font-black text-xs uppercase tracking-widest cursor-pointer"
                />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-accent pointer-events-none" />
                {selectedDate && (
                    <button 
                        onClick={() => setSelectedDate('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-red-400 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>

        {/* Multi-Filter Bar */}
        <Carousel>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                {filterOptions.map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setActiveFilter(opt.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap type-box-filter ${
                            activeFilter === opt.id 
                            ? 'bg-accent-gradient text-on-accent shadow-lg scale-105 font-black border-transparent' 
                            : 'bg-bg-secondary text-text-primary/70'
                        }`}
                    >
                        {opt.icon}
                        <span>{opt.label}</span>
                    </button>
                ))}
                <div className="w-4 flex-shrink-0"></div>
            </div>
        </Carousel>
      </div>

      <section className="space-y-8">
        {processedHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedHistory.map(item => {
              const { day, month, year, fullWithTime } = formatHistoryDate(item.timestamp, timezone);
              
              const isGrouped = item.logId.includes('-group-');
              
              const mainImagePaths = [
                  item.episodeStillPath ? getImageUrl(item.episodeStillPath, 'w780', 'still') : null,
                  item.seasonPosterPath ? getImageUrl(item.seasonPosterPath, 'w780') : null,
                  item.poster_path ? getImageUrl(item.poster_path, 'w780') : null
              ].filter(Boolean);

              return (
                <div key={item.logId} className="group relative bg-bg-secondary/20 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden transition-all hover:bg-bg-secondary/40 flex flex-col shadow-xl animate-fade-in">
                    <div 
                        className="w-full aspect-video relative cursor-pointer overflow-hidden bg-black/40 border-b border-white/5" 
                        onClick={() => onSelectShow(item.id, item.media_type)}
                    >
                        <FallbackImage 
                            srcs={mainImagePaths} 
                            placeholder={item.media_type === 'tv' ? PLACEHOLDER_STILL : PLACEHOLDER_POSTER} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        
                        <div className="absolute top-4 left-4 flex gap-2 z-10">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 ${item.media_type === 'tv' ? 'bg-red-500/60 text-white' : 'bg-blue-500/60 text-white'}`}>
                                {isGrouped ? (activeFilter === 'shows' ? 'series' : 'season') : item.media_type}
                            </span>
                        </div>

                        <div className="absolute top-4 right-4 flex flex-col items-center bg-bg-primary rounded-2xl p-2 min-w-[55px] shadow-2xl border border-white/10 scale-90 group-hover:scale-100 transition-transform z-10">
                            <span className="text-[10px] font-black text-primary-accent uppercase tracking-widest leading-none">{month}</span>
                            <span className="text-xl font-black text-text-primary leading-none mt-1">{day}</span>
                            {year && <span className="text-[9px] font-bold text-text-secondary mt-1">{year}</span>}
                        </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onSelectShow(item.id, item.media_type)}>
                                <h3 className="font-black text-xl text-text-primary truncate leading-tight group-hover:text-primary-accent transition-colors">
                                    {item.title}
                                </h3>
                                {item.media_type === 'tv' && (
                                    <div className="mt-1 flex items-center gap-2">
                                        <p className="text-xs font-black text-white uppercase tracking-[0.15em]">
                                            S{item.seasonNumber} {item.episodeNumber ? `• E${item.episodeNumber}` : ''}
                                        </p>
                                        {item.episodeTitle && (
                                            <>
                                                <span className="text-text-secondary/30 text-xs">•</span>
                                                <p className="text-sm text-primary-accent italic truncate font-bold">"{item.episodeTitle}"</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!isGrouped && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item); }}
                                    className="p-3 rounded-full text-text-secondary/40 hover:text-red-500 hover:bg-red-500/10 transition-all bg-bg-secondary/20 flex-shrink-0"
                                    title="Delete this play"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {item.note && (
                            <div className="mt-4 p-4 bg-bg-primary/40 rounded-2xl border border-white/5 relative">
                                <p className="text-sm text-text-secondary italic leading-relaxed font-medium">
                                    {item.note}
                                </p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 flex justify-between items-center border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{fullWithTime}</p>
                            <span className="text-[10px] font-bold text-text-primary uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-full">
                                {formatTimeFromDate(item.timestamp, timezone)}
                            </span>
                        </div>
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
            <ClockIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Timeline Empty</h2>
            <p className="mt-2 text-text-secondary font-medium px-10">
                {searchQuery || selectedDate ? "No matching moments found for these filters." : "Your cinematic journey is just beginning. Start tracking to see your timeline grow."}
            </p>
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
  <div className="space-y-6">
    <div className="flex justify-between items-center px-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Recent Searches</h2>
        {searchHistory.length > 0 && <button onClick={onClear} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Clear All</button>}
    </div>
    {searchHistory.length > 0 ? (
      <ul className="space-y-2">
        {searchHistory.map(item => (
          <li key={item.timestamp} className="bg-bg-secondary/30 rounded-xl p-4 flex items-center justify-between hover:bg-bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4">
                <SearchIcon className="w-5 h-5 text-primary-accent" />
                <div>
                  <p className="text-text-primary font-bold">{item.query}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60 mt-0.5">{formatDateTime(item.timestamp, timezone)}</p>
                </div>
            </div>
            <button onClick={() => onDelete(item.timestamp)} className="p-2 rounded-full text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 transition-all"><TrashIcon className="w-5 h-5"/></button>
          </li>
        ))}
      </ul>
    ) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
        <SearchIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
        <p className="text-text-secondary font-black uppercase tracking-widest">No Search History</p>
    </div>}
  </div>
);

// --- RATINGS HISTORY TAB ---
const RatingsHistory: React.FC<{ ratings: UserRatings; onSelect: (id: number) => void }> = ({ ratings, onSelect }) => {
    const sortedRatings = useMemo(() => {
        return Object.entries(ratings)
            .sort((a, b) => new Date((b[1] as { date: string }).date).getTime() - new Date((a[1] as { date: string }).date).getTime());
    }, [ratings]);

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Your Rated Items</h2>
            {sortedRatings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedRatings.map(([id, info]) => (
                        <div key={id} onClick={() => onSelect(Number(id))} className="bg-bg-secondary/30 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-bg-secondary/50 transition-all border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-18 bg-bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={getImageUrl(null, 'w92')} className="w-full h-full object-cover grayscale opacity-20" alt="" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Item #{id}</span>
                                    <div className="flex gap-1 mt-1">
                                        {[1,2,3,4,5].map(star => (
                                            <StarIcon key={star} filled={info.rating >= star} className={`w-3 h-3 ${info.rating >= star ? 'text-yellow-500' : 'text-text-secondary/20'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-text-secondary/40 uppercase tracking-tighter">{formatDate(info.date, 'UTC', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    ))}
                </div>
            ) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5"><StarIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" /><p className="text-text-secondary font-black uppercase tracking-widest">No ratings found</p></div>}
        </div>
    );
};

// --- MAIN SCREEN ---
interface HistoryScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');

  const historyTabs: { id: HistoryTab, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'watch', label: 'Timeline', icon: ClockIcon },
    { id: 'search', label: 'Searches', icon: SearchIcon },
    { id: 'ratings', label: 'Ratings', icon: StarIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
    { id: 'comments', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'watch': return <WatchHistory history={props.userData.history} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />;
      case 'search': return <SearchHistory searchHistory={props.userData.searchHistory} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} timezone={props.timezone} />;
      case 'ratings': return <RatingsHistory ratings={props.userData.ratings} onSelect={(id) => props.onSelectShow(id, 'movie')} />; 
      case 'favorites': return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {props.userData.favorites.length > 0 ? props.userData.favorites.map(item => <CompactShowCard key={item.id} item={item} onSelect={props.onSelectShow} />) : <div className="col-span-full py-20 text-center"><p className="text-text-secondary font-black uppercase tracking-widest">No favorites yet</p></div>}
        </div>
      );
      case 'comments': return (
        <div className="space-y-4">
            {props.userData.comments.length > 0 ? props.userData.comments.map(c => (
                <div key={c.id} className="bg-bg-secondary/30 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-primary-accent uppercase tracking-widest mb-1">{c.mediaKey}</p>
                    <p className="text-text-primary text-sm line-clamp-3">"{c.text}"</p>
                    <p className="text-[10px] font-black text-text-secondary/40 uppercase tracking-tighter mt-3 text-right">{formatDate(c.timestamp, props.timezone)}</p>
                </div>
            )) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5"><ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" /><p className="text-text-secondary font-black uppercase tracking-widest">No discussions yet</p></div>}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-20">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Your Legacy</h1>
        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-60">Archive of your cinematic memories</p>
      </header>

      <div className="mb-8 relative">
        <div className="flex p-1 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto hide-scrollbar">
            {historyTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-1 ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent shadow-xl scale-[1.02]' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default HistoryScreen;