import React, { useState, useMemo } from 'react';
import { UserData, TrackedItem } from '../types';
import OngoingShowCard from '../components/OngoingShowCard';
import { QueueListIcon, SearchIcon, SparklesIcon } from '../components/Icons';

interface OngoingShowsScreenProps {
    userData: UserData;
    onSelectShow: (id: number, media_type: 'tv') => void;
}

const OngoingShowsScreen: React.FC<OngoingShowsScreenProps> = ({ userData, onSelectShow }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Logic: Ongoing means status is not 'Ended' or 'Canceled'. 
    // We already have show metadata in watching/ptw/completed etc.
    // However, to filter accurately by STATUS, we technically need details.
    // But we can start with the user's TV lists and rely on the card to identify status or 
    // pre-fetch if we really want a clean list. 
    // Let's assume we want to show anything in 'Watching' or 'PTW' that is TV.
    const ongoingCandidates = useMemo(() => {
        const combined = [...userData.watching, ...userData.planToWatch, ...userData.allCaughtUp, ...userData.onHold];
        const unique = Array.from(new Map(combined.map(i => [i.id, i])).values());
        return unique.filter(i => i.media_type === 'tv');
    }, [userData]);

    const filteredShows = useMemo(() => {
        if (!searchQuery.trim()) return ongoingCandidates;
        const q = searchQuery.toLowerCase();
        return ongoingCandidates.filter(s => s.title.toLowerCase().includes(q));
    }, [ongoingCandidates, searchQuery]);

    return (
        <div className="animate-fade-in space-y-10 px-4 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter flex items-center gap-4">
                        <QueueListIcon className="w-12 h-12 text-primary-accent" />
                        Catch Up
                    </h1>
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Ongoing series requiring your attention</p>
                </div>
                
                <div className="relative w-full md:w-80">
                    <input 
                        type="text" 
                        placeholder="Search ongoing..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-bg-secondary/40 border border-white/5 rounded-2xl font-black uppercase text-xs focus:border-primary-accent focus:outline-none shadow-xl"
                    />
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                </div>
            </header>

            {filteredShows.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                    {filteredShows.map(show => (
                        <OngoingShowCard 
                            key={show.id} 
                            item={show} 
                            watchProgress={userData.watchProgress} 
                            onSelect={onSelectShow as any} 
                        />
                    ))}
                </div>
            ) : (
                <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                    <SparklesIcon className="w-20 h-20 text-text-secondary/20 mb-6" />
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">No Series Found</h2>
                    <p className="text-sm text-text-secondary max-w-sm mx-auto mt-2 font-medium">
                        {searchQuery 
                            ? `We couldn't find any shows matching "${searchQuery}" in your library.`
                            : "Start tracking some TV shows to see which ones are ongoing and need catching up!"
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default OngoingShowsScreen;