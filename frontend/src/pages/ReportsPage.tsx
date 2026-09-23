import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { HazardCard } from '../components/domain/HazardCard';
import type { Hazard } from '../types';
import { supabase } from '../lib/supabase';

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

  return (
    <DashboardLayout>
      <PageHeader 
        title="My Reports" 
        description="Track the status and impact of the hazards you've reported to the community."
      />

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
              <div key={report.id} className="relative group">
                <HazardCard hazard={report} />
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClass} backdrop-blur-sm shadow-sm inline-block`}>
                    {label}
                  </span>
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
          <h3 className="text-xl font-semibold text-slate-200 mb-2">No reports yet</h3>
          <p className="text-slate-400 max-w-sm mb-6">You haven't reported any road hazards. Help make your community safer by submitting your first report.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
