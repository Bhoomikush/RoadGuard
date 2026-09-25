import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import ConeMascot from '../components/ConeMascot';
import { 
  ShieldAlert, 
  Map, 
  Eye, 
  Activity, 
  Users, 
  Bell, 
  Bot, 
  ChevronRight,
  Target,
  BarChart3,
  CheckCircle
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0E1013] font-['Inter',sans-serif]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background glow effects & dashed line pattern */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFC629]/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F3F4F6 0, #F3F4F6 2px, transparent 2px, transparent 15px)' }}></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] text-[#FFC629] text-sm font-bold mb-8 uppercase tracking-wide">RoadGuard AI v1.0 is live</div>
          
          <div className="relative inline-block">
             <h1 className="text-5xl md:text-7xl font-extrabold text-[#F3F4F6] tracking-tight mb-8 leading-tight font-['Sora',sans-serif]">
               See the road. <br />
               <span className="text-[#FFC629]">Understand the risk.</span>
             </h1>
             <div className="absolute -top-12 -right-16 md:-top-20 md:-right-32 opacity-90 pointer-events-none hidden sm:block z-[-1]">
               <ConeMascot waving size={220} />
             </div>
          </div>

          <p className="mt-4 text-xl text-[#9CA3AF] max-w-3xl mx-auto mb-10 leading-relaxed">
            RoadGuard AI uses computer vision, machine learning, and community intelligence to detect road hazards and identify high-risk areas before accidents happen.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-20 w-full sm:w-auto">
            <Link to="/report">
              <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-lg shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:shadow-[0_6px_20px_rgba(255,198,41,0.4)] hover:scale-105 transition-all">
                Report a Hazard
              </button>
            </Link>
            <Link to="/map">
              <button className="w-full sm:w-auto h-14 px-8 rounded-full bg-transparent border-2 border-[rgba(243,244,246,0.3)] text-[#F3F4F6] font-bold text-lg hover:border-[#F3F4F6] hover:bg-[#F3F4F6]/5 transition-all">
                Explore the Map
              </button>
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="max-w-5xl mx-auto mt-20 px-4 sm:px-6 relative">
          <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#161A20] p-2 shadow-2xl relative">
            <div className="absolute -top-3 -right-3 z-10">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-[#EF4444] border-2 border-[#161A20]"></span>
              </span>
            </div>
            <div className="rounded-[16px] overflow-hidden bg-[#0E1013] aspect-[16/9] relative border border-[rgba(255,255,255,0.08)]">
               {/* Decorative grid */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#F3F4F6 1px, transparent 1px), linear-gradient(90deg, #F3F4F6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               {/* UI Mockup Elements */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[60%] h-[60%] rounded-lg border-2 border-[#FFC629]/40 bg-[#FFC629]/5 relative group transition-all duration-500 hover:border-[#FFC629]">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[12px] px-4 py-2 shadow-xl flex items-center gap-3 whitespace-nowrap">
                      <Bot className="w-5 h-5 text-[#FFC629]" />
                      <div>
                        <p className="text-xs font-semibold text-[#F3F4F6]">RoadGuard AI Detection</p>
                        <p className="text-[10px] text-[#FFC629]">Confidence: 94%</p>
                      </div>
                      <div className="h-6 w-px bg-[rgba(255,255,255,0.1)] mx-1"></div>
                      <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444] text-white">HIGH</div>
                    </div>
                    {/* Bounding box corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#FFC629]"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#FFC629]"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#FFC629]"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#FFC629]"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[#FFC629]/80 text-sm font-bold tracking-widest uppercase">Pothole detected</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 border-y border-[rgba(255,255,255,0.08)] relative">
        <div className="absolute inset-0 bg-[#0E1013]/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#F3F4F6] mb-4 font-['Sora',sans-serif]">The Infrastructure Blindspot</h2>
            <p className="text-[#9CA3AF] max-w-2xl mx-auto text-lg">Traditional road maintenance relies on fragmented data, leading to reactive fixes instead of proactive safety.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Eye, title: "Discovered Too Late", desc: "Hazards are often only reported after they cause damage or accidents." },
              { icon: Target, title: "Difficult to Track", desc: "Issues get lost in bureaucratic systems and multiple reporting channels." },
              { icon: Activity, title: "Scattered Data", desc: "Information sits in silos, making it hard to see the big picture." },
              { icon: BarChart3, title: "Rarely Analyzed", desc: "Lack of city-level risk analysis prevents data-driven infrastructure planning." }
            ].map((item, i) => (
              <div key={i} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 text-center hover:border-[rgba(255,255,255,0.2)] transition-colors">
                <div className="w-14 h-14 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center mx-auto mb-5">
                  <item.icon className="w-6 h-6 text-[#FFC629]" />
                </div>
                <h3 className="text-lg font-bold text-[#F3F4F6] mb-3">{item.title}</h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] text-[#FFC629] text-sm font-bold mb-4 uppercase tracking-wide">Process</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#F3F4F6] mb-4 font-['Sora',sans-serif]">How RoadGuard Works</h2>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[42px] left-[10%] right-[10%] h-0.5 bg-[rgba(255,255,255,0.08)] z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { step: "1", title: "Report", icon: ShieldAlert, desc: "Users quickly capture hazards via mobile or dashcam." },
                { step: "2", title: "Detect", icon: Bot, desc: "AI automatically classifies the issue and assesses severity." },
                { step: "3", title: "Analyze", icon: Activity, desc: "Data is aggregated to identify recurring high-risk zones." },
                { step: "4", title: "Protect", icon: CheckCircle, desc: "Alerts are sent to drivers and maintenance crews." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-[84px] h-[84px] rounded-[24px] bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-6 shadow-xl relative rotate-3 hover:rotate-0 transition-transform">
                    <item.icon className="w-8 h-8 text-[#FFC629]" />
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#FF7A1A] text-white font-bold text-sm flex items-center justify-center shadow-lg border-[3px] border-[#0E1013]">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 border-t border-[rgba(255,255,255,0.08)] relative">
        <div className="absolute inset-0 bg-[#0E1013]/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] text-[#FFC629] text-sm font-bold mb-4 uppercase tracking-wide">Features</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#F3F4F6] mb-4 font-['Sora',sans-serif]">Intelligent Infrastructure</h2>
            <p className="text-[#9CA3AF] max-w-2xl text-lg">Everything you need to monitor and manage road safety at scale.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: "AI Hazard Detection", desc: "Computer vision automatically identifies potholes, debris, and damaged signs." },
              { icon: ShieldAlert, title: "Severity Classification", desc: "Machine learning models score hazards based on potential risk to drivers." },
              { icon: Map, title: "Live Hazard Map", desc: "Real-time visualization of all active reports with density heatmaps." },
              { icon: Users, title: "Community Verification", desc: "Crowdsourced confirmation system ensures data accuracy and removes duplicates." },
              { icon: Target, title: "Risk Hotspot Detection", desc: "Algorithmic clustering identifies dangerous road segments needing permanent fixes." },
              { icon: Bell, title: "Automated Alerts", desc: "Location-based notifications warn drivers approaching high-risk areas." }
            ].map((feature, i) => (
              <div key={i} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 hover:border-[rgba(255,255,255,0.2)] transition-colors group">
                  <div className="w-14 h-14 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center mb-6 group-hover:border-[#FFC629]/50 transition-colors">
                    <feature.icon className="w-7 h-7 text-[#9CA3AF] group-hover:text-[#FFC629] transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-[#F3F4F6] mb-3">{feature.title}</h3>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FFC629]/5"></div>
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #F3F4F6 0, #F3F4F6 2px, transparent 2px, transparent 15px)' }}></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-[#F3F4F6] mb-6 font-['Sora',sans-serif]">Help make every road safer.</h2>
          <p className="text-xl text-[#9CA3AF] mb-10 max-w-2xl mx-auto leading-relaxed">
            Join the community of drivers, city planners, and safety advocates using AI to map and resolve infrastructure issues.
          </p>
          <Link to="/register" className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-lg hover:opacity-90 hover:scale-105 transition-all">
            Get Started
            <ChevronRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
