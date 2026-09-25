import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, Map as MapIcon, FileText, Bot } from 'lucide-react';

export function BottomNav() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Map', path: '/map', icon: MapIcon },
    { name: 'Report', path: '/report', icon: AlertTriangle, isCenter: true },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'AI', path: '/assistant', icon: Bot },
  ];

  return (
    <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
      <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] shadow-xl px-2 py-2 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          if (item.isCenter) {
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className="relative -top-6 bg-[#FFC629] text-[#0E1013] p-4 rounded-full shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform"
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
              className={`flex flex-col items-center justify-center w-[48px] h-[48px] rounded-xl transition-colors ${
                isActive ? 'text-[#FFC629]' : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
              aria-label={item.name}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
