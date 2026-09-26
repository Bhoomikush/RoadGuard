import { Activity, MapPin } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import type { RiskZone } from '../../utils/geo';

interface RiskCardProps {
  zone: RiskZone;
}

export function RiskCard({ zone }: RiskCardProps) {
  const levelColors: Record<string, string> = {
    HIGH: 'text-red-500 bg-red-500/10 border-red-500/20',
    MEDIUM: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    LOW: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  };

  return (
    <Card className="hover:bg-slate-900/80 transition-colors">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${levelColors[zone.level]}`}>
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-sm">{zone.level} RISK</h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-50">{zone.hazardCount}</span>
            <p className="text-xs text-slate-500">active hazards</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2 text-sm text-slate-400 mb-6">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
          <p>Lat: {zone.center.lat.toFixed(4)}, Lng: {zone.center.lng.toFixed(4)}</p>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-500">Risk Intensity (Score)</span>
            <span className="text-slate-300 font-medium">{Math.round(Math.min(zone.score / 10, 1) * 100)}% ({zone.score})</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                zone.level === 'HIGH' ? 'bg-red-500' :
                zone.level === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} 
              style={{ width: `${Math.min(zone.score / 10, 1) * 100}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
