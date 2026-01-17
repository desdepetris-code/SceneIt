import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPersonDetails } from '../services/tmdbService';
import { PersonDetails, UserData, TrackedItem, UserRatings, HistoryItem, TmdbMedia, PersonCredit, TmdbMediaDetails } from '../types';
import { ChevronLeftIcon, TrophyIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import FilmographyCard from '../components/FilmographyCard';
import RatingModal from '../components/RatingModal';
import HistoryModal from '../components/HistoryModal';
import NominationModal from '../components/NominationModal';
import { getDominantColor, mixColors } from '../utils/colorUtils';

// --- PROPS INTERFACE ---
interface ActorDetailProps {
  personId: number;
  onBack: () => void;
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onRateItem: (mediaId: number, rating: number) => void;
  ratings: UserRatings;
  favorites: TrackedItem[];
  onToggleWeeklyFavorite: (item: TrackedItem, replacementId?: number) => void;
  weeklyFavorites: any[];
}

type ActorDetailTab = 'overview' | 'recommendations' | 'watched' | 'filmography';

// --- SKELETON LOADER ---
const ActorDetailSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="w-full h-48 sm:h-64 bg-bg-secondary"></div>
        <div className="container mx-auto px-4 -mt-16">
            <div className="flex flex-col sm:flex-row items-end">
                <div className="w-32 h-48 sm:w-40 sm:h-60 bg-bg-secondary rounded-lg shadow-lg flex-shrink-0 border-4 border-bg-primary"></div>
                <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                    <div className="h-8 bg-bg-secondary rounded w-3/4"></div>
                    <div className="h-4 bg-bg-secondary rounded w-1/2 mt-2"></div>
                </div>
            </div>
        </div>
        <div className="container mx-auto px-4 mt-8 space-y-4">
            <div className="h-10 bg-bg-secondary rounded w-full"></div>
            <div className="h-40 bg-bg-secondary rounded w-full"></div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const ActorDetail: React.FC<ActorDetailProps> = (props) => {
    const { personId, onBack, userData, onSelectShow, onToggleFavoriteShow, onRateItem, ratings, favorites, onToggleWeeklyFavorite, weeklyFavorites } = props;

    // --- STATE MANAGEMENT ---
    const [details, setDetails] = useState<PersonDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActorDetailTab>('overview');
    
    const [ratingModalState, setRatingModalState] = useState<{ isOpen: boolean; media: TmdbMedia | null }>({ isOpen: false, media: null });
    const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; media: TmdbMedia | null }>({ isOpen: false, media: null });
    const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const personDetails = await getPersonDetails(personId);
                setDetails(personDetails);
            } catch (e: any) {
                console.error(e);
                setError(e.message || 'Failed to load actor details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [personId]);

    // --- THE CHAMELEON: Actor Edition ---
    useEffect(() => {
        if (!details) return;

        let isMounted = true;
        const originalStyles = {
            primary: document.documentElement.style.getPropertyValue('--color-accent-primary'),
            secondary: document.documentElement.style.getPropertyValue('--color-accent-secondary'),
            gradient: document.documentElement.style.getPropertyValue('--accent-gradient'),
            navVars: Array.from({ length: 10 }).map((_, i) => document.documentElement.style.getPropertyValue(`--nav-c${i+1}`))
        };

        const applyChameleon = async () => {
            // Profile image or backdrop? Profile is usually better for Actors.
            const sampledUrl = getImageUrl(details.profile_path, 'h632', 'profile');
            if (!sampledUrl || sampledUrl.includes('data:image')) return;

            const colors = await getDominantColor(sampledUrl);
            if (!colors || !isMounted) return;

            const { primary, secondary } = colors;
            const root = document.documentElement;

            root.style.setProperty('--color-accent-primary', primary);
            root.style.setProperty('--color-accent-secondary', secondary);
            root.style.setProperty('--accent-gradient', `linear-gradient(to right, ${primary}, ${secondary})`);

            for (let i = 0; i < 10; i++) {
                const weight = i / 9;
                root.style.setProperty(`--nav-c${i+1}`, mixColors(primary, secondary, weight));
            }
        };

        applyChameleon();

        return () => {
            isMounted = false;
            const root = document.documentElement;
            root.style.setProperty('--color-accent-primary', originalStyles.primary);
            root.style.setProperty('--color-accent-secondary', originalStyles.secondary);
            root.style.setProperty('--accent-gradient', originalStyles.gradient);
            originalStyles.navVars.forEach((val, i) => {
                root.style.setProperty(`--nav-c${i+1}`, val);
            });
        };
    }, [details]);

    // --- MEMOIZED VALUES & DERIVED STATE ---
    const allUserMediaIds = useMemo(() => {
        const ids = new Set<number>();
        [...userData.watching, ...userData.completed].forEach(i => ids.add(i.id));
        return ids;
    }, [userData.watching, userData.completed]);

    const filmography = useMemo(() => {
        const castCredits = details?.combined_credits?.cast || [];
        const uniqueCredits = Array.from(
            new Map(castCredits.map(item => [item.id, item])).values()
        );
        return uniqueCredits
            .filter((item: PersonCredit) => (item.media_type === 'movie' || item.media_type === 'tv') && item.poster_path)
            .sort((a: PersonCredit, b: PersonCredit) => (b.popularity || 0) - (a.popularity || 0));
    }, [details]);
    
    const knownFor = useMemo(() => filmography.slice(0, 20), [filmography]);
    const watchedByUser = useMemo(() => filmography.filter(item => allUserMediaIds.has(item.id)), [filmography, allUserMediaIds]);
    const fullFilmographySortedByDate = useMemo(() => [...filmography].sort((a,b) => {
        const dateA = new Date(a.release_date || a.first_air_date || 0).getTime();
        const dateB = new Date(b.release_date || b.first_air_date || 0).getTime();
        return dateB - dateA;
    }), [filmography]);


    // --- EVENT HANDLERS ---
    const handleToggleFavorite = (item: PersonCredit) => {
        const trackedItem: TrackedItem = { id: item.id, title: item.title || item.name || '', media_type: item.media_type, poster_path: item.poster_path, genre_ids: item.genre_ids };
        onToggleFavoriteShow(trackedItem);
    };

    const handleRate = (rating: number) => {
        if (ratingModalState.media) {
            onRateItem(ratingModalState.media.id, rating);
        }
        setRatingModalState({ isOpen: false, media: null });
    };

    const calculateAge = (birthday: string | null): string => {
        if (!birthday) return 'N/A';
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return `${age}`;
    };

    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const category = details?.gender === 1 ? 'actress' : 'actor';
    const isWeeklyFavorite = useMemo(() => {
        return weeklyFavorites.some(p => p.id === personId && p.category === category && p.dayIndex === todayIndex);
    }, [weeklyFavorites, personId, category, todayIndex]);

    const handleWeeklyGemToggle = () => {
        if (!details) return;
        const categoryDayCount = weeklyFavorites.filter(p => p.dayIndex === todayIndex && p.category === category).length;
        
        if (isWeeklyFavorite) {
            setIsNominationModalOpen(true);
        } else if (categoryDayCount < 5) {
            onToggleWeeklyFavorite({
                id: personId,
                title: details.name,
                media_type: 'person',
                poster_path: details.profile_path,
                category: category,
                dayIndex: todayIndex
            } as any);
        } else {
            setIsNominationModalOpen(true);
        }
    };

    // --- SUB-COMPONENTS (TABS & DISPLAYS) ---

    const ExpandableText: React.FC<{ text: string, maxLength?: number }> = ({ text, maxLength = 400 }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        if (!text) return <p className="text-text-secondary">No biography available.</p>;

        if (text.length <= maxLength) {
            return <p className="text-text-secondary whitespace-pre-wrap">{text}</p>;
        }

        return (
            <div>
                <p className="text-text-secondary whitespace-pre-wrap">
                    {isExpanded ? text : `${text.substring(0, maxLength)}...`}
                </p>
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm font-semibold text-primary-accent hover:underline mt-2">
                    {isExpanded ? 'Read Less' : 'Read More'}
                </button>
            </div>
        );
    };

    const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
        if (!value) return null;
        return (
            <div className="flex flex-col">
                <dt className="text-sm font-medium text-text-secondary">{label}</dt>
                <dd className="mt-1 text-md text-text-primary font-semibold">{value}</dd>
            </div>
        );
    };

    // --- TAB RENDERING ---
    const OverviewTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4 bg-card-gradient p-4 rounded-lg self-start">
                <h3 className="text-xl font-bold text-text-primary mb-2">Personal Info</h3>
                <InfoRow label="Born" value={details?.birthday ? new Date(details.birthday).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
                <InfoRow label="Age" value={calculateAge(details?.birthday || null)} />
                <InfoRow label="Place of Birth" value={details?.place_of_birth} />
                <InfoRow label="Known Credits" value={filmography.length} />
            </div>

            <div className="lg:col-span-2 space-y-8">
                 <div>
                    <h3 className="text-xl font-bold text-text-primary mb-4">Known For</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-2">
                        {knownFor.slice(0, 12).map(item => (
                            <div key={`${item.id}-${item.credit_id}`}>
                                <FilmographyCard
                                    item={item}
                                    isFavorite={favorites.some(f => f.id === item.id)}
                                    userRating={ratings[item.id]?.rating || 0}
                                    onSelect={() => onSelectShow(item.id, item.media_type)}
                                    onToggleFavorite={() => handleToggleFavorite(item)}
                                    onRate={() => setRatingModalState({ isOpen: true, media: item })}
                                    onShowHistory={() => setHistoryModalState({ isOpen: true, media: item })}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Biography</h3>
                    <ExpandableText text={details?.biography || ''} />
                </div>
            </div>
        </div>
    );
    
    const GridDisplay: React.FC<{ items: PersonCredit[] }> = ({ items }) => {
        if (items.length === 0) {
            return <p className="text-text-secondary py-8 text-center">No items to display in this section.</p>;
        }
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {items.map(item => (
                    <div key={`${item.id}-${item.credit_id}`}>
                        <FilmographyCard
                            item={item}
                            isFavorite={favorites.some(f => f.id === item.id)}
                            userRating={ratings[item.id]?.rating || 0}
                            onSelect={() => onSelectShow(item.id, item.media_type)}
                            onToggleFavorite={() => handleToggleFavorite(item)}
                            onRate={() => setRatingModalState({ isOpen: true, media: item })}
                            onShowHistory={() => setHistoryModalState({ isOpen: true, media: item })}
                        />
                    </div>
                ))}
            </div>
        );
    };

    const tabs: { id: ActorDetailTab, label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'recommendations', label: `Recommendations` },
        { id: 'watched', label: `Watched (${watchedByUser.length})` },
        { id: 'filmography', label: `Filmography (${filmography.length})` },
    ];
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview': return <OverviewTab />;
            case 'recommendations': return <GridDisplay items={knownFor} />;
            case 'watched': return <GridDisplay items={watchedByUser} />;
            case 'filmography': return <GridDisplay items={fullFilmographySortedByDate} />;
            default: return null;
        }
    };
    
    // --- RENDER LOGIC ---
    if (loading) return <ActorDetailSkeleton />;
    if (error) return <div className="text-center py-20"><p className="text-red-500">{error}</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-bg-secondary rounded-lg">Back</button></div>;
    if (!details) return null;

    const backdropUrl = getImageUrl(knownFor[0]?.backdrop_path, 'w1280', 'backdrop');
    const profileUrl = getImageUrl(details.profile_path, 'h632', 'profile');
    
    const historyForModal = historyModalState.media ? userData.history.filter(h => h.id === historyModalState.media!.id) : [];

    return (
        <>
            <RatingModal isOpen={ratingModalState.isOpen} onClose={() => setRatingModalState({ isOpen: false, media: null })} onSave={handleRate} currentRating={ratingModalState.media ? ratings[ratingModalState.media.id]?.rating || 0 : 0} mediaTitle={ratingModalState.media?.title || ratingModalState.media?.name || ''} />
            <HistoryModal isOpen={historyModalState.isOpen} onClose={() => setHistoryModalState({ isOpen: false, media: null })} history={historyForModal} mediaTitle={historyModalState.media?.title || historyModalState.media?.name || ''} mediaDetails={historyModalState.media as TmdbMediaDetails} />
            <NominationModal 
                isOpen={isNominationModalOpen} 
                onClose={() => setIsNominationModalOpen(false)} 
                item={details} 
                category={category} 
                onNominate={onToggleWeeklyFavorite} 
                currentPicks={weeklyFavorites} 
            />

            <div className="relative mb-8">
                <img src={backdropUrl} alt="" className="w-full h-48 sm:h-64 object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40"><ChevronLeftIcon className="h-6 w-6" /></button>
                <button 
                    onClick={handleWeeklyGemToggle}
                    className={`absolute bottom-4 right-4 p-3 rounded-full transition-all group shadow-xl border border-white/10 ${isWeeklyFavorite ? 'bg-accent-gradient text-on-accent' : 'bg-backdrop/50 backdrop-blur-md text-white hover:bg-bg-secondary'}`}
                    title="Nominate as Weekly Gem"
                >
                    <TrophyIcon className="w-6 h-6" />
                </button>
            </div>
            
            <div className="container mx-auto px-4 -mt-24 sm:-mt-32 relative z-10">
                <div className="flex flex-col sm:flex-row items-end">
                    <img src={profileUrl} alt={details.name} className="w-32 h-48 sm:w-40 sm:h-60 object-cover rounded-lg shadow-xl flex-shrink-0 border-4 border-bg-primary"/>
                    <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{details.name}</h1>
                    </div>
                </div>
                {details.images?.profiles && details.images.profiles.length > 1 && (
                    <div className="mt-6">
                        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                            {details.images.profiles.slice(1, 11).map(p => (
                                <img key={p.file_path} src={getImageUrl(p.file_path, 'w185')} alt="" className="h-24 w-auto rounded-md" />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="container mx-auto px-4 mt-8 pb-20">
                <div className="border-b border-bg-secondary/50 mb-6">
                    <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                        {tabs.map(tab => (
                             <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-accent-gradient text-on-accent'
                                    : 'bg-bg-secondary text-text-secondary hover:brightness-125'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                {renderTabContent()}
            </div>
        </>
    );
};

export default ActorDetail;