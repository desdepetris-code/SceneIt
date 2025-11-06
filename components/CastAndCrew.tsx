import React, { useState, useMemo } from 'react';
import { TmdbMediaDetails, CrewMember, TvdbShow, CastMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface CastAndCrewProps {
  details: TmdbMediaDetails | null;
  tvdbDetails: TvdbShow | null;
  onSelectPerson: (personId: number) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
);

const CastAndCrew: React.FC<CastAndCrewProps> = ({ details, tvdbDetails, onSelectPerson }) => {
  const [showFullMainCast, setShowFullMainCast] = useState(false);
  const [showFullGuestCast, setShowFullGuestCast] = useState(false);
  
  const { mainCast, guestStars } = useMemo(() => {
    const tmdbCast = details?.credits?.cast || [];
    const main = tmdbCast.filter(c => (c as any).order < 15);
    const guests = tmdbCast.filter(c => (c as any).order >= 15);
    return { mainCast: main, guestStars: guests };
  }, [details]);
  
  const mainCastToShow = showFullMainCast ? mainCast : mainCast.slice(0, 10);
  const guestStarsToShow = showFullGuestCast ? guestStars : guestStars.slice(0, 10);
  
  const crew = details?.credits?.crew || [];
  const creators = Array.from(new Map(crew.filter(c => c.job === 'Creator' || c.job === 'Screenplay' || c.job === 'Writer').map((item: CrewMember) => [item.id, item])).values()).slice(0,5);
  const directors = Array.from(new Map(crew.filter(c => c.job === 'Director').map((item: CrewMember) => [item.id, item])).values()).slice(0,5);

  if (mainCast.length === 0 && guestStars.length === 0 && creators.length === 0 && directors.length === 0) {
      return <p className="text-text-secondary">Cast and crew information is not available.</p>;
  }
  
  const CastGrid: React.FC<{ cast: CastMember[] }> = ({ cast }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {cast.map(person => (
            <div key={`${person.id}-${person.character}`} className={`text-center group ${person.id > 0 ? 'cursor-pointer' : 'cursor-default'}`} onClick={person.id > 0 ? () => onSelectPerson(person.id) : undefined}>
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
      {mainCastToShow.length > 0 && (
        <section>
            <SectionHeader title="Main Cast" />
            <CastGrid cast={mainCastToShow} />
            {mainCast.length > 10 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowFullMainCast(!showFullMainCast)}
                  className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all"
                >
                  {showFullMainCast ? 'Show Less' : 'Show Full Main Cast'}
                </button>
              </div>
            )}
        </section>
      )}
      
      {guestStarsToShow.length > 0 && (
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

      {(creators.length > 0 || directors.length > 0) && (
        <section>
            <SectionHeader title="Key Crew" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {creators.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-text-secondary mb-2">Created &amp; Written By</h3>
                        <ul className="space-y-1">
                            {creators.map((person: CrewMember, index) => <li key={`${person.id}-${index}`} className="text-text-primary">{person.name}</li>)}
                        </ul>
                    </div>
                )}
                {directors.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-text-secondary mb-2">Directed By</h3>
                        <ul className="space-y-1">
                            {directors.map((person: CrewMember, index) => <li key={`${person.id}-${index}`} className="text-text-primary">{person.name}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </section>
      )}
    </div>
  );
};

export default CastAndCrew;
