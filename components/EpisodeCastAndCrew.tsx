import React, { useState, useMemo, useEffect } from 'react';
import { CastMember, CrewMember } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface EpisodeCastAndCrewProps {
  credits: {
    cast: CastMember[];
    crew: CrewMember[];
    guest_stars: CastMember[];
  };
  onSelectPerson: (personId: number) => void;
}

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

const PersonCard: React.FC<{ person: CastMember | CrewMember; onSelectPerson: (personId: number) => void; }> = ({ person, onSelectPerson }) => {
    const subtitle = 'character' in person ? person.character : person.job;
    return (
        <div className="text-center group cursor-pointer" onClick={() => onSelectPerson(person.id)}>
            <img
                src={getImageUrl(person.profile_path, 'w185', 'profile')}
                alt={person.name}
                className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg transition-transform group-hover:scale-105"
                loading="lazy"
            />
            <p className="mt-2 text-xs font-semibold text-text-primary">{person.name}</p>
            <p className="text-[10px] text-text-secondary">{subtitle}</p>
        </div>
    );
};

const CrewSection: React.FC<{ title: string; people: CrewMember[]; onSelectPerson: (personId: number) => void; }> = ({ title, people, onSelectPerson }) => {
    if (people.length === 0) return null;
    return (
        <section className="mb-4">
            <h4 className="font-semibold text-text-secondary text-sm mb-3">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                {people.map(person => (
                    <PersonCard key={`${person.id}-${person.job}`} person={person} onSelectPerson={onSelectPerson} />
                ))}
            </div>
        </section>
    );
};

const EpisodeCastAndCrew: React.FC<EpisodeCastAndCrewProps> = ({ credits, onSelectPerson }) => {
  const [activeTab, setActiveTab] = useState<'cast' | 'guests' | 'crew'>('cast');

  const { directors, writers } = useMemo(() => {
    const directors = credits.crew.filter(c => c.job === 'Director');
    const writers = credits.crew.filter(c => c.department === 'Writing');
    return { directors, writers };
  }, [credits.crew]);
  
  const totalCrew = directors.length + writers.length;

  // Set initial tab based on what data is available
  useEffect(() => {
    if (credits.cast.length > 0) {
        setActiveTab('cast');
    } else if (credits.guest_stars.length > 0) {
        setActiveTab('guests');
    } else if (totalCrew > 0) {
        setActiveTab('crew');
    }
  }, [credits, totalCrew]);

  if (credits.cast.length === 0 && credits.guest_stars.length === 0 && totalCrew === 0) {
    return (
      <div className="mt-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">Episode Cast & Crew</h3>
        <p className="text-text-secondary text-sm text-center py-4">
          No specific cast & crew information available for this episode.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h3 className="text-xl font-bold text-text-primary mb-4">Episode Cast & Crew</h3>
      <div className="flex space-x-2 overflow-x-auto pb-4">
        <TabButton label="Main Cast" count={credits.cast.length} isActive={activeTab === 'cast'} onClick={() => setActiveTab('cast')} />
        <TabButton label="Guest Stars" count={credits.guest_stars.length} isActive={activeTab === 'guests'} onClick={() => setActiveTab('guests')} />
        <TabButton label="Crew" count={totalCrew} isActive={activeTab === 'crew'} onClick={() => setActiveTab('crew')} />
      </div>

      <div className="mt-4">
        {activeTab === 'cast' && credits.cast.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {credits.cast.map(person => <PersonCard key={person.id} person={person} onSelectPerson={onSelectPerson} />)}
          </div>
        )}
        {activeTab === 'guests' && credits.guest_stars.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {credits.guest_stars.map(person => <PersonCard key={person.id} person={person} onSelectPerson={onSelectPerson} />)}
          </div>
        )}
        {activeTab === 'crew' && totalCrew > 0 && (
          <div className="space-y-4">
            <CrewSection title="Directing" people={directors} onSelectPerson={onSelectPerson} />
            <CrewSection title="Writing" people={writers} onSelectPerson={onSelectPerson} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeCastAndCrew;