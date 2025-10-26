import React from 'react';
import { LiveWatchMediaInfo } from '../types';
import { PlayIcon, PauseIcon, StopIcon } from './Icons';

interface LiveWatchControlsProps {
  mediaInfo: LiveWatchMediaInfo;
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  isDashboardWidget?: boolean; // To add a title for the dashboard version
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

const LiveWatchControls: React.FC<LiveWatchControlsProps> = ({ mediaInfo, elapsedSeconds, isPaused, onTogglePause, onStop, isDashboardWidget }) => {
  const runtimeInSeconds = mediaInfo.runtime * 60;
  const progress = runtimeInSeconds > 0 ? Math.min((elapsedSeconds / runtimeInSeconds) * 100, 100) : 0;

  return (
    <div className="bg-card-gradient rounded-lg shadow-xl w-full p-6">
        {isDashboardWidget && <h2 className="text-2xl font-bold text-text-primary mb-4">▶️ Live Watch</h2>}
        <div className="text-center">
            {!isDashboardWidget && <p className="text-sm text-text-secondary">Now Watching</p>}
            <h3 className="text-lg font-bold text-text-primary truncate">{mediaInfo.title}</h3>
            {mediaInfo.media_type === 'tv' && (
                <p className="text-sm text-text-secondary truncate">
                    S{mediaInfo.seasonNumber} E{mediaInfo.episodeNumber}: {mediaInfo.episodeTitle}
                </p>
            )}
        </div>
        
        <div className="my-6">
            <div className="flex justify-between text-sm text-text-secondary">
                <span>{formatTime(elapsedSeconds)}</span>
                <span>{formatTime(runtimeInSeconds)}</span>
            </div>
             <div className="w-full bg-bg-secondary rounded-full h-2 mt-1">
                <div className="bg-accent-gradient h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>

        <div className="flex justify-center items-center space-x-6">
            <button onClick={onStop} className="p-3 bg-bg-secondary rounded-full text-text-primary hover:bg-red-500/20 hover:text-red-400">
                <StopIcon className="w-6 h-6"/>
            </button>
             <button onClick={onTogglePause} className="p-5 bg-accent-gradient text-white rounded-full">
                {isPaused ? <PlayIcon className="w-8 h-8"/> : <PauseIcon className="w-8 h-8"/>}
            </button>
             <div className="w-12 h-12"></div>
        </div>
    </div>
  );
};

export default LiveWatchControls;
