import React from 'react';
import { NewlyPopularEpisode } from '../types';
import FallbackImage from './FallbackImage';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_STILL } from '../constants';
import { formatDate } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { isNewRelease } from '../utils/formatUtils';

interface EpisodeCardProps {
    item: NewlyPopularEpisode;
    onSelectShow: (id: number, media_type: 'tv') => void;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ item, onSelectShow }) => {
    const { showInfo, episode } = item;

    const stillSrcs = [
        getImageUrl(episode.still_path, 'w500', 'still'),
        getImageUrl(showInfo.poster_path, 'w500', 'poster'),
    ];

    const isNew = isNewRelease(episode.air_date);

    return (
        <div 
            className="w-64 flex-shrink-0 cursor-pointer group"
            onClick={() => onSelectShow(showInfo.id, 'tv')}
        >
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                {isNew && <NewReleaseOverlay />}
                <div className="aspect-video">
                    <FallbackImage
                        srcs={stillSrcs}
                        placeholder={PLACEHOLDER_STILL}
                        alt={`Still from ${episode.name}`}
                        className="w-full h-full object-cover bg-bg-secondary transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
            <div className="mt-2">
                <p className="text-xs text-text-secondary">{showInfo.title}</p>
                <h4 className="font-semibold text-sm text-text-primary truncate">
                    S{episode.season_number} E{episode.episode_number}: {episode.name}
                </h4>
                <p className="text-xs text-text-secondary/80">{formatDate(episode.air_date, 'UTC')}</p>
            </div>
        </div>
    );
};

export default EpisodeCard;