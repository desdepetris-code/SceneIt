import React from 'react';
import { LiveWatchMediaInfo } from '../types';
import LiveWatchControls from './LiveWatchControls';

interface LiveWatchTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaInfo: LiveWatchMediaInfo | null;
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
}

const LiveWatchTracker: React.FC<LiveWatchTrackerProps> = ({
  isOpen,
  onClose,
  mediaInfo,
  elapsedSeconds,
  isPaused,
  onTogglePause
}) => {
  if (!isOpen || !mediaInfo) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end justify-center z-50 p-4 pointer-events-none">
        <div className="w-full max-w-lg pointer-events-auto">
            <LiveWatchControls
                mediaInfo={mediaInfo}
                elapsedSeconds={elapsedSeconds}
                isPaused={isPaused}
                onTogglePause={onTogglePause}
                onStop={onClose}
                isDashboardWidget={false}
            />
        </div>
    </div>
  );
};

export default LiveWatchTracker;