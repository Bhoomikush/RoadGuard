import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { RiskCard } from '../components/domain/RiskCard';
import { supabase } from '../lib/supabase';
import { calculateRiskZones, DEFAULT_MAP_CENTER } from '../utils/geo';
import type { Hazard } from '../types';
import { getHazardTitle } from '../utils/hazard';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertTriangle } from 'lucide-react';
import ConeMascot from '../components/ConeMascot';

export function RiskZonesPage() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHazards = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: apiHazardsData, error: sbError } = await supabase
          .from('hazards')
          .select('*');
          
        if (sbError) throw sbError;
        
        const apiHazards: Hazard[] = (apiHazardsData || []).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: getHazardTitle(item),
          severity: item.severity || 'low',
          status: item.status || 'pending',
          latitude: item.latitude,
          longitude: item.longitude,
          location: `Lat: ${item.latitude?.toFixed(4)}, Lng: ${item.longitude?.toFixed(4)}`,
          imageUrl: item.image_url ? supabase.storage.from('hazard-images').getPublicUrl(item.image_url).data.publicUrl : undefined,
          createdAt: item.created_at || new Date().toISOString(),
          ai_detections: item.ai_detections
        }));
        setHazards(apiHazards);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch hazards');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHazards();
  }, []);

  const zones = useMemo(() => calculateRiskZones(hazards), [hazards]);

  return (
    <DashboardLayout>
      <PageHeader 
        title="Risk Zones" 
        description="AI-generated hotspot analysis identifying the most dangerous road segments based on community reports."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="w-8 h-8 text-[#FFC629] animate-spin mb-4" />
              <p className="text-[#9CA3AF]">Analyzing active hazards...</p>
            </div>
          ) : error ? (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[24px] p-5 text-[#EF4444] text-center">
              {error}
            </div>
          ) : zones.length === 0 ? (
            <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] py-12 text-center flex flex-col items-center">
              <ConeMascot size={80} waving={false} title="No risk zones" />
              <p className="text-[#9CA3AF] text-sm mt-4">No active risk zones detected.</p>
            </div>
          ) : (
            zones.map(zone => (
              <RiskCard key={zone.id} zone={zone} />
            ))
          )}
        </div>
        
        <div className="lg:col-span-2">
          <div className="w-full h-full min-h-[600px] bg-[#161A20] rounded-xl border border-[rgba(255,255,255,0.08)] relative overflow-hidden flex flex-col shadow-inner">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-full">
                 <Loader2 className="w-8 h-8 animate-spin text-[#FFC629] mb-2" />
                 <p className="text-sm text-[#9CA3AF]">Loading map...</p>
               </div>
            ) : error ? (
               <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <AlertTriangle className="w-8 h-8 text-[#EF4444] mb-2" />
                 <p className="text-sm text-[#EF4444] mb-2">Failed to load map data</p>
               </div>
            ) : zones.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <ConeMascot size={100} waving={false} title="No active risk zones" />
                 <p className="text-sm text-[#9CA3AF] mt-2">No active risk zones yet</p>
               </div>
            ) : (
              <MapContainer
                center={zones.length > 0 ? [zones[0].center.lat, zones[0].center.lng] : DEFAULT_MAP_CENTER}
                zoom={14}
                className="w-full h-full"
                style={{ zIndex: 0 }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {zones.map((zone) => {
                  const color =
                    zone.level === 'HIGH' ? '#ef4444' : // red-500
                    zone.level === 'MEDIUM' ? '#f59e0b' : // amber-500
                    '#10b981'; // emerald-500

                  return (
                    <Circle
                      key={zone.id}
                      center={[zone.center.lat, zone.center.lng]}
                      radius={300}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2 }}
                    >
                      <Popup className="roadguard-popup">
                        <div className="p-1">
                          <h4 className="font-bold text-[#F3F4F6] m-0 text-sm font-['Sora',sans-serif]">Risk Zone</h4>
                          <div className="flex items-center gap-2 mt-1 mb-1">
                            <span className="text-xs font-bold uppercase" style={{ color }}>
                              {zone.level} RISK
                            </span>
                          </div>
                          <p className="text-xs text-[#9CA3AF] m-0 mt-1">Active Hazards: {zone.hazardCount}</p>
                          <p className="text-xs text-[#9CA3AF] m-0 mt-1">Risk Score: {zone.score}</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        /* Custom styles to make leaflet popups dark mode friendly */
        .leaflet-popup-content-wrapper {
          background-color: #161A20;
          color: #F3F4F6;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.5);
          font-family: 'Inter', sans-serif;
        }
        .leaflet-popup-tip {
          background-color: #161A20;
        }
        .leaflet-popup-close-button {
          color: #9CA3AF !important;
          padding: 6px !important;
        }
        .leaflet-popup-close-button:hover {
          color: #F3F4F6 !important;
        }
      `}</style>
    </DashboardLayout>
  );
}
