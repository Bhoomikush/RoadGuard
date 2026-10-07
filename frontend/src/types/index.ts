export type HazardSeverity = 'low' | 'medium' | 'high';
export type HazardStatus = 'active' | 'under-repair' | 'fixed' | 'invalid';

export interface Hazard {
  id: string;
  type: string;
  severity: HazardSeverity;
  status: HazardStatus;
  latitude: number;
  longitude: number;
  location: string;
  imageUrl?: string;
  confidence?: number;
  createdAt: string;
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  complaint_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}
