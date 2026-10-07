import { Bell, Check, Clock } from 'lucide-react';
import type { Notification } from '../../types';

interface NotificationsListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationsList({ notifications, loading, onMarkAsRead, onMarkAllAsRead }: NotificationsListProps) {
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col h-full bg-[#161A20] rounded-[16px] overflow-hidden border border-[rgba(255,255,255,0.08)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)] bg-[#0E1013]/50">
        <h3 className="text-[#F3F4F6] font-semibold text-sm">Notifications</h3>
        {unreadCount > 0 && (
          <button 
            onClick={onMarkAllAsRead}
            className="text-xs text-[#FFC629] hover:text-[#EAB308] font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto max-h-[350px]">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-5 h-5 border-2 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="flex flex-col divide-y divide-[rgba(255,255,255,0.04)]">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
                className={`flex gap-3 p-4 transition-colors cursor-pointer ${
                  notification.is_read 
                    ? 'hover:bg-[rgba(255,255,255,0.02)] opacity-70' 
                    : 'bg-[#FFC629]/5 hover:bg-[#FFC629]/10'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.is_read ? 'bg-[rgba(255,255,255,0.05)] text-[#9CA3AF]' : 'bg-[#FFC629]/10 text-[#FFC629]'
                  }`}>
                    {notification.is_read ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className={`text-sm truncate ${notification.is_read ? 'text-[#D1D5DB]' : 'text-[#F3F4F6] font-semibold'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-[10px] text-[#9CA3AF] shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className={`text-xs ${notification.is_read ? 'text-[#9CA3AF]' : 'text-[#D1D5DB]'}`}>
                    {notification.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
              <Bell className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <p className="text-[#9CA3AF] text-sm">You have no notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
