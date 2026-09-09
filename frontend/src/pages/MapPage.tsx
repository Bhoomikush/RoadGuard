import { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { MapLegend } from '../components/domain/MapLegend';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HazardCard } from '../components/domain/HazardCard';
import type { Hazard } from '../types';

// Fix Leaflet's default icon path issues
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

  const mockHazards: Hazard[] = [
    {
      id: 'HZ-1042',
      type: 'Deep Pothole',
      severity: 'high',
      status: 'active',
      latitude: 34.0522,
      longitude: -118.2437,
      location: 'Main St & 4th Ave',
      createdAt: new Date().toISOString(),
      confidence: 96
    },
    {
      id: 'HZ-1041',
      type: 'Fallen Branch',
      severity: 'medium',
      status: 'under-repair',
      latitude: 34.0622,
      longitude: -118.2537,
      location: 'Oak Rd',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'HZ-1040',
      type: 'Faded Crossing',
      severity: 'low',
      status: 'fixed',
      latitude: 34.0422,
      longitude: -118.2337,
      location: 'School District',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    }
  ];

  const center: [number, number] = [34.0522, -118.2437]; // Los Angeles

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
            {/* Dark mode map tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            {mockHazards.map(hazard => (
              <Marker 
                key={hazard.id} 
                position={[hazard.latitude, hazard.longitude]}
                icon={icons[hazard.severity]}
                eventHandlers={{
                  click: () => setSelectedHazard(hazard),
                }}
              >
                <Popup className="roadguard-popup">
                  <div className="p-1">
                    <h4 className="font-bold text-slate-900 m-0 text-sm">{hazard.type}</h4>
                    <p className="text-xs text-slate-600 m-0 mt-1">{hazard.location}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          <MapLegend />
        </div>

        {/* Side Panel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 overflow-y-auto h-full flex flex-col">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Nearby Hazards</h3>
          
          <div className="space-y-4 flex-1">
            {selectedHazard ? (
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
                {mockHazards.map(hazard => (
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
