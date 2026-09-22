export interface Hazard {
  id: string;
  user_id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
}
