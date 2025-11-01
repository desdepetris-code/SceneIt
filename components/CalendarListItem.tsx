import React, { useState, useMemo } from 'react';
import { CalendarItem, Reminder, ReminderType } from '../types';
import { BellIcon } from './Icons';
import { formatDate, formatAirtime } from '../utils/formatUtils';

interface ReminderOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ReminderType) => void;
}

const ReminderOptionsModal: React.FC<ReminderOptionsModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-lg shadow-xl p-4 space-y-2 w-full max-w-xs" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-center mb-2">Remind Me...</h3>
                <button onClick={() => onSelect('release')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">At time of release</button>
                <button onClick={() => onSelect('day_before')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">1 day before</button>
                <button onClick={() => onSelect('week_before')} className="w-full text-left p-2 rounded-md bg-bg-secondary hover:brightness-125">1 week before</button>
            </div>
        </div>
    );
}


interface CalendarListItemProps {
  item: CalendarItem;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  isReminderSet: boolean;
  onToggleReminder: (type: ReminderType | null) => void;
  isPast: boolean;
  timezone: string;
}

const CalendarListItem: React.FC<CalendarListItemProps> = ({ item, onSelect, isReminderSet, onToggleReminder, isPast, timezone }) => {
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  
  const { seasonEpisode, episodeName } = useMemo(() => {
    if (item.media_type === 'tv' && item.episodeInfo) {
      const parts = item.episodeInfo.split(': ');
      if (parts.length > 1) {
        return { seasonEpisode: parts[0], episodeName: parts.slice(1).join(': ') };
      }
      return { seasonEpisode: item.episodeInfo, episodeName: '' };
    }
    // For movies, we don't need to parse anything specific
    return { seasonEpisode: null, episodeName: null };
  }, [item.media_type, item.episodeInfo]);
  
  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
      if (isReminderSet) {
          onToggleReminder(null);
      } else {
          setIsReminderModalOpen(true);
      }
  };
  
  const handleSelectReminderType = (type: ReminderType) => {
      onToggleReminder(type);
      setIsReminderModalOpen(false);
  };
  
  const formattedDate = formatDate(item.date, timezone, { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedAirtime = formatAirtime(item.airtime);

  return (
    <>
      <ReminderOptionsModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSelect={handleSelectReminderType}
      />
      <div
        className="relative group bg-card-gradient rounded-lg shadow-md transition-colors hover:bg-bg-secondary/50 cursor-pointer"
        onClick={() => onSelect(item.id, item.media_type)}
      >
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary-accent rounded-l-lg"></div>
          <div className="pl-6 pr-4 py-4">
              {!isPast && (
                  <button
                      onClick={handleReminderClick}
                      className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isReminderSet ? 'text-primary-accent bg-primary-accent/10' : 'text-text-secondary hover:bg-bg-secondary'}`}
                      aria-label={isReminderSet ? "Remove reminder" : "Add reminder"}
                  >
                      <BellIcon filled={isReminderSet} className="w-5 h-5"/>
                  </button>
              )}

              <h3 className="text-3xl font-bold text-text-primary pr-12">{item.title}</h3>
              <hr className="border-t border-bg-secondary/50 my-2" />
              
              {item.media_type === 'tv' ? (
                  <>
                      <p className="text-md text-text-secondary">{seasonEpisode}</p>
                      <h4 className="text-4xl font-bold text-text-primary my-1">{episodeName}</h4>
                      <p className="text-lg text-text-secondary">{formattedDate}</p>
                      {formattedAirtime && <p className="text-lg text-text-secondary">{formattedAirtime}</p>}
                      {item.network && (
                          <div className="mt-4">
                              <p className="text-md text-text-secondary">Where to watch</p>
                              <p className="text-lg font-semibold text-text-primary">{item.network}</p>
                          </div>
                      )}
                  </>
              ) : ( // Movie
                  <>
                      <h4 className="text-4xl font-bold text-text-primary my-1">Movie Release</h4>
                      <p className="text-lg text-text-secondary">{formattedDate}</p>
                      <div className="mt-4">
                          <p className="text-md text-text-secondary">Where to watch</p>
                          <p className="text-lg font-semibold text-text-primary">In Theaters</p>
                      </div>
                  </>
              )}
          </div>
      </div>
    </>
  );
};

export default CalendarListItem;