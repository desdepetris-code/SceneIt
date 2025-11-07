import React, { useState, useMemo } from 'react';
import { TmdbMediaDetails, CrewMember, CastMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface CastAndCrewProps {
  aggregateCredits: { mainCast: CastMember[]; guestStars: CastMember[]; crew: CrewMember[] } | null;
  tmdbCredits: TmdbMediaDetails['credits'] | null | undefined;
  onSelectPerson: (personId: number) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
);

const CastAndCrew: React.FC<CastAndCrewProps> = ({ aggregateCredits, tmdbCredits, onSelectPerson }) => {
  const [showFullMainCast, setShowFullMainCast] = useState(false);
  const [showFullGuestCast, setShowFullGuestCast] = useState(false);
  
  const { mainCast, guestStars, crew } = useMemo(() => {
    if (aggregateCredits) {
      return { 
        mainCast: aggregateCredits.mainCast, 
        guestStars: aggregateCredits.guestStars, 
        crew: aggregateCredits.crew 
      };
    }
    // Fallback logic
    const tmdbCast = tmdbCredits?.cast || [];
    const main = tmdbCast.filter(c => (c as any).order < 15); // Simple heuristic
    const guests = tmdbCast.filter(c => (c as any).order >= 15);
    return { mainCast: main, guestStars: guests, crew: tmdbCredits?.crew || [] };
  }, [aggregateCredits, tmdbCredits]);
  
  const mainCastToShow = showFullMainCast ? mainCast : mainCast.slice(0, 10);
  const guestStarsToShow = showFullGuestCast ? guestStars : guestStars.slice(0, 10);

  const crewByDepartment = useMemo(() => {
    const grouped: Record<string, CrewMember[]> = {};
    const memberIdsInDept = new Set<string>();

    for (const member of crew) {
        const dept = member.department || 'Other';
        if (!grouped[dept]) {
            grouped[dept] = [];
        }
        const key = `${member.id}-${dept}`;
        if (!memberIdsInDept.has(key)) {
            grouped[dept].push(member);
            memberIdsInDept.add(key);
        }
    }
    return grouped;
  }, [crew]);

  const sortedDepartments = useMemo(() => {
    const order = ['Directing', 'Writing', 'Production', 'Creator', 'Screenplay'];
    return Object.keys(crewByDepartment).sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
  }, [crewByDepartment]);

  if (mainCast.length === 0 && guestStars.length === 0 && sortedDepartments.length === 0) {
      return <p className="text-text-secondary">Cast and crew information is not available.</p>;
  }
  
  const CastGrid: React.FC<{ cast: CastMember[] }> = ({ cast }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cast.map(person => (
            <div key={`${person.id}-${person.character}`} className="text-center group cursor-pointer" onClick={() => onSelectPerson(person.id)}>
              <img
                  src={getImageUrl(person.profile_path, 'w185', 'profile')}
                  alt={person.name}
                  className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg transition-transform group-hover:scale-110"
                  loading="lazy"
              />
              <p className="mt-2 text-sm font-semibold text-text-primary">{person.name}</p>
              <p className="text-xs text-text-secondary">{person.character}</p>
            </div>
        ))}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8">
      {mainCast.length > 0 && (
        <section>
            <SectionHeader title="Main Cast" />
            <CastGrid cast={mainCastToShow} />
            {mainCast.length > 10 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowFullMainCast(!showFullMainCast)}
                  className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all"
                >
                  {showFullMainCast ? 'Show Less' : `Show All ${mainCast.length} Main Cast`}
                </button>
              </div>
            )}
        </section>
      )}
      
      {guestStars.length > 0 && (
        <section>
            <SectionHeader title="Guest Stars" />
            <CastGrid cast={guestStarsToShow} />
            {guestStars.length > 10 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowFullGuestCast(!showFullGuestCast)}
                  className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all"
                >
                  {showFullGuestCast ? 'Show Less' : `Show All ${guestStars.length} Guest Stars`}
                </button>
              </div>
            )}
        </section>
      )}

      {sortedDepartments.length > 0 && (
        <section>
            <SectionHeader title="Crew" />
            <div className="space-y-6">
                {sortedDepartments.map(dept => (
                    <div key={dept}>
                        <h3 className="font-semibold text-text-secondary mb-2">{dept}</h3>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                            {crewByDepartment[dept].map((person: CrewMember) => (
                                <li key={`${person.id}-${dept}`} className="text-text-primary text-sm">
                                    <span className="font-semibold cursor-pointer hover:underline" onClick={() => onSelectPerson(person.id)}>{person.name}</span>
                                    <span className="text-text-secondary/80"> ({person.job})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </section>
      )}
    </div>
  );
};

export default CastAndCrew;
