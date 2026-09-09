import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { RiskCard } from '../components/domain/RiskCard';
import type { RiskZone } from '../types';

export function RiskZonesPage() {
  const mockRiskZones: RiskZone[] = [
    {
      id: 'RZ-001',
      level: 'critical',
      hazardCount: 24,
      location: 'Downtown Core - Financial District',
      intensity: 0.92,
      centerLat: 34.0489,
      centerLng: -118.2531
    },
    {
      id: 'RZ-002',
      level: 'high',
      hazardCount: 15,
      location: 'Highway 9 Southbound Ramp',
      intensity: 0.78,
      centerLat: 34.0321,
      centerLng: -118.2711
    },
    {
      id: 'RZ-003',
      level: 'medium',
      hazardCount: 8,
      location: 'University District - East Campus',
      intensity: 0.45,
      centerLat: 34.0682,
      centerLng: -118.2245
    },
    {
      id: 'RZ-004',
      level: 'medium',
      hazardCount: 6,
      location: 'Westside Industrial Park',
      intensity: 0.38,
      centerLat: 34.0211,
      centerLng: -118.2911
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="Risk Zones" 
        description="AI-generated hotspot analysis identifying the most dangerous road segments based on community reports."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {mockRiskZones.map(zone => (
            <RiskCard key={zone.id} zone={zone} />
          ))}
        </div>
        
        <div className="lg:col-span-2">
          {/* Heatmap Visual Placeholder */}
          <div className="w-full h-full min-h-[500px] bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at center, #1e293b 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
            
            {/* Heatmap blur spots */}
            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-rose-600/30 rounded-full blur-[60px] animate-pulse"></div>
            <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-red-500/40 rounded-full blur-[40px]"></div>
            
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-[70px]"></div>
            <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-emerald-500/10 rounded-full blur-[30px]"></div>
            
            <div className="z-10 bg-slate-950/80 backdrop-blur-md px-6 py-4 rounded-lg border border-slate-800 text-center">
              <h3 className="text-lg font-bold text-slate-200 mb-1">DBSCAN Heatmap View</h3>
              <p className="text-sm text-slate-400">Map integration pending</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
