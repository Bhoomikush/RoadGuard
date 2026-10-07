import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Menu } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationsList } from '../ui/NotificationsList';
import { BottomNav } from './BottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#0E1013] text-[#F3F4F6] font-['Inter']">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Header / Navigation for Notifications */}
        <div className="absolute lg:sticky top-0 left-0 right-0 z-20 w-full px-4 sm:px-8 py-4 flex justify-between items-center bg-[#0E1013]/90 backdrop-blur-sm lg:bg-transparent lg:justify-end">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-[#9CA3AF] hover:text-[#F3F4F6] focus:outline-none"
            aria-expanded={isSidebarOpen}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border border-[#161A20]" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 shadow-lg shadow-black/50 z-30">
                <NotificationsList 
                  notifications={notifications}
                  loading={loading}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-8 pb-24 lg:pb-8 pt-20 lg:pt-0 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <BottomNav isHidden={isSidebarOpen} />
    </div>
  );
}
