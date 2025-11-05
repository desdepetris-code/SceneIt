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
        if ('character' in person && person.character) return person.character;
        if ('job' in person && person.job) return person.job;
        if ('roles' in person && person.roles) return person.roles.map(r => `${r.character} (${r.episode_count} ep)`).join(', ');
        if ('jobs' in person && person.jobs) return person.jobs.map(j => `${j.job} (${j.episode_count} ep)`).join(', ');
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
            <PersonCard key={`${person.id}-${person.name}-${'character' in person ? person.character : ''}-${'job' in person ? person.job : ''}`} person={person} onSelectPerson={onSelectPerson} />
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
  const [activeTab, setActiveTab] = useState('cast');
  const [showFullCast, setShowFullCast] = useState(false);

  const allTvCast = useMemo(() => {
    if (!isTv || !details?.aggregate_credits?.cast) return [];
    
    return [...details.aggregate_credits.cast].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return b.total_episode_count - a.total_episode_count;
    });
  }, [details, isTv]);

  const crewByDept = useMemo(() => {
    const crew = isTv ? details?.aggregate_credits?.crew : details?.credits?.crew;
    if (!crew) return {};

    const groupedCrew = crew.reduce((acc, person) => {
        const department = 'department' in person ? person.department : 'Other';
        if (!acc[department]) {
            acc[department] = new Map<number, AnyPerson>();
        }
        acc[department].set(person.id, person);
        return acc;
    }, {} as Record<string, Map<number, AnyPerson>>);
    
    const finalGrouped: Record<string, AnyPerson[]> = {};
    for (const dept in groupedCrew) {
        finalGrouped[dept] = Array.from(groupedCrew[dept].values());
    }

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

  const castToDisplay = isTv ? allTvCast : movieCast;
  const INITIAL_CAST_COUNT = 20;
  const castToShow = showFullCast ? castToDisplay : castToDisplay.slice(0, INITIAL_CAST_COUNT);
  const canExpand = castToDisplay.length > INITIAL_CAST_COUNT;
  
  // FIX: Explicitly type the 'people' parameter in the 'reduce' function to resolve a TypeScript error where its type was inferred as 'unknown'.
  const totalCrewCount = useMemo(() => Object.values(crewByDept).reduce((acc: number, people: any[]) => acc + people.length, 0), [crewByDept]);

  if (castToDisplay.length === 0 && totalCrewCount === 0) {
    return <p className="text-text-secondary">Cast & crew information is not available.</p>;
  }

  return (
    <div className="animate-fade-in">
        <div className="flex space-x-2 overflow-x-auto pb-4">
            <TabButton label="Cast" count={castToDisplay.length} isActive={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />
            <TabButton label="Crew" count={totalCrewCount} isActive={activeTab === 'crew'} onClick={() => setActiveTab('crew')} />
        </div>

        <div className="mt-6">
            {activeTab === 'cast' && (
                 <>
                    <PersonGrid people={castToShow} onSelectPerson={onSelectPerson} />
                    {canExpand && (
                         <div className="text-center mt-6">
                            <button onClick={() => setShowFullCast(!showFullCast)} className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all">
                                {showFullCast ? 'Show Less' : `Show All ${castToDisplay.length} Cast Members`}
                            </button>
                        </div>
                    )}
                </>
            )}
            {activeTab === 'crew' && (
                <div className="space-y-6">
                    {Object.entries(crewByDept).map(([department, people]) => (
                        <CrewSection key={department} title={department} people={people as (AggregateCrewMember | CrewMember)[]} onSelectPerson={onSelectPerson} />
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};

export default CastAndCrew;
