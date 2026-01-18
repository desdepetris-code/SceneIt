import React from 'react';
import { XMarkIcon, SearchIcon, SparklesIcon } from './Icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, timezone, setTimezone }) => {
  if (!isOpen) return null;

  const timezones = [
      { id: 'America/New_York', name: 'Eastern Time (ET)' },
      { id: 'America/Chicago', name: 'Central Time (CT)' },
      { id: 'America/Denver', name: 'Mountain Time (MT)' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
      { id: 'Europe/London', name: 'London (GMT/BST)' },
      { id: 'Europe/Berlin', name: 'Central Europe (CET)' },
      { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
      { id: 'Australia/Sydney', name: 'Sydney (AEST)' },
      { id: 'Etc/UTC', name: 'Coordinated Universal Time (UTC)' },
  ];

  const logoUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjU2IiBjeT0iMjU2IiByPSIyNTYiIGZpbGw9IiMzMDAzMDMiIC8+PHRleHQgeD0iMjU2IiB5PSIzNzAiIGZvbnQtZmFtaWx5PSInVGltZXMgTmV3IFJvbWFuJywgVGltZXMsIHNlcmlmIiBmb250LXNpemU9IjM4MCIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0iIzIyRDNFRSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q008L3RleHQ+PHJlY3QgeD0iMCIgeT0iMjQwIiB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMDAwIiAvPjx0ZXh0IHg9IjI1NiIgeT0iMjc2IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNGRkYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSIxNCI+Q0lORU1PTlRBVUdFPC90ZXh0Pjwvc3ZnPg==";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[120] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-fade-in relative text-center border border-white/10" onClick={e => e.stopPropagation()}>
        <img src={logoUri} alt="CineMontauge Logo" className="h-24 w-auto mx-auto mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2">CineMontauge</h2>
        <p className="text-sm text-text-secondary mb-8 font-medium leading-relaxed">Your personal gallery of cinematic moments. Start tracking and journaling your favorite shows and movies today.</p>
        
        <div className="text-left space-y-4 mb-8 bg-bg-secondary/40 p-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="text-left space-y-2 mb-4">
                <label htmlFor="timezone-select" className="block text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Regional Sync</label>
                <div className="relative">
                    <select id="timezone-select" value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full p-3 bg-bg-primary text-text-primary rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-accent appearance-none text-sm font-bold shadow-md">
                        {timezones.map(tz => <option key={tz.id} value={tz.id}>{tz.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-accent/10 rounded-lg text-primary-accent shadow-sm">
                    <SearchIcon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black uppercase tracking-widest text-xs text-text-primary">Find Your Favorites</h4>
                    <p className="text-[11px] text-text-secondary font-medium">Instantly find and track any global movie or show.</p>
                </div>
            </div>
             <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary-accent/10 rounded-lg text-primary-accent shadow-sm">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black uppercase tracking-widest text-xs text-text-primary">Discover Gems</h4>
                    <p className="text-[11px] text-text-secondary font-medium">Curate your weekly hall of fame picks.</p>
                </div>
            </div>
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="w-full px-8 py-5 rounded-3xl text-on-accent bg-accent-gradient hover:opacity-90 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform active:scale-95 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          Begin Your Montage
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;