import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import { calculateRiskZones } from '../utils/geo';
import { FileText, AlertTriangle, CheckCircle, Activity, BarChart2 } from 'lucide-react';
import type { Hazard } from '../types';
import { getHazardTitle, HAZARD_STATUS, HAZARD_SEVERITY } from '../utils/hazard';

export function AnalyticsPage() {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHazards = async () => {
      try {
        const { data, error: sbError } = await supabase
          .from('hazards')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (sbError) throw sbError;
        
        const apiHazards: Hazard[] = (data || []).map((item: any) => ({
          id: item.id?.toString() || Math.random().toString(),
          type: getHazardTitle(item),
          severity: item.severity || HAZARD_SEVERITY.LOW,
          status: item.status || 'pending',
          latitude: item.latitude,
          longitude: item.longitude,
          location: `Lat: ${item.latitude}, Lng: ${item.longitude}`,
          imageUrl: item.image_url,
          createdAt: item.created_at || new Date().toISOString(),
        }));
        setHazards(apiHazards);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHazards();
  }, []);

  const riskZones = useMemo(() => calculateRiskZones(hazards), [hazards]);

  // KPIs
  const totalReports = hazards.length;
  const activeReports = hazards.filter(h => String(h.status || '').toLowerCase() !== 'resolved').length;
  const resolvedReports = totalReports - activeReports;
  const activeRiskZonesCount = riskZones.length;

  // By Severity
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  hazards.forEach(h => {
    const sev = String(h.severity || 'low').toLowerCase();
    if (sev in bySeverity) bySeverity[sev as keyof typeof bySeverity]++;
  });

  // By Status
  const byStatus = { pending: 0, under_review: 0, in_progress: 0, resolved: 0 };
  hazards.forEach(h => {
    const st = String(h.status || HAZARD_STATUS.PENDING).toLowerCase();
    if (st === HAZARD_STATUS.UNDER_REVIEW || st === 'under review') byStatus.under_review++;
    else if (st === HAZARD_STATUS.IN_PROGRESS || st === 'in progress') byStatus.in_progress++;
    else if (st in byStatus) byStatus[st as keyof typeof byStatus]++;
  });

  // Over Time
  const reportsByDate: Record<string, number> = {};
  hazards.forEach(h => {
    let dateStr = 'Unknown';
    if (h.createdAt) {
      try {
        const d = new Date(h.createdAt);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      } catch (e) {
        // Fallback to unknown if parsing fails
      }
    }
    reportsByDate[dateStr] = (reportsByDate[dateStr] || 0) + 1;
  });
  const dateEntries = Object.entries(reportsByDate).sort((a, b) => a[0].localeCompare(b[0]));
  const maxPerDate = Math.max(1, ...dateEntries.map(e => e[1]));

  // Risk Zone Overview
  const highRiskZones = riskZones.filter(z => (z.level as string).toUpperCase() === 'HIGH' || (z.level as string).toUpperCase() === 'CRITICAL').length;
  const mediumRiskZones = riskZones.filter(z => (z.level as string).toUpperCase() === 'MEDIUM').length;
  const lowRiskZones = riskZones.filter(z => (z.level as string).toUpperCase() === 'LOW').length;

  const StatCardPhase7 = ({ title, value, icon: Icon }: { title: string, value: number, icon: any }) => (
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20 space-y-6">
        <div>
          <h1 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Analytics</h1>
          <p className="text-[#9CA3AF] text-sm">Comprehensive insights into road hazards and risk zones.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-[#FFC629] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[24px] p-5 text-[#EF4444]">
            <p>Error loading analytics: {error}</p>
          </div>
        ) : totalReports === 0 ? (
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
              <BarChart2 className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">No Data Available</h3>
            <p className="text-[#9CA3AF] max-w-md text-sm">There are currently no hazards reported in the database to analyze.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCardPhase7 title="Total Reports" value={totalReports} icon={FileText} />
              <StatCardPhase7 title="Active Reports" value={activeReports} icon={AlertTriangle} />
              <StatCardPhase7 title="Resolved Reports" value={resolvedReports} icon={CheckCircle} />
              <StatCardPhase7 title="Active Risk Zones" value={activeRiskZonesCount} icon={Activity} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Severity Breakdown */}
              <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 lg:p-8">
                <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-6">Reports by Severity</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Low', count: bySeverity.low, color: 'bg-[#22C55E]' },
                    { label: 'Medium', count: bySeverity.medium, color: 'bg-[#F59E0B]' },
                    { label: 'High', count: bySeverity.high, color: 'bg-[#EF4444]' },
                    { label: 'Critical', count: bySeverity.critical, color: 'bg-[#EF4444]' }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[15px] mb-2">
                        <span className="text-[#F3F4F6] font-medium">{item.label}</span>
                        <span className="text-[#9CA3AF]">{item.count}</span>
                      </div>
                      <div className="w-full bg-[#0E1013] rounded-full h-2.5 border border-[rgba(255,255,255,0.04)]">
                        <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${Math.max(2, (item.count / totalReports) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 lg:p-8">
                <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-6">Reports by Status</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Reported', count: byStatus.pending, color: 'bg-[#9CA3AF]' },
                    { label: 'Under Review', count: byStatus.under_review, color: 'bg-[#F59E0B]' },
                    { label: 'In Progress', count: byStatus.in_progress, color: 'bg-[#3B82F6]' },
                    { label: 'Resolved', count: byStatus.resolved, color: 'bg-[#22C55E]' }
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[15px] mb-2">
                        <span className="text-[#F3F4F6] font-medium">{item.label}</span>
                        <span className="text-[#9CA3AF]">{item.count}</span>
                      </div>
                      <div className="w-full bg-[#0E1013] rounded-full h-2.5 border border-[rgba(255,255,255,0.04)]">
                        <div className={`${item.color} h-full rounded-full transition-all`} style={{ width: `${Math.max(2, (item.count / totalReports) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reports Over Time */}
              <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 lg:p-8">
                <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-6">Reports Over Time</h3>
                <div className="relative h-[220px] w-full">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-full h-px bg-[rgba(255,255,255,0.05)]"></div>
                    ))}
                  </div>
                  
                  <div className="absolute inset-0 flex items-end h-[calc(100%-32px)] gap-2 pb-0 overflow-x-auto overflow-y-hidden z-10 px-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)]">
                    {dateEntries.length > 0 ? dateEntries.map(([date, count]) => {
                      const heightPct = Math.max(5, (count / maxPerDate) * 100);
                      return (
                        <div key={date} className="flex flex-col justify-end items-center flex-1 min-w-[32px] group h-full relative cursor-default">
                          <div className="absolute -top-8 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] text-[#F3F4F6] text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                            {count} reports
                          </div>
                          <div 
                            className="w-full max-w-[24px] bg-[#FFC629] rounded-t-[4px] opacity-80 group-hover:opacity-100 transition-opacity"
                            style={{ height: `${heightPct}%` }}
                          ></div>
                          <div className="absolute -bottom-7 text-[10px] text-[#9CA3AF] truncate w-[50px] text-center" title={date}>
                            {date.length > 5 ? date.slice(5) : date}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-sm">
                        No timeline data
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk Zone Overview */}
              <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">Risk Zone Overview</h3>
                  <p className="text-[#9CA3AF] text-sm mb-6">Aggregated from active hazards.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[rgba(255,255,255,0.02)] p-5 rounded-[16px] border border-[rgba(255,255,255,0.04)] text-center flex flex-col justify-center min-h-[110px]">
                    <div className="text-4xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-1">{activeRiskZonesCount}</div>
                    <div className="text-sm font-medium text-[#9CA3AF]">Active Zones</div>
                  </div>
                  <div className="bg-[#EF4444]/10 p-5 rounded-[16px] border border-[#EF4444]/20 text-center flex flex-col justify-center min-h-[110px]">
                    <div className="text-4xl font-['Sora',sans-serif] font-bold text-[#EF4444] mb-1">{highRiskZones}</div>
                    <div className="text-sm font-medium text-[#EF4444]/80">High Risk</div>
                  </div>
                  <div className="bg-[#F59E0B]/10 p-5 rounded-[16px] border border-[#F59E0B]/20 text-center flex flex-col justify-center min-h-[110px]">
                    <div className="text-3xl font-['Sora',sans-serif] font-bold text-[#F59E0B] mb-1">{mediumRiskZones}</div>
                    <div className="text-sm font-medium text-[#F59E0B]/80">Medium Risk</div>
                  </div>
                  <div className="bg-[#22C55E]/10 p-5 rounded-[16px] border border-[#22C55E]/20 text-center flex flex-col justify-center min-h-[110px]">
                    <div className="text-3xl font-['Sora',sans-serif] font-bold text-[#22C55E] mb-1">{lowRiskZones}</div>
                    <div className="text-sm font-medium text-[#22C55E]/80">Low Risk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
