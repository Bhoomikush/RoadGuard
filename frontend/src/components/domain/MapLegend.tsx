import { Card } from '../ui/Card';

export function MapLegend() {
  return (
    <Card className="absolute bottom-6 right-6 z-[1000] bg-slate-950/90 backdrop-blur-md border-slate-800 shadow-2xl">
      <div className="p-4">
        <h4 className="text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">Hazard Severity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span className="text-sm text-slate-300">High Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
            <span className="text-sm text-slate-300">Medium Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-sm text-slate-300">Low Risk</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
