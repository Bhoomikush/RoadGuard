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
