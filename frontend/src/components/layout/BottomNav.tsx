import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map as MapIcon, FileText, Bot } from 'lucide-react';

interface BottomNavProps {
  isHidden?: boolean;
}

export function BottomNav({ isHidden }: BottomNavProps) {
  const location = useLocation();

  if (isHidden) return null;

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Report', path: '/report', icon: AlertTriangle, isCenter: true },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'AI', path: '/assistant', icon: Bot },
  ];

  return (
    <div className="lg:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-4 sm:right-4 z-50 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="bg-[#161A20]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-[24px] shadow-2xl px-2 py-1.5 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (item.isCenter) {
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="relative -top-5 bg-[#FFC629] text-[#0E1013] w-12 h-12 rounded-full shadow-[0_4px_14px_rgba(255,198,41,0.3)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center shrink-0"
                aria-label={item.name}
              >
                <item.icon className="w-6 h-6 stroke-[2.5]" />
              </Link>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] px-1 py-1 rounded-xl transition-colors ${
                isActive ? 'text-[#FFC629]' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
              aria-label={item.name}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
