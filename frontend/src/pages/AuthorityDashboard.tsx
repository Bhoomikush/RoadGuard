import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { HazardCard } from '../components/domain/HazardCard';
import { StatCard } from '../components/ui/StatCard';
import type { Hazard } from '../types';
import { supabase } from '../lib/supabase';
import { FileText, AlertCircle, Clock, CheckCircle, Search } from 'lucide-react';

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

  return (
    <DashboardLayout>
      <PageHeader 
        title="Authority Dashboard" 
        description="Review and manage reported road hazards."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Reports" value={totalReports} icon={FileText} />
        <StatCard title="Reported" value={reportedCount} icon={AlertCircle} />
        <StatCard title="Under Review" value={underReviewCount} icon={Search} />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} />
        <StatCard title="Resolved" value={resolvedCount} icon={CheckCircle} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => {
            let label = "Reported";
            let colorClass = "bg-yellow-900/80 text-yellow-300 border-yellow-500/50"; // reported/pending

            const statusStr = report.status as string;
            
            if (statusStr === 'under_review') {
              label = "Under Review";
              colorClass = "bg-blue-900/80 text-blue-300 border-blue-500/50";
            } else if (statusStr === 'in_progress') {
              label = "In Progress";
              colorClass = "bg-orange-900/80 text-orange-300 border-orange-500/50";
            } else if (statusStr === 'resolved') {
              label = "Resolved";
              colorClass = "bg-green-900/80 text-green-300 border-green-500/50";
            }

            return (
              <div key={report.id} className="relative group flex flex-col">
                <div className="flex-1">
                  <HazardCard hazard={report} />
                </div>
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass} backdrop-blur-sm shadow-sm inline-block`}>
                    {label}
                  </span>
                </div>
                
                <div className="mt-3 p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Set Status:</span>
                    <select
                      disabled={updatingId === report.id}
                      value={statusStr}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className="bg-slate-900 border border-slate-600 text-slate-200 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 p-1.5 outline-none disabled:opacity-50 min-w-[130px]"
                    >
                      <option value="pending">Reported</option>
                      <option value="under_review">Under Review</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  {updatingId === report.id && (
                    <div className="text-xs text-teal-400 mt-2 text-right animate-pulse">Updating database...</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6">
            <div className="w-10 h-10 border-4 border-dashed border-slate-700 rounded-full"></div>
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">No hazards found</h3>
          <p className="text-slate-400 max-w-sm mb-6">There are currently no hazards reported in the system.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
