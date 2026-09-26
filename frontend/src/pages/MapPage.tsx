import { useState, useEffect, useMemo, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MapLegend } from '../components/domain/MapLegend';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HazardCard } from '../components/domain/HazardCard';
import type { Hazard } from '../types';

import { supabase } from '../lib/supabase';
import { calculateRiskZones, DEFAULT_MAP_CENTER } from '../utils/geo';
import { getHazardTitle, HAZARD_STATUS } from '../utils/hazard';
// Fix Leaflet's default icon path issues
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Search, Navigation, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SeverityBadge } from '../components/ui/SeverityBadge';

// Create custom colored icons for severity
const createCustomIcon = (color: string) => {
  return new Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  high: createCustomIcon('red'),
  medium: createCustomIcon('gold'),
  low: createCustomIcon('green'),
};

export function MapPage() {
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const { data: apiHazardsData, error: sbError } = await supabase
          .from('hazards')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (sbError) throw sbError;
        
        const apiHazards: Hazard[] = (apiHazardsData || []).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: getHazardTitle(item),
          severity: item.severity || 'low',
          status: item.status || 'active',
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

  const displayedHazards = useMemo(() => {
    return hazards.filter(h => (h.status as string) !== HAZARD_STATUS.RESOLVED && (severityFilter === 'all' || h.severity === severityFilter));
  }, [hazards, severityFilter]);

  // Calculate risk zones from the current hazards
  const zones = useMemo(() => calculateRiskZones(hazards), [hazards]);

  
  const handleLocate = () => {
    if (mapRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 15);
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">Live Road Map</h1>
            <p className="text-[#9CA3AF] mt-1">Explore reported hazards and road-risk areas in real-time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Map Container Wrapper */}
          <div className="lg:col-span-3 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden relative shadow-inner h-full flex flex-col">
            
            {/* Floating Search/Filter Panel */}
            <div className="absolute top-4 left-4 right-4 md:right-auto z-[1000] bg-[#161A20]/95 backdrop-blur-md rounded-[24px] border border-[rgba(255,255,255,0.08)] p-3 md:w-96 flex flex-col gap-3 shadow-lg pointer-events-auto max-h-[40%] overflow-y-auto scrollbar-hide">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input 
                  type="text" 
                  placeholder="Search locations..." 
                  className="w-full h-[48px] bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[12px] pl-12 pr-4 text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:border-[#FFC629] focus:outline-none transition-colors font-['Inter']"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                {['all', 'high', 'medium', 'low'].map(level => (
                  <button 
                    key={level}
                    onClick={() => setSeverityFilter(level)}
                    className={`snap-center shrink-0 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${
                      severityFilter === level 
                        ? level === 'all' ? 'bg-[#FFC629] border-[#FFC629] text-[#0E1013]' 
                          : level === 'high' ? 'bg-[#EF4444] border-[#EF4444] text-[#0E1013]'
                          : level === 'medium' ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0E1013]'
                          : 'bg-[#22C55E] border-[#22C55E] text-[#0E1013]'
                        : 'bg-[#161A20] border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:text-[#F3F4F6] hover:border-[rgba(255,255,255,0.2)]'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Action Buttons */}
            <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3 pointer-events-none items-end">
              <button 
                onClick={handleLocate}
                className="pointer-events-auto w-[48px] h-[48px] rounded-full bg-[#161A20] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#F3F4F6] shadow-lg hover:border-[#FFC629]/50 transition-colors"
                title="My Location"
              >
                <Navigation className="w-5 h-5" />
              </button>
              <Link to="/report" className="pointer-events-auto flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#FFC629] text-[#0E1013] shadow-lg hover:opacity-90 transition-opacity font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="hidden md:inline">Report Hazard</span>
              </Link>
            </div>

            <MapContainer 
              center={DEFAULT_MAP_CENTER} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={false}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render Risk Zones */}
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
              
              {displayedHazards.map((hazard) => {
                const iconKey = (hazard.severity && icons[hazard.severity]) ? hazard.severity : 'low';
                return (
                  <Marker 
                    key={hazard.id} 
                    position={[hazard.latitude, hazard.longitude]}
                    icon={icons[iconKey]}
                    eventHandlers={{
                      click: () => setSelectedHazard(hazard),
                    }}
                  >
                    <Popup className="roadguard-popup">
                      <div className="p-1">
                        {hazard.imageUrl && (
                          <img src={hazard.imageUrl} alt={hazard.type} className="w-full h-24 object-cover rounded-xl mb-3" />
                        )}
                        <h4 className="font-bold text-[#F3F4F6] m-0 text-sm font-['Sora',sans-serif]">{hazard.type}</h4>
                        <p className="text-xs text-[#9CA3AF] m-0 mt-1 mb-2 leading-relaxed">{hazard.location}</p>
                        
                        <div className="flex items-center gap-2 mt-3 mb-2">
                           <SeverityBadge severity={hazard.severity} />
                        </div>

                        <p className="text-xs text-[#9CA3AF] m-0 mt-2">Status: <span className="text-[#F3F4F6] capitalize">{hazard.status}</span></p>
                        {hazard.createdAt && (
                          <p className="text-xs text-[#9CA3AF] m-0 mt-1">Reported: {new Date(hazard.createdAt).toLocaleDateString()}</p>
                        )}
                        {(hazard as any).ai_detections && (
                          <p className="text-xs text-[#FFC629] font-medium m-0 mt-1">AI Detected</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
            
            <MapLegend />
          </div>

          {/* Side Panel */}
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 overflow-y-auto h-full flex flex-col">
            <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">Nearby Hazards</h3>
            
            <div className="space-y-4 flex-1">
              {isLoading ? (
                <div className="p-4 text-center text-[#9CA3AF]">Loading hazards...</div>
              ) : error ? (
                <div className="p-4 text-center text-[#EF4444]">{error}</div>
              ) : displayedHazards.length === 0 ? (
                <div className="p-4 text-center text-[#9CA3AF]">No hazards found for current filter</div>
              ) : selectedHazard ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <button className="text-sm text-[#FFC629] font-bold hover:underline" onClick={() => setSelectedHazard(null)}>
                      ← Back to list
                    </button>
                  </div>
                  <HazardCard hazard={selectedHazard} />
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedHazards.map(hazard => (
                    <div 
                      key={hazard.id} 
                      className="p-4 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[16px] cursor-pointer hover:border-[#FFC629]/50 transition-colors"
                      onClick={() => setSelectedHazard(hazard)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[#F3F4F6] text-sm font-['Sora',sans-serif]">{hazard.type}</h4>
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 shadow-lg ${
                          hazard.severity === 'high' ? 'bg-[#EF4444] shadow-[#EF4444]/50' :
                          hazard.severity === 'medium' ? 'bg-[#F59E0B] shadow-[#F59E0B]/50' : 'bg-[#22C55E] shadow-[#22C55E]/50'
                        }`}></div>
                      </div>
                      <p className="text-xs text-[#9CA3AF] line-clamp-1 leading-relaxed">{hazard.location}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
