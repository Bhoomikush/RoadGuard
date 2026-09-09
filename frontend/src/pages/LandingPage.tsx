import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="success" className="mb-6 mx-auto px-3 py-1">RoadGuard AI v1.0 is live</Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-50 tracking-tight mb-8 leading-tight">
            See the road. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
              Understand the risk.
            </span>
          </h1>
          <p className="mt-4 text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            RoadGuard AI uses computer vision, machine learning, and community intelligence to detect road hazards and identify high-risk areas before accidents happen.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/report">
              <Button variant="primary" size="lg" className="w-full sm:w-auto h-14 px-8 text-base shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_25px_rgba(20,184,166,0.5)] transition-all">
                Report a Hazard
              </Button>
            </Link>
            <Link to="/map">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base">
                Explore the Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="max-w-5xl mx-auto mt-20 px-4 sm:px-6 relative">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm p-2 shadow-2xl relative">
            <div className="absolute -top-3 -right-3">
              <span className="relative flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 border-2 border-slate-900"></span>
              </span>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 aspect-[16/9] relative border border-slate-800/50">
               {/* Decorative grid */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               {/* UI Mockup Elements */}
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[60%] h-[60%] rounded-lg border-2 border-teal-500/30 bg-teal-500/5 relative group transition-all duration-500 hover:border-teal-500">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 shadow-xl flex items-center gap-3">
                      <Bot className="w-5 h-5 text-teal-400" />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">RoadGuard AI Detection</p>
                        <p className="text-[10px] text-teal-400">Confidence: 94%</p>
                      </div>
                      <div className="h-6 w-px bg-slate-700 mx-1"></div>
                      <div>
                        <Badge variant="danger">HIGH</Badge>
                      </div>
                    </div>
                    {/* Bounding box corners */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-500"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-500"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-500"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-slate-500/50 text-sm font-medium tracking-widest uppercase">Pothole detected</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-50 mb-4">The Infrastructure Blindspot</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Traditional road maintenance relies on fragmented data, leading to reactive fixes instead of proactive safety.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Eye, title: "Discovered Too Late", desc: "Hazards are often only reported after they cause damage or accidents." },
              { icon: Target, title: "Difficult to Track", desc: "Issues get lost in bureaucratic systems and multiple reporting channels." },
              { icon: Activity, title: "Scattered Data", desc: "Information sits in silos, making it hard to see the big picture." },
              { icon: BarChart3, title: "Rarely Analyzed", desc: "Lack of city-level risk analysis prevents data-driven infrastructure planning." }
            ].map((item, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">How RoadGuard Works</h2>
          </div>

          <div className="relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>

            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {[
                { step: "1", title: "Report", icon: ShieldAlert, desc: "Users quickly capture hazards via mobile or dashcam." },
                { step: "2", title: "Detect", icon: Bot, desc: "AI automatically classifies the issue and assesses severity." },
                { step: "3", title: "Analyze", icon: Activity, desc: "Data is aggregated to identify recurring high-risk zones." },
                { step: "4", title: "Protect", icon: CheckCircle, desc: "Alerts are sent to drivers and maintenance crews." }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(20,184,166,0.15)] relative">
                    <item.icon className="w-7 h-7 text-teal-400" />
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-200 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-24 bg-slate-900/50 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">Intelligent Infrastructure</h2>
            <p className="text-slate-400 max-w-2xl">Everything you need to monitor and manage road safety at scale.</p>
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
              <Card key={i} className="bg-slate-950 hover:bg-slate-900 transition-colors group cursor-default">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center mb-4 group-hover:border-teal-500/50 group-hover:bg-teal-500/10 transition-colors">
                    <feature.icon className="w-6 h-6 text-slate-300 group-hover:text-teal-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-teal-900/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjAsIDE4NCwgMTY2LCAwLjIpIi8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Help make every road safer.</h2>
          <p className="text-xl text-teal-100/80 mb-10 max-w-2xl mx-auto">
            Join the community of drivers, city planners, and safety advocates using AI to map and resolve infrastructure issues.
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg" className="h-14 px-8 text-lg" icon={ChevronRight} iconPosition="right">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
