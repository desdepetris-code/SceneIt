import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPersonDetails } from '../services/tmdbService';
import { PersonDetails, UserData, TrackedItem, UserRatings, HistoryItem, TmdbMedia, PersonCredit, TmdbMediaDetails, WeeklyPick } from '../types';
import { BookOpenIcon, StarIcon, ClockIcon, PlayCircleIcon, TrophyIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import FilmographyCard from '../components/FilmographyCard';
import RatingModal from '../components/RatingModal';
import HistoryModal from '../components/HistoryModal';
import { getDominantColor } from '../utils/colorUtils';
import NominationModal from '../components/NominationModal';

interface ActorDetailProps {
  personId: number;
  onBack: () => void;
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onRateItem: (mediaId: number, rating: number) => void;
  ratings: UserRatings;
  favorites: TrackedItem[];
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
  weeklyFavorites: WeeklyPick[];
}

type ActorDetailTab = 'overview' | 'recommendations' | 'watched' | 'filmography';

const ActorDetailSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="w-full h-48 sm:h-64 bg-bg-secondary"></div>
        <div className="max-w-7xl mx-auto px-4 -mt-16">
            <div className="flex flex-col md:flex-row items-end">
                <div className="w-32 h-48 md:w-60 md:h-80 bg-bg-secondary rounded-lg shadow-lg flex-shrink-0 border-4 border-bg-primary"></div>
                <div className="md:ml-6 mt-4 md:mt-0 w-full">
                    <div className="h-8 bg-bg-secondary rounded w-3/4"></div>
                </div>
            </div>
        </div>
    </div>
);

