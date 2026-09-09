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
  User,
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

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-teal-500" />
          <span className="text-xl font-bold text-slate-50 tracking-tight">RoadGuard</span>
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
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-teal-500/10 text-teal-400' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-teal-500' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="space-y-1">
          <Link to="/settings" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-100 transition-colors">
            <Settings className="w-5 h-5 mr-3 text-slate-500" />
            Settings
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
          <div className="flex items-center px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mr-3 shrink-0">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
