import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, CheckCircle2, Bot, MapPin, Activity, ChevronLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import ConeMascot from '../components/ConeMascot';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };
  const strength = calculateStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    }
  };

  return (
    <div className="min-h-dvh bg-[#0E1013] font-['Inter',sans-serif] flex">
      {/* Desktop Left Half */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col p-8 lg:p-12 xl:p-16 bg-[#0E1013] overflow-hidden">
        <div className="absolute inset-0 bg-[#FFC629] rounded-full blur-[120px] opacity-[0.12] transform scale-150"></div>
        <div className="absolute inset-y-0 right-0 w-[60px] h-full z-0 text-[#161A20] pointer-events-none translate-x-[1px]">
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M100,0 L0,0 C40,200 -20,400 40,600 C100,800 20,1000 100,1000 Z"></path>
          </svg>
        </div>
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col h-full">
          <Link to="/" className="flex items-center gap-3 mb-10 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#FFC629]" />
            </div>
            <span className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] tracking-tight">RoadGuard</span>
          </Link>
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-4 leading-[1.1] tracking-normal text-balance" style={{ fontSize: 'clamp(2.5rem, 3.5vw, 3.5rem)' }}>
              <span className="block">Report road hazards.</span>
              <span className="block text-[#FFC629]">Track every repair.</span>
            </h1>
            <p className="text-[#9CA3AF] text-lg mb-10 leading-relaxed max-w-[400px]">
              RoadGuard detects potholes and cracks from a photo, sends them for review, and shows repair progress on a live map.
            </p>
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-[#FFC629]" />
                </div>
                <span className="text-[#F3F4F6] font-bold text-base">AI hazard detection</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#FFC629]" />
                </div>
                <span className="text-[#F3F4F6] font-bold text-base">Live hazard map</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-[#FFC629]" />
                </div>
                <span className="text-[#F3F4F6] font-bold text-base">Repair status tracking</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 right-12 pointer-events-none z-0">
          <div style={{ width: 'clamp(180px, 18vw, 260px)' }}>
            <ConeMascot size={220} title="" className="w-full h-auto drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* Right Half / Mobile Form */}
      <div className="flex-1 flex-col relative z-10 overflow-y-auto bg-[#0E1013] lg:bg-[#161A20] flex">
        {/* Mobile Header hero for register */}
        <div className="lg:hidden relative w-full pt-12 pb-8 flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFC629]/10 to-[#0E1013] pointer-events-none"></div>
          <Link 
            to="/login"
            className="absolute top-6 left-6 w-11 h-11 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center text-[#F3F4F6] focus:outline-none z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="relative mt-4 mb-2">
            <ConeMascot size={220} title="" className="relative z-10 drop-shadow-lg" />
          </div>
          <div className="w-full h-[40px] text-[#0E1013] absolute -bottom-[1px] pointer-events-none">
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full fill-current">
               <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,48C1200,64,1320,96,1380,112L1440,128L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
            </svg>
          </div>
        </div>

        <div className="w-full max-w-[440px] mx-auto px-6 py-6 sm:py-12 lg:h-full lg:flex lg:flex-col lg:justify-center">
          <div className="bg-[#161A20] lg:border lg:border-[rgba(255,255,255,0.08)] lg:rounded-[24px] lg:p-10 shadow-none lg:shadow-xl">
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Create your account</h2>
              <p className="text-[#9CA3AF] text-[15px]">Enter your details to get started with RoadGuard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-sm rounded-xl">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-4 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] text-base transition-shadow"
                    placeholder="Display name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-4 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] text-base transition-shadow"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-4 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] text-base transition-shadow"
                    placeholder="Password"
                  />
                </div>
                {password && (
                  <div className="mt-2 pl-2">
                    <div className="flex gap-1 h-1.5 mt-1 max-w-[200px]">
                      {[1, 2, 3, 4].map((level) => (
                        <div 
                          key={level} 
                          className={`flex-1 rounded-full ${
                            level <= strength 
                              ? strength <= 1 ? 'bg-[#EF4444]' : strength === 2 ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                              : 'bg-[#0E1013]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium uppercase tracking-wider">
                      {strength <= 1 && 'Weak password'}
                      {strength === 2 && 'Fair password'}
                      {strength >= 3 && 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <CheckCircle2 className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-4 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] text-base transition-shadow"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-[#FFC629] text-[#0E1013] font-bold rounded-full mt-6 flex items-center justify-center hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[rgba(255,255,255,0.08)]"></div>
                </div>
                <div className="relative flex justify-center text-[13px]">
                  <span className="px-4 bg-[#161A20] text-[#9CA3AF]">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-[48px] flex items-center justify-center gap-3 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-full text-[#F3F4F6] font-bold hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.08)] flex flex-col items-center">
              <p className="text-[#9CA3AF] text-[15px]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#FFC629] hover:opacity-80 transition-colors">
                  Log in
                </Link>
              </p>
              
              <p className="mt-6 text-center text-[12px] text-[#9CA3AF] leading-relaxed">
                By continuing, you agree to RoadGuard's <br/>
                <a href="#" className="underline hover:text-[#F3F4F6] transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-[#F3F4F6] transition-colors">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
