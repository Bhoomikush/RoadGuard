export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-3 sm:left-4 z-[1000] bg-[#161A20]/90 backdrop-blur-md border border-[rgba(255,255,255,0.12)] shadow-xl rounded-xl p-2.5 max-w-[170px] pointer-events-auto">
      <h4 className="text-[10px] font-bold text-[#F3F4F6] uppercase tracking-wider font-['Sora',sans-serif] mb-1.5 opacity-80">Risk Zones</h4>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.7)] shrink-0"></div>
          <span className="text-[11px] font-medium text-[#D1D5DB]">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.7)] shrink-0"></div>
          <span className="text-[11px] font-medium text-[#D1D5DB]">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_rgba(34,197,94,0.7)] shrink-0"></div>
          <span className="text-[11px] font-medium text-[#D1D5DB]">Low Risk</span>
        </div>
      </div>
    </div>
  );
}
