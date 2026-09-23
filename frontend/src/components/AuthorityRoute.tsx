import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

interface AuthorityRouteProps {
  children: React.ReactNode;
}

export const AuthorityRoute = ({ children }: AuthorityRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Shield className="w-12 h-12 text-teal-500 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'authority') {
    // Redirect standard users back to the main dashboard safely
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
