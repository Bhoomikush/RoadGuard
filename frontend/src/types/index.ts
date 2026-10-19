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

export interface Authority {
  id: string;
  name: string;
  type: 'national_highway' | 'municipal' | 'pwd' | 'portal';
  jurisdiction: string;
  email: string;
  helpline?: string;
  portal_url?: string;
  description?: string;
  confidence?: 'high' | 'medium' | 'low';
  reason?: string;
  requires_user_choice?: boolean;
}

export interface VoiceComplaint {
  id: string;
  user_id: string;
  hazard_id?: string;
  subject: string;
  body: string;
  authority_name?: string;
  authority_email?: string;
  status: 'draft' | 'generated' | 'sent' | 'submitted_externally' | 'failed' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
  email_status: 'pending' | 'sent' | 'failed' | 'not_applicable';
  channel?: 'email' | 'external_portal';
  transcript?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  evidence_storage_path?: string;
  evidence_url?: string;
  provider_ref_id?: string;
  sent_at?: string;
  created_at: string;
  updated_at?: string;
}
