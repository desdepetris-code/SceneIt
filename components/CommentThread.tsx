import React, { useMemo } from 'react';
import { Comment, PublicUser } from '../types';
import CommentCard from './CommentCard';

interface CommentThreadProps {
    allComments: Comment[];
    threadKey: string;
    sortBy: 'newest' | 'oldest' | 'most_liked';
    currentUser: { id: string; username: string; email: string; } | null;
    onSaveComment: (commentData: { mediaKey: string; text: string; parentId: string | null; isSpoiler: boolean; }) => void;
    onToggleLikeComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
    parentId?: string | null;
    isNested?: boolean;
}

const CommentThread: React.FC<CommentThreadProps> = (props) => {
    const { allComments, threadKey, sortBy, parentId = null } = props;

    const threadComments = useMemo(() => {
        const commentsInThread = allComments.filter(c => c.mediaKey === threadKey);
        const commentsByParent: Record<string, Comment[]> = { 'root': [] };

        commentsInThread.forEach(c => {
            const pId = c.parentId || 'root';
            if (!commentsByParent[pId]) commentsByParent[pId] = [];
            commentsByParent[pId].push(c);
        });

        const sortFunc = (a: Comment, b: Comment) => {
            if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            if (sortBy === 'most_liked') {
                const likeDiff = b.likes.length - a.likes.length;
                if (likeDiff !== 0) return likeDiff;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Newest first for ties
            }
            return 0;
        };

        Object.values(commentsByParent).forEach(arr => arr.sort(sortFunc));
        
        return {
            rootComments: commentsByParent['root'] || [],
            repliesMap: commentsByParent,
        };

    }, [allComments, threadKey, sortBy]);

    if (threadComments.rootComments.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-text-secondary">No comments yet. Be the first to start the discussion!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {threadComments.rootComments.map(comment => (
                <CommentCard
                    key={comment.id}
                    comment={comment}
                    replies={threadComments.repliesMap[comment.id] || []}
                    repliesMap={threadComments.repliesMap}
                    {...props}
                />
            ))}
        </div>
    );
};

export default CommentThread;