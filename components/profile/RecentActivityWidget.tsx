
import React from 'react';
import { HistoryItem } from '../../types';
import { getImageUrl } from '../../utils/imageUtils';

interface RecentActivityWidgetProps {
    history: HistoryItem[];
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
}

const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({ history, onSelectShow }) => {
    const recentHistory = history.slice(0, 5);

    return (
        <div className="bg-card-gradient rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-text-primary p-4">Recent Activity</h3>
            {recentHistory.length > 0 ? (
                <div className="divide-y divide-bg-secondary">
                    {recentHistory.map(item => {
                        const imageToUse = item.episodeStillPath || item.seasonPosterPath || item.poster_path;
                        return (
                            <div 
                                key={item.timestamp} 
                                onClick={() => onSelectShow(item.id, item.media_type)}
                                className="flex items-center p-3 cursor-pointer hover:bg-bg-secondary/50"
                            >
                                <img src={getImageUrl(imageToUse, 'w92', item.episodeStillPath ? 'still' : 'poster')} alt={item.title} className="w-10 h-15 rounded-md flex-shrink-0 object-cover"/>
                                <div className="ml-4 flex-grow min-w-0">
                                    <p className="font-semibold text-text-primary truncate">{item.title}</p>
                                    <p className="text-sm text-text-secondary">
                                        {item.media_type === 'tv' ? `S${item.seasonNumber} E${item.episodeNumber}` : 'Movie'}
                                    </p>
                                </div>
                                <p className="text-sm text-text-secondary flex-shrink-0 ml-4">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="p-4 text-text-secondary">No watch history yet.</p>
            )}
        </div>
    );
};

export default RecentActivityWidget;
