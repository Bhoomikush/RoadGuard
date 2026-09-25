import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  LayoutDashboard, 
  AlertTriangle, 
  Map as MapIcon, 
  FileText, 
  Activity, 
  Bot, 
  Settings, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Report Hazard', path: '/report', icon: AlertTriangle },
    { name: 'Live Map', path: '/map', icon: MapIcon },
    { name: 'My Reports', path: '/reports', icon: FileText },
    { name: 'Risk Zones', path: '/risk-zones', icon: Activity },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials = getInitials(user?.user_metadata?.name, user?.email || '');

  return (
    <aside className="w-64 bg-[#0E1013] border-r border-[rgba(255,255,255,0.08)] flex flex-col h-screen sticky top-0 font-['Inter']">
      <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.08)]">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-[#FFC629]" />
          <span className="text-xl font-bold text-[#F3F4F6] tracking-tight font-['Sora',sans-serif]">RoadGuard</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center px-3 py-3 rounded-lg text-[15px] font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#FFC629]/10 text-[#FFC629]' 
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FFC629] rounded-r-full" />
                )}
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#FFC629]' : 'text-[#9CA3AF]'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
        <div className="space-y-1 mb-4">
          <Link to="/settings" className="flex items-center px-3 py-3 rounded-lg text-sm font-medium text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors">
            <Settings className="w-5 h-5 mr-3 text-[#9CA3AF]" />
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium text-[#9CA3AF] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
        <div className="flex items-center p-3 bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)]">
          <div className="w-10 h-10 rounded-full bg-[#FFC629] flex items-center justify-center mr-3 shrink-0">
            <span className="text-sm font-bold text-[#0E1013]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F3F4F6] truncate">
              {displayName}
            </p>
            <p className="text-xs text-[#9CA3AF] truncate">{displayEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

