import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { MapLegend } from '../components/domain/MapLegend';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HazardCard } from '../components/domain/HazardCard';
import type { Hazard } from '../types';

import { supabase } from '../lib/supabase';

// Fix Leaflet's default icon path issues
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

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
          type: item.description || 'Unknown Hazard',
          severity: item.severity || 'low',
          status: item.status || 'active',
          latitude: item.latitude,
          longitude: item.longitude,
          location: `Lat: ${item.latitude?.toFixed(4)}, Lng: ${item.longitude?.toFixed(4)}`,
          imageUrl: item.image_url,
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

  const center: [number, number] = [23.1765, 75.7885]; // Ujjain, Madhya Pradesh, India

  return (
    <DashboardLayout>
      <PageHeader 
        title="Live Road Map" 
        description="Explore reported hazards and road-risk areas in real-time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-inner h-full">
          <MapContainer 
            center={center} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {hazards.map((hazard) => {
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
                        <img src={hazard.imageUrl} alt={hazard.type} className="w-full h-24 object-cover rounded mb-2" />
                      )}
                      <h4 className="font-bold text-slate-900 m-0 text-sm">{hazard.type}</h4>
                      <p className="text-xs text-slate-600 m-0 mt-1">{hazard.location}</p>
                      
                      <div className="flex items-center gap-2 mt-2 mb-1">
                         <span className={`text-xs font-bold uppercase ${
                            hazard.severity === 'high' ? 'text-red-600' :
                            hazard.severity === 'medium' ? 'text-orange-500' :
                            'text-green-600'
                         }`}>
                           {hazard.severity} Risk
                         </span>
                      </div>

                      <p className="text-xs text-slate-600 m-0 mt-1">Status: {hazard.status}</p>
                      {hazard.createdAt && (
                        <p className="text-xs text-slate-500 m-0 mt-1">Reported: {new Date(hazard.createdAt).toLocaleDateString()}</p>
                      )}
                      {(hazard as any).ai_detections && (
                        <p className="text-xs text-teal-600 font-medium m-0 mt-1">AI Detected</p>
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
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 overflow-y-auto h-full flex flex-col">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Nearby Hazards</h3>
          
          <div className="space-y-4 flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-slate-400">Loading hazards...</div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : hazards.length === 0 ? (
              <div className="p-4 text-center text-slate-400">No hazards reported yet</div>
            ) : selectedHazard ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-teal-500 font-medium cursor-pointer hover:underline" onClick={() => setSelectedHazard(null)}>
                    ← Back to list
                  </span>
                </div>
                <HazardCard hazard={selectedHazard} />
              </div>
            ) : (
              <div className="space-y-3">
                {hazards.map(hazard => (
                  <div 
                    key={hazard.id} 
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-teal-500/50 transition-colors"
                    onClick={() => setSelectedHazard(hazard)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-200 text-sm">{hazard.type}</h4>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                        hazard.severity === 'high' ? 'bg-red-500' :
                        hazard.severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{hazard.location}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        /* Custom styles to make leaflet popups dark mode friendly */
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background-color: #f8fafc;
          color: #0f172a;
        }
      `}</style>
    </DashboardLayout>
  );
}
