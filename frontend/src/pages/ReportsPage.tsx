import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Hazard } from '../types';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, ArrowRight, Sparkles, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConeMascot from '../components/ConeMascot';
import { getHazardTitle, HAZARD_STATUS, HAZARD_SEVERITY } from '../utils/hazard';

export function ReportsPage() {
  const [reports, setReports] = useState<Hazard[]>([]);
  const [filter, setFilter] = useState<string>('All');
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
        
        const apiHazards: Hazard[] = (apiHazardsData || []).map((item: any) => {
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
          };
        });
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

  const filterOptions = ['All', 'Reported', 'Under Review', 'In Progress', 'Resolved'];

  const filteredReports = reports.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Reported' && (r.status as string) === HAZARD_STATUS.PENDING) return true;
    if (filter === 'Under Review' && (r.status as string) === HAZARD_STATUS.UNDER_REVIEW) return true;
    if (filter === 'In Progress' && (r.status as string) === HAZARD_STATUS.IN_PROGRESS) return true;
    if (filter === 'Resolved' && (r.status as string) === HAZARD_STATUS.RESOLVED) return true;
    return false;
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">My Reports</h1>
            <p className="text-[#9CA3AF] text-sm">
              Track the hazards you've reported and their progress.
            </p>
          </div>
          <Link to="/report" className="w-full md:w-auto">
            <button className="w-full h-12 md:h-10 px-6 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform flex items-center justify-center gap-2">
              Report new hazard
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {!isLoading && !error && reports.length > 0 && (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-2 pb-6 mb-2 scrollbar-hide">
            {filterOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === opt 
                    ? 'bg-[#FFC629] text-[#0E1013]' 
                    : 'bg-[#161A20] text-[#9CA3AF] border border-[rgba(255,255,255,0.08)] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden flex flex-col sm:flex-row animate-pulse">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="w-1/3 h-6 bg-[rgba(255,255,255,0.05)] rounded mb-4"></div>
                    <div className="w-1/2 h-4 bg-[rgba(255,255,255,0.05)] rounded mb-2"></div>
                  </div>
                  <div className="w-1/4 h-4 bg-[rgba(255,255,255,0.05)] rounded mt-8"></div>
                </div>
                <div className="w-full sm:w-[240px] h-[200px] sm:h-auto bg-[rgba(255,255,255,0.05)] hidden sm:block"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
            </div>
            <h3 className="text-xl font-bold text-[#F3F4F6] mb-2">Failed to load reports</h3>
            <p className="text-[#9CA3AF] max-w-sm mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-2.5 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-full text-sm font-medium hover:border-[#FFC629]/50 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="flex flex-col gap-6">
            <p className="text-sm font-medium text-[#9CA3AF] mb-2">
              Showing {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </p>
            {filteredReports.map(report => {
              const confidence = getAiConfidence(report);
              return (
                <div key={report.id} className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] overflow-hidden flex flex-col sm:flex-row group hover:border-[#FFC629]/30 transition-colors">
                  <div className="p-6 flex-1 flex flex-col min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                      <h3 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6] truncate pr-4">{report.type}</h3>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <SeverityBadge severity={report.severity} />
                        <StatusBadge status={report.status as any} />
                      </div>
                    </div>
                    
                    <div className="space-y-3 mt-auto">
                      <div className="flex items-start gap-2 text-[#9CA3AF] text-sm">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{report.location}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-[#9CA3AF] text-sm pt-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>Reported {timeAgo(report.createdAt)}</span>
                        </div>
                        {confidence !== null && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)]">
                            <Sparkles className="w-3 h-3 text-[#FFC629]" />
                            <span className="text-xs font-medium text-[#F3F4F6]">AI detected • {confidence}% confidence</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {report.imageUrl && (
                    <div className="shrink-0 sm:w-[280px] h-[220px] sm:h-auto w-full border-t sm:border-t-0 sm:border-l border-[rgba(255,255,255,0.08)] overflow-hidden bg-[#0E1013] relative">
                      <img src={report.imageUrl} alt={report.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px]">
            <div className="mb-6 opacity-80">
              <ConeMascot waving={false} size={120} title="No hazards reported" />
            </div>
            <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">
              {filter === 'All' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}
            </h3>
            <p className="text-[#9CA3AF] max-w-sm mb-8 text-sm leading-relaxed">
              {filter === 'All' 
                ? "You haven't reported any road hazards. Help make your community safer by submitting your first report."
                : `You don't have any reports that are currently ${filter.toLowerCase()}.`}
            </p>
            {filter === 'All' ? (
              <Link to="/report">
                <button className="h-12 px-8 rounded-full bg-[#FFC629] text-[#0E1013] font-bold shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform">
                  Report a hazard
                </button>
              </Link>
            ) : (
              <button 
                onClick={() => setFilter('All')}
                className="h-10 px-6 rounded-full bg-[rgba(255,255,255,0.05)] text-[#F3F4F6] font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
