import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './Icons';

interface MarkAsWatchedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { date: string; note: string }) => void;
  mediaTitle: string;
}

const MarkAsWatchedModal: React.FC<MarkAsWatchedModalProps> = ({ isOpen, onClose, onSave, mediaTitle }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      // Set default to today at current time
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().split(' ')[0].substring(0, 5));
      setNote(''); // Reset note on open
    }
  }, [isOpen]);


  if (!isOpen) return null;

  const handleSave = () => {
    if (!date || !time) {
      alert('Please select a date and time.');
      return;
    }
    const dateTimeString = new Date(`${date}T${time}`).toISOString();
    onSave({ date: dateTimeString, note });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
          <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-2">Log a Past Watch</h2>
        <p className="text-text-secondary mb-1 truncate">{mediaTitle}</p>
        <p className="text-xs text-text-secondary/80 mb-4">Log a past watch date and time. You can optionally add a note for this specific entry, which is saved to your history.</p>
        
        <label htmlFor="watch-date" className="block text-sm font-medium text-text-secondary mb-1">Date & Time:</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            id="watch-date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
          />
          <input
            type="time"
            id="watch-time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
          />
        </div>

        <label htmlFor="watch-note" className="block text-sm font-medium text-text-secondary mb-1 mt-4">Note (for this log entry):</label>
        <textarea
          id="watch-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g., Watched with friends, director's cut..."
          className="w-full h-20 p-2 bg-bg-secondary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
        />

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onClose} className="px-6 py-2 rounded-md text-text-primary bg-bg-secondary hover:brightness-125 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">
            Save Watch Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkAsWatchedModal;