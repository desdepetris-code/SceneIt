
import React, { useState, useMemo } from 'react';
import { UserData, WeeklyPick } from '../types';
import CompactShowCard from '../components/CompactShowCard';
import { XMarkIcon, TrophyIcon, ChevronDownIcon, ClockIcon, PlusIcon, TvIcon, FilmIcon, UserIcon, UsersIcon, TrashIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';

interface WeeklyPicksScreenProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
    onRemovePick: (item: WeeklyPick) => void;
    onNominate: () => void;
}

type SubTab = 'nominations' | 'archives';

const WeeklyPicksScreen: React.FC<WeeklyPicksScreenProps> = ({ userData, onSelectShow, onRemovePick, onNominate }) => {
    const { weeklyFavorites, weeklyFavoritesHistory = {} } = userData;
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('nominations');
    const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

    const getWeekStartDate = (weekKey: string) => {
        return new Date(weekKey + 'T00:00:00');
    };

    const getFormattedDayDate = (weekKey: string, dayIndex: number) => {
        const base = getWeekStartDate(weekKey);
        const day = new Date(base);
        day.setDate(base.getDate() + dayIndex);
        
        return {
            dayName: day.toLocaleDateString(undefined, { weekday: 'short' }),
            dateStr: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        };
    };

    // FIX: Correctly compare timestamps of date strings for sorting
    const historyWeeks = Object.keys(weeklyFavoritesHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const formatWeekLabel = (weekKey: string) => {
        const date = getWeekStartDate(weekKey);
        return `Week of ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    };

    const categories: { id: WeeklyPick['category'], label: string, icon: React.ReactNode }[] = [
        { id: 'tv', label: 'TV Show', icon: <TvIcon className="w-5 h-5 text-red-400" /> },
        { id: 'movie', label: 'Movie', icon: <FilmIcon className="w-5 h-5 text-blue-400" /> },
        { id: 'actor', label: 'Actor', icon: <UserIcon className="w-5 h-5 text-yellow-400" /> },
        { id: 'actress', label: 'Actress', icon: <UsersIcon className="w-5 h-5 text-pink-400" /> },
    ];

    const getPicks = (category: WeeklyPick['category'], dayIndex: number) => {
        return weeklyFavorites.filter(p => p.category === category && p.dayIndex === dayIndex);
    };

    const currentWeekKey = useMemo(() => {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0,0,0,0);
        return monday.toISOString().split('T')[0];
    }, []);

    const renderPickCard = (pick: WeeklyPick) => {
        return (
            <div className="relative group h-full">
                <CompactShowCard item={pick} onSelect={onSelectShow} />
                <button 
                    onClick={(e) => { e.stopPropagation(); onRemovePick(pick); }}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 transform hover:scale-110"
                    title="Delete Nomination"
                >
                    <TrashIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    };

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-4 bg-yellow-500/20 rounded-2xl text-yellow-500 shadow-inner">
                        <TrophyIcon className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-text-primary uppercase tracking-tighter leading-none">Weekly Gems</h2>
                        <p className="text-sm text-text-secondary font-black uppercase tracking-[0.2em] mt-2">Elite 140 Selection • 5 Per Category Per Day</p>
                    </div>
                </div>
                
                <div className="flex p-1 bg-bg-secondary rounded-full shadow-lg border border-white/5">
                    <button 
                        onClick={() => setActiveSubTab('nominations')}
                        className={`flex items-center space-x-2 px-6 py-2 text-sm font-black uppercase tracking-widest rounded-full transition-all ${activeSubTab === 'nominations' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        Nominations
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('archives')}
                        className={`flex items-center space-x-2 px-4 py-2 text-sm font-black uppercase tracking-widest rounded-full transition-all ${activeSubTab === 'archives' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        Archives
                    </button>
                </div>
            </header>

            {activeSubTab === 'nominations' ? (
                <div className="space-y-12">
                    <div className="bg-card-gradient rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl overflow-x-auto">
                        <div className="min-w-[1000px]">
                            {/* Header Row */}
                            <div className="grid grid-cols-[150px_repeat(7,1fr)] gap-4 mb-8">
                                <div className="flex items-center justify-center font-black text-text-secondary uppercase tracking-widest text-[10px]">Categories</div>
                                {[0,1,2,3,4,5,6].map(dayIdx => {
                                    const { dayName, dateStr } = getFormattedDayDate(currentWeekKey, dayIdx);
                                    return (
                                        <div key={dayIdx} className="text-center py-2 bg-bg-secondary/30 rounded-xl">
                                            <div className="font-black text-text-primary uppercase tracking-widest text-[10px] leading-tight">{dayName}</div>
                                            <div className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">{dateStr}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Category Rows */}
                            {categories.map(cat => (
                                <div key={cat.id} className="grid grid-cols-[150px_repeat(7,1fr)] gap-4 mb-10 items-start">
                                    <div className="flex items-center space-x-3 px-4 py-3 bg-bg-secondary/50 rounded-2xl border border-white/5 shadow-inner sticky left-0 z-10">
                                        {cat.icon}
                                        <span className="font-black text-[10px] text-text-primary uppercase tracking-widest">{cat.label}</span>
                                    </div>
                                    {[0,1,2,3,4,5,6].map(dayIndex => {
                                        const picks = getPicks(cat.id, dayIndex);
                                        return (
                                            <div key={`${cat.id}-${dayIndex}`} className="space-y-2">
                                                <div className="flex flex-col gap-2">
                                                    {picks.map(p => (
                                                        <div key={p.id} className="aspect-[2/3] w-full">
                                                            {renderPickCard(p)}
                                                        </div>
                                                    ))}
                                                    {picks.length < 5 && (
                                                        <button 
                                                            onClick={onNominate}
                                                            className="w-full aspect-[2/3] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-text-secondary/20 hover:border-primary-accent/40 hover:bg-primary-accent/5 hover:text-primary-accent/40 transition-all group"
                                                        >
                                                            <PlusIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Add {picks.length + 1}/5</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <section className="animate-fade-in space-y-6">
                    {historyWeeks.length > 0 ? (
                        <div className="space-y-4">
                            {historyWeeks.map(weekKey => (
                                <div key={weekKey} className="bg-bg-secondary/50 rounded-2xl overflow-hidden border border-white/5 transition-all hover:border-primary-accent/30">
                                    <button 
                                        onClick={() => setExpandedWeek(expandedWeek === weekKey ? null : weekKey)}
                                        className="w-full flex items-center justify-between p-6 hover:bg-bg-secondary transition-colors"
                                    >
                                        <div className="flex items-center space-x-4 text-left">
                                            <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                                                <TrophyIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <span className="font-black text-text-primary uppercase tracking-widest">{formatWeekLabel(weekKey)}</span>
                                                <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-1">{weeklyFavoritesHistory[weekKey].length} Nominations</p>
                                            </div>
                                        </div>
                                        <ChevronDownIcon className={`w-6 h-6 text-text-secondary transition-transform duration-500 ${expandedWeek === weekKey ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {expandedWeek === weekKey && (
                                        <div className="p-6 pt-0 border-t border-white/5 animate-fade-in bg-black/20">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 mt-6">
                                                {weeklyFavoritesHistory[weekKey].map(item => {
                                                    const { dayName, dateStr } = getFormattedDayDate(weekKey, item.dayIndex);
                                                    return (
                                                        <div key={`${weekKey}-${item.id}-${item.category}-${item.dayIndex}`} className="space-y-2">
                                                            <div className="flex flex-col px-1 leading-tight">
                                                                <span className="text-[9px] font-black text-yellow-500 uppercase tracking-tighter">
                                                                    {dayName}, {dateStr}
                                                                </span>
                                                                <span className="text-[8px] font-black text-text-secondary uppercase tracking-widest opacity-60">{item.category}</span>
                                                            </div>
                                                            <CompactShowCard item={item} onSelect={onSelectShow} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-24 text-center bg-bg-secondary/20 rounded-3xl border-4 border-dashed border-white/5">
                            <ClockIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-6" />
                            <p className="text-xl font-black text-text-secondary uppercase tracking-[0.2em]">Your legacy begins here</p>
                            <p className="text-sm text-text-secondary/50 mt-2 uppercase tracking-widest font-bold italic">Past weekly picks will be archived here automatically.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default WeeklyPicksScreen;
