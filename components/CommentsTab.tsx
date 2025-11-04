import React from 'react';
import { Comment, PublicUser } from '../types';
import { PencilSquareIcon } from './Icons';
import { PLACEHOLDER_PROFILE } from '../constants';

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    let interval = seconds / 31536000; // years
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000; // months
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400; // days
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600; // hours
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60; // minutes
    return `${Math.floor(interval)}m ago`;
};

interface User {
  id: string;
  username: string;
  email: string;
}

interface CommentsTabProps {
    comments: Comment[];
    userMap: Map<string, PublicUser>;
    currentUser: User | null;
    onCommentAction: () => void;
}

const CommentsTab: React.FC<CommentsTabProps> = ({ comments, userMap, currentUser, onCommentAction }) => {
    const currentUserComment = currentUser ? comments.find(c => c.userId === currentUser.id) : null;
    const otherUserComments = comments.filter(c => c.userId !== currentUser?.id);

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h3 className="text-xl font-bold text-text-primary mb-3">Your Comment</h3>
                {currentUser ? (
                    currentUserComment ? (
                        <div className="bg-bg-secondary p-4 rounded-lg">
                            <p className="text-text-primary whitespace-pre-wrap">{currentUserComment.text}</p>
                            <div className="flex justify-end mt-2">
                                <button onClick={onCommentAction} className="text-sm font-semibold text-primary-accent hover:underline flex items-center space-x-1">
                                    <PencilSquareIcon className="w-4 h-4" />
                                    <span>Edit Comment</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={onCommentAction} className="w-full text-center p-4 rounded-lg bg-bg-secondary hover:brightness-125 transition-colors">
                            <span className="font-semibold text-text-primary">Add your comment...</span>
                        </button>
                    )
                ) : (
                    <button onClick={onCommentAction} className="w-full text-center p-4 rounded-lg bg-bg-secondary hover:brightness-125 transition-colors">
                        <span className="font-semibold text-text-primary">Log in to add a comment</span>
                    </button>
                )}
            </div>

            {otherUserComments.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-text-primary mb-3">Community Comments</h3>
                    <div className="space-y-4">
                        {otherUserComments.map(comment => {
                            const user = userMap.get(comment.userId);
                            if (!user) return null;
                            return (
                                <div key={comment.id} className="flex items-start space-x-4">
                                    <img src={user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={user.username} className="w-10 h-10 rounded-full object-cover bg-bg-secondary" />
                                    <div className="flex-grow bg-bg-secondary p-3 rounded-lg">
                                        <div className="flex justify-between items-baseline">
                                            <p className="font-semibold text-text-primary">{user.username}</p>
                                            <p className="text-xs text-text-secondary">{formatTimeAgo(comment.timestamp)}</p>
                                        </div>
                                        <p className="text-text-primary whitespace-pre-wrap mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
export default CommentsTab;