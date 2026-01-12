
import React from 'react';
import { XMarkIcon, SearchIcon, SparklesIcon } from './Icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, timezone, setTimezone }) => {
  if (!isOpen) return null;

  const timezones = [
      { id: 'America/New_York', name: 'Eastern Time (ET)' },
      { id: 'America/Chicago', name: 'Central Time (CT)' },
      { id: 'America/Denver', name: 'Mountain Time (MT)' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
      { id: 'Europe/London', name: 'London (GMT/BST)' },
      { id: 'Europe/Berlin', name: 'Central Europe (CET)' },
      { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
      { id: 'Australia/Sydney', name: 'Sydney (AEST)' },
      { id: 'Etc/UTC', name: 'Coordinated Universal Time (UTC)' },
  ];

  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRUYwOEEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGREUwNDciLz48L2xpbmVhckdyYWRpZW50PjxmaWx0ZXIgaWQ9Imdsb3ciPjxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249IjMiIHJlc3VsdD0iYmx1ciIvPjxmZU1lcmdlPjxmZU1lcmdlTm9kZSBpbj0iYmx1ciIvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgcng9IjI4IiBmaWxsPSIjMTExODI3Ii8+PHJlY3QgeD0iMTQiIHk9IjE0IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjI0IiBmaWxsPSIjMDAwMDAwIi8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzIsIDMyKSBzY2FsZSgwLjgpIj48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHJ4PSI0IiBmaWx0ZXI9InVybCgjZ2xvdykiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNncmFkMSkiIHN0cm9rZS13aWR0aD0iNiIgb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iMTIiIHk9IjEyIiB3aWR0aD0iNTYiIGhlaWdodD0iNTYiIHJ4PSI0IiBmaWx0ZXI9InVybCgjZ2xvdykiIGZpbGw9Im5vbmUiIHN0cm9rZT0idXJsKCNncmFkMSkiIHN0cm9rZS13aWR0aD0iNiIvPjxwYXRoIGQ9Ik0zNCAyOCBMNTAgNDAgTDM0IDUyIFoiIGZpbGw9IiNGRkYxOEEiLz48L2c+PC9zdmc+";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative text-center" onClick={e => e.stopPropagation()}>
        <img src={iconDataUri} alt="cinemontauge Logo" className="h-16 w-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to cinemontauge!</h2>
        <p className="text-text-secondary mb-6">Your personal gallery of cinematic moments. Start tracking and journaling your favorite shows and movies today.</p>
        <div className="text-left space-y-4 mb-8 bg-bg-secondary p-4 rounded-lg">
            <div className="text-left space-y-2 mb-6">
                <label htmlFor="timezone-select" className="block text-sm font-medium text-text-secondary">To ensure dates are accurate, please select your timezone:</label>
                <select id="timezone-select" value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full p-2 bg-bg-primary text-text-primary rounded-md border border-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-accent">
                    {timezones.map(tz => <option key={tz.id} value={tz.id}>{tz.name}</option>)}
                </select>
            </div>
            <div className="flex items-start space-x-3">
                <SearchIcon className="w-6 h-6 text-primary-accent flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-text-primary">Find Your Favorites</h4>
                    <p className="text-sm text-text-secondary">Use the search bar at the top to instantly find any movie or show.</p>
                </div>
            </div>
             <div className="flex items-start space-x-3">
                <SparklesIcon className="w-6 h-6 text-primary-accent flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-text-primary">Discover Something New</h4>
                    <p className="text-sm text-text-secondary">Check out the personalized recommendations based on your unique taste.</p>
                </div>
            </div>
        </div>
        <button onClick={onClose} className="w-full px-6 py-3 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">Begin Your Montage</button>
      </div>
    </div>
  );
};

export default WelcomeModal;
