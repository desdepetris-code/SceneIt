import React, { useState } from 'react';
import { TmdbMediaDetails, CrewMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface CastAndCrewProps {
  details: TmdbMediaDetails | null;
  onSelectPerson: (personId: number) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-text-primary mb-4">{title}</h2>
);

const CastAndCrew: React.FC<CastAndCrewProps> = ({ details, onSelectPerson }) => {
  const [showFullCast, setShowFullCast] = useState(false);
  
  const allCast = details?.credits?.cast || [];
  const castToShow = showFullCast ? allCast : allCast.slice(0, 10);
  
  const crew = details?.credits?.crew || [];
  // FIX: Explicitly type the 'item' parameter in the map function to correct type inference.
  const creators = Array.from(new Map(crew.filter(c => c.job === 'Creator' || c.job === 'Screenplay' || c.job === 'Writer').map((item: CrewMember) => [item.id, item])).values()).slice(0,5);
  const directors = Array.from(new Map(crew.filter(c => c.job === 'Director').map((item: CrewMember) => [item.id, item])).values()).slice(0,5);

  if (allCast.length === 0 && creators.length === 0 && directors.length === 0) {
      return <p className="text-text-secondary">Cast and crew information is not available.</p>;
  }

  return (
    <div className="animate-fade-in">
      {castToShow.length > 0 && (
        <section className="mb-8">
            <SectionHeader title="Cast" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {castToShow.map(person => (
                <div key={person.id} className="text-center group cursor-pointer" onClick={() => onSelectPerson(person.id)}>
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
            {allCast.length > 10 && (
              <div className="text-center mt-6">
                <button 
                  onClick={() => setShowFullCast(!showFullCast)}
                  className="px-4 py-2 rounded-md bg-bg-secondary text-text-primary font-semibold hover:brightness-125 transition-all"
                >
                  {showFullCast ? 'Show Less' : 'Show Full Cast'}
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
                            {/* FIX: Explicitly type `person` as `CrewMember` to resolve TS error. */}
                            {creators.map((person: CrewMember, index) => <li key={`${person.id}-${index}`} className="text-text-primary">{person.name}</li>)}
                        </ul>
                    </div>
                )}
                {directors.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-text-secondary mb-2">Directed By</h3>
                        <ul className="space-y-1">
                            {/* FIX: Explicitly type `person` as `CrewMember` to resolve TS error. */}
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