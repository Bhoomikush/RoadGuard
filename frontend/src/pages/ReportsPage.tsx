import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { HazardCard } from '../components/domain/HazardCard';
import type { Hazard } from '../types';

export function ReportsPage() {
  const mockReports: Hazard[] = [
    {
      id: 'REP-001',
      type: 'Large Pothole',
      severity: 'high',
      status: 'active',
      latitude: 34.0522,
      longitude: -118.2437,
      location: '123 Main St, near 4th Ave intersection',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'REP-002',
      type: 'Fallen Tree Branch',
      severity: 'medium',
      status: 'under-repair',
      latitude: 34.0622,
      longitude: -118.2537,
      location: 'Oak Drive, outside Central Park',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
      imageUrl: 'https://images.unsplash.com/photo-1605553255394-bb969ce74390?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'REP-003',
      type: 'Faded Crosswalk',
      severity: 'low',
      status: 'fixed',
      latitude: 34.0422,
      longitude: -118.2337,
      location: 'Washington Blvd & 10th St',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
    }
  ];

  return (
    <DashboardLayout>
      <PageHeader 
        title="My Reports" 
        description="Track the status and impact of the hazards you've reported to the community."
      />

      {mockReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockReports.map(report => (
            <HazardCard key={report.id} hazard={report} />
          ))}
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
