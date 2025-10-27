import React, { useState, useEffect } from 'react';
import { LiveWatchMediaInfo } from '../types';
import LiveWatchControls from './LiveWatchControls';
import { FilmIcon, ChevronDownIcon } from './Icons';

interface LiveWatchTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaInfo: LiveWatchMediaInfo | null;
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  isMinimized: boolean;
}

const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const parts: string[] = [];
    if (hours > 0) parts.push(String(hours).padStart(2, '0'));
    parts.push(String(minutes).padStart(2, '0'));
    parts.push(String(seconds).padStart(2, '0'));
    return parts.join(':');
};

const LiveWatchTracker: React.FC<LiveWatchTrackerProps> = ({
  isOpen, onClose, mediaInfo, elapsedSeconds, isPaused, onTogglePause, isMinimized
}) => {
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);

  useEffect(() => {
    if (!isMinimized) {
        setIsManuallyExpanded(false);
    }
  }, [isMinimized]);

  const handleStop = () => {
      setIsManuallyExpanded(false);
      onClose();
  };

  if (!isOpen || !mediaInfo) return null;

  const shouldDisplayMinimized = isMinimized && !isManuallyExpanded;

  if (shouldDisplayMinimized) {
    return (
        <div 
            className="fixed bottom-20 sm:bottom-4 right-4 z-50 bg-card-gradient rounded-lg shadow-2xl w-64 p-3 cursor-pointer hover:scale-105 transition-transform animate-fade-in"
            onClick={() => setIsManuallyExpanded(true)}
        >
            <div className="flex items-center space-x-3">
                <FilmIcon className="w-6 h-6 text-primary-accent flex-shrink-0"/>
                <div className="min-w-0">
                    <p className="text-xs text-text-secondary">Watching:</p>
                    <p className="text-sm font-semibold text-text-primary truncate">{mediaInfo.title}</p>
                    <p className="text-xs text-text-secondary">{formatTime(elapsedSeconds)} / {formatTime(mediaInfo.runtime * 60)}</p>
                </div>
            </div>
        </div>
    );
  }

  // Maximized view
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pointer-events-none flex justify-center">
        <div className="w-full max-w-lg pointer-events-auto relative">
            {isMinimized && ( // Show minimize button only when it was manually expanded from a bubble
                 <button 
                    onClick={() => setIsManuallyExpanded(false)}
                    className="absolute -top-10 right-0 p-2 bg-backdrop rounded-full text-white pointer-events-auto"
                    aria-label="Minimize live tracker"
                >
                    <ChevronDownIcon className="w-5 h-5" />
                </button>
            )}
            <LiveWatchControls
                mediaInfo={mediaInfo}
                elapsedSeconds={elapsedSeconds}
                isPaused={isPaused}
                onTogglePause={onTogglePause}
                onStop={handleStop}
                isDashboardWidget={false}
            />
        </div>
    </div>
  );
};

export default LiveWatchTracker;