import React, { useState, useEffect, useMemo } from 'react';
import { Follows, FriendActivity, PublicUser, UserData, PrivacySettings, HistoryItem, CustomList, UserRatings, Activity, ActivityType, TrackedItem } from '../types';
import { getAllUsers } from '../utils/userUtils';
import { PLACEHOLDER_PROFILE } from '../constants';
import { getImageUrl } from '../utils/imageUtils';
import { formatTimeFromDate, formatDate } from '../utils/formatUtils';
import { StarIcon, TvIcon, FilmIcon, ListBulletIcon } from '../components/Icons';

interface ActivityScreenProps {
    currentUser: { id: string; username: string } | null;
    follows: Follows;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onSelectUser: (userId: string) => void;
}

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    return `${Math.floor(interval)}m`;
};

const ActivityCard: React.FC<{ activity: Activity; onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void; }> = ({ activity, onSelectShow }) => {
    let actionText = '';
    let icon: React.ReactNode = null;
    
    switch (activity.type) {
        case 'WATCHED_EPISODE':
            actionText = 'watched';
            icon = <TvIcon className="w-4 h-4 text-red-400" />;
            break;
        case 'WATCHED_MOVIE':
            actionText = 'watched';
            icon = <FilmIcon className="w-4 h-4 text-blue-400" />;
            break;
        case 'RATED_ITEM':
            actionText = `rated`;
            icon = <StarIcon className="w-4 h-4 text-yellow-400" />;
            break;
        case 'CREATED_LIST':
            actionText = 'created a list';
            icon = <ListBulletIcon className="w-4 h-4 text-green-400" />;
            break;
    }

    return (
        <div className="bg-bg-secondary/50 p-3 rounded-lg flex space-x-3">
            <div className="flex-shrink-0">
                <img src={getImageUrl(activity.media?.poster_path, 'w92')} alt="" className="w-12 h-18 object-cover rounded-md bg-bg-secondary"/>
            </div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center space-x-1.5 text-sm">
                    {icon}
                    <p className="text-text-secondary truncate">
                        <span className="font-semibold text-text-primary">{activity.user.username}</span> {actionText}
                    </p>
                </div>
                <p 
                    className="font-semibold text-text-primary truncate mt-1 cursor-pointer hover:underline"
                    onClick={() => activity.media && onSelectShow(activity.media.id, activity.media.media_type)}
                >
                    {activity.media?.title || activity.listName}
                </p>
                <div className="text-xs text-text-secondary truncate">
                    {activity.type === 'WATCHED_EPISODE' && activity.episodeInfo}
                    {activity.type === 'RATED_ITEM' && `with ${activity.rating} stars`}
                </div>
                <p className="text-xs text-text-secondary/70 mt-1">{formatTimeAgo(activity.timestamp)}</p>
            </div>
        </div>
    );
};

