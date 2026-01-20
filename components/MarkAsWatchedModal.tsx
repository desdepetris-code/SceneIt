import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon, SearchIcon, ChevronDownIcon, CheckCircleIcon } from './Icons';
import { TmdbMediaDetails, Episode, TmdbSeasonDetails } from '../types';
import { getSeasonDetails } from '../services/tmdbService';

export type LogWatchScope = 'single' | 'show' | 'season';

interface MarkAsWatchedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { date: string; note: string; scope: LogWatchScope; selectedEpisodeIds?: number[] }) => void;
  mediaTitle: string;
  initialScope?: LogWatchScope;
  mediaType?: 'tv' | 'movie';
  showDetails?: TmdbMediaDetails | null;
  seasonDetails?: TmdbSeasonDetails | null;
}

const MarkAsWatchedModal: React.FC<MarkAsWatchedModalProps> = ({ isOpen, onClose, onSave, mediaTitle, initialScope = 'single', mediaType, showDetails, seasonDetails }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [scope, setScope] = useState<LogWatchScope>(initialScope);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<Set<number>>(new Set());
  const [selectedSeasonNums, setSelectedSeasonNums] = useState<Set<number>>(new Set());
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [fetchedSeasons, setFetchedSeasons] = useState<Record<number, Episode[]>>({});
  const [loadingSeasons, setLoadingSeasons] = useState<Set<number>>(new Set());

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().split(' ')[0].substring(0, 5));
      setNote('');
      setScope(initialScope);
      setSearchQuery('');
      setSelectedEpisodeIds(new Set());
      setSelectedSeasonNums(new Set());
      setExpandedSeasons(new Set());
      setFetchedSeasons({});
      
      if (seasonDetails) {
        setFetchedSeasons({ [seasonDetails.season_number]: seasonDetails.episodes });
        setExpandedSeasons(new Set([seasonDetails.season_number]));
      }
    }
  }, [isOpen, initialScope, seasonDetails]);

  const toggleSeasonExpansion = async (e: React.MouseEvent, seasonNum: number) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonNum)) {
        newExpanded.delete(seasonNum);
    } else {
        newExpanded.add(seasonNum);
        if (!fetchedSeasons[seasonNum] && showDetails) {
            setLoadingSeasons(prev => new Set(prev).add(seasonNum));
            try {
                const sd = await getSeasonDetails(showDetails.id, seasonNum);
                setFetchedSeasons(prev => ({ ...prev, [seasonNum]: sd.episodes }));
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingSeasons(prev => {
                    const next = new Set(prev);
                    next.delete(seasonNum);
                    return next;
                });
            }
        }
    }
    setExpandedSeasons(newExpanded);
  };

  const toggleSeasonSelection = async (seasonNum: number) => {
    const newSelected = new Set(selectedSeasonNums);
    const isAdding = !newSelected.has(seasonNum);
    
    if (isAdding) {
        newSelected.add(seasonNum);
    } else {
        newSelected.delete(seasonNum);
    }
    setSelectedSeasonNums(newSelected);

    let episodes = fetchedSeasons[seasonNum];
    if (isAdding && !episodes && showDetails) {
        setLoadingSeasons(prev => new Set(prev).add(seasonNum));
        try {
            const sd = await getSeasonDetails(showDetails.id, seasonNum);
            episodes = sd.episodes;
            setFetchedSeasons(prev => ({ ...prev, [seasonNum]: sd.episodes }));
        } catch (e) { console.error(e); }
        finally { setLoadingSeasons(prev => { const n = new Set(prev); n.delete(n); return n; }); }
    }

    if (episodes) {
        setSelectedEpisodeIds(prev => {
            const next = new Set(prev);
            episodes!.forEach(ep => {
                if (ep.air_date && ep.air_date <= todayStr) {
                    if (isAdding) next.add(ep.id);
                    else next.delete(ep.id);
                }
            });
            return next;
        });
    }
  };

  const toggleEpisode = (id: number) => {
    setSelectedEpisodeIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const selectAllAired = () => {
    const allAiredIds = new Set<number>();
    (Object.values(fetchedSeasons) as Episode[][]).forEach(eps => {
        eps.forEach(ep => {
            if (ep.air_date && ep.air_date <= todayStr) {
                allAiredIds.add(ep.id);
            }
        });
    });
    setSelectedEpisodeIds(allAiredIds);
    if (showDetails?.seasons) {
        setSelectedSeasonNums(new Set(showDetails.seasons.map(s => s.season_number)));
    }
  };

  const filteredEpisodes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const result: Record<number, Episode[]> = {};
    (Object.entries(fetchedSeasons) as [string, Episode[]][]).forEach(([sNum, eps]) => {
        const matching = eps.filter(e => e.name.toLowerCase().includes(query) || `e${e.episode_number}`.includes(query) || `episode ${e.episode_number}`.includes(query));
        if (matching.length > 0) result[Number(sNum)] = matching;
    });
    return result;
  }, [fetchedSeasons, searchQuery]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!date || !time) {
      alert('Please select a date and time.');
      return;
    }
    const dateTimeString = new Date(`${date}T${time}`).toISOString();
    onSave({ 
        date: dateTimeString, 
        note, 
        scope, 
        selectedEpisodeIds: scope !== 'single' ? Array.from(selectedEpisodeIds) : undefined 
    });
    onClose();
  };

  const isTV = mediaType === 'tv';
  const showEpisodePicker = isTV && scope !== 'single';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className={`bg-bg-primary rounded-lg shadow-xl w-full p-6 animate-fade-in relative flex flex-col ${showEpisodePicker ? 'max-w-2xl h-[90vh]' : 'max-w-sm'}`} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
          <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-2">Log a Past Watch</h2>
        <p className="text-text-secondary mb-1 truncate font-semibold">{mediaTitle}</p>
        
        {isTV && initialScope !== 'single' && (
            <div className="mb-4">
                <label className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Scope:</label>
                <div className="flex p-1 bg-bg-secondary rounded-lg">
                    <button 
                        onClick={() => setScope('show')}
                        className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${scope === 'show' ? 'bg-accent-gradient text-on-accent shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                        Full Show
                    </button>
                    {initialScope === 'season' && (
                        <button 
                            onClick={() => setScope('season')}
                            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${scope === 'season' ? 'bg-accent-gradient text-on-accent shadow-md' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            This Season
                        </button>
                    )}
                </div>
            </div>
        )}

        <div className={`space-y-4 overflow-y-auto custom-scrollbar flex-grow ${showEpisodePicker ? 'pr-2' : ''}`}>
            <div>
                <label htmlFor="watch-date" className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Date & Time:</label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="date"
                        id="watch-date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                    <input
                        type="time"
                        id="watch-time"
                        value={time}
                        onChange={e => setTime(e.target.value)}
                        className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    />
                </div>
            </div>

            {showEpisodePicker && (
                <div className="flex flex-col flex-grow min-h-0 border-t border-white/5 pt-4">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Select Content ({selectedEpisodeIds.size} Episodes):</label>
                        <div className="space-x-3">
                            <button onClick={selectAllAired} className="text-[10px] font-bold text-primary-accent hover:underline uppercase">Select All Aired</button>
                            <button onClick={() => { setSelectedEpisodeIds(new Set()); setSelectedSeasonNums(new Set()); }} className="text-[10px] font-bold text-red-400 hover:underline uppercase">Clear All</button>
                        </div>
                    </div>
                    
                    <div className="relative mb-3">
                        <input 
                            type="text" 
                            placeholder="Search episodes..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-bg-secondary text-sm rounded-md focus:outline-none border border-white/5"
                        />
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    </div>

                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                        {scope === 'show' && showDetails?.seasons?.map(s => {
                            const isSeasonChecked = selectedSeasonNums.has(s.season_number);
                            const displayName = s.season_number === 0 ? 'Specials' : `Season ${s.season_number}`;
                            return (
                                <div key={s.season_number} className="bg-bg-secondary/30 rounded-lg overflow-hidden border border-white/5">
                                    <div className="flex items-center p-3 hover:bg-bg-secondary transition-colors cursor-pointer" onClick={() => toggleSeasonSelection(s.season_number)}>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${isSeasonChecked ? 'bg-primary-accent border-primary-accent' : 'border-white/20'}`}>
                                            {isSeasonChecked && <CheckCircleIcon className="w-4 h-4 text-on-accent" />}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <span className="font-bold text-sm text-text-primary">{displayName}</span>
                                            <span className="text-[10px] text-text-secondary ml-2">{s.episode_count} Episodes</span>
                                        </div>
                                        <button 
                                            onClick={(e) => toggleSeasonExpansion(e, s.season_number)}
                                            className="p-1 rounded-md hover:bg-white/10 transition-colors"
                                        >
                                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedSeasons.has(s.season_number) ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                    {expandedSeasons.has(s.season_number) && (
                                        <div className="p-2 space-y-1 bg-black/10 border-t border-white/5">
                                            {loadingSeasons.has(s.season_number) ? (
                                                <p className="text-xs text-center py-2 animate-pulse">Loading episodes...</p>
                                            ) : (
                                                filteredEpisodes[s.season_number]?.map(ep => (
                                                    <div 
                                                        key={ep.id} 
                                                        onClick={() => toggleEpisode(ep.id)}
                                                        className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${selectedEpisodeIds.has(ep.id) ? 'bg-primary-accent/10' : 'hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEpisodeIds.has(ep.id) ? 'bg-primary-accent border-primary-accent' : 'border-white/20'}`}>
                                                            {selectedEpisodeIds.has(ep.id) && <CheckCircleIcon className="w-3 h-3 text-on-accent" />}
                                                        </div>
                                                        <div className="flex-grow min-w-0">
                                                            <p className="text-xs font-semibold text-text-primary truncate">E{ep.episode_number}. {ep.name}</p>
                                                            <p className="text-[10px] text-text-secondary">{ep.air_date || 'Unknown Air Date'}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {scope === 'season' && seasonDetails?.episodes.filter(ep => ep.name.toLowerCase().includes(searchQuery.toLowerCase()) || `e${ep.episode_number}`.includes(searchQuery.toLowerCase())).map(ep => (
                             <div 
                                key={ep.id} 
                                onClick={() => toggleEpisode(ep.id)}
                                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${selectedEpisodeIds.has(ep.id) ? 'bg-primary-accent/10' : 'hover:bg-white/5'}`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEpisodeIds.has(ep.id) ? 'bg-primary-accent border-primary-accent' : 'border-white/20'}`}>
                                    {selectedEpisodeIds.has(ep.id) && <CheckCircleIcon className="w-3 h-3 text-on-accent" />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-xs font-semibold text-text-primary truncate">E{ep.episode_number}. {ep.name}</p>
                                    <p className="text-[10px] text-text-secondary">{ep.air_date || 'Unknown Air Date'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="watch-note" className="block text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Note (optional):</label>
                <textarea
                    id="watch-note"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g., Rewatched with family..."
                    className="w-full h-20 p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                />
            </div>
        </div>

        <div className="flex justify-end space-x-4 mt-6 flex-shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkAsWatchedModal;