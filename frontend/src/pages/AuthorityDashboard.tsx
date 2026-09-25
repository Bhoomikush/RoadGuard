import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Hazard } from '../types';
import { supabase } from '../lib/supabase';
import { FileText, AlertCircle, Clock, CheckCircle, Search, MapPin } from 'lucide-react';

export function AuthorityDashboard() {
  const [reports, setReports] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
        setError(err.message || 'Failed to fetch hazards');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHazards();
  }, []);

  const handleStatusChange = async (hazardId: string, newStatus: string) => {
    if (!['pending', 'under_review', 'in_progress', 'resolved'].includes(newStatus)) {
      return;
    }
    
    setUpdatingId(hazardId);
    try {
      const { error: updateError } = await supabase
        .from('hazards')
        .update({ status: newStatus })
        .eq('id', hazardId);
        
      if (updateError) throw updateError;
      
      setReports(prev => prev.map(r => r.id === hazardId ? { ...r, status: newStatus as any } : r));
    } catch (err: any) {
      alert(`Failed to update status: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const totalReports = reports.length;
  const reportedCount = reports.filter(r => (r.status as string) === 'pending').length;
  const underReviewCount = reports.filter(r => (r.status as string) === 'under_review').length;
  const inProgressCount = reports.filter(r => (r.status as string) === 'in_progress').length;
  const resolvedCount = reports.filter(r => (r.status as string) === 'resolved').length;

  const StatCardPhase8 = ({ title, value, icon: Icon }: { title: string, value: number, icon: any }) => (
    <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 flex flex-col justify-between h-full min-h-[140px]">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[#9CA3AF] text-[15px] font-medium">{title}</h3>
        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#FFC629]" />
        </div>
      </div>
      <div className="text-4xl font-['Sora',sans-serif] font-bold text-[#F3F4F6]">{value}</div>
    </div>
  );

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
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20 space-y-8">
        <div>
          <h1 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Authority Dashboard</h1>
          <p className="text-[#9CA3AF] text-sm">Review and manage reported road hazards.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCardPhase8 title="Total Reports" value={totalReports} icon={FileText} />
          <StatCardPhase8 title="Reported" value={reportedCount} icon={AlertCircle} />
          <StatCardPhase8 title="Under Review" value={underReviewCount} icon={Search} />
          <StatCardPhase8 title="In Progress" value={inProgressCount} icon={Clock} />
          <StatCardPhase8 title="Resolved" value={resolvedCount} icon={CheckCircle} />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[24px] p-5 text-[#EF4444]">
            {error}
          </div>
        ) : reports.length > 0 ? (
          <div className="flex flex-col gap-4">
            {reports.map(report => {
              const confidence = getAiConfidence(report);
              const statusStr = report.status as string;
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

                    <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between">
                      <span className="text-sm font-medium text-[#9CA3AF]">Update Status:</span>
                      <div className="flex items-center gap-3">
                        {updatingId === report.id && (
                          <span className="text-xs text-[#FFC629] animate-pulse">Updating...</span>
                        )}
                        <select
                          disabled={updatingId === report.id}
                          value={statusStr}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className="bg-[#0E1013] border border-[rgba(255,255,255,0.08)] text-[#F3F4F6] text-sm rounded-lg focus:ring-1 focus:ring-[#FFC629] focus:border-[#FFC629] p-2 outline-none disabled:opacity-50 min-w-[140px]"
                        >
                          <option value="pending">Reported</option>
                          <option value="under_review">Under Review</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {report.imageUrl && (
                    <div className="shrink-0 sm:w-[160px] h-[160px] w-full rounded-[12px] overflow-hidden bg-[#0E1013] border border-[rgba(255,255,255,0.04)]">
                      <img src={report.imageUrl} alt={report.type} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">No hazards found</h3>
            <p className="text-[#9CA3AF] max-w-sm mx-auto text-sm">There are currently no hazards reported in the system.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
