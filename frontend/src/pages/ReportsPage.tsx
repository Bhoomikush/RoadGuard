import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Hazard } from '../types';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConeMascot from '../components/ConeMascot';

export function ReportsPage() {
  const [reports, setReports] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          setError('You must be logged in to view your reports.');
          setIsLoading(false);
          return;
        }

        const { data: apiHazardsData, error: sbError } = await supabase
          .from('hazards')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (sbError) throw sbError;
        
        const apiHazards: Hazard[] = (apiHazardsData || []).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: item.description || 'Reported Hazard',
          severity: item.severity || 'low',
          status: item.status || 'pending',
          latitude: item.latitude,
          longitude: item.longitude,
          location: `Lat: ${item.latitude?.toFixed(4)}, Lng: ${item.longitude?.toFixed(4)}`,
          imageUrl: item.image_url ? supabase.storage.from('hazard-images').getPublicUrl(item.image_url).data.publicUrl : undefined,
          createdAt: item.created_at || new Date().toISOString(),
          ai_detections: item.ai_detections
        }));
        setReports(apiHazards);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch reports');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, []);

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getAiConfidence = (report: Hazard) => {
    const r = report as any;
    if (!r.ai_detections || !Array.isArray(r.ai_detections) || r.ai_detections.length === 0) return null;
    const maxConf = Math.max(...r.ai_detections.map((d: any) => d.confidence || 0));
    return maxConf > 0 ? Math.round(maxConf * 100) : null;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">My Reports</h1>
            <p className="text-[#9CA3AF] text-sm">
              {!isLoading && !error && `${reports.length} report${reports.length !== 1 ? 's' : ''} submitted`}
            </p>
          </div>
          <Link to="/report">
            <button className="h-10 px-6 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform flex items-center gap-2">
              Report new hazard
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 h-[160px] animate-pulse flex gap-5">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-1/3 h-6 bg-[rgba(255,255,255,0.05)] rounded mb-3"></div>
                    <div className="w-1/2 h-4 bg-[rgba(255,255,255,0.05)] rounded mb-2"></div>
                  </div>
                  <div className="w-1/4 h-4 bg-[rgba(255,255,255,0.05)] rounded"></div>
                </div>
                <div className="w-[120px] h-[120px] bg-[rgba(255,255,255,0.05)] rounded-[12px] hidden sm:block"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[24px] text-[#EF4444] text-center">
            {error}
          </div>
        ) : reports.length > 0 ? (
          <div className="flex flex-col gap-4">
            {reports.map(report => {
              const confidence = getAiConfidence(report);
              return (
                <div key={report.id} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 flex flex-col sm:flex-row gap-5 hover:border-[rgba(255,255,255,0.15)] transition-colors">
                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-[#F3F4F6] truncate pr-4">{report.type}</h3>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status} />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-auto pt-2">
                      <div className="flex items-center gap-2 text-[#9CA3AF] text-sm">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">{report.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[#9CA3AF] text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Reported {timeAgo(report.createdAt)}</span>
                        </div>
                        {confidence !== null && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                            <span className="w-2 h-2 rounded-full bg-[#FFC629]"></span>
                            <span className="text-xs font-medium text-[#F3F4F6]">AI {confidence}% match</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {report.imageUrl && (
                    <div className="shrink-0 sm:w-[140px] h-[140px] w-full rounded-[12px] overflow-hidden bg-[#0E1013] border border-[rgba(255,255,255,0.04)]">
                      <img src={report.imageUrl} alt={report.type} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px]">
            <div className="mb-6 opacity-80">
              <ConeMascot waving={false} size={120} title="" />
            </div>
            <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">No reports yet</h3>
            <p className="text-[#9CA3AF] max-w-sm mb-8 text-sm leading-relaxed">
              You haven't reported any road hazards. Help make your community safer by submitting your first report.
            </p>
            <Link to="/report">
              <button className="h-12 px-8 rounded-full bg-[#FFC629] text-[#0E1013] font-bold shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform">
                Report a hazard
              </button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
