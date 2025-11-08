import React, { useState } from 'react';
import { Comment, PublicUser } from '../types';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, TrashIcon, EllipsisVerticalIcon } from './Icons';
import { PLACEHOLDER_PROFILE } from '../constants';
import ReportCommentModal from './ReportCommentModal';

interface CommentCardProps {
    comment: Comment;
    replies: Comment[];
    repliesMap: Record<string, Comment[]>;
    currentUser: { id: string; username: string; email: string; } | null;
    onSaveComment: (commentData: { mediaKey: string; text: string; parentId: string | null; isSpoiler: boolean; }) => void;
    onToggleLikeComment: (commentId: string) => void;
    onDeleteComment: (commentId: string) => void;
    isNested?: boolean;
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


const CommentForm: React.FC<{
    onSubmit: (text: string, isSpoiler: boolean) => void;
    buttonText?: string;
    onCancel?: () => void;
    isNested?: boolean;
}> = ({ onSubmit, buttonText = "Reply", onCancel, isNested }) => {
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
        <form onSubmit={handleSubmit} className={`mt-2 ${isNested ? 'ml-4 pl-4 border-l-2 border-bg-secondary' : ''}`}>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full h-20 p-2 bg-bg-primary rounded-md text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                required
            />
            <div className="flex justify-between items-center mt-2">
                <label className="flex items-center text-xs text-text-secondary cursor-pointer">
                    <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)} className="h-3 w-3 rounded border-bg-secondary text-primary-accent focus:ring-primary-accent" />
                    <span className="ml-2">Spoiler</span>
                </label>
                <div className="space-x-2">
                    {onCancel && <button type="button" onClick={onCancel} className="px-3 py-1 text-xs rounded-md text-text-primary hover:bg-bg-secondary">Cancel</button>}
                    <button type="submit" className="px-3 py-1 text-xs font-semibold rounded-md bg-accent-gradient text-on-accent hover:opacity-90">{buttonText}</button>
                </div>
            </div>
        </form>
    );
};

const CommentCard: React.FC<CommentCardProps> = (props) => {
    const { comment, replies, repliesMap, currentUser, onSaveComment, onToggleLikeComment, onDeleteComment, isNested } = props;
    const [isReplying, setIsReplying] = useState(false);
    const [isSpoilerVisible, setIsSpoilerVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const hasLiked = currentUser ? comment.likes.includes(currentUser.id) : false;
    const isOwner = currentUser ? currentUser.id === comment.user.id : false;

    const handleReply = (text: string, isSpoiler: boolean) => {
        onSaveComment({ mediaKey: comment.mediaKey, text, parentId: comment.id, isSpoiler });
        setIsReplying(false);
    };
    
    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this comment? This will also delete all replies.")) {
            onDeleteComment(comment.id);
        }
    };
    
    const handleReport = (reason: string, comments: string) => {
        const subject = `Report Comment ID: ${comment.id}`;
        const body = `Report submitted by: ${currentUser?.username || 'N/A'} (ID: ${currentUser?.id || 'N/A'})\n\nReported User: ${comment.user.username} (ID: ${comment.user.id})\n\nReason: ${reason}\n\nComment Text: "${comment.text}"\n\nAdditional Comments:\n${comments}`;
        window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <>
            <ReportCommentModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportedUsername={comment.user.username} onReport={handleReport} />
            <div className={`bg-bg-secondary/30 rounded-lg p-3 ${isNested ? 'ml-4 pl-4 border-l-2 border-bg-secondary' : ''}`}>
                <div className="flex items-start space-x-3">
                    <img src={comment.user.profilePictureUrl || PLACEHOLDER_PROFILE} alt={comment.user.username} className="w-8 h-8 rounded-full bg-bg-secondary flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-semibold text-sm text-text-primary">{comment.user.username}</span>
                                <span className="text-xs text-text-secondary/80 ml-2">{formatTimeAgo(comment.timestamp)}</span>
                            </div>
                            <div className="relative">
                                <button onClick={() => setIsMenuOpen(p => !p)} onBlur={() => setTimeout(() => setIsMenuOpen(false), 200)} className="p-1 rounded-full text-text-secondary hover:bg-bg-secondary">
                                    <EllipsisVerticalIcon className="w-4 h-4" />
                                </button>
                                {isMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-bg-primary border border-bg-secondary rounded-md shadow-lg z-10">
                                        {isOwner && <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10">Delete</button>}
                                        <button onClick={() => setIsReportModalOpen(true)} className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-secondary">Report</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {comment.isSpoiler && !isSpoilerVisible ? (
                            <button onClick={() => setIsSpoilerVisible(true)} className="mt-1 text-sm text-text-primary bg-bg-secondary px-3 py-1 rounded-md hover:brightness-125">
                                Reveal Spoiler
                            </button>
                        ) : (
                            <p className="text-sm text-text-primary mt-1 whitespace-pre-wrap">{comment.text}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-2">
                            <button onClick={() => onToggleLikeComment(comment.id)} disabled={!currentUser} className={`flex items-center space-x-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${hasLiked ? 'text-primary-accent' : 'text-text-secondary hover:text-primary-accent'}`}>
                                <HeartIcon filled={hasLiked} className="w-4 h-4" />
                                <span>{comment.likes.length > 0 ? comment.likes.length : ''}</span>
                            </button>
                            <button onClick={() => setIsReplying(p => !p)} disabled={!currentUser} className="flex items-center space-x-1.5 text-xs font-semibold text-text-secondary hover:text-primary-accent disabled:cursor-not-allowed">
                                <ChatBubbleOvalLeftEllipsisIcon className="w-4 h-4" />
                                <span>Reply</span>
                            </button>
                        </div>

                        {isReplying && <CommentForm onSubmit={handleReply} onCancel={() => setIsReplying(false)} isNested />}
                        
                        {replies.length > 0 && (
                            <div className="mt-3 space-y-3">
                                {replies.map(reply => (
                                    <CommentCard
                                        key={reply.id}
                                        comment={reply}
                                        replies={repliesMap[reply.id] || []}
                                        {...props}
                                        isNested
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommentCard;