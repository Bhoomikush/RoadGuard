import { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Lock, 
  Save, 
  CheckCircle, 
  AlertTriangle,
  Smartphone
} from 'lucide-react';

export function SettingsPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  
  // Profile settings state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Notification settings state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [hazardUpdates, setHazardUpdates] = useState(true);
  const [communityDigest, setCommunityDigest] = useState(false);

  // Password reset state
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          phone: phone.trim()
        }
      });

      if (error) throw error;
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    setResetError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset link.');
    } finally {
      setResetLoading(false);
    }
  };

  const initials = (user?.user_metadata?.full_name || user?.email || 'RG')
    .slice(0, 2)
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-0 lg:left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-32">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">
            Account Settings
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Manage your personal profile, notifications, and security preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.08)] mb-8 max-w-md">
          {[
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'notifications', label: 'Alerts', icon: Bell },
            { id: 'security', label: 'Security', icon: Lock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#FFC629] text-[#0E1013] shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Account Card */}
            <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-[rgba(255,255,255,0.08)]">
                <div className="w-16 h-16 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-xl flex items-center justify-center shrink-0 shadow-lg">
                  {initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F3F4F6] font-['Sora',sans-serif]">
                    {user?.user_metadata?.full_name || 'RoadGuard Member'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#9CA3AF]">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFC629]/10 text-[#FFC629] border border-[#FFC629]/20 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {role === 'authority' ? 'Civic Authority' : 'Verified Citizen'}
                    </span>
                  </div>
                </div>
              </div>

              {profileSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-sm flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="mb-6 p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full h-12 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl pl-11 pr-4 text-sm text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:border-[#FFC629] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full h-12 bg-[#0E1013]/60 border border-[rgba(255,255,255,0.05)] rounded-xl pl-11 pr-4 text-sm text-[#9CA3AF] cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                    Your email is managed via your Supabase / Google OAuth identity.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-[#9CA3AF] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-12 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl pl-11 pr-4 text-sm text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:border-[#FFC629] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="h-11 px-6 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Save className="w-4 h-4" />
                    {profileSaving ? 'Saving Changes...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F3F4F6] font-['Sora',sans-serif] mb-1">
                Notification Preferences
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                Choose how RoadGuard alerts you regarding verified hazards and official complaint updates.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {[
                {
                  id: 'alerts',
                  title: 'High Risk Hazard Alerts',
                  desc: 'Get notified immediately when severe road hazards or potholes are detected near your location.',
                  state: emailAlerts,
                  setter: setEmailAlerts
                },
                {
                  id: 'updates',
                  title: 'Complaint Status Updates',
                  desc: 'Receive emails when civic authorities review or take action on your submitted reports.',
                  state: hazardUpdates,
                  setter: setHazardUpdates
                },
                {
                  id: 'digest',
                  title: 'Weekly Community Road Safety Digest',
                  desc: 'A weekly summary of repaired roads, active hot-zones, and community statistics in your district.',
                  state: communityDigest,
                  setter: setCommunityDigest
                }
              ].map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.05)]">
                  <div className="pr-4">
                    <h4 className="text-sm font-semibold text-[#F3F4F6]">{item.title}</h4>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setter(!item.state)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                      item.state ? 'bg-[#FFC629]' : 'bg-[#161A20] border border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        item.state ? 'translate-x-7 bg-[#0E1013]' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#F3F4F6] font-['Sora',sans-serif] mb-1">
                Security & Authentication
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF]">
                Manage your login methods and security credentials.
              </p>
            </div>

            <div className="p-4 bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.05)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-[#F3F4F6]">Reset Account Password</h4>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">
                    We will send a secure password reset link to your registered email ({user?.email}).
                  </p>
                </div>
              </div>

              {resetSent && (
                <div className="p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg text-[#10B981] text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Password reset link sent! Please check your inbox.
                </div>
              )}

              {resetError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-[#EF4444] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {resetError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendPasswordReset}
                disabled={resetLoading || resetSent}
                className="h-10 px-5 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-[#FFC629]" />
                {resetLoading ? 'Sending Link...' : resetSent ? 'Link Sent' : 'Send Password Reset Email'}
              </button>
            </div>

            <div className="p-4 bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.05)]">
              <h4 className="text-sm font-semibold text-[#F3F4F6]">Active Session</h4>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Logged in with user ID: <span className="font-mono text-[#D1D5DB]">{user?.id}</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