const ActorDetail: React.FC<ActorDetailProps> = (props) => {
    const { personId, onBack, userData, onSelectShow, onToggleFavoriteShow, onRateItem, ratings, favorites, weeklyFavorites, onToggleWeeklyFavorite } = props;
    const [details, setDetails] = useState<PersonDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActorDetailTab>('overview');
    const [ratingModalState, setRatingModalState] = useState<{ isOpen: boolean; media: TmdbMedia | null }>({ isOpen: false, media: null });
    const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; media: TmdbMedia | null }>({ isOpen: false, media: null });
    const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const personDetails = await getPersonDetails(personId);
                setDetails(personDetails);
            } catch (e: any) { setError(e.message || 'Failed to load actor details.'); } finally { setLoading(false); }
        };
        fetchData();
    }, [personId]);

    useEffect(() => {
        if (!details) return;
        let isMounted = true;
        const root = document.documentElement;
        const originalStyles = {
            primary: root.style.getPropertyValue('--color-accent-primary'),
            secondary: root.style.getPropertyValue('--color-accent-secondary'),
            gradient: root.style.getPropertyValue('--accent-gradient'),
            onAccent: root.style.getPropertyValue('--on-accent'),
        };
        const applyChameleon = async () => {
            const sampledUrl = getImageUrl(details.profile_path, 'h632', 'profile');
            const colors = await getDominantColor(sampledUrl);
            if (!colors || !isMounted) return;
            const { primary, secondary, isLight } = colors;
            root.style.setProperty('--color-accent-primary', primary);
            root.style.setProperty('--color-accent-secondary', secondary);
            root.style.setProperty('--accent-gradient', `linear-gradient(to right, ${primary}, ${secondary})`);
            root.style.setProperty('--on-accent', isLight ? '#000000' : '#FFFFFF');
        };
        applyChameleon();
        return () => {
            isMounted = false;
            root.style.setProperty('--color-accent-primary', originalStyles.primary);
            root.style.setProperty('--color-accent-secondary', originalStyles.secondary);
            root.style.setProperty('--accent-gradient', originalStyles.gradient);
            root.style.setProperty('--on-accent', originalStyles.onAccent);
        };
    }, [details]);

    const filmography = useMemo(() => {
        const castCredits = (details?.combined_credits?.cast || []) as PersonCredit[];
        return Array.from(new Map(castCredits.map(item => [item.id, item])).values())
            .filter((item: PersonCredit) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
            .sort((a: PersonCredit, b: PersonCredit) => (b.popularity || 0) - (a.popularity || 0));
    }, [details]);
    
    const knownFor = useMemo(() => filmography.slice(0, 30), [filmography]);
    const watchedByUser = useMemo(() => filmography.filter(item => userData.history.some(h => h.id === item.id)), [filmography, userData.history]);
    
    const fullFilmographySortedByDate = useMemo(() => [...filmography].sort((a: PersonCredit, b: PersonCredit) => {
        const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
        const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
        return dateB - dateA;
    }), [filmography]);

    const calculateAge = (birthday: string | null): string => {
        if (!birthday) return 'N/A';
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
        return `${age}`;
    };

    const isPick = useMemo(() => {
        const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        return weeklyFavorites.some(p => p.id === personId && (p.category === 'actor' || p.category === 'actress') && p.dayIndex === todayIndex);
    }, [weeklyFavorites, personId]);

    const handleToggleFavorite = (item: PersonCredit) => {
        const trackedItem: TrackedItem = { id: item.id, title: item.title || item.name || '', media_type: item.media_type, poster_path: item.poster_path, genre_ids: item.genre_ids };
        onToggleFavoriteShow(trackedItem);
    };

    const GridDisplay: React.FC<{ items: PersonCredit[] }> = ({ items }) => {
        if (items.length === 0) {
            return <p className="text-text-secondary py-8 text-center">No items to display in this section.</p>;
        }
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map((item: PersonCredit) => (
                    <div key={`${item.id}-${item.credit_id}`}>
                        <FilmographyCard
                            item={item}
                            isFavorite={favorites.some(f => f.id === item.id)}
                            userRating={ratings[item.id]?.rating || 0}
                            onSelect={() => onSelectShow(item.id, item.media_type)}
                            onToggleFavorite={() => handleToggleFavorite(item)}
                            onRate={() => setRatingModalState({ isOpen: true, media: item as any })}
                            onShowHistory={() => setHistoryModalState({ isOpen: true, media: item as any })}
                        />
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <ActorDetailSkeleton />;
    if (!details) return null;

    const profileUrl = getImageUrl(details.profile_path, 'h632', 'profile');
    const tabs: { id: ActorDetailTab, label: string, icon: any }[] = [
        { id: 'overview', label: 'Biography', icon: BookOpenIcon },
        { id: 'recommendations', label: 'Top Hits', icon: StarIcon },
        { id: 'watched', label: 'My History', icon: ClockIcon },
        { id: 'filmography', label: 'Filmography', icon: PlayCircleIcon },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <p className="text-text-secondary whitespace-pre-wrap leading-relaxed max-w-3xl">{details.biography || "No biography available."}</p>;
            case 'recommendations': return <GridDisplay items={knownFor} />;
            case 'watched': return <GridDisplay items={watchedByUser} />;
            case 'filmography': return <GridDisplay items={fullFilmographySortedByDate} />;
            default: return null;
        }
    };

    return (
        <div className="animate-fade-in relative pb-20">
            <RatingModal isOpen={ratingModalState.isOpen} onClose={() => setRatingModalState({ isOpen: false, media: null })} onSave={(r) => onRateItem(ratingModalState.media!.id, r)} currentRating={ratingModalState.media ? ratings[ratingModalState.media.id]?.rating || 0 : 0} mediaTitle={ratingModalState.media?.title || ratingModalState.media?.name || ''} />
            <HistoryModal isOpen={historyModalState.isOpen} onClose={() => setHistoryModalState({ isOpen: false, media: null })} history={userData.history.filter(h => h.id === historyModalState.media?.id)} mediaTitle={historyModalState.media?.title || historyModalState.media?.name || ''} mediaDetails={historyModalState.media as TmdbMediaDetails} />
            <NominationModal 
                isOpen={isNominationModalOpen} onClose={() => setIsNominationModalOpen(false)} item={details as any} 
                category={details.gender === 1 ? 'actress' : 'actor'} onNominate={onToggleWeeklyFavorite} currentPicks={weeklyFavorites} 
            />

            <div className="relative h-[30vh] md:h-[45vh] overflow-hidden">
                <img src={getImageUrl(knownFor[0]?.backdrop_path, 'w1280', 'backdrop')} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 -mt-32 md:-mt-48 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                    <div className="w-full md:w-80 flex-shrink-0">
                        <img src={profileUrl} alt={details.name} className="w-full aspect-[3/4] object-cover rounded-3xl shadow-2xl border-4 border-bg-primary"/>
                        <div className="mt-6 space-y-3">
                            <button onClick={() => setIsNominationModalOpen(true)} className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold border transition-all ${isPick ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-lg' : 'bg-bg-secondary/40 border-white/10 text-text-primary hover:bg-bg-secondary'}`}>
                                <TrophyIcon className="w-5 h-5" />
                                <span className="uppercase tracking-widest">{isPick ? "Weekly Pick" : "Nominate Pick"}</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow min-w-0 space-y-10 pt-4 md:pt-10">
                        <header>
                            <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter mb-4">{details.name}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="px-4 py-1.5 bg-primary-accent/10 border border-primary-accent/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-accent shadow-sm">Age {calculateAge(details.birthday)}</span>
                            </div>
                        </header>

                        <nav className="flex space-x-8 border-b border-white/5 sticky top-16 bg-bg-primary/80 backdrop-blur-md z-30 -mx-4 px-4 overflow-x-auto hide-scrollbar">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                                    <tab.icon className="w-4 h-4" />{tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-accent rounded-full"></div>}
                                </button>
                            ))}
                        </nav>

                        <div className="min-h-[400px]">
                            {renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActorDetail;
