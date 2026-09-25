import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Bot, MapPin, Activity, ChevronLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ConeMascot from '../components/ConeMascot';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // On mobile, show welcome screen first by default
  const [showWelcome, setShowWelcome] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowWelcome(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
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

  if (showWelcome) {
    return (
      <div className="flex-1 flex flex-col font-['Inter',sans-serif] relative bg-[#0E1013] z-10 overflow-hidden min-h-dvh lg:hidden">
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0E1013]">
          {/* Warm radial glow */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 bg-[#FFC629] rounded-full w-[250px] h-[250px] blur-[80px] opacity-[0.12] pointer-events-none"></div>
          
          <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
            <ConeMascot size={240} waving={true} title="" className="drop-shadow-xl" />
          </div>

          <div className="w-full h-[60px] text-[#161A20] absolute bottom-0 pointer-events-none">
            <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-full fill-current translate-y-[1px]">
              <path d="M0,128L48,138.7C96,149,192,171,288,170.7C384,171,480,149,576,160C672,171,768,213,864,229.3C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>
        
        <div className="bg-[#161A20] px-8 pt-6 pb-12 sm:pb-16 w-full relative z-20 flex flex-col items-center text-center">
          <h2 className="text-4xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-3 tracking-tight">RoadGuard</h2>
          <p className="text-[#9CA3AF] mb-10 text-[15px] max-w-xs mx-auto">
            Report road hazards.<br/>Track every repair.
          </p>
          
          <div className="w-full max-w-sm flex flex-col gap-4">
            <button 
              onClick={() => setShowWelcome(false)}
              className="w-full h-[52px] bg-[#FFC629] text-[#0E1013] font-bold rounded-full text-lg hover:opacity-90 transition-transform active:scale-95 focus:outline-none"
            >
              Log in
            </button>
            <Link 
              to="/register"
              className="w-full flex items-center justify-center h-[52px] bg-transparent border-2 border-[#FFC629] text-[#FFC629] font-bold rounded-full text-lg hover:bg-[#FFC629]/10 transition-transform active:scale-95 focus:outline-none"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <ConeMascot size={260} waving={true} title="" className="w-full h-auto drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* Right Half / Mobile Form */}
      <div className="flex-1 flex-col relative z-10 overflow-y-auto bg-[#0E1013] lg:bg-[#161A20] flex">
        {/* Mobile Header hero for login */}
        <div className="lg:hidden relative w-full pt-12 pb-8 flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFC629]/10 to-[#0E1013] pointer-events-none"></div>
          <button 
            onClick={() => setShowWelcome(true)} 
            className="absolute top-6 left-6 w-11 h-11 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center text-[#F3F4F6] focus:outline-none z-20"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="relative mt-4 mb-2">
            <ConeMascot size={150} waving={true} title="" className="relative z-10 drop-shadow-lg" />
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
              <h2 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Welcome back</h2>
              <p className="text-[#9CA3AF] text-[15px]">Enter your details to access your account.</p>
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-[48px] pl-11 pr-12 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] text-base transition-shadow"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#F3F4F6] focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[rgba(255,255,255,0.08)] bg-[#0E1013] text-[#FFC629] focus:ring-[#FFC629] focus:ring-offset-[#161A20]"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-[#9CA3AF]">Remember me</label>
                </div>
                <a href="#" className="text-[13px] font-bold text-[#FFC629] hover:opacity-80">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-[#FFC629] text-[#0E1013] font-bold rounded-full mt-4 flex items-center justify-center hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-transform active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
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
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#FFC629] hover:opacity-80 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
