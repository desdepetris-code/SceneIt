
import React from 'react';
import { AppNotification } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { XMarkIcon } from './Icons';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
  onSelectUser: (userId: string) => void;
}

const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    return `${Math.floor(interval)}m ago`;
};

const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, notifications, onMarkAllRead, onMarkOneRead, onSelectShow, onSelectUser }) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        <header className="p-6 border-b border-white/10 flex justify-between items-center bg-card-gradient">
          <div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Notifications</h2>
            {unreadCount > 0 && (
              <button onClick={onMarkAllRead} className="text-xs font-bold text-primary-accent hover:underline uppercase tracking-widest mt-1">
                Mark all as read
              </button>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
        </header>

        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <p className="text-text-secondary font-bold">You're all caught up!</p>
            </div>
          ) : (
            notifications.map(notification => {
              let onClickAction = () => {};
              if (notification.type === 'new_follower' && notification.followerInfo?.userId) {
                  onClickAction = () => onSelectUser(notification.followerInfo.userId);
              } else if (notification.type === 'list_like' && notification.likerInfo?.userId) {
                  onClickAction = () => onSelectUser(notification.likerInfo.userId);
              } else if (notification.mediaId && notification.mediaType) {
                  onClickAction = () => onSelectShow(notification.mediaId, notification.mediaType);
              }

              const finalOnClick = () => {
                  onMarkOneRead(notification.id);
                  onClickAction();
                  onClose();
              }

              return (
                <div
                  key={notification.id}
                  onClick={finalOnClick}
                  className={`flex items-start p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 border border-transparent ${
                    notification.read ? 'opacity-60' : 'bg-bg-secondary border-primary-accent/20'
                  }`}
                >
                  <img
                    src={getImageUrl(notification.poster_path, 'w92')}
                    alt=""
                    className="w-12 h-18 rounded-lg mr-4 object-cover flex-shrink-0 bg-bg-secondary shadow-md"
                  />
                  <div className="flex-grow min-w-0">
                    <p className="font-bold text-text-primary text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">{notification.description}</p>
                    <p className="text-[10px] font-bold text-text-secondary/50 mt-1 uppercase tracking-tighter">{formatTimeAgo(notification.timestamp)}</p>
                  </div>
                  {!notification.read && (
                    <div className="w-2.5 h-2.5 bg-primary-accent rounded-full self-center ml-3 shadow-[0_0_8px_var(--color-accent-primary)] flex-shrink-0"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
