import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, Comment, PublicUser, TmdbSeasonDetails } from '../types';
import CommentThread from './CommentThread';
import { ChevronDownIcon } from './Icons';

interface CommentsTabProps {
    details: TmdbMediaDetails;
    comments: Comment[];
    currentUser: { id: string; username: string; email: string; } | null;
    allUsers: PublicUser[];
    seasonDetailsMap: Record<number, TmdbSeasonDetails>;
    onFetchSeasonDetails: (seasonNumber: number) => void;
    onSaveComment: (commentData: { mediaKey: string; text: string; parentId: string | null; isSpoiler: boolean; }) => void;
    onToggleLikeComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
    activeThread: string;
    setActiveThread: (key: string) => void;
}

const CommentForm: React.FC<{
    onSubmit: (text: string, isSpoiler: boolean) => void;
    buttonText?: string;
    onCancel?: () => void;
}> = ({ onSubmit, buttonText = "Post Comment", onCancel }) => {
    const [text, setText] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSubmit(text, isSpoiler);
        setText('');
        setIsSpoiler(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-bg-secondary/50 p-4 rounded-lg">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Join the discussion..."
                className="w-full h-24 p-2 bg-bg-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                required
            />
            <div className="flex justify-between items-center mt-2">
                <label className="flex items-center text-sm text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} className="h-4 w-4 rounded border-bg-secondary text-primary-accent focus:ring-primary-accent" />
                    <span className="ml-2">Mark as spoiler</span>
                </label>
                <div className="space-x-2">
                    {onCancel && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-md text-text-primary hover:bg-bg-secondary">Cancel</button>}
                    <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-md bg-accent-gradient text-on-accent hover:opacity-90">{buttonText}</button>
                </div>
            </div>
        </form>
    );
};


const CommentsTab: React.FC<CommentsTabProps> = (props) => {
    const { details, onFetchSeasonDetails, seasonDetailsMap, activeThread, setActiveThread, currentUser } = props;
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');

    const handlePostComment = (text: string, isSpoiler: boolean) => {
        const mediaKey = activeThread === 'general' ? `${details.media_type}-${details.id}` : activeThread;
        props.onSaveComment({ mediaKey, text, parentId: null, isSpoiler });
    };

    const threadOptions = useMemo(() => {
        const options: { key: string; label: string; group: string }[] = [{ key: 'general', label: 'General Discussion', group: 'Main' }];
        if (details.media_type === 'tv' && details.seasons) {
            details.seasons.forEach(season => {
                if (season.season_number > 0) {
                    options.push({
                        key: `s${season.season_number}`,
                        label: season.name,
                        group: `Season ${season.season_number}`,
                    });
                }
            });
        }
        return options;
    }, [details]);
    
    const handleThreadChange = (key: string) => {
        if (key.startsWith('s')) {
            const seasonNum = parseInt(key.replace('s', ''));
            if (!seasonDetailsMap[seasonNum]) {
                onFetchSeasonDetails(seasonNum);
            }
        }
        setActiveThread(key === `s${details.last_episode_to_air?.season_number}` ? `tv-${details.id}-s${details.last_episode_to_air?.season_number}-e${details.last_episode_to_air?.episode_number}` : key);
    }
    
    const isEpisodeThread = activeThread.startsWith('tv-') && activeThread.includes('-e');

    const selectedGroup = useMemo(() => {
        if (isEpisodeThread) {
             const parts = activeThread.split('-');
             const seasonNum = parts[2].replace('s', '');
             return `s${seasonNum}`;
        }
        return activeThread;
    }, [activeThread, isEpisodeThread]);
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                     <select
                        value={selectedGroup}
                        onChange={(e) => handleThreadChange(e.target.value)}
                        className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    >
                       {threadOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                </div>
                {selectedGroup.startsWith('s') && (
                    <div className="relative flex-1">
                        <select
                            value={activeThread}
                            onChange={(e) => setActiveThread(e.target.value)}
                            className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                        >
                            {!seasonDetailsMap[parseInt(selectedGroup.replace('s', ''))] ? (
                                <option>Loading episodes...</option>
                            ) : (
                                seasonDetailsMap[parseInt(selectedGroup.replace('s', ''))].episodes.map(ep => (
                                    <option key={ep.id} value={`tv-${details.id}-s${ep.season_number}-e${ep.episode_number}`}>
                                        E{ep.episode_number}: {ep.name}
                                    </option>
                                ))
                            )}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                    </div>
                )}
                 <div className="relative">
                     <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="most_liked">Top</option>
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                </div>
            </div>

            {currentUser ? (
                <CommentForm onSubmit={handlePostComment} />
            ) : (
                <div className="text-center p-4 bg-bg-secondary/50 rounded-lg">
                    <p className="text-text-secondary">You must be logged in to comment.</p>
                </div>
            )}
            
            <CommentThread
                allComments={props.comments}
                threadKey={activeThread === 'general' ? `${details.media_type}-${details.id}` : activeThread}
                sortBy={sortBy}
                currentUser={currentUser}
                onSaveComment={props.onSaveComment}
                onToggleLikeComment={props.onToggleLikeComment}
                onDeleteComment={props.onDeleteComment}
            />
        </div>
    );
};

export default CommentsTab;