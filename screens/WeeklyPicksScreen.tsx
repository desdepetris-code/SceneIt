
import React, { useState } from 'react';
import { UserData, TrackedItem } from '../types';
import CompactShowCard from '../components/CompactShowCard';
import { XMarkIcon, TrophyIcon, ChevronDownIcon, ClockIcon, PlusIcon } from '../components/Icons';

interface WeeklyPicksScreenProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onRemovePick: (item: TrackedItem) => void;
    onNominate: () => void;
}

type SubTab = 'nominations' | 'archives';

const WeeklyPicksScreen: React.FC<WeeklyPicksScreenProps> = ({ userData, onSelectShow, onRemovePick, onNominate }) => {
    const { weeklyFavorites, weeklyFavoritesHistory = {} } = userData;
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('nominations');
    const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

    const historyWeeks = Object.keys(weeklyFavoritesHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const formatWeekLabel = (weekKey: string) => {
        const date = new Date(weekKey);
        return `Week of ${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    };

    return (
        <div className="animate-fade-in space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500">
                        <TrophyIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Weekly Favorites</h2>
                        <p className="text-sm text-text-secondary font-bold uppercase tracking-widest">Your Top 5 Cinematic Gems</p>
                    </div>
                </div>
                
                <div className="flex p-1 bg-bg-secondary rounded-full self-start">
                    <button 
                        onClick={() => setActiveSubTab('nominations')}
                        className={`flex items-center space-x-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeSubTab === 'nominations' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        <TrophyIcon className="w-4 h-4" />
                        <span>Nominations</span>
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('archives')}
                        className={`flex items-center space-x-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${activeSubTab === 'archives' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary'}`}
                    >
                        <ClockIcon className="w-4 h-4" />
                        <span>Archives</span>
                    </button>
                </div>
            </header>

            {activeSubTab === 'nominations' ? (
                <section className="animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em]">Current Week Selection ({weeklyFavorites.length}/5)</h3>
                        {weeklyFavorites.length < 5 && (
                            <button 
                                onClick={onNominate}
                                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Nominate</span>
                            </button>
                        )}
                    </div>

                    {weeklyFavorites.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                            {weeklyFavorites.map(item => (
                                <div key={item.id} className="relative group">
                                    <CompactShowCard item={item} onSelect={onSelectShow} />
                                    <button 
                                        onClick={() => onRemovePick(item)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove from picks"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {[...Array(5 - weeklyFavorites.length)].map((_, i) => (
                                <div 
                                    key={`empty-${i}`} 
                                    onClick={onNominate}
                                    className="aspect-[2/3] border-2 border-dashed border-text-secondary/20 rounded-lg flex flex-col items-center justify-center text-text-secondary/40 cursor-pointer hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-colors group"
                                >
                                    <TrophyIcon className="w-8 h-8 mb-2 opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Open Slot</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-bg-secondary/30 rounded-xl p-10 text-center border border-yellow-500/10">
                            <TrophyIcon className="w-16 h-16 text-yellow-500/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-text-primary">No nominations yet</h3>
                            <p className="text-text-secondary mt-2 max-w-xs mx-auto mb-6">
                                Nominate your favorite shows or movies for this week to showcase them on your dashboard!
                            </p>
                            <button 
                                onClick={onNominate}
                                className="px-6 py-2 bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105"
                            >
                                Nominate Picks
                            </button>
                        </div>
                    )}
                </section>
            ) : (
                <section className="animate-fade-in space-y-4">
                    <h3 className="text-xs font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Past Weekly Gems</h3>
                    {historyWeeks.length > 0 ? (
                        <div className="space-y-4">
                            {historyWeeks.map(weekKey => (
                                <div key={weekKey} className="bg-bg-secondary/50 rounded-lg overflow-hidden border border-white/5">
                                    <button 
                                        onClick={() => setExpandedWeek(expandedWeek === weekKey ? null : weekKey)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-bg-secondary transition-colors"
                                    >
                                        <div className="flex items-center space-x-3 text-left">
                                            <div className="p-2 bg-yellow-500/10 rounded-md text-yellow-500">
                                                <TrophyIcon className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-text-primary">{formatWeekLabel(weekKey)}</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest bg-bg-primary px-2 py-1 rounded">
                                                {weeklyFavoritesHistory[weekKey].length} Picks
                                            </span>
                                            <ChevronDownIcon className={`w-5 h-5 text-text-secondary transition-transform ${expandedWeek === weekKey ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    
                                    {expandedWeek === weekKey && (
                                        <div className="p-4 pt-0 border-t border-white/5 animate-fade-in bg-black/10">
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mt-4">
                                                {weeklyFavoritesHistory[weekKey].map(item => (
                                                    <div key={`${weekKey}-${item.id}`} className="w-full">
                                                        <CompactShowCard item={item} onSelect={onSelectShow} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-16 text-center bg-bg-secondary/20 rounded-xl border-2 border-dashed border-white/5">
                            <ClockIcon className="w-12 h-12 text-text-secondary/20 mx-auto mb-4" />
                            <p className="text-text-secondary font-bold">Your cinematic history starts here.</p>
                            <p className="text-xs text-text-secondary/70 mt-1">Past weekly picks will be archived here automatically at the end of each week.</p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default WeeklyPicksScreen;
