import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AlertTriangle, MapPin, Activity, CheckCircle, ShieldAlert, Bot, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';

export function DashboardPage() {
  const recentHazards = [
    { id: 'HZ-1042', type: 'Deep Pothole', location: 'Main St & 4th Ave', severity: 'high', status: 'active', time: '10 mins ago' },
    { id: 'HZ-1041', type: 'Fallen Branch', location: 'Oak Rd', severity: 'medium', status: 'verifying', time: '45 mins ago' },
    { id: 'HZ-1040', type: 'Faded Crossing', location: 'School District', severity: 'low', status: 'resolved', time: '2 hours ago' },
    { id: 'HZ-1039', type: 'Traffic Light Out', location: 'Highway 9', severity: 'high', status: 'active', time: '3 hours ago' },
  ];

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6]">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">Good morning, RoadGuard.</h1>
            <p className="text-[#9CA3AF] mt-1">Here's what's happening on the roads.</p>
          </div>
          <div>
            <Link to="/report" className="inline-flex items-center justify-center px-4 py-2 bg-[#FFC629] text-[#0E1013] rounded-lg font-medium hover:opacity-90 transition-opacity">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Report Hazard
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Hazards", value: "1,248", icon: AlertTriangle, trend: { value: '12%', isPositive: false } },
            { title: "High Risk", value: "42", icon: ShieldAlert, trend: { value: '5%', isPositive: true } },
            { title: "Active Reports", value: "315", icon: Activity },
            { title: "Resolved", value: "891", icon: CheckCircle, trend: { value: '18%', isPositive: true } }
          ].map((stat, i) => (
            <div key={i} className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF] mb-1">{stat.title}</p>
                  <h4 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">{stat.value}</h4>
                </div>
                <div className="w-12 h-12 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[12px] flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#FFC629]" />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-4 flex items-center text-sm">
                  <span className={`font-medium ${stat.trend.isPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {stat.trend.isPositive ? '+' : '-'}{stat.trend.value}
                  </span>
                  <span className="text-[#9CA3AF] ml-2">from last month</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] h-full flex flex-col">
              <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif]">Recent Hazards</h3>
                <Link to="/reports" className="text-sm text-[#FFC629] hover:opacity-80 font-medium">View all</Link>
              </div>
              
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#9CA3AF] uppercase bg-[#0E1013]/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Hazard</th>
                      <th className="px-6 py-4 font-medium">Location</th>
                      <th className="px-6 py-4 font-medium">Severity</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHazards.map((hazard) => (
                      <tr key={hazard.id} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[#FFC629]/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#F3F4F6]">{hazard.type}</td>
                        <td className="px-6 py-4 text-[#9CA3AF] flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5" />
                          {hazard.location}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            hazard.severity === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' : 
                            hazard.severity === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' : 
                            'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                          }`}>
                            {hazard.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <Badge variant={hazard.status === 'resolved' ? 'success' : hazard.status === 'active' ? 'danger' : 'default'}>
                            {hazard.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-[#9CA3AF]">{hazard.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Scroll Snap List */}
              <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 p-4 pb-6">
                {recentHazards.map((hazard) => (
                  <div key={hazard.id} className="min-w-[85%] sm:min-w-[300px] snap-center bg-[#0E1013] rounded-[16px] p-5 border border-[rgba(255,255,255,0.08)]">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        hazard.severity === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 
                        hazard.severity === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 
                        'bg-[#22C55E]/10 text-[#22C55E]'
                      }`}>
                        {hazard.severity} severity
                      </span>
                      <span className="text-xs text-[#9CA3AF]">{hazard.time}</span>
                    </div>
                    <h4 className="font-semibold text-[#F3F4F6] text-lg mb-1">{hazard.type}</h4>
                    <p className="text-sm text-[#9CA3AF] flex items-center mb-4">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {hazard.location}
                    </p>
                    <div className="mt-auto">
                      <Badge variant={hazard.status === 'resolved' ? 'success' : hazard.status === 'active' ? 'danger' : 'default'}>
                        {hazard.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Link to="/report" className="block w-full bg-gradient-to-br from-[#FFC629] to-[#FF7A1A] rounded-[24px] p-6 text-[#0E1013] hover:opacity-95 transition-opacity group relative overflow-hidden shadow-lg shadow-[#FF7A1A]/20">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-['Sora',sans-serif] mb-1">Report New Hazard</h3>
                  <p className="text-[#0E1013]/80 text-sm font-medium">Help keep our roads safe</p>
                </div>
                <div className="w-12 h-12 bg-[#0E1013]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </div>
              <AlertTriangle className="absolute -bottom-4 -right-4 w-32 h-32 text-[#0E1013]/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
            </Link>

            <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
              <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <Link to="/map" className="flex items-center p-3 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] hover:border-[#FFC629]/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#FFC629]/10 flex items-center justify-center mr-4">
                    <MapPin className="w-5 h-5 text-[#FFC629]" />
                  </div>
                  <span className="font-medium">View Live Map</span>
                </Link>
                <Link to="/assistant" className="flex items-center p-3 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] hover:border-[#FFC629]/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#FFC629]/10 flex items-center justify-center mr-4">
                    <Bot className="w-5 h-5 text-[#FFC629]" />
                  </div>
                  <span className="font-medium">Ask RoadGuard AI</span>
                </Link>
              </div>
            </div>

            <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-hidden">
              <div className="p-6 border-b border-[rgba(255,255,255,0.08)]">
                <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif]">Risk Overview</h3>
              </div>
              <div className="p-6">
                <div className="aspect-video bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.08)] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #FFC629 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                  <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#EF4444] rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                  <div className="absolute top-1/2 left-2/3 w-2 h-2 bg-[#F59E0B] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-[#22C55E]/20 rounded-full border border-[#22C55E]/50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full"></div>
                  </div>
                  <div className="z-10 text-center bg-[#0E1013]/60 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-[rgba(255,255,255,0.05)]">
                    <p className="text-sm font-medium text-[#F3F4F6]">Live Map Preview</p>
                    <Link to="/map" className="text-xs text-[#FFC629] hover:underline mt-1 block">Open full map</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
