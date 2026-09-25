export function MapLegend() {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-[#161A20]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] shadow-2xl rounded-[16px]">
      <div className="p-4">
        <h4 className="text-sm font-semibold text-[#F3F4F6] mb-3 uppercase tracking-wider font-['Sora',sans-serif]">Risk Zones</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <span className="text-sm text-[#9CA3AF]">High Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#F59E0B] shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
            <span className="text-sm text-[#9CA3AF]">Medium Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-sm text-[#9CA3AF]">Low Risk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
