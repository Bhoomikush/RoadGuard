import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AlertTriangle, MapPin, Activity, CheckCircle, ShieldAlert, Bot, ArrowRight, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import type { Hazard } from '../types';
import ConeMascot from '../components/ConeMascot';
import { calculateRiskZones, DEFAULT_MAP_CENTER } from '../utils/geo';
import { getHazardTitle, HAZARD_STATUS, HAZARD_SEVERITY } from '../utils/hazard';
import type { RiskZone } from '../utils/geo';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

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

export function DashboardPage() {
  const [recentHazards, setRecentHazards] = useState<Hazard[]>([]);
  const [allHazards, setAllHazards] = useState<Hazard[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    highRisk: 0,
    active: 0,
    resolved: 0,
    aiPotholes: 0,
    aiCracks: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = 'Good evening';
      
      if (hour >= 5 && hour < 12) {
        timeGreeting = 'Good morning';
      } else if (hour >= 12 && hour < 17) {
        timeGreeting = 'Good afternoon';
      }

      let displayName = 'RoadGuard';
      if (user?.user_metadata?.name) {
        displayName = user.user_metadata.name.split(' ')[0];
      }

      setGreeting(`${timeGreeting}, ${displayName}.`);
    };

    updateGreeting();
    
    // Check every minute to keep greeting accurate if page is kept open
    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch recent hazards
      const { data: recentData, error: recentError } = await supabase
        .from('hazards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
        
      if (recentError) throw recentError;
      
      const mapHazardData = (item: any): Hazard => {
        return {
          id: item.id?.toString() || Math.random().toString(),
          type: getHazardTitle(item),
          severity: item.severity || HAZARD_SEVERITY.LOW,
          status: item.status || 'pending',
          latitude: item.latitude,
          longitude: item.longitude,
          location: `Lat: ${item.latitude?.toFixed(4)}, Lng: ${item.longitude?.toFixed(4)}`,
          imageUrl: item.image_url ? supabase.storage.from('hazard-images').getPublicUrl(item.image_url).data.publicUrl : undefined,
          createdAt: item.created_at || new Date().toISOString(),
          ai_detections: item.ai_detections
        } as unknown as Hazard;
      };

      const mappedHazards: Hazard[] = (recentData || []).map(mapHazardData);
      
      setRecentHazards(mappedHazards);

      // Fetch stats and map data
      const { data: allData, error: statsError } = await supabase
        .from('hazards')
        .select('*');
        
      if (statsError) throw statsError;

      const total = allData?.length || 0;
      const highRisk = allData?.filter(h => h.severity === HAZARD_SEVERITY.HIGH).length || 0;
      const resolved = allData?.filter(h => (h.status as string) === HAZARD_STATUS.RESOLVED).length || 0;
      const active = total - resolved;
      const aiPotholes = allData?.filter(h => h.ai_detections && Array.isArray(h.ai_detections) && h.ai_detections.some((d: any) => d.class_name === 'pothole')).length || 0;
      const aiCracks = allData?.filter(h => h.ai_detections && Array.isArray(h.ai_detections) && h.ai_detections.some((d: any) => d.class_name === 'crack')).length || 0;

      setStats({ total, highRisk, active, resolved, aiPotholes, aiCracks });
      
      const mappedAllHazards: Hazard[] = (allData || []).map(mapHazardData);
      setAllHazards(mappedAllHazards);
      setRiskZones(calculateRiskZones(mappedAllHazards));
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `Just now`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case HAZARD_STATUS.PENDING: return 'Reported';
      case HAZARD_STATUS.UNDER_REVIEW: return 'Under Review';
      case HAZARD_STATUS.IN_PROGRESS: return 'In Progress';
      case HAZARD_STATUS.RESOLVED: return 'Resolved';
      default: return status;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    if (status === HAZARD_STATUS.RESOLVED) return 'success';
    if (status === HAZARD_STATUS.PENDING || status === HAZARD_STATUS.UNDER_REVIEW || status === HAZARD_STATUS.IN_PROGRESS) return 'danger';
    return 'default';
  };

  const recentHazardsCard = (
    <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] flex flex-col min-h-[400px]">
      <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif]">Recent Hazards</h3>
        <Link to="/reports" className="text-sm text-[#FFC629] hover:opacity-80 font-medium">View all</Link>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-[#FFC629] animate-spin mb-4" />
          <p className="text-[#9CA3AF]">Loading recent hazards...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
          </div>
          <p className="text-[#EF4444] mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-lg text-sm font-medium hover:border-[#FFC629]/50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      ) : recentHazards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <ConeMascot size={120} waving={false} title="No hazards reported" />
          <h3 className="text-lg font-semibold text-[#F3F4F6] mt-4 mb-2">No hazards reported yet</h3>
          <p className="text-[#9CA3AF] text-sm max-w-sm">When new hazards are reported by the community, they will appear here.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#9CA3AF] uppercase bg-[#0E1013]/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Hazard</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium">Severity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Reported</th>
                </tr>
              </thead>
              <tbody>
                {recentHazards.map((hazard) => (
                  <tr key={hazard.id} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[#FFC629]/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#F3F4F6]">{hazard.type}</td>
                    <td className="px-6 py-4 text-[#9CA3AF] flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                      <span className="truncate max-w-[200px]">{hazard.location}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        hazard.severity === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' : 
                        hazard.severity === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' : 
                        'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                      }`}>
                        {hazard.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <Badge variant={getStatusBadgeVariant(hazard.status as string)}>
                        {formatStatus(hazard.status as string)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[#9CA3AF]">{timeAgo(hazard.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex md:hidden overflow-x-auto snap-x snap-mandatory gap-4 p-4 pb-6">
            {recentHazards.map((hazard) => (
              <div key={hazard.id} className="min-w-[85%] sm:min-w-[300px] snap-center bg-[#0E1013] rounded-[16px] p-5 border border-[rgba(255,255,255,0.08)]">
                <div className="flex justify-between items-start mb-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    hazard.severity === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 
                    hazard.severity === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 
                    'bg-[#22C55E]/10 text-[#22C55E]'
                  }`}>
                    {hazard.severity} severity
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{timeAgo(hazard.createdAt)}</span>
                </div>
                <h4 className="font-semibold text-[#F3F4F6] text-lg mb-1 truncate">{hazard.type}</h4>
                <p className="text-sm text-[#9CA3AF] flex items-center mb-4">
                  <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
                  <span className="truncate">{hazard.location}</span>
                </p>
                <div className="mt-auto">
                  <Badge variant={getStatusBadgeVariant(hazard.status as string)}>
                    {formatStatus(hazard.status as string)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const reportNewHazardCard = (
    <Link to="/report" className="block w-full bg-gradient-to-br from-[#FFC629] to-[#FF7A1A] rounded-[24px] p-6 text-[#0E1013] hover:opacity-95 transition-opacity group relative overflow-hidden shadow-lg shadow-[#FF7A1A]/20">
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold font-['Sora',sans-serif] mb-1">Report New Hazard</h3>
          <p className="text-[#0E1013]/80 text-sm font-medium">Help keep our roads safe</p>
        </div>
        <div className="w-12 h-12 bg-[#0E1013]/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <ArrowRight className="w-6 h-6" />
        </div>
      </div>
      <AlertTriangle className="absolute -bottom-4 -right-4 w-32 h-32 text-[#0E1013]/10 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />
    </Link>
  );

  const riskOverviewCard = (
    <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-hidden">
      <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif]">Risk Overview</h3>
        {isLoading ? (
           <Loader2 className="w-4 h-4 animate-spin text-[#9CA3AF]" />
        ) : riskZones.some(z => z.level === 'HIGH') ? (
           <span className="text-xs font-bold px-2 py-1 rounded bg-[#EF4444]/20 text-[#EF4444]">HIGH RISK</span>
        ) : riskZones.some(z => z.level === 'MEDIUM') ? (
           <span className="text-xs font-bold px-2 py-1 rounded bg-[#F59E0B]/20 text-[#F59E0B]">MEDIUM RISK</span>
        ) : riskZones.length > 0 ? (
           <span className="text-xs font-bold px-2 py-1 rounded bg-[#22C55E]/20 text-[#22C55E]">LOW RISK</span>
        ) : null}
      </div>
      <div className="p-6">
        <div className="aspect-video bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.08)] flex items-center justify-center relative overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFC629] mb-2" />
              <p className="text-sm text-[#9CA3AF]">Loading map...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center text-center p-4">
              <AlertTriangle className="w-8 h-8 text-[#EF4444] mb-2" />
              <p className="text-sm text-[#EF4444] mb-2">Failed to load map data</p>
              <button onClick={fetchData} className="text-xs px-3 py-1 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded hover:border-[#FFC629]/50 transition-colors">
                Retry
              </button>
            </div>
          ) : riskZones.length === 0 && allHazards.filter(h => (h.status as string) !== HAZARD_STATUS.RESOLVED).length === 0 ? (
            <div className="flex flex-col items-center text-center p-4">
              <ConeMascot size={100} waving={false} title="No active risk zones" />
              <p className="text-sm text-[#9CA3AF] mt-2">No active risk zones yet</p>
            </div>
          ) : (
            <>
              <MapContainer
                center={riskZones.length > 0 ? [riskZones[0].center.lat, riskZones[0].center.lng] : (allHazards.length > 0 && allHazards[0].latitude && allHazards[0].longitude ? [allHazards[0].latitude, allHazards[0].longitude] : DEFAULT_MAP_CENTER)}
                zoom={riskZones.length > 0 ? 14 : 12}
                className="w-full h-full"
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {riskZones.map(zone => (
                  <Circle
                    key={zone.id}
                    center={[zone.center.lat, zone.center.lng]}
                    radius={300}
                    pathOptions={{
                      color: zone.level === 'HIGH' ? '#EF4444' : zone.level === 'MEDIUM' ? '#F59E0B' : '#22C55E',
                      fillColor: zone.level === 'HIGH' ? '#EF4444' : zone.level === 'MEDIUM' ? '#F59E0B' : '#22C55E',
                      fillOpacity: 0.2,
                      weight: 2
                    }}
                  />
                ))}
                {allHazards.filter(h => (h.status as string) !== HAZARD_STATUS.RESOLVED).map(hazard => {
                   const icon = hazard.severity === HAZARD_SEVERITY.HIGH ? icons.high : hazard.severity === HAZARD_SEVERITY.MEDIUM ? icons.medium : icons.low;
                   return (
                     <Marker 
                       key={hazard.id}
                       position={[hazard.latitude || 0, hazard.longitude || 0]}
                       icon={icon}
                     />
                   );
                })}
              </MapContainer>
              <div className="absolute z-[1000] bottom-4 left-1/2 -translate-x-1/2 text-center bg-[#0E1013]/80 px-3 py-1.5 rounded-lg backdrop-blur-md border border-[rgba(255,255,255,0.1)] pointer-events-auto">
                <p className="text-sm font-medium text-[#F3F4F6]">Live Map Preview</p>
                <Link to="/map" className="text-xs text-[#FFC629] hover:underline mt-1 block">Open full map</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const quickActionsCard = (
    <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
      <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">Quick Actions</h3>
      <div className="flex flex-col gap-3">
        <Link to="/map" className="flex items-center p-3 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] hover:border-[#FFC629]/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#FFC629]/10 flex items-center justify-center mr-4">
            <MapPin className="w-5 h-5 text-[#FFC629]" />
          </div>
          <span className="font-medium">View Live Map</span>
        </Link>
        <Link to="/assistant" className="flex items-center p-3 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] hover:border-[#FFC629]/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-[#FFC629]/10 flex items-center justify-center mr-4">
            <Bot className="w-5 h-5 text-[#FFC629]" />
          </div>
          <span className="font-medium">Ask RoadGuard AI</span>
        </Link>
      </div>
    </div>
  );

  const safetyInsightsCard = (
    <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] flex items-center">
          <Sparkles className="w-5 h-5 text-[#FFC629] mr-2" />
          Safety Insights
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-[#FFC629]/10 text-[#FFC629] rounded-full border border-[#FFC629]/20">
          Powered by RoadGuard AI
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0E1013] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
          <p className="text-sm text-[#9CA3AF] mb-1">Potholes</p>
          <p className="text-2xl font-bold text-[#F3F4F6]">{stats.aiPotholes}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">AI detected</p>
        </div>
        <div className="bg-[#0E1013] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
          <p className="text-sm text-[#9CA3AF] mb-1">Cracks</p>
          <p className="text-2xl font-bold text-[#F3F4F6]">{stats.aiCracks}</p>
          <p className="text-xs text-[#9CA3AF] mt-1">AI detected</p>
        </div>
        <div className="bg-[#0E1013] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
          <p className="text-sm text-[#9CA3AF] mb-1">High Risk</p>
          <p className="text-2xl font-bold text-[#F3F4F6]">{stats.highRisk}</p>
        </div>
        <div className="bg-[#0E1013] border border-[rgba(255,255,255,0.05)] rounded-xl p-4">
          <p className="text-sm text-[#9CA3AF] mb-1">Active Reports</p>
          <p className="text-2xl font-bold text-[#F3F4F6]">{stats.active}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6]">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">{greeting || 'Good morning, RoadGuard.'}</h1>
            <p className="text-[#9CA3AF] mt-1">Here's what's happening on the roads.</p>
          </div>
          <div>
            <Link to="/report" className="inline-flex items-center justify-center px-4 py-2 bg-[#FFC629] text-[#0E1013] rounded-lg font-medium hover:opacity-90 transition-opacity">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Report Hazard
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Hazards", value: stats.total.toString(), icon: AlertTriangle },
            { title: "High Risk", value: stats.highRisk.toString(), icon: ShieldAlert },
            { title: "Active Reports", value: stats.active.toString(), icon: Activity },
            { title: "Resolved", value: stats.resolved.toString(), icon: CheckCircle }
          ].map((stat, i) => (
            <div key={i} className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF] mb-1">{stat.title}</p>
                  <h4 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-[#9CA3AF]" /> : stat.value}
                  </h4>
                </div>
                <div className="w-12 h-12 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-[12px] flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#FFC629]" />
                </div>
              </div>
              {/* Removed fake trend data */}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          {reportNewHazardCard}
          {recentHazardsCard}
          {riskOverviewCard}
          {safetyInsightsCard}
          {quickActionsCard}
        </div>

        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          <div className="col-span-2 flex flex-col gap-8">
            {recentHazardsCard}
            {safetyInsightsCard}
          </div>
          <div className="col-span-1 flex flex-col gap-8">
            {reportNewHazardCard}
            {riskOverviewCard}
            {quickActionsCard}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
