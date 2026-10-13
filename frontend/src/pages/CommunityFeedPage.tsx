import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MapPin, 
  Clock, 
  AlertTriangle, 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  Trash2, 
  Search, 
  Sparkles, 
  Compass, 
  Share2, 
  Check, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { getHazardTitle } from '../utils/hazard';
import ConeMascot from '../components/ConeMascot';
import { Link } from 'react-router-dom';

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
  hazard_reactions: { user_id: string }[];
  hazard_comments: { id: string; content: string; created_at: string; user_id: string }[];
}

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return 'Recently';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

function getResolvedImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return supabase.storage.from('hazard-images').getPublicUrl(url).data.publicUrl;
}

function FeedHazardCard({ hazard, currentUserId }: { hazard: FeedHazard; currentUserId: string | undefined }) {
  const [reactionsCount, setReactionsCount] = useState(
    Array.isArray(hazard.hazard_reactions) ? hazard.hazard_reactions.length : 0
  );
  const [hasReacted, setHasReacted] = useState(
    Array.isArray(hazard.hazard_reactions) && currentUserId
      ? hazard.hazard_reactions.some(r => r?.user_id === currentUserId)
      : false
  );
  const [isReacting, setIsReacting] = useState(false);

  const initialComments = Array.isArray(hazard.hazard_comments)
    ? [...hazard.hazard_comments].sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
    : [];
  const [comments, setComments] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const title = getHazardTitle(hazard);
  const resolvedImageUrl = getResolvedImageUrl(hazard.image_url);

  let aiClasses: string[] = [];
  if (hazard.ai_detections && Array.isArray(hazard.ai_detections)) {
    aiClasses = hazard.ai_detections
      .filter(d => d && typeof d === 'object' && typeof d.class_name === 'string')
      .map(d => d.class_name);
  }

  const lat = hazard.latitude != null ? Number(hazard.latitude) : null;
  const lng = hazard.longitude != null ? Number(hazard.longitude) : null;
  const locationLabel = (lat != null && lng != null && !isNaN(lat) && !isNaN(lng))
    ? `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`
    : 'Reported location';

  const handleReaction = async () => {
    if (!currentUserId || isReacting) return;
    setIsReacting(true);
    
    const wasReacted = hasReacted;
    const newCount = wasReacted ? reactionsCount - 1 : reactionsCount + 1;
    setHasReacted(!wasReacted);
    setReactionsCount(newCount);

    try {
      if (wasReacted) {
        await supabase
          .from('hazard_reactions')
          .delete()
          .match({ hazard_id: hazard.id, user_id: currentUserId });
      } else {
        await supabase
          .from('hazard_reactions')
          .insert({ hazard_id: hazard.id, user_id: currentUserId });
      }
    } catch (err) {
      setHasReacted(wasReacted);
      setReactionsCount(wasReacted ? newCount + 1 : newCount - 1);
    } finally {
      setIsReacting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isSubmitting || !newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('hazard_comments')
        .insert({
          hazard_id: hazard.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        setComments([data, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase
        .from('hazard_comments')
        .delete()
        .match({ id: commentId, user_id: currentUserId });
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/map`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 sm:p-6 hover:border-[rgba(255,255,255,0.18)] transition-all shadow-lg flex flex-col gap-4">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#FFC629]/15 border border-[#FFC629]/30 flex items-center justify-center shrink-0">
            <span className="text-[#FFC629] font-bold text-sm">RG</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-[#F3F4F6] font-['Sora',sans-serif] truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-[#9CA3AF] mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeAgo(hazard.created_at)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-[#FFC629]" />
                {locationLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={hazard.severity} />
          <StatusBadge status={hazard.status} />
        </div>
      </div>

      {/* Description */}
      {hazard.description ? (
        <p className="text-[#D1D5DB] text-sm sm:text-base leading-relaxed">
          {hazard.description}
        </p>
      ) : (
        <p className="text-[#9CA3AF] text-sm italic">
          Community member reported this road hazard.
        </p>
      )}

      {/* Image (Cleanly omitted if no image or error) */}
      {resolvedImageUrl && !imgError && (
        <div className="relative w-full rounded-[16px] overflow-hidden bg-[#0E1013] border border-[rgba(255,255,255,0.06)] group">
          <img 
            src={resolvedImageUrl} 
            alt={title} 
            className="w-full max-h-80 object-cover group-hover:scale-[1.01] transition-transform duration-300"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1013]/60 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* AI Detections Pills */}
      {aiClasses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#9CA3AF] flex items-center gap-1 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC629]" />
            AI Verified:
          </span>
          {aiClasses.map((cls, idx) => (
            <span 
              key={idx} 
              className="px-2.5 py-0.5 rounded-full bg-[#FFC629]/10 border border-[#FFC629]/25 text-[#FFC629] text-xs font-medium capitalize"
            >
              {cls}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          {/* Reaction Button */}
          <button 
            onClick={handleReaction}
            disabled={isReacting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              hasReacted 
                ? 'bg-[#FFC629]/20 text-[#FFC629] border border-[#FFC629]/30' 
                : 'bg-[#0E1013] text-[#9CA3AF] border border-[rgba(255,255,255,0.08)] hover:text-[#F3F4F6] hover:border-[rgba(255,255,255,0.2)]'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${hasReacted ? 'fill-current' : ''}`} />
            <span>{reactionsCount} {reactionsCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          {/* Comment Toggle */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              showComments 
                ? 'bg-[#FFC629] text-[#0E1013]' 
                : 'bg-[#0E1013] text-[#9CA3AF] border border-[rgba(255,255,255,0.08)] hover:text-[#F3F4F6] hover:border-[rgba(255,255,255,0.2)]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button 
            onClick={handleShare}
            className="p-2 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors"
            title="Share hazard link"
          >
            {copied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Open in Map */}
          <Link
            to="/map"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1013] border border-[rgba(255,255,255,0.08)] text-xs text-[#9CA3AF] hover:text-[#FFC629] hover:border-[#FFC629]/40 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>View on Map</span>
          </Link>
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="mt-2 pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-4">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your note or update on this road..."
              maxLength={1000}
              className="flex-1 bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-2.5 text-sm text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC629] transition-all"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="bg-[#FFC629] text-[#0E1013] px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-center text-[#9CA3AF] text-xs py-3">
                No comments yet. Be the first community member to confirm or update!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="bg-[#0E1013] rounded-xl p-3 border border-[rgba(255,255,255,0.05)]">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[11px] text-[#9CA3AF] font-medium">
                      Member • {timeAgo(comment.created_at)}
                    </span>
                    {currentUserId === comment.user_id && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors p-0.5"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[#E5E7EB] break-words leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunityFeedPage() {
  const [hazards, setHazards] = useState<FeedHazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high' | 'active' | 'ai' | 'resolved'>('all');
  const { user } = useAuth();

  useEffect(() => {
    async function fetchFeed() {
      try {
        const { data, error: fetchError } = await supabase
          .from('hazards')
          .select(`
            id, description, severity, status, image_url, ai_detections, created_at, latitude, longitude,
            hazard_reactions ( user_id ),
            hazard_comments ( id, content, created_at, user_id )
          `)
          .order('created_at', { ascending: false })
          .limit(30);

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

  const displayedHazards = useMemo(() => {
    return hazards.filter(h => {
      if (!h) return false;
      const title = (getHazardTitle(h) || '').toLowerCase();
      const desc = (h.description || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || title.includes(query) || desc.includes(query);

      let matchesFilter = true;
      if (activeFilter === 'high') {
        matchesFilter = (h.severity || '').toLowerCase() === 'high';
      } else if (activeFilter === 'active') {
        const s = (h.status || '').toLowerCase();
        matchesFilter = s === 'active' || s === 'pending';
      } else if (activeFilter === 'ai') {
        matchesFilter = Boolean(h.ai_detections && Array.isArray(h.ai_detections) && h.ai_detections.length > 0);
      } else if (activeFilter === 'resolved') {
        const s = (h.status || '').toLowerCase();
        matchesFilter = s === 'fixed' || s === 'resolved';
      }

      return matchesSearch && matchesFilter;
    });
  }, [hazards, searchQuery, activeFilter]);

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] pb-12 max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F3F4F6] font-['Sora',sans-serif] tracking-tight">
              Community Feed
            </h1>
            <p className="text-[#9CA3AF] mt-1 text-sm sm:text-base">
              Real-time hazard verification, photos, and discussion reported by RoadGuard drivers.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:opacity-90 transition-opacity shadow-lg self-start sm:self-auto shrink-0"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Report Hazard</span>
          </Link>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[20px] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search reports by hazard or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl pl-10 pr-4 py-2 text-sm text-[#F3F4F6] placeholder:text-[#9CA3AF] focus:border-[#FFC629] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High Risk' },
              { id: 'active', label: 'Active' },
              { id: 'ai', label: 'AI Verified' },
              { id: 'resolved', label: 'Resolved' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  activeFilter === f.id
                    ? 'bg-[#FFC629] text-[#0E1013]'
                    : 'bg-[#0E1013] text-[#9CA3AF] border border-[rgba(255,255,255,0.08)] hover:text-[#F3F4F6]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
            <Loader2 className="w-8 h-8 text-[#FFC629] animate-spin mb-3" />
            <p className="text-sm text-[#9CA3AF]">Loading live community feed...</p>
          </div>
        ) : error ? (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-[24px] p-6 text-center max-w-lg mx-auto">
            <AlertTriangle className="w-10 h-10 text-[#EF4444] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#F3F4F6] mb-1">Could not load feed</h3>
            <p className="text-xs text-[#9CA3AF]">{error}</p>
          </div>
        ) : displayedHazards.length === 0 ? (
          <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] py-16 px-6 text-center flex flex-col items-center justify-center">
            <ConeMascot size={100} waving={false} title="No reports found" />
            <h3 className="text-lg font-bold text-[#F3F4F6] mt-4 font-['Sora',sans-serif]">No reports match your filters</h3>
            <p className="text-sm text-[#9CA3AF] mt-1 max-w-sm">
              {searchQuery || activeFilter !== 'all' 
                ? 'Try clearing your search query or switching to another filter.' 
                : 'The community feed is currently clear. Report the first road hazard!'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                className="mt-4 text-xs font-bold text-[#FFC629] hover:underline"
              >
                Reset all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {displayedHazards.map((hazard) => (
              <FeedHazardCard 
                key={hazard.id} 
                hazard={hazard} 
                currentUserId={user?.id} 
              />
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
