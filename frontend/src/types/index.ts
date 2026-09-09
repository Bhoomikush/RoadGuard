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

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskZone {
  id: string;
  level: RiskLevel;
  hazardCount: number;
  location: string;
  intensity: number; // 0 to 1
  centerLat: number;
  centerLng: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
