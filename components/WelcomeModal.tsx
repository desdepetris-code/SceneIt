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

  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLXRvcC1ncmFkIiB4MT0iMC41IiB5MT0iMCIgeDI9IjAuNSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRUYwOEEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGREUwNDciLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iY2xhcHBlci1ib2R5LWdyYWQiIHgxPSIwLjUiIHkxPSIwIiB4Mj0iMC41IiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZFRjlDMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZFRjA4QSIvPjwvbGluZWFyR3JhZGllbnQ+PGZpbHRlciBpZD0iZ2xvdyI+PGZlR2F1c3NpYW5CbHVyIHN0ZERldmlhdGlvbj0iMi41IiByZXN1bHQ9ImNvbG9yZWRCbHVyIi8+PGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPSJjb2xvcmVkQmx1ciIvPjxmZU1lcmdlTm9kZSBpbj0iU291cmNlR3JhcGhpYyIvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTA4IiBoZWlnaHQ9IjEwOCIgcng9IjI0IiByeT0iMjQiIGZpbGw9IiMxMTE4MjciLz48cmVjdCB4PSIxNCIgeT0iMTQiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMjAiIHJ5PSIyMCIgZmlsbD0iIzAwMDAwMCIvPjxwYXRoIGQ9Ik0zMCAyNSBMMzIgMjAgTDM0IDI1IEwzOSAyNyBMMzQgMjkgTDMyIDM0IEwzMCAyOSBMMjUgMjcgWiIgZmlsbD0iI0ZFRjA4QSIgb3BhY2l0eT0iMC44IiBmaWx0ZXI9InVybCgjZ2xvdykiLz48cGF0aCBkPSJNOTggNDAgTDEwMCAzNSBMMTAyIDQwIEwxMDcgNDIgTDEwMiA0NCBMMTAwIDQ5IEw5OCA0NCBMOTMgNDIgWiIgZmlsbD0iI0ZFRjlDMyIgb3BhY2l0eT0iMC45IiBmaWx0ZXI9InVybCgjZ2xvdykiLz48cGF0aCBkPSJNMjggOTggTDI5IDk1IEwzMCA5OCBMMzMgOTkgTDMwIDEwMCBMMjkgMTAzIEwyOCAxMDAgTDI1IDk5IFoiIGZpbGw9IiNGREUwNDciIG9wYWNpdHk9IjAuNyIvPjxwYXRoIGQ9Ik05NSA5MCBMOTYgODcgTDk3IDkwIEwxMDAgOTEgTDk3IDkyIEw5NiA5NSBMOTUgOTIgTDkyIDkxIFoiIGZpbGw9IiNGRUYwOEEiIG9wYWNpdHk9IjAuOCIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAyOSkiPjxyZWN0IHg9IjAiIHk9IjIyIiB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHJ4PSI1IiByeT0iNSIgZmlsbD0idXJsKCNjbGFwcGVyLWJvZHktZ3JhZCkiLz48cGF0aCBkPSJNMzIgMzggTDUyIDUwIEwzMiA2MiBaIiBmaWxsPSIjMTExODI3Ii8+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTEwIDAgOSkiPjxwYXRoIGQ9Ik0wIDAgSDgwIEw3NSAxOCBILTUgWiIgZmlsbD0idXJsKCNjbGFwcGVyLXRvcC1ncmFkKSIvPjxwYXRoIGQ9Ik01IDIgSDE4IEwxMyAxNiBIMCB6IiBmaWxsPSIjMUYyOTM3Ii8+PHBhdGggZD0iTTI1IDIgSDM4IEwzMyAxNiBIMjAgeiIgZmlsbD0iIzFGMjkzNyIvPjxwYXRoIGQ9Ik00NSAyIEg1OCBMNTMgMTYgSDQwIHoiIGZpbGw9IiMxRjI5MzciLz48cGF0aCBkPSJNNjUgMiBINTggTDczIDE2IEg2MCB6IiBmaWxsPSIjMUYyOTM3Ii8+PC9nPjwvZz48L3N2Zz4=";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative text-center" onClick={e => e.stopPropagation()}>
        <img src={iconDataUri} alt="SceneIt Logo" className="h-16 w-16 mx-auto mb-4" />
        
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to SceneIt!</h2>
        <p className="text-text-secondary mb-6">
          Thank you for joining. We're excited to help you track and journal your favorite shows and movies.
        </p>

        <div className="text-left space-y-4 mb-8 bg-bg-secondary p-4 rounded-lg">
            <div className="text-left space-y-2 mb-6">
                <label htmlFor="timezone-select" className="block text-sm font-medium text-text-secondary">
                    To ensure dates are accurate, please select your timezone:
                </label>
                <select
                    id="timezone-select"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    className="w-full p-2 bg-bg-primary text-text-primary rounded-md border border-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
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
                    <p className="text-sm text-text-secondary">Check out the "Recs" tab for personalized recommendations based on your taste.</p>
                </div>
            </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;