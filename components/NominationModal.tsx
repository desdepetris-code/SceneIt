
import React, { useState, useMemo } from 'react';
import { XMarkIcon, TrophyIcon, PlusIcon, TvIcon, FilmIcon, UserIcon, UsersIcon, SparklesIcon } from './Icons';
import { WeeklyPick, TmdbMediaDetails } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface NominationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any; // Can be TmdbMediaDetails or Actor/Actress info
    category: WeeklyPick['category'];
    onNominate: (pick: WeeklyPick, replacementId?: number) => void;
    currentPicks: WeeklyPick[];
}

const NominationModal: React.FC<NominationModalProps> = ({ isOpen, onClose, item, category, onNominate, currentPicks }) => {
    // Default to today. Sunday is day 6 in our indices, Monday is 0.
    const [selectedDay, setSelectedDay] = useState<number>(() => {
        const d = new Date().getDay();
        return d === 0 ? 6 : d - 1;
    });
    
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayNamesShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const categoryIcon = useMemo(() => {
        if (category === 'tv') return <TvIcon className="w-5 h-5 text-red-400" />;
        if (category === 'movie') return <FilmIcon className="w-5 h-5 text-blue-400" />;
        if (category === 'actor') return <UserIcon className="w-5 h-5 text-yellow-400" />;
        return <UsersIcon className="w-5 h-5 text-pink-400" />;
    }, [category]);

    if (!isOpen) return null;

    const dayPicks = currentPicks.filter(p => p.dayIndex === selectedDay && p.category === category);
    const isFull = dayPicks.length >= 5;
    const isAlreadyPicked = dayPicks.some(p => p.id === item.id);

    const handleNominate = () => {
        const pick: WeeklyPick = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type || (category === 'actor' || category === 'actress' ? 'person' : category),
            poster_path: item.poster_path || item.profile_path,
            category: category,
            dayIndex: selectedDay,
        };
        onNominate(pick);
        onClose();
    };

    const handleReplace = (oldId: number) => {
        const pick: WeeklyPick = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type || (category === 'actor' || category === 'actress' ? 'person' : category),
            poster_path: item.poster_path || item.profile_path,
            category: category,
            dayIndex: selectedDay,
        };
        onNominate(pick, oldId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-white/5" onClick={e => e.stopPropagation()}>
                <header className="p-6 bg-card-gradient border-b border-white/10 flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner flex-shrink-0">
                            {categoryIcon}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Weekly Gem</h2>
                            <p className="text-xs text-text-secondary mt-1">Nominate <strong className="text-primary-accent">{item.title || item.name}</strong></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-text-secondary transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-3 block opacity-60">Choose Day Of Week</label>
                        <div className="flex p-1 bg-bg-secondary/50 rounded-xl border border-white/5">
                            {dayNamesShort.map((day, i) => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(i)}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${selectedDay === i ? 'bg-accent-gradient text-on-accent shadow-lg scale-105' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-bg-secondary/20 rounded-2xl p-4 border border-white/5 shadow-inner">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">{dayNames[selectedDay]} GEMS ({dayPicks.length}/5)</h3>
                            {isFull && <span className="text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse">Category Full</span>}
                        </div>
                        
                        {dayPicks.length > 0 ? (
                            <div className="space-y-2">
                                {dayPicks.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-2 bg-bg-primary/40 rounded-xl group border border-white/5 hover:border-primary-accent/30 transition-all">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img src={getImageUrl(p.poster_path, 'w92')} className="w-10 h-14 rounded-lg object-cover flex-shrink-0 shadow-md" alt="" />
                                            <div className="min-w-0">
                                                <span className="text-sm font-bold text-text-primary truncate block">{p.title}</span>
                                                <span className="text-[9px] text-text-secondary/60 uppercase tracking-widest font-black">Current Gem</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleReplace(p.id)}
                                            className="px-3 py-1 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-500/20 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                        >
                                            Replace
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                <TrophyIcon className="w-8 h-8 text-text-secondary/20 mx-auto mb-2" />
                                <p className="text-[10px] text-text-secondary/40 font-black uppercase tracking-widest">No gems selected yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <footer className="p-6 bg-bg-secondary/10 flex flex-col gap-4">
                    {isAlreadyPicked ? (
                        <div className="w-full py-4 text-center text-yellow-500 font-black uppercase tracking-widest text-[10px] bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                            Already nominated for {dayNames[selectedDay]}
                        </div>
                    ) : isFull ? (
                        <div className="text-center space-y-2">
                            <p className="text-[10px] text-text-secondary font-medium italic">Limit reached for this day. Select a gem above to replace it, or choose a different day of this week.</p>
                        </div>
                    ) : (
                        <button 
                            onClick={handleNominate}
                            className="w-full py-4 bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:opacity-90 shadow-2xl flex items-center justify-center gap-3 transform transition-transform hover:scale-[1.02]"
                        >
                            <TrophyIcon className="w-5 h-5" />
                            Confirm Nomination
                        </button>
                    )}
                    <button 
                        onClick={onClose} 
                        className="text-[10px] font-black text-text-secondary/50 hover:text-text-primary uppercase tracking-[0.2em] transition-colors"
                    >
                        Maybe Later
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default NominationModal;
