import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeedHazard {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'under-repair' | 'fixed' | 'invalid';
  image_url: string;
  ai_detections: any;
  created_at: string;
  latitude: number;
  longitude: number;
}

const severityConfig = {
  low: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', label: 'Low Severity' },
  medium: { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', label: 'Medium Severity' },
  high: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: 'High Severity' },
};

const statusConfig = {
  active: { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', icon: AlertCircle, label: 'Active' },
  'under-repair': { color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10', icon: AlertTriangle, label: 'Under Repair' },
  fixed: { color: 'text-[#10B981]', bg: 'bg-[#10B981]/10', icon: CheckCircle2, label: 'Fixed' },
  invalid: { color: 'text-[#9CA3AF]', bg: 'bg-[#9CA3AF]/10', icon: ShieldAlert, label: 'Invalid' },
};

export function CommunityFeedPage() {
  const [hazards, setHazards] = useState<FeedHazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data, error: fetchError } = await supabase
          .from('hazards')
          .select('id, description, severity, status, image_url, ai_detections, created_at, latitude, longitude')
          .order('created_at', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;
        setHazards(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load community feed.');
      } finally {
        setLoading(false);
      }
    }

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#FFC629]/20 border-t-[#FFC629] rounded-full animate-spin mb-4" />
        <p className="text-[#9CA3AF]">Loading community feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl p-6 text-center max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-[#F3F4F6] mb-2">Oops! Something went wrong</h3>
        <p className="text-[#9CA3AF]">{error}</p>
      </div>
    );
  }

  if (hazards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-[#161A20] flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-[#FFC629]" />
        </div>
        <h2 className="text-2xl font-bold text-[#F3F4F6] mb-2 font-['Sora',sans-serif]">No Reports Yet</h2>
        <p className="text-[#9CA3AF] max-w-md">
          The community feed is currently empty. Check back later for new road hazard reports.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#F3F4F6] font-['Sora',sans-serif] tracking-tight">
          Community Feed
        </h1>
        <p className="text-[#9CA3AF] mt-2">
          Recent road hazards reported by the RoadGuard community.
        </p>
      </div>

      <div className="space-y-6">
        {hazards.map((hazard) => {
          const sev = severityConfig[hazard.severity] || severityConfig.medium;
          const stat = statusConfig[hazard.status] || statusConfig.active;
          const StatusIcon = stat.icon;
          
          let aiClasses: string[] = [];
          if (hazard.ai_detections && Array.isArray(hazard.ai_detections)) {
             aiClasses = hazard.ai_detections
               .filter(d => d && typeof d === 'object' && d.class_name)
               .map(d => d.class_name);
          }

          return (
            <div key={hazard.id} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.12)] transition-colors">
              {hazard.image_url && (
                <div className="relative w-full h-64 bg-[#0E1013]">
                  <img 
                    src={hazard.image_url} 
                    alt="Hazard" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161A20] via-transparent to-transparent" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${sev.bg} ${sev.color}`}>
                    {sev.label}
                  </span>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${stat.bg} ${stat.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {stat.label}
                  </span>
                </div>

                <p className="text-[#F3F4F6] text-lg mb-6 leading-relaxed">
                  {hazard.description || 'No description provided.'}
                </p>

                {aiClasses.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider mb-2">AI Detections</h4>
                    <div className="flex flex-wrap gap-2">
                      {aiClasses.map((cls, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-[#222730] border border-[rgba(255,255,255,0.05)] text-[#E5E7EB] text-sm">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[rgba(255,255,255,0.08)] text-sm text-[#9CA3AF]">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(hazard.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Location reported</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
