import React from 'react';
import { XMarkIcon, SearchIcon, SparklesIcon, ClockIcon, ChevronDownIcon } from './Icons';
import Logo from './Logo';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  timeFormat: '12h' | '24h';
  setTimeFormat: (format: '12h' | '24h') => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, timezone, setTimezone, timeFormat, setTimeFormat }) => {
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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-scale-in relative text-center border border-white/10"
        onClick={e => e.stopPropagation()}
      >
        <Logo className="h-20 w-20 mx-auto mb-6 drop-shadow-2xl" />
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2 leading-none">CineMontauge</h2>
        <p className="text-sm text-text-secondary mb-8 font-medium leading-relaxed px-4">Your personal gallery of cinematic moments. Start tracking and journaling your favorite shows and movies today.</p>
        
        <div className="text-left space-y-4 mb-8 bg-bg-secondary/40 p-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="text-left space-y-2 mb-4">
                <label htmlFor="timezone-select" className="block text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Set Your Timeline (Timezone)</label>
                <div className="relative group">
                    <select 
                        id="timezone-select" 
                        value={timezone} 
                        onChange={e => setTimezone(e.target.value)} 
                        className="w-full p-3 bg-bg-primary text-text-primary rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-accent appearance-none text-sm font-bold shadow-md cursor-pointer group-hover:border-white/20 transition-all"
                    >
                        {timezones.map(tz => <option key={tz.id} value={tz.id}>{tz.name}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            <div className="text-left space-y-2 mb-4">
                <label className="block text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Preferred Format</label>
                <div className="flex p-1 bg-bg-primary rounded-xl border border-white/10 shadow-md">
                    <button 
                        onClick={() => setTimeFormat('12h')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${timeFormat === '12h' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        12 Hour
                    </button>
                    <button 
                        onClick={() => setTimeFormat('24h')}
                        className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${timeFormat === '24h' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        24 Hour
                    </button>
                </div>
            </div>

            <div className="flex items-start space-x-3 pt-2 border-t border-white/5">
                <div className="p-2 bg-primary-accent/10 rounded-lg text-primary-accent shadow-sm">
                    <SearchIcon className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black uppercase tracking-widest text-xs text-text-primary">Find Your Favorites</h4>
                    <p className="text-[11px] text-text-secondary font-medium">Instantly find and track any global movie or show.</p>
                </div>
            </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full px-8 py-5 rounded-3xl text-on-accent bg-accent-gradient hover:opacity-90 transition-all font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform active:scale-95 flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          Begin Your Montage
        </button>
        
        <p className="mt-4 text-[9px] font-black text-text-secondary/40 uppercase tracking-widest">
            By continuing, you agree to the CineMontauge Experience
        </p>
      </div>
    </div>
  );
};

export default WelcomeModal;