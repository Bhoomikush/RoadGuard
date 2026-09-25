import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ChevronLeft, Mail, Lock, User, Shield, Bot, MapPin, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConeMascot from '../components/ConeMascot';

type Mode = 'splash' | 'welcome' | 'auth';
type AuthTab = 'login' | 'register';

export function AuthFlow({ initialTab }: { initialTab: AuthTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [mode, setMode] = useState<Mode>(location.state?.mode || 'splash');
  const [authTab, setAuthTab] = useState<AuthTab>(initialTab);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'splash') {
      const timer = setTimeout(() => {
        setMode('welcome');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    setAuthTab(initialTab);
  }, [initialTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authTab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        navigate('/dashboard');
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (signUpError) throw signUpError;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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

  const handleTabSwitch = (tab: AuthTab) => {
    setError(null);
    setAuthTab(tab);
    navigate(tab === 'login' ? '/login' : '/register', { 
      replace: true,
      state: { mode: 'auth' }
    });
  };

  if (mode === 'splash') {
    return (
      <div className="min-h-dvh bg-asphalt-950 flex flex-col items-center justify-center font-['Inter']">
        <div className="animate-bounce mb-6">
          <ConeMascot size={128} title="" />
        </div>
        <h1 className="text-3xl font-['Sora'] font-bold text-text-primary tracking-tight">RoadGuard</h1>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-asphalt-950 font-['Inter'] flex">
      
      {/* --- DESKTOP LEFT HALF (>= 1024px) --- */}
      <div className="hidden lg:flex lg:flex-1 relative flex-col p-8 lg:p-12 xl:p-16 bg-asphalt-950 overflow-hidden">
        {/* Soft Warm Radial Glow */}
        <div className="absolute inset-0 bg-signal rounded-full blur-[120px] opacity-[0.08] transform scale-150"></div>
        
        {/* Wave Edge on Right Side for Desktop */}
        <div className="absolute inset-y-0 right-0 w-[60px] h-full z-0 text-[var(--color-asphalt-900)] pointer-events-none translate-x-[1px]">
          <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="w-full h-full fill-current">
            <path d="M100,0 L0,0 C40,200 -20,400 40,600 C100,800 20,1000 100,1000 Z"></path>
          </svg>
        </div>

        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col h-full">
          {/* Logo Top Left */}
          <div className="flex items-center gap-3 mb-10 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-signal" />
            </div>
            <span className="text-xl font-['Sora'] font-bold text-text-primary tracking-tight">RoadGuard</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-['Sora'] font-bold text-text-primary mb-4 leading-[1.1] tracking-normal text-balance max-w-none" style={{ fontSize: 'clamp(2rem, 3.4vw, 3.25rem)' }}>
              <span className="block">Report road hazards.</span>
              <span className="block">Track every repair.</span>
            </h1>
            <p className="text-text-muted text-lg mb-8 leading-relaxed max-w-[400px]">
              RoadGuard detects potholes and cracks from a photo, sends them for review, and shows repair progress on a live map.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-asphalt-900 border border-border-subtle flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-signal" />
                </div>
                <span className="text-text-primary font-medium text-[15px]">AI hazard detection</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-asphalt-900 border border-border-subtle flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-signal" />
                </div>
                <span className="text-text-primary font-medium text-[15px]">Live hazard map</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-asphalt-900 border border-border-subtle flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5 text-signal" />
                </div>
                <span className="text-text-primary font-medium text-[15px]">Repair status tracking</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mascot */}
        <div className="absolute bottom-12 right-12 pointer-events-none z-0">
          <div style={{ width: 'clamp(220px, 18vw, 260px)', height: 'clamp(220px, 18vw, 260px)' }}>
            <ConeMascot size={260} waving={true} title="" className="w-full h-full relative z-10 drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* --- MOBILE START SCREEN (< 1024px) --- */}
      {mode === 'welcome' && (
        <div className="lg:hidden flex-1 flex flex-col font-['Inter'] relative bg-asphalt-950 z-10 overflow-hidden min-h-dvh">
          
          <div className="flex-1 flex flex-col relative overflow-hidden bg-asphalt-950">
            {/* Warm radial glow */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-signal rounded-full w-[250px] h-[250px] blur-[80px] opacity-[0.12] pointer-events-none"></div>
            
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              <ConeMascot size={240} waving={true} title="" className="drop-shadow-xl" />
            </div>

            {/* SVG Wave Shape Layered on Bottom of top half */}
            <div className="w-full h-[60px] text-[var(--color-asphalt-900)] absolute bottom-0 pointer-events-none">
              <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-current translate-y-[1px]">
                <path d="M0,128L48,138.7C96,149,192,171,288,170.7C384,171,480,149,576,160C672,171,768,213,864,229.3C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
          </div>
          
          {/* Bottom Card Actions */}
          <div className="bg-asphalt-900 px-8 pt-6 pb-12 sm:pb-16 w-full relative z-20 flex flex-col items-center text-center">
            <h2 className="text-4xl font-['Sora'] font-bold text-text-primary mb-3 tracking-tight">RoadGuard</h2>
            <p className="text-text-muted mb-10 text-[15px] max-w-xs mx-auto">
              Report road hazards.<br/>Track every repair.
            </p>
            
            <div className="w-full max-w-sm flex flex-col gap-4">
              <button 
                onClick={() => {
                  setMode('auth');
                  setAuthTab('login');
                  navigate('/login', { replace: true, state: { mode: 'auth' } });
                }}
                className="w-full h-[52px] bg-signal text-[var(--color-asphalt-950)] font-semibold rounded-full text-lg hover:bg-[#e5b224] transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-signal/50"
              >
                Log in
              </button>
              <button 
                onClick={() => {
                  setMode('auth');
                  setAuthTab('register');
                  navigate('/register', { replace: true, state: { mode: 'auth' } });
                }}
                className="w-full h-[52px] bg-transparent border-2 border-signal text-signal font-semibold rounded-full text-lg hover:bg-signal/10 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-signal/50"
              >
                Sign up
              </button>
            </div>
          </div>

        </div>
      )}

      {/* --- FORM PANEL (MOBILE AUTH OR DESKTOP RIGHT HALF) --- */}
      <div className={`flex-1 flex-col relative z-10 overflow-y-auto bg-asphalt-950 lg:bg-asphalt-900 ${mode === 'welcome' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Mobile Header hero for login/register (< lg only) */}
        <div className="lg:hidden relative w-full pt-12 pb-8 flex flex-col items-center">
          {/* Warm gradient background */}
          <div className="absolute inset-0 bg-gradient-to-b from-signal/20 to-[var(--color-asphalt-950)] pointer-events-none"></div>
          
          <button 
            onClick={() => setMode('welcome')} 
            className="absolute top-6 left-6 w-11 h-11 bg-asphalt-900 border border-border-subtle rounded-full flex items-center justify-center text-text-primary hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-signal z-20"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {authTab === 'register' ? (
            <div className="relative mt-8 mb-4">
              <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'repeating-linear-gradient(to right, #ffffff 0px, #ffffff 20px, transparent 20px, transparent 40px)', height: '4px', top: '50%' }}></div>
              <ConeMascot size={100} waving={true} title="" className="relative z-10 drop-shadow-lg" />
            </div>
          ) : (
            <div className="relative mt-4 mb-2">
              <ConeMascot size={150} waving={true} title="" className="relative z-10 drop-shadow-lg" />
            </div>
          )}

          {/* Curved wave-shaped bottom edge for the gradient hero */}
          <div className="w-full h-[40px] text-[var(--color-asphalt-950)] absolute -bottom-[1px] pointer-events-none">
            <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-full fill-current">
               <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,42.7C840,32,960,32,1080,48C1200,64,1320,96,1380,112L1440,128L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
            </svg>
          </div>
        </div>

        {/* The Form Content */}
        <div className="w-full max-w-[440px] mx-auto px-6 py-6 sm:py-12 lg:h-full lg:flex lg:flex-col lg:justify-center">
          
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-['Sora'] font-bold text-text-primary mb-2">
              {authTab === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-text-muted text-[15px]">
              {authTab === 'login' 
                ? 'Enter your details to access your account.' 
                : 'Enter your details to get started with RoadGuard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}
            
            {authTab === 'register' && (
              <div className="space-y-1.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-text-muted" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-4 bg-asphalt-950 border border-border-subtle rounded-[16px] text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent text-base transition-shadow"
                    placeholder="Display name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full h-[48px] pl-11 pr-4 bg-asphalt-950 border border-border-subtle rounded-[16px] text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent text-base transition-shadow"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-muted" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full h-[48px] pl-11 pr-12 bg-asphalt-950 border border-border-subtle rounded-[16px] text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-signal focus:border-transparent text-base transition-shadow"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary focus:outline-none focus:text-signal"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {authTab === 'login' && (
              <div className="flex justify-end pt-1">
                <a href="#" className="text-[13px] font-medium text-signal hover:text-[#e5b224] focus:outline-none focus:underline">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-signal text-[var(--color-asphalt-950)] font-semibold rounded-full mt-4 flex items-center justify-center hover:bg-[#e5b224] disabled:opacity-70 disabled:cursor-not-allowed transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-signal/50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (authTab === 'login' ? 'Log in' : 'Create account')}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle"></div>
              </div>
              <div className="relative flex justify-center text-[13px]">
                <span className="px-4 bg-asphalt-950 lg:bg-asphalt-900 text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-[48px] flex items-center justify-center gap-3 bg-asphalt-950 border border-border-subtle rounded-full text-text-primary font-medium hover:bg-[#1a1e26] transition-colors focus:outline-none focus:ring-2 focus:ring-signal"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col items-center">
            {authTab === 'login' ? (
              <p className="text-text-muted text-[15px]">
                Don't have an account?{' '}
                <button 
                  onClick={() => handleTabSwitch('register')} 
                  className="font-bold text-signal hover:text-[#e5b224] transition-colors focus:outline-none focus:underline"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-text-muted text-[15px]">
                Already have an account?{' '}
                <button 
                  onClick={() => handleTabSwitch('login')} 
                  className="font-bold text-signal hover:text-[#e5b224] transition-colors focus:outline-none focus:underline"
                >
                  Log in
                </button>
              </p>
            )}

            {authTab === 'register' && (
              <p className="mt-6 text-center text-[12px] text-text-muted leading-relaxed">
                By continuing, you agree to RoadGuard's <br/>
                <a href="#" className="underline hover:text-text-primary focus:outline-none focus:text-signal">Terms of Service</a> and <a href="#" className="underline hover:text-text-primary focus:outline-none focus:text-signal">Privacy Policy</a>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