const ActivityScreen: React.FC<ActivityScreenProps> = ({ currentUser, follows, onSelectShow, onSelectUser }) => {
    const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');

    useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const followedIds = follows[currentUser.id] || [];
        if (followedIds.length === 0) {
            setLoading(false);
            return;
        }

        const allUsers = getAllUsers();
        const userMap = new Map(allUsers.map(u => [u.id, u.username]));
        
        const activityPromises = followedIds.map(async (id) => {
            const privacySettingsJson = localStorage.getItem(`privacy_settings_${id}`);
            const privacySettings: PrivacySettings = privacySettingsJson ? JSON.parse(privacySettingsJson) : { activityVisibility: 'followers' };
            if (privacySettings.activityVisibility === 'private') return null;
            
            // Get user's full library to map IDs to titles for ratings
            const allLists = ['watching', 'planToWatch', 'completed', 'onHold', 'dropped', 'favorites'];
            const userMediaMap = new Map<number, TrackedItem>();
            allLists.forEach(listKey => {
                const listJson = localStorage.getItem(`${listKey}_list_${id}`);
                if (listJson) {
                    const listItems: TrackedItem[] = JSON.parse(listJson);
                    listItems.forEach(item => {
                        if (!userMediaMap.has(item.id)) userMediaMap.set(item.id, item);
                    });
                }
            });

            const userActivities: Activity[] = [];
            const profilePicJson = localStorage.getItem(`profilePictureUrl_${id}`);
            const profilePictureUrl = profilePicJson ? JSON.parse(profilePicJson) : null;
            const user: PublicUser = {
                id,
                username: userMap.get(id) || 'Unknown',
                profilePictureUrl
            };

            // Process History
            const historyJson = localStorage.getItem(`history_${id}`);
            if (historyJson) {
                const history: HistoryItem[] = JSON.parse(historyJson);
                history.forEach(h => {
                    userActivities.push({
                        user, timestamp: h.timestamp, type: h.media_type === 'tv' ? 'WATCHED_EPISODE' : 'WATCHED_MOVIE',
                        media: { id: h.id, title: h.title, poster_path: h.poster_path, media_type: h.media_type, genre_ids: [] },
                        episodeInfo: h.media_type === 'tv' ? `S${h.seasonNumber} E${h.episodeNumber}` : undefined
                    });
                });
            }
            
            // Process Ratings
            const ratingsJson = localStorage.getItem(`user_ratings_${id}`);
            if (ratingsJson) {
                const ratings: UserRatings = JSON.parse(ratingsJson);
                Object.entries(ratings).forEach(([mediaId, ratingInfo]) => {
                    const media = userMediaMap.get(Number(mediaId));
                    if(media) {
                        userActivities.push({
                            user, timestamp: ratingInfo.date, type: 'RATED_ITEM',
                            media, rating: ratingInfo.rating
                        });
                    }
                });
            }
            
            // Process List Creations
            const listsJson = localStorage.getItem(`custom_lists_${id}`);
            if (listsJson) {
                const lists: CustomList[] = JSON.parse(listsJson);
                lists.forEach(l => {
                    if (l.isPublic) {
                        userActivities.push({
                            user, timestamp: l.createdAt, type: 'CREATED_LIST',
                            listName: l.name, media: l.items[0] // Use first item for poster
                        });
                    }
                });
            }

            userActivities.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return { user, activities: userActivities };
        });

        Promise.all(activityPromises).then(results => {
            setFriendsActivity(results.filter((r): r is FriendActivity => r !== null));
            setLoading(false);
        });

    }, [currentUser, follows]);

    const filteredActivities = useMemo(() => {
        if (filter === 'ALL') return friendsActivity;
        return friendsActivity.map(friend => ({
            ...friend,
            activities: friend.activities.filter(act => {
                if(filter === 'WATCHED_EPISODE') return act.type === 'WATCHED_EPISODE';
                if(filter === 'WATCHED_MOVIE') return act.type === 'WATCHED_MOVIE';
                return act.type === filter;
            })
        })).filter(friend => friend.activities.length > 0);
    }, [friendsActivity, filter]);

    if (loading) return <div className="text-center p-8">Loading activity feed...</div>;

    if (!currentUser || (follows[currentUser.id] || []).length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <h2 className="text-xl font-bold">Find Your Friends</h2>
                <p className="mt-2 text-text-secondary max-w-sm mx-auto">
                    Follow other users to see what they've been watching, rating, and adding to their lists right here.
                </p>
            </div>
        );
    }
    
    if (filteredActivities.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <h2 className="text-xl font-bold">No Recent Activity</h2>
                <p className="mt-2 text-text-secondary max-w-sm mx-auto">
                    Your friends haven't had any recent activity matching your filters.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Friend Activity</h1>
                <p className="text-text-secondary mt-1">See what people you follow have been up to.</p>
            </header>
            
            <div className="space-y-6">
                {filteredActivities.map(({ user, activities }) => (
                    <div key={user.id}>
                        <div 
                            className="flex items-center space-x-3 mb-3 cursor-pointer group"
                            onClick={() => onSelectUser(user.id)}
                        >
                            <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-bg-secondary" />
                            <h4 className="font-semibold text-lg text-text-primary group-hover:underline">{user.username}</h4>
                        </div>
                        <div className="space-y-2">
                           {activities.slice(0, 5).map(activity => (
                               <ActivityCard key={`${activity.timestamp}-${activity.type}-${activity.media?.id || activity.listName}`} activity={activity} onSelectShow={onSelectShow}/>
                           ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityScreen;