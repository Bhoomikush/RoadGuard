import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Clock, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, ThumbsUp, MessageSquare, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

function FeedHazardCard({ hazard, currentUserId }: { hazard: FeedHazard, currentUserId: string | undefined }) {
  const [reactionsCount, setReactionsCount] = useState(hazard.hazard_reactions?.length || 0);
  const [hasReacted, setHasReacted] = useState(hazard.hazard_reactions?.some(r => r.user_id === currentUserId) || false);
  const [isReacting, setIsReacting] = useState(false);

  const initialComments = [...(hazard.hazard_comments || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const [comments, setComments] = useState(initialComments);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sev = severityConfig[hazard.severity] || severityConfig.medium;
  const stat = statusConfig[hazard.status] || statusConfig.active;
  const StatusIcon = stat.icon;

  let aiClasses: string[] = [];
  if (hazard.ai_detections && Array.isArray(hazard.ai_detections)) {
     aiClasses = hazard.ai_detections
       .filter(d => d && typeof d === 'object' && d.class_name)
       .map(d => d.class_name);
  }

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

  return (
    <div className="bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden hover:border-[rgba(255,255,255,0.12)] transition-colors">
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
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReaction}
              disabled={isReacting}
              className={`flex items-center gap-1.5 transition-colors ${hasReacted ? 'text-[#FFC629]' : 'hover:text-[#F3F4F6]'}`}
            >
              <ThumbsUp className={`w-4 h-4 ${hasReacted ? 'fill-current' : ''}`} />
              <span>{reactionsCount} {reactionsCount === 1 ? 'Like' : 'Likes'}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-colors hover:text-[#F3F4F6] ${showComments ? 'text-[#F3F4F6]' : ''}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}</span>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{new Date(hazard.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Location reported</span>
            </div>
          </div>
        </div>
        
        {showComments && (
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)]">
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    maxLength={1000}
                    rows={2}
                    className="w-full bg-[#0E1013] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm text-[#F3F4F6] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FFC629]/50 focus:ring-1 focus:ring-[#FFC629]/50 transition-all resize-none"
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs text-[#9CA3AF]">{newComment.length}/1000</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-[#FFC629] text-[#0E1013] p-3 rounded-xl font-semibold hover:bg-[#FBBF24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            
            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-[#9CA3AF] text-sm py-2">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-[#0E1013] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#9CA3AF] font-medium">
                          User • {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      {currentUserId === comment.user_id && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#E5E7EB] whitespace-pre-wrap break-words leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunityFeedPage() {
  const [hazards, setHazards] = useState<FeedHazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        {hazards.map((hazard) => (
          <FeedHazardCard key={hazard.id} hazard={hazard} currentUserId={user?.id} />
        ))}
      </div>
    </div>
  );
}
