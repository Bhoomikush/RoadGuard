import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { AlertTriangle, MapPin, Activity, CheckCircle, ShieldAlert, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const recentHazards = [
    { id: 'HZ-1042', type: 'Deep Pothole', location: 'Main St & 4th Ave', severity: 'high', status: 'active', time: '10 mins ago' },
    { id: 'HZ-1041', type: 'Fallen Branch', location: 'Oak Rd', severity: 'medium', status: 'verifying', time: '45 mins ago' },
    { id: 'HZ-1040', type: 'Faded Crossing', location: 'School District', severity: 'low', status: 'resolved', time: '2 hours ago' },
    { id: 'HZ-1039', type: 'Traffic Light Out', location: 'Highway 9', severity: 'high', status: 'active', time: '3 hours ago' },
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Good morning, RoadGuard."
        description="Here's what's happening on the roads."
        action={
          <Link to="/report">
            <Button variant="primary" icon={AlertTriangle}>Report Hazard</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Hazards" 
          value="1,248" 
          icon={AlertTriangle} 
          trend={{ value: '12%', isPositive: false }} 
        />
        <StatCard 
          title="High Risk" 
          value="42" 
          icon={ShieldAlert} 
          trend={{ value: '5%', isPositive: true }} 
        />
        <StatCard 
          title="Active Reports" 
          value="315" 
          icon={Activity} 
        />
        <StatCard 
          title="Resolved" 
          value="891" 
          icon={CheckCircle} 
          trend={{ value: '18%', isPositive: true }} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Hazards</CardTitle>
              <Link to="/reports" className="text-sm text-teal-500 hover:text-teal-400 font-medium">View all</Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs text-slate-500 bg-slate-900/50 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Hazard</th>
                      <th className="px-6 py-3 font-medium">Location</th>
                      <th className="px-6 py-3 font-medium">Severity</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Reported</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHazards.map((hazard) => (
                      <tr key={hazard.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">{hazard.type}</td>
                        <td className="px-6 py-4 flex items-center text-slate-400">
                          <MapPin className="w-3 h-3 mr-1.5" />
                          {hazard.location}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={hazard.severity === 'high' ? 'danger' : hazard.severity === 'medium' ? 'warning' : 'info'}>
                            {hazard.severity.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={hazard.status === 'resolved' ? 'success' : hazard.status === 'active' ? 'danger' : 'default'}>
                            {hazard.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{hazard.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link to="/report">
                <Button variant="outline" className="w-full justify-start h-12" icon={AlertTriangle}>
                  Report New Hazard
                </Button>
              </Link>
              <Link to="/map">
                <Button variant="outline" className="w-full justify-start h-12" icon={MapPin}>
                  View Live Map
                </Button>
              </Link>
              <Link to="/assistant">
                <Button variant="outline" className="w-full justify-start h-12" icon={Bot}>
                  Ask RoadGuard AI
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #14b8a6 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                <div className="absolute top-1/2 left-2/3 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-teal-500/20 rounded-full border border-teal-500/50 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                </div>
                <div className="z-10 text-center">
                  <p className="text-sm font-medium text-slate-300">Live Map Preview</p>
                  <Link to="/map" className="text-xs text-teal-500 hover:underline mt-1 block">Open full map</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
