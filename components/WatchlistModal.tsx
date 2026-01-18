import React from 'react';
import { WatchStatus } from '../types';
import { XMarkIcon, CheckCircleIcon, InformationCircleIcon, ClockIcon } from './Icons';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateList: (newListId: string | null) => void;
  currentList: WatchStatus | null;
  customLists: any[];
  mediaType: 'tv' | 'movie' | 'person';
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({ isOpen, onClose, onUpdateList, currentList, mediaType }) => {
  if (!isOpen) return null;

  const manualLists: { id: WatchStatus, name: string, desc: string }[] = [
    { id: 'planToWatch', name: 'Plan to Watch', desc: 'I intend to watch this eventually.' },
    { id: 'onHold', name: 'On Hold', desc: 'Paused my journey for now.' },
    { id: 'dropped', name: 'Dropped', desc: 'I have decided to stop watching.' },
  ];

  const autoLists: { id: WatchStatus, name: string, desc: string }[] = [
    { id: 'watching', name: 'Watching', desc: 'Shows with at least 1 episode watched.' },
    { id: 'allCaughtUp', name: 'All Caught Up', desc: 'Watched everything aired so far.' },
    { id: 'completed', name: 'Completed', desc: 'Finished every episode of the show.' },
  ];

  const isTV = mediaType === 'tv';

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-1">Add to Library</h2>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Update your tracking status</p>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent mb-3 flex items-center gap-2">
                    <InformationCircleIcon className="w-3.5 h-3.5" />
                    User Choice
                </h3>
                <div className="space-y-2">
                    {manualLists.map(list => {
                        const isActive = currentList === list.id;
                        return (
                        <button
                            key={list.id}
                            onClick={() => { onUpdateList(list.id); onClose(); }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border text-left ${
                            isActive 
                                ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' 
                                : 'bg-bg-secondary/40 border-white/5 text-text-primary hover:bg-bg-secondary'
                            }`}
                        >
                            <div className="min-w-0">
                                <span className="uppercase tracking-widest text-[11px] font-black block">{list.name}</span>
                                <span className={`text-[9px] font-medium opacity-60 block truncate ${isActive ? 'text-white' : ''}`}>{list.desc}</span>
                            </div>
                            {isActive && <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />}
                        </button>
                        );
                    })}
                </div>
            </div>

            {isTV && (
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-3 flex items-center gap-2">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Managed by SceneIt
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {autoLists.map(list => {
                            const isActive = currentList === list.id;
                            return (
                                <div 
                                    key={list.id}
                                    className={`w-full p-3 rounded-2xl border transition-all ${
                                        isActive 
                                            ? 'bg-primary-accent/10 border-primary-accent text-primary-accent' 
                                            : 'bg-bg-secondary/10 border-white/5 text-text-secondary opacity-40'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="uppercase tracking-widest text-[10px] font-black">{list.name}</span>
                                        {isActive && <CheckCircleIcon className="w-4 h-4" />}
                                    </div>
                                    {isActive && <span className="text-[9px] font-medium mt-1 block leading-tight">{list.desc}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
          
          {currentList && (
             <button
              onClick={() => { onUpdateList(null); onClose(); }}
              className="w-full text-center py-3 rounded-2xl transition-all text-red-500 hover:bg-red-500/10 mt-2 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Remove from Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistModal;