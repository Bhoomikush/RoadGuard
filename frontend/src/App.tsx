import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthorityRoute } from './components/AuthorityRoute';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { Shield } from 'lucide-react';

const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ReportPage = React.lazy(() => import('./pages/ReportPage').then(m => ({ default: m.ReportPage })));
const MapPage = React.lazy(() => import('./pages/MapPage').then(m => ({ default: m.MapPage })));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const RiskZonesPage = React.lazy(() => import('./pages/RiskZonesPage').then(m => ({ default: m.RiskZonesPage })));
const AssistantPage = React.lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })));
const CommunityFeedPage = React.lazy(() => import('./pages/CommunityFeedPage').then(m => ({ default: m.CommunityFeedPage })));
const AuthorityDashboard = React.lazy(() => import('./pages/AuthorityDashboard').then(m => ({ default: m.AuthorityDashboard })));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VoiceComplaintPage = React.lazy(() => import('./pages/VoiceComplaintPage').then(m => ({ default: m.VoiceComplaintPage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const LoadingFallback = () => (
  <div className="min-h-screen bg-[#0E1013] flex items-center justify-center">
    <Shield className="w-12 h-12 text-[#FFC629] animate-pulse" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
            <Route path="/voice-complaint" element={<ProtectedRoute><VoiceComplaintPage /></ProtectedRoute>} />
            <Route path="/report/voice" element={<ProtectedRoute><VoiceComplaintPage /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/risk-zones" element={<ProtectedRoute><RiskZonesPage /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/feed" element={<ProtectedRoute><CommunityFeedPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/authority-dashboard" element={<AuthorityRoute><AuthorityDashboard /></AuthorityRoute>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
