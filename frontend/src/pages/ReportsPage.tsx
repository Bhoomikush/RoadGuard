import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import type { Hazard, VoiceComplaint } from '../types';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Clock, ArrowRight, Sparkles, AlertTriangle, Mic, Mail, Globe, 
  ChevronDown, ChevronUp, Copy, Check, FileText 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ConeMascot from '../components/ConeMascot';
import { getHazardTitle, HAZARD_STATUS, HAZARD_SEVERITY } from '../utils/hazard';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'hazards' | 'complaints'>('hazards');
  const [reports, setReports] = useState<Hazard[]>([]);
  const [complaintsList, setComplaintsList] = useState<VoiceComplaint[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded complaint letters
  const [expandedComplaintIds, setExpandedComplaintIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hazard complaint generation states
  const [complaintStates, setComplaintStates] = useState<Record<string, { loading: boolean, error: string | null, data: any | null }>>({});
  const [sendStates, setSendStates] = useState<Record<string, { loading: boolean, error: string | null }>>({});

  const toggleComplaintExpanded = (id: string) => {
    setExpandedComplaintIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyComplaintBody = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const generateComplaint = async (hazardId: string) => {
    setComplaintStates(prev => ({ ...prev, [hazardId]: { loading: true, error: null, data: null } }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
      const response = await fetch(`${backendUrl}/api/complaints/generate/${hazardId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate complaint");
      }
      
      setComplaintStates(prev => ({ ...prev, [hazardId]: { loading: false, error: null, data } }));
    } catch (err: any) {
      setComplaintStates(prev => ({ ...prev, [hazardId]: { loading: false, error: err.message || "An error occurred", data: null } }));
    }
  };

  const sendComplaintEmail = async (hazardId: string, complaintId: string) => {
    setSendStates(prev => ({ ...prev, [hazardId]: { loading: true, error: null } }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not logged in");

      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
      const response = await fetch(`${backendUrl}/api/complaints/${complaintId}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.detail || "Failed to send complaint");
      }
      
      setComplaintStates(prev => ({
        ...prev,
        [hazardId]: {
          ...prev[hazardId],
          data: {
            ...prev[hazardId].data,
            email_status: 'sent'
          }
        }
      }));
      setSendStates(prev => ({ ...prev, [hazardId]: { loading: false, error: null } }));
    } catch (err: any) {
      setSendStates(prev => ({ ...prev, [hazardId]: { loading: false, error: err.message || "Failed to send email" } }));
      setComplaintStates(prev => ({
        ...prev,
        [hazardId]: {
          ...prev[hazardId],
          data: {
            ...prev[hazardId].data,
            email_status: 'failed'
          }
        }
      }));
    }
  };

  useEffect(() => {
    const fetchReportsAndComplaints = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) {
          setError('You must be logged in to view your reports.');
          setIsLoading(false);
          return;
        }

        // Fetch hazards
        const { data: apiHazardsData, error: sbError } = await supabase
          .from('hazards')
          .select('id, description, severity, status, latitude, longitude, image_url, created_at, ai_detections')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (sbError) throw sbError;
        
        // Fetch all complaints
        const { data: apiComplaintsData, error: compError } = await supabase
          .from('complaints')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (compError) console.error("Failed to fetch complaints", compError);

        const initialComplaintStates: Record<string, any> = {};
        if (apiComplaintsData) {
          setComplaintsList(apiComplaintsData as VoiceComplaint[]);
          apiComplaintsData.forEach((c: any) => {
            if (c.hazard_id) {
              initialComplaintStates[c.hazard_id] = {
                loading: false,
                error: null,
                data: c
              };
            }
          });
        }
        setComplaintStates(initialComplaintStates);
        
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
    
    fetchReportsAndComplaints();
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
        
        {/* Page Header with Action Buttons */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">My Reports &amp; Complaints</h1>
            <p className="text-[#9CA3AF] text-sm">
              Track the road hazards and official civic complaints you&apos;ve submitted.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/voice-complaint">
              <button className="h-10 px-5 rounded-full bg-[#161A20] text-[#F3F4F6] border border-[rgba(255,255,255,0.15)] hover:border-[#FFC629] font-semibold text-xs transition-colors flex items-center justify-center gap-2">
                <Mic className="w-3.5 h-3.5 text-[#FFC629]" />
                Voice Complaint
              </button>
            </Link>

            <Link to="/report">
              <button className="h-10 px-5 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-xs shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform flex items-center justify-center gap-2">
                Report new hazard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>

        {/* Section Tabs: Hazard Reports vs Official Complaints */}
        <div className="mb-6 flex border-b border-[rgba(255,255,255,0.08)]">
          <button
            onClick={() => setActiveTab('hazards')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'hazards'
                ? 'border-[#FFC629] text-[#FFC629]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Hazard Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('complaints')}
            className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'complaints'
                ? 'border-[#FFC629] text-[#FFC629]'
                : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
            }`}
          >
            <FileText className="w-4 h-4" />
            Official Complaints ({complaintsList.length})
          </button>
        </div>

        {/* TAB 1: Hazard Reports View */}
        {activeTab === 'hazards' && (
          <>
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
                          
                          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] mt-4">
                            {!complaintStates[report.id]?.data ? (
                              <button
                                onClick={() => generateComplaint(report.id)}
                                disabled={complaintStates[report.id]?.loading}
                                className="text-sm font-medium h-9 px-4 rounded-full bg-[rgba(255,255,255,0.05)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
                              >
                                {complaintStates[report.id]?.loading ? 'Generating...' : 'Generate Official Complaint'}
                              </button>
                            ) : (
                              <div className="bg-[#0E1013] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                <h4 className="text-sm font-bold text-[#F3F4F6] mb-1">Generated Complaint: {complaintStates[report.id].data.subject}</h4>
                                <p className="text-[#9CA3AF] text-sm whitespace-pre-wrap">{complaintStates[report.id].data.body}</p>
                                <div className="mt-4 flex flex-col gap-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium break-words">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[#9CA3AF]">Status:</span>
                                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] text-[#F3F4F6] w-fit">
                                        {complaintStates[report.id].data.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[#9CA3AF]">Email Status:</span>
                                      <span className={`inline-flex items-center px-2 py-1 rounded-md border w-fit ${
                                        complaintStates[report.id].data.email_status === 'sent' ? 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]' : 
                                        complaintStates[report.id].data.email_status === 'failed' ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]' : 'bg-[#FFC629]/10 border-[#FFC629]/20 text-[#FFC629]'
                                      }`}>
                                        {complaintStates[report.id].data.email_status === 'sent' ? 'Sent' : 
                                         complaintStates[report.id].data.email_status === 'failed' ? 'Failed' : 'Pending'}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[#9CA3AF]">Authority Email:</span>
                                      <span className="text-[#F3F4F6]">{complaintStates[report.id].data.authority_email || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-[#9CA3AF]">Created:</span>
                                      <span className="text-[#F3F4F6]">{new Date(complaintStates[report.id].data.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {complaintStates[report.id].data.sent_at && (
                                      <div className="flex flex-col gap-1 col-span-2">
                                        <span className="text-[#9CA3AF]">Sent On:</span>
                                        <span className="text-[#F3F4F6]">{new Date(complaintStates[report.id].data.sent_at).toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {complaintStates[report.id].data.email_status !== 'sent' && (
                                    <button
                                      onClick={() => sendComplaintEmail(report.id, complaintStates[report.id].data.id)}
                                      disabled={sendStates[report.id]?.loading}
                                      className="text-sm font-medium h-9 px-4 rounded-full bg-[#FFC629] text-[#0E1013] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                    >
                                      {sendStates[report.id]?.loading ? 'Sending...' : 'Send Official Complaint'}
                                    </button>
                                  )}
                                  
                                  {complaintStates[report.id].data.email_status === 'sent' && (
                                    <div className="text-sm font-medium text-[#10B981] flex items-center gap-2 bg-[#10B981]/10 px-3 py-2 rounded-lg">
                                      Official complaint sent successfully
                                    </div>
                                  )}
                                  
                                  {sendStates[report.id]?.error && complaintStates[report.id].data.email_status !== 'sent' && (
                                    <div className="text-sm text-[#EF4444] bg-[#EF4444]/10 px-3 py-2 rounded-lg">
                                      {sendStates[report.id].error}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {complaintStates[report.id]?.error && (
                              <div className="mt-2 text-sm text-[#EF4444]">
                                {complaintStates[report.id].error}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {report.imageUrl && (
                        <div className="shrink-0 sm:w-[280px] h-[220px] sm:h-auto w-full border-t sm:border-t-0 sm:border-l border-[rgba(255,255,255,0.08)] overflow-hidden bg-[#0E1013] relative flex items-center justify-center">
                          {report.imageUrl.endsWith('.webm') || report.imageUrl.endsWith('.mp4') ? (
                            <video src={report.imageUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <img 
                              src={report.imageUrl} 
                              alt={report.type} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                                const parent = (e.target as HTMLElement).parentElement;
                                if (parent && !parent.querySelector('.img-fallback')) {
                                  const fallback = document.createElement('div');
                                  fallback.className = 'img-fallback flex flex-col items-center justify-center p-6 text-center text-[#9CA3AF]';
                                  fallback.innerHTML = '<span class="text-xs font-semibold text-[#FFC629] mb-1">Evidence Attached</span><span class="text-[11px] text-[#9CA3AF]">Voice complaint report</span>';
                                  parent.appendChild(fallback);
                                }
                              }}
                            />
                          )}
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
          </>
        )}

        {/* TAB 2: Official Complaints & Letters View */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            {complaintsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px]">
                <div className="w-16 h-16 rounded-full bg-[#FFC629]/10 border border-[#FFC629]/20 flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-[#FFC629]" />
                </div>
                <h3 className="text-xl font-['Sora',sans-serif] font-bold text-[#F3F4F6] mb-2">
                  No Official Complaints Yet
                </h3>
                <p className="text-[#9CA3AF] max-w-md mb-6 text-sm">
                  Record a voice complaint or generate a formal letter from any reported hazard to have it officially sent to the civic authorities.
                </p>
                <Link to="/voice-complaint">
                  <button className="h-12 px-8 rounded-full bg-[#FFC629] text-[#0E1013] font-bold shadow-[0_4px_14px_rgba(255,198,41,0.2)] hover:scale-105 transition-transform flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Record Voice Complaint
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <p className="text-sm font-medium text-[#9CA3AF]">
                  Showing {complaintsList.length} {complaintsList.length === 1 ? 'complaint' : 'complaints'}
                </p>

                {complaintsList.map(comp => {
                  const isExpanded = !!expandedComplaintIds[comp.id];
                  const isCopied = copiedId === comp.id;

                  return (
                    <div
                      key={comp.id}
                      className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-6 space-y-4 hover:border-[#FFC629]/30 transition-colors"
                    >
                      {/* Complaint Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-[#FFC629] uppercase tracking-wider">
                            {comp.authority_name || 'Road Authority'}
                          </span>
                          <h3 className="text-lg font-bold font-['Sora',sans-serif] text-[#F3F4F6] mt-0.5">
                            {comp.subject}
                          </h3>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 shrink-0">
                          {comp.channel === 'external_portal' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Official Portal
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#FFC629]/10 text-[#FFC629] border border-[#FFC629]/20 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> Direct Email
                            </span>
                          )}

                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                            comp.status === 'sent' ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20' :
                            comp.status === 'submitted_externally' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            comp.status === 'failed' ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20' :
                            'bg-[rgba(255,255,255,0.05)] text-[#F3F4F6] border-[rgba(255,255,255,0.1)]'
                          }`}>
                            {comp.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Location & Metadata */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#9CA3AF] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                        {comp.location_address && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#FFC629]" />
                            <span className="truncate max-w-xs">{comp.location_address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Filed {timeAgo(comp.created_at)}</span>
                        </div>
                        {comp.authority_email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{comp.authority_email}</span>
                          </div>
                        )}
                      </div>

                      {/* Transcript snippet if available */}
                      {comp.transcript && (
                        <div className="p-3 bg-[#0E1013] rounded-xl border border-[rgba(255,255,255,0.05)] text-xs">
                          <span className="text-[#9CA3AF] font-bold block mb-0.5">Spoken Transcript:</span>
                          <p className="text-[#F3F4F6] italic">&quot;{comp.transcript}&quot;</p>
                        </div>
                      )}

                      {/* Expandable Formal Letter */}
                      <div className="pt-2">
                        <button
                          onClick={() => toggleComplaintExpanded(comp.id)}
                          className="text-xs text-[#FFC629] hover:underline flex items-center gap-1 font-semibold"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" /> Hide Full Letter
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" /> View Full Formal Complaint Letter
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-4 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] text-xs text-[#F3F4F6] space-y-3 font-sans leading-relaxed">
                            <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
                              <span className="font-bold text-[#9CA3AF] uppercase">Official Letter Text</span>
                              <button
                                onClick={() => copyComplaintBody(comp.id, `SUBJECT: ${comp.subject}\n\n${comp.body}`)}
                                className="px-3 py-1 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#FFC629] text-[11px] font-bold flex items-center gap-1"
                              >
                                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {isCopied ? 'Copied!' : 'Copy Letter'}
                              </button>
                            </div>
                            <div className="whitespace-pre-wrap">{comp.body}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
