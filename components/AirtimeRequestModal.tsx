import React, { useState, useMemo } from 'react';
/* FIX: Added missing ArrowPathIcon import */
import { XMarkIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, CheckCircleIcon, TrashIcon, ArrowPathIcon } from './Icons';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode } from '../types';
import { getSeasonDetails } from '../services/tmdbService';
import { allTimezones } from '../data/timezones';

interface AirtimeRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (data: any) => void;
    onDiscard: () => void;
    showDetails: TmdbMediaDetails;
}

const AirtimeRequestModal: React.FC<AirtimeRequestModalProps> = ({ isOpen, onClose, onSend, onDiscard, showDetails }) => {
    const [step, setStep] = useState<'type' | 'timezone' | 'episodes'>('type');
    const [selectedTimezone, setSelectedTimezone] = useState('');
    const [selectedEpisodes, setSelectedEpisodes] = useState<Set<number>>(new Set());
    const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
    const [seasonMap, setSeasonMap] = useState<Record<number, Episode[]>>({});
    const [loadingSeason, setLoadingSeason] = useState(false);

    if (!isOpen) return null;

    const handleToggleSeason = async (seasonNum: number) => {
        if (expandedSeason === seasonNum) {
            setExpandedSeason(null);
            return;
        }
        setExpandedSeason(seasonNum);
        if (!seasonMap[seasonNum]) {
            setLoadingSeason(true);
            try {
                const data = await getSeasonDetails(showDetails.id, seasonNum);
                setSeasonMap(prev => ({ ...prev, [seasonNum]: data.episodes }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSeason(false);
            }
        }
    };

    const toggleEpisode = (id: number) => {
        setSelectedEpisodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSend = () => {
        const payload = {
            type: step === 'timezone' ? 'Timezone Issue' : 'Missing Airdate',
            timezone: selectedTimezone,
            episodes: Array.from(selectedEpisodes).map(id => {
                /* FIX: Explicitly cast Object.values(seasonMap) to Episode[][] to resolve 'Property find does not exist on type unknown' error */
                for (const s of Object.values(seasonMap) as Episode[][]) {
                    const ep = s.find(e => e.id === id);
                    if (ep) return `S${ep.season_number} E${ep.episode_number}: ${ep.name}`;
                }
                return `ID: ${id}`;
            })
        };
        onSend(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <header className="p-8 bg-card-gradient border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter leading-none">Airtime Request</h2>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-60">Help improve the SceneIt database</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-8 flex-grow overflow-y-auto custom-scrollbar max-h-[60vh]">
                    {step === 'type' && (
                        <div className="space-y-4">
                            <button 
                                onClick={() => setStep('timezone')}
                                className="w-full flex items-center justify-between p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-accent/10 rounded-2xl text-primary-accent">
                                        <ClockIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-black text-text-primary uppercase tracking-widest">Timezone Discrepancy</span>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase opacity-50">Local times don't match broadcast</p>
                                    </div>
                                </div>
                                <ChevronDownIcon className="w-5 h-5 -rotate-90 text-text-secondary opacity-20 group-hover:opacity-100" />
                            </button>

                            <button 
                                onClick={() => setStep('episodes')}
                                className="w-full flex items-center justify-between p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-accent/10 rounded-2xl text-primary-accent">
                                        <ListBulletIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-black text-text-primary uppercase tracking-widest">Missing Airdates</span>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase opacity-50">Episodes are missing "The Truth"</p>
                                    </div>
                                </div>
                                <ChevronDownIcon className="w-5 h-5 -rotate-90 text-text-secondary opacity-20 group-hover:opacity-100" />
                            </button>
                        </div>
                    )}

                    {step === 'timezone' && (
                        <div className="space-y-6">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent">Select Correct Broadcast Timezone</label>
                            <div className="relative">
                                <select 
                                    value={selectedTimezone}
                                    onChange={(e) => setSelectedTimezone(e.target.value)}
                                    className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary font-bold focus:outline-none border border-white/10 appearance-none"
                                >
                                    <option value="">Choose Timezone...</option>
                                    {allTimezones.map(tz => (
                                        <option key={tz.id} value={tz.id}>{tz.name}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {step === 'episodes' && (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent">Select Episodes with Issues</label>
                            <div className="space-y-2">
                                {showDetails.seasons?.filter(s => s.season_number > 0).map(s => (
                                    <div key={s.id} className="bg-bg-secondary/20 rounded-2xl border border-white/5 overflow-hidden">
                                        <button 
                                            onClick={() => handleToggleSeason(s.season_number)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-bg-secondary/40 transition-all"
                                        >
                                            <span className="text-xs font-black uppercase text-text-primary">Season {s.season_number}</span>
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedSeason === s.season_number ? 'rotate-180' : ''}`} />
                                        </button>
                                        {expandedSeason === s.season_number && (
                                            <div className="p-2 space-y-1 bg-black/20 border-t border-white/5">
                                                {loadingSeason ? (
                                                    <div className="py-4 text-center animate-pulse"><ArrowPathIcon className="w-5 h-5 animate-spin mx-auto text-primary-accent" /></div>
                                                ) : (
                                                    seasonMap[s.season_number]?.map(ep => (
                                                        <div 
                                                            key={ep.id}
                                                            onClick={() => toggleEpisode(ep.id)}
                                                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedEpisodes.has(ep.id) ? 'bg-primary-accent/10 border-primary-accent/20' : 'hover:bg-white/5'}`}
                                                        >
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedEpisodes.has(ep.id) ? 'bg-primary-accent border-primary-accent' : 'border-white/10'}`}>
                                                                {selectedEpisodes.has(ep.id) && <CheckCircleIcon className="w-4 h-4 text-on-accent" />}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-text-primary uppercase tracking-tight truncate">E{ep.episode_number}. {ep.name}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-8 bg-bg-secondary/30 flex flex-col gap-3">
                    <div className="flex gap-3">
                        {step !== 'type' && (
                            <button onClick={() => setStep('type')} className="px-6 py-4 rounded-2xl bg-bg-primary text-text-primary font-black uppercase text-[10px] tracking-widest hover:brightness-110">Back</button>
                        )}
                        <button 
                            onClick={handleSend}
                            disabled={step === 'type' || (step === 'timezone' && !selectedTimezone) || (step === 'episodes' && selectedEpisodes.size === 0)}
                            className="flex-grow py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-30 disabled:hover:scale-100"
                        >
                            Send Request
                        </button>
                    </div>
                    <button 
                        onClick={() => { onDiscard(); onClose(); }}
                        className="w-full flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-red-500/60 hover:text-red-500 transition-colors group"
                    >
                        <TrashIcon className="w-3 h-3" />
                        <span>Discard Request</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AirtimeRequestModal;