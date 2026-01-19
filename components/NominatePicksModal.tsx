import React from 'react';
import { UserData, WeeklyPick } from '../types';
import { XMarkIcon, TrophyIcon, CheckCircleIcon, TrashIcon } from './Icons';
import CompactShowCard from './CompactShowCard';

interface NominatePicksModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData;
  currentPicks: WeeklyPick[];
  onNominate: (pick: WeeklyPick, replacementId?: number) => void;
  onRemovePick: (pick: WeeklyPick) => void;
}

const NominatePicksModal: React.FC<NominatePicksModalProps> = ({ isOpen, onClose, userData, currentPicks, onNominate, onRemovePick }) => {
  if (!isOpen) return null;

  const recentMedia = [...userData.history]
      .filter(h => !h.logId.startsWith('live-'))
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);

  const uniqueRecent = Array.from(new Map(recentMedia.map(m => [m.id, m])).values());

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="p-8 border-b border-white/5 bg-card-gradient flex justify-between items-center">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-500 shadow-inner">
                    <TrophyIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Nominate Gems</h2>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-2 opacity-60">Add up to 5 favorites per category daily</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/10 text-text-secondary transition-all"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {uniqueRecent.map(item => {
                    const nominatedItem = currentPicks.find(p => p.id === item.id && p.dayIndex === todayIndex);
                    const isNominatedToday = !!nominatedItem;
                    
                    return (
                        <div key={item.id} className="relative group">
                            <div className={`transition-all duration-500 ${isNominatedToday ? 'scale-95 opacity-60' : 'hover:scale-105'}`}>
                                <CompactShowCard item={item} onSelect={() => {}} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                {isNominatedToday ? (
                                    <div className="flex flex-col items-center gap-2 pointer-events-auto">
                                        <div className="bg-yellow-500 rounded-full p-2 shadow-2xl border-2 border-black/10">
                                            <CheckCircleIcon className="w-6 h-6 text-black" />
                                        </div>
                                        <button 
                                            onClick={() => onRemovePick(nominatedItem)}
                                            className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-xl transition-all transform hover:scale-110 flex items-center gap-1 group/del"
                                            title="Delete Nomination"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            <span className="text-[8px] font-black uppercase pr-1 hidden group-hover/del:block">Delete</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => onNominate({ ...item, category: item.media_type as any, dayIndex: todayIndex })}
                                        className="bg-accent-gradient text-on-accent text-[10px] font-black uppercase px-4 py-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 pointer-events-auto"
                                    >
                                        Nominate
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
        
        <footer className="p-8 bg-bg-secondary/30 text-center border-t border-white/5">
            <button onClick={onClose} className="px-12 py-4 rounded-full bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs hover:scale-105 transition-transform shadow-2xl">Return to Profile</button>
        </footer>
      </div>
    </div>
  );
};

export default NominatePicksModal;