
import React, { useState, useMemo } from 'react';
import { TmdbMediaDetails, CrewMember, CastMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface CastAndCrewProps {
  aggregateCredits: { mainCast: CastMember[]; guestStars: CastMember[]; crew: CrewMember[] } | null;
  tmdbCredits: TmdbMediaDetails['credits'] | null | undefined;
  onSelectPerson: (personId: number) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest whitespace-nowrap">{title}</h2>
        <div className="h-px w-full bg-white/5"></div>
    </div>
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
    const order = ['Directing', 'Writing', 'Production', 'Creator', 'Screenplay', 'Camera', 'Editing', 'Art', 'Costume & Make-Up', 'Sound', 'Visual Effects'];
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
      return (
        <div className="text-center py-20 bg-bg-secondary/20 rounded-2xl border-2 border-dashed border-white/5">
            <p className="text-text-secondary font-black uppercase tracking-widest opacity-40">Cast and crew information is not available.</p>
        </div>
      );
  }
  
  const CastGrid: React.FC<{ cast: CastMember[] }> = ({ cast }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cast.map(person => (
            <div key={`${person.id}-${person.character}`} className="text-center group cursor-pointer" onClick={() => onSelectPerson(person.id)}>
              <div className="relative inline-block">
                <img
                    src={getImageUrl(person.profile_path, 'w185', 'profile')}
                    alt={person.name}
                    className="w-24 h-24 mx-auto rounded-full object-cover shadow-2xl border-2 border-white/5 transition-all group-hover:scale-105 group-hover:border-primary-accent"
                    loading="lazy"
                />
              </div>
              <p className="mt-3 text-sm font-black text-text-primary uppercase tracking-tight">{person.name}</p>
              <p className="text-[10px] text-text-secondary font-bold uppercase opacity-60 tracking-wider line-clamp-1">{person.character}</p>
            </div>
        ))}
    </div>
  );

  return (
    <div className="animate-fade-in space-y-12">
      {mainCast.length > 0 && (
        <section>
            <SectionHeader title="Main Cast" />
            <CastGrid cast={mainCastToShow} />
            {mainCast.length > 10 && (
              <div className="text-center mt-8">
                <button 
                  onClick={() => setShowFullMainCast(!showFullMainCast)}
                  className="px-6 py-2 rounded-full bg-bg-secondary text-text-primary font-black uppercase text-[10px] tracking-widest hover:brightness-125 transition-all border border-white/5"
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
              <div className="text-center mt-8">
                <button 
                  onClick={() => setShowFullGuestCast(!showFullGuestCast)}
                  className="px-6 py-2 rounded-full bg-bg-secondary text-text-primary font-black uppercase text-[10px] tracking-widest hover:brightness-125 transition-all border border-white/5"
                >
                  {showFullGuestCast ? 'Show Less' : `Show All ${guestStars.length} Guest Stars`}
                </button>
              </div>
            )}
        </section>
      )}

      {sortedDepartments.length > 0 && (
        <section>
            <SectionHeader title="Production Crew" />
            <div className="space-y-10">
                {sortedDepartments.map(dept => (
                    <div key={dept}>
                        <h3 className="text-xs font-black text-primary-accent uppercase tracking-[0.3em] mb-4 opacity-80">{dept}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {crewByDepartment[dept].map((person: CrewMember) => (
                                <div 
                                    key={`${person.id}-${dept}`} 
                                    className="flex items-center gap-3 p-2 rounded-xl bg-bg-secondary/20 hover:bg-bg-secondary/40 transition-all border border-white/5 group cursor-pointer"
                                    onClick={() => onSelectPerson(person.id)}
                                >
                                    {person.profile_path ? (
                                        <img 
                                            src={getImageUrl(person.profile_path, 'w185', 'profile')} 
                                            alt={person.name}
                                            className="w-10 h-10 rounded-full object-cover shadow-lg border border-white/10 group-hover:border-primary-accent transition-all"
                                            loading="lazy"
                                        />
                                    ) : null}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-text-primary truncate group-hover:text-primary-accent transition-colors">{person.name}</p>
                                        <p className="text-[10px] text-text-secondary font-black uppercase opacity-60 truncate tracking-tighter">{person.job}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
      )}
    </div>
  );
};

export default CastAndCrew;
