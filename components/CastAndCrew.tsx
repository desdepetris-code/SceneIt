import React, { useState, useMemo } from 'react';
import { TmdbMediaDetails, TvdbShow, AggregateCastMember, AggregateCrewMember, CastMember, CrewMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface CastAndCrewProps {
  details: TmdbMediaDetails | null;
  tvdbDetails: TvdbShow | null; // This is kept for potential future use but is not used in the new logic
  onSelectPerson: (personId: number) => void;
}

// --- Reusable Sub-components ---

const TabButton: React.FC<{ label: string; count: number; isActive: boolean; onClick: () => void }> = ({ label, count, isActive, onClick }) => (
    <button
        onClick={onClick}
        disabled={count === 0}
        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive
            ? 'bg-accent-gradient text-on-accent'
            : 'bg-bg-secondary text-text-secondary hover:brightness-125'
        }`}
    >
        {label} <span className="opacity-70">{count}</span>
    </button>
);

type AnyPerson = (AggregateCastMember | AggregateCrewMember | CastMember | CrewMember) & { roles?: any[]; jobs?: any[]; character?: string; job?: string };

const PersonCard: React.FC<{ person: AnyPerson; onSelectPerson: (personId: number) => void; }> = ({ person, onSelectPerson }) => {
    const subtitle = useMemo(() => {
        if (person.character) return person.character;
        if (person.job) return person.job;
        if (person.roles) return person.roles.map(r => `${r.character} (${r.episode_count} ep)`).join(', ');
        if (person.jobs) return person.jobs.map(j => `${j.job} (${j.episode_count} ep)`).join(', ');
        return '';
    }, [person]);

    return (
        <div className={`text-center group ${person.id > 0 ? 'cursor-pointer' : 'cursor-default'}`} onClick={person.id > 0 ? () => onSelectPerson(person.id) : undefined}>
            <img
                src={getImageUrl(person.profile_path, 'w185', 'profile')}
                alt={person.name}
                className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg transition-transform group-hover:scale-110"
                loading="lazy"
            />
            <p className="mt-2 text-sm font-semibold text-text-primary">{person.name}</p>
            <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
    );
};

const PersonGrid: React.FC<{ people: AnyPerson[]; onSelectPerson: (personId: number) => void; }> = ({ people, onSelectPerson }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {people.map(person => (
            <PersonCard key={`${person.id}-${person.name}`} person={person} onSelectPerson={onSelectPerson} />
        ))}
    </div>
);

const CrewSection: React.FC<{ title: string; people: (AggregateCrewMember | CrewMember)[]; onSelectPerson: (personId: number) => void; }> = ({ title, people, onSelectPerson }) => {
    if (people.length === 0) return null;
    return (
        <section className="mb-6">
            <h3 className="font-semibold text-text-secondary mb-3">{title}</h3>
            <PersonGrid people={people} onSelectPerson={onSelectPerson} />
        </section>
    );
};

// --- Main Component ---

const CastAndCrew: React.FC<CastAndCrewProps> = ({ details, onSelectPerson }) => {
  const isTv = details?.media_type === 'tv';
  const [activeTab, setActiveTab] = useState(isTv ? 'main' : 'cast');
  const [showFullCast, setShowFullCast] = useState(false);

  const GUEST_STAR_THRESHOLD = 5;

  const { mainCast, guestStars } = useMemo(() => {
    if (!isTv || !details?.aggregate_credits?.cast) return { mainCast: [], guestStars: [] };
    const cast = details.aggregate_credits.cast;
    const main = cast.filter(c => c.total_episode_count > GUEST_STAR_THRESHOLD).sort((a,b) => a.order - b.order);
    const guests = cast.filter(c => c.total_episode_count <= GUEST_STAR_THRESHOLD).sort((a,b) => b.total_episode_count - a.total_episode_count);
    return { mainCast: main, guestStars: guests };
  }, [details, isTv]);

  const crewByDept = useMemo(() => {
    const crew = isTv ? details?.aggregate_credits?.crew : details?.credits?.crew;
    if (!crew) return {};

    // Group all crew members by their department
    const groupedCrew = crew.reduce((acc, person) => {
        const department = 'department' in person ? person.department : (person.jobs?.[0]?.department || 'Other');
        if (!acc[department]) {
            acc[department] = new Map<number, AnyPerson>();
        }
        acc[department].set(person.id, person);
        return acc;
    }, {} as Record<string, Map<number, AnyPerson>>);
    
    // Convert Map values to arrays
    const finalGrouped: Record<string, AnyPerson[]> = {};
    for (const dept in groupedCrew) {
        finalGrouped[dept] = Array.from(groupedCrew[dept].values());
    }

    // Sort departments for a consistent and logical order
    const sortedDepartments = Object.keys(finalGrouped).sort((a,b) => {
        const order = ['Creator', 'Directing', 'Writing', 'Production', 'Sound', 'Art', 'Costume & Make-Up', 'Camera', 'Editing', 'Visual Effects', 'Crew'];
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    const sortedFinalGrouped: Record<string, AnyPerson[]> = {};
    sortedDepartments.forEach(dept => {
        sortedFinalGrouped[dept] = finalGrouped[dept];
    });

    return sortedFinalGrouped;
  }, [details, isTv]);

  const movieCast = useMemo(() => !isTv ? details?.credits?.cast || [] : [], [details, isTv]);

  // FIX: Explicitly type 'people' as 'any' in reduce to prevent TypeScript from inferring it as 'unknown'
  // due to the useMemo hook returning a union type that includes an empty object.
  const totalCrewCount = useMemo(() => Object.values(crewByDept).reduce((acc, people: any) => acc + people.length, 0), [crewByDept]);

  const castToShow = showFullCast ? (isTv ? guestStars : movieCast) : (isTv ? guestStars.slice(0, 10) : movieCast.slice(0, 20));
  const fullCastCount = isTv ? guestStars.length : movieCast.length;
  const canExpand = fullCastCount > (isTv ? 10 : 20);

  if ((isTv && mainCast.length === 0 && guestStars.length === 0) || (!isTv && movieCast.length === 0)) {
    return <p className="text-text-secondary">Cast information is not available.</p>;
  }

  return (
    <div className="animate-fade-in">
        <div className="flex space-x-2 overflow-x-auto pb-4">
            {isTv ? (
                <>
                    <TabButton label="Main Cast" count={mainCast.length} isActive={activeTab === 'main'} onClick={() => setActiveTab('main')} />
                    <TabButton label="Guest Stars" count={guestStars.length} isActive={activeTab === 'guests'} onClick={() => setActiveTab('guests')} />
                    <TabButton label="Crew" count={totalCrewCount} isActive={activeTab === 'crew'} onClick={() => setActiveTab('crew')} />
                </>
            ) : (
                <>
                    <TabButton label="Cast" count={movieCast.length} isActive={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />
                    <TabButton label="Crew" count={totalCrewCount} isActive={activeTab === 'crew'} onClick={() => setActiveTab('crew')} />
                </>
            )}
        </div>

        <div className="mt-6">
            {isTv && activeTab === 'main' && <PersonGrid people={mainCast} onSelectPerson={onSelectPerson} />}
            {isTv && activeTab === 'guests' && (
                <>
                    <PersonGrid people={castToShow} onSelectPerson={onSelectPerson} />
                    {canExpand && (
                         <div className="text-center mt-6">
                            <button onClick={() => setShowFullCast(!showFullCast)} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all">
                                {showFullCast ? 'Show Less' : 'Show All Guest Stars'}
                            </button>
                        </div>
                    )}
                </>
            )}
            {!isTv && activeTab === 'cast' && (
                <>
                    <PersonGrid people={castToShow} onSelectPerson={onSelectPerson} />
                    {canExpand && (
                         <div className="text-center mt-6">
                            <button onClick={() => setShowFullCast(!showFullCast)} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all">
                                {showFullCast ? 'Show Less' : 'Show Full Cast'}
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'crew' && (
                <div className="space-y-6">
                    {Object.entries(crewByDept).map(([department, people]) => (
                        <CrewSection key={department} title={department} people={people} onSelectPerson={onSelectPerson} />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default CastAndCrew;
