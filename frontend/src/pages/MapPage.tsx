import { useState, useEffect, useMemo, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MapLegend } from '../components/domain/MapLegend';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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
import axios from 'axios';
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

interface Weather {
  temperature: number;
  precipitation: number;
  wind_speed: number;
  condition: string;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);
  return null;
}

export function MapPage() {
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<any>(null);

  const [weatherCache, setWeatherCache] = useState<Record<string, Weather>>({});
  const [weatherLoading, setWeatherLoading] = useState<Record<string, boolean>>({});
  const [weatherError, setWeatherError] = useState<Record<string, string>>({});

  const fetchWeatherForHazard = async (latitude: number, longitude: number) => {
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    if (weatherCache[key] || weatherLoading[key] || weatherError[key]) return;

    setWeatherLoading(prev => ({ ...prev, [key]: true }));
    setWeatherError(prev => ({ ...prev, [key]: '' }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
      const response = await axios.get(`${backendUrl}/api/hazards/weather`, {
        params: { lat: latitude, lng: longitude },
        headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });
      setWeatherCache(prev => ({ ...prev, [key]: response.data }));
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeatherError(prev => ({ ...prev, [key]: 'Weather unavailable' }));
    } finally {
      setWeatherLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const { data: apiHazardsData, error: sbError } = await supabase
          .from('hazards')
          .select('id, description, severity, status, latitude, longitude, image_url, created_at, ai_detections')
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
    const query = searchQuery.trim().toLowerCase();
    return hazards.filter(h => {
      const isNotResolved = (h.status as string) !== HAZARD_STATUS.RESOLVED;
      const matchesSeverity = severityFilter === 'all' || h.severity === severityFilter;
      const matchesSearch = !query || 
        (h.type ? h.type.toLowerCase().includes(query) : false) || 
        (h.location ? h.location.toLowerCase().includes(query) : false);
      return isNotResolved && matchesSeverity && matchesSearch;
    });
  }, [hazards, severityFilter, searchQuery]);

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
      <div className="fixed inset-0 left-0 lg:left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">Live Road Map</h1>
            <p className="text-[#9CA3AF] mt-1">Explore reported hazards and road-risk areas in real-time.</p>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:h-[calc(100vh-200px)] lg:min-h-[600px]">
          {/* Map Container Wrapper */}
          <div className="lg:col-span-3 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden relative shadow-inner h-[50vh] min-h-[380px] lg:h-full lg:min-h-0 flex flex-col">
            
            {/* Top Compact Floating Controls */}
            <div className="absolute top-3 left-3 right-3 sm:right-auto sm:left-4 sm:top-4 z-[1000] sm:w-[360px] flex flex-col gap-2 pointer-events-auto">
              <div className="relative shadow-xl rounded-2xl overflow-hidden bg-[#161A20]/90 backdrop-blur-md border border-[rgba(255,255,255,0.12)]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input 
                  type="text" 
                  placeholder="Search hazard locations..." 
                  className="w-full h-11 bg-transparent pl-10 pr-4 text-sm text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:outline-none font-['Inter']"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-1.5 p-1 bg-[#161A20]/90 backdrop-blur-md rounded-xl border border-[rgba(255,255,255,0.08)] shadow-lg">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'high', label: 'High' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'low', label: 'Low' },
                ].map(level => (
                  <button 
                    key={level.id}
                    onClick={() => setSeverityFilter(level.id)}
                    className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                      severityFilter === level.id 
                        ? 'bg-[#FFC629] text-[#0E1013] shadow-sm font-bold'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Right Floating Action Buttons */}
            <div className="absolute bottom-4 right-3 sm:right-4 z-[1000] flex flex-col gap-2.5 pointer-events-none items-end">
              <button 
                onClick={handleLocate}
                className="pointer-events-auto w-11 h-11 rounded-full bg-[#161A20]/90 backdrop-blur-md border border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[#F3F4F6] shadow-xl hover:text-[#FFC629] hover:border-[#FFC629] active:scale-95 transition-all"
                title="Center on my location"
                aria-label="Center on my location"
              >
                <Navigation className="w-4 h-4" />
              </button>
              <Link 
                to="/report" 
                className="pointer-events-auto flex items-center justify-center gap-1.5 h-11 px-4 rounded-full bg-[#FFC629] text-[#0E1013] shadow-xl hover:opacity-90 active:scale-95 transition-all font-bold text-xs"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Report</span>
              </Link>
            </div>

            <MapContainer 
              center={DEFAULT_MAP_CENTER} 
              zoom={13} 
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              zoomControl={false}
              ref={mapRef}
            >
              <MapResizer />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                      click: () => {
                        setSelectedHazard(hazard);
                        fetchWeatherForHazard(hazard.latitude, hazard.longitude);
                      },
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

                        {(() => {
                          const key = `${hazard.latitude.toFixed(2)},${hazard.longitude.toFixed(2)}`;
                          const w = weatherCache[key];
                          const loading = weatherLoading[key];
                          const err = weatherError[key];
                          
                          return (
                            <div className="mt-2 bg-[#0E1013] p-2 rounded-lg border border-[rgba(255,255,255,0.08)]">
                              <p className="text-[10px] text-[#9CA3AF] uppercase font-semibold mb-1">Weather</p>
                              {loading ? (
                                <p className="text-xs text-[#F3F4F6]">Loading weather...</p>
                              ) : err ? (
                                <p className="text-xs text-[#EF4444]">{err}</p>
                              ) : w ? (
                                <div>
                                  <p className="text-xs text-[#F3F4F6] font-bold">
                                    {w.temperature}°C • {w.condition}
                                  </p>
                                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                                    Rain: {w.precipitation} mm • Wind: {w.wind_speed} km/h
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-[#9CA3AF]">Click marker to load weather</p>
                              )}
                            </div>
                          );
                        })()}

                        <p className="text-xs text-[#9CA3AF] m-0 mt-3">Status: <span className="text-[#F3F4F6] capitalize">{hazard.status}</span></p>
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
          <div className="lg:col-span-1 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 overflow-y-auto max-h-[450px] lg:max-h-none lg:h-full flex flex-col">
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
